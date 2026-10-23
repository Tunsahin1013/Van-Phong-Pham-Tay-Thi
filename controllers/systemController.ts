import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore, StoreSettings } from '../services/dataStore.ts';
import { appendPersistentSystemLog, createSystemBackupSnapshot, getPersistentStoreSettings, getPersistentSystemLogs, savePersistentStoreSettings } from '../services/systemPersistence.ts';

const CSV_BOM = '\uFEFF';

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  // Mitigate spreadsheet formula injection for exported text fields.
  if (typeof value !== 'number' && /^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function toCsv(rows: unknown[][]): string {
  return CSV_BOM + rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}

function parseDateBound(value: unknown, endOfDay = false): Date | null | false {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  return date;
}

function withinRange(isoDate: string | undefined, from: Date | null, to: Date | null): boolean {
  const date = new Date(isoDate || '');
  if (Number.isNaN(date.getTime())) return false;
  return (!from || date >= from) && (!to || date <= to);
}

async function systemLog(req: AuthRequest, action: string, details?: string) {
  await appendPersistentSystemLog({
    actorId: req.user?.id,
    actorName: req.user?.name || 'Quản trị viên',
    actorRole: req.user?.role || 'ADMIN',
    action,
    method: req.method,
    path: req.originalUrl.split('?')[0],
    statusCode: 200,
    ip: req.ip,
    userAgent: String(req.headers['user-agent'] || '').slice(0, 180),
    details,
  });
}

export const systemController = {
  getPublicSettings: async (_req: AuthRequest, res: Response) => {
    const settings = await getPersistentStoreSettings();
    return res.json({
      success: true,
      data: {
        storeName: settings.storeName,
        logoUrl: settings.logoUrl,
        hotline: settings.hotline,
        address: settings.address,
        email: settings.email,
      },
    });
  },

  getSettings: async (_req: AuthRequest, res: Response) => {
    return res.json({ success: true, data: await getPersistentStoreSettings() });
  },

  updateSettings: async (req: AuthRequest, res: Response) => {
    const body = req.body as Record<string, unknown>;
    const storeName = typeof body.storeName === 'string' ? body.storeName.trim() : '';
    const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl.trim() : '';
    const hotline = typeof body.hotline === 'string' ? body.hotline.trim() : '';
    const address = typeof body.address === 'string' ? body.address.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';

    if (storeName.length < 2 || storeName.length > 100) {
      return res.status(400).json({ success: false, message: 'Tên cửa hàng phải từ 2 đến 100 ký tự.' });
    }
    if (hotline.length < 6 || hotline.length > 30 || !/^[+\d\s().-]+$/.test(hotline)) {
      return res.status(400).json({ success: false, message: 'Hotline không hợp lệ.' });
    }
    if (address.length < 5 || address.length > 250) {
      return res.status(400).json({ success: false, message: 'Địa chỉ phải từ 5 đến 250 ký tự.' });
    }
    if (logoUrl.length > 2048 || (logoUrl && !(/^(https?:\/\/|\/)/i.test(logoUrl)))) {
      return res.status(400).json({ success: false, message: 'Logo phải là URL http(s) hoặc đường dẫn tương đối bắt đầu bằng dấu /.' });
    }
    if (email.length > 120 || (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return res.status(400).json({ success: false, message: 'Email cửa hàng không hợp lệ.' });
    }

    const settings: Partial<StoreSettings> = { storeName, logoUrl, hotline, address, email };
    const updated = await savePersistentStoreSettings(settings, req.user?.name || 'Quản trị viên');
    await systemLog(req, 'STORE_SETTINGS_UPDATED', `Cập nhật thông tin cửa hàng: ${storeName}`);
    return res.json({ success: true, message: 'Đã cập nhật thông tin cửa hàng.', data: updated });
  },

  downloadBackup: async (req: AuthRequest, res: Response) => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    await systemLog(req, 'SYSTEM_BACKUP_EXPORTED', 'Quản trị viên tải bản sao lưu JSON. Tệp có thể chứa dữ liệu cá nhân và hash mật khẩu.');
    const backupData = await createSystemBackupSnapshot();
    const payload = {
      application: 'Van Phong Pham Tay Thi',
      formatVersion: 1,
      generatedAt: now.toISOString(),
      generatedBy: req.user?.email || req.user?.name || 'ADMIN',
      warning: 'Bản sao lưu có thể chứa dữ liệu cá nhân và hash mật khẩu. Lưu trữ ở nơi an toàn.',
      data: backupData,
    };

    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="tay-thi-backup-${timestamp}.json"`);
    return res.status(200).send(JSON.stringify(payload, null, 2));
  },

  exportReport: async (req: AuthRequest, res: Response) => {
    const type = String(req.query.type || 'orders');
    if (!['orders', 'revenue'].includes(type)) {
      return res.status(400).json({ success: false, message: 'Loại báo cáo không hợp lệ.' });
    }

    const from = parseDateBound(req.query.from);
    const to = parseDateBound(req.query.to, true);
    if (from === false || to === false) {
      return res.status(400).json({ success: false, message: 'Ngày lọc phải có định dạng YYYY-MM-DD.' });
    }
    if (from && to && from > to) {
      return res.status(400).json({ success: false, message: 'Ngày bắt đầu không được lớn hơn ngày kết thúc.' });
    }

    const allOrders = dataStore.getOrders();
    const filtered = allOrders.filter(order => {
      if (type === 'revenue') {
        if (order.orderStatus !== 'COMPLETED' || order.paymentStatus === 'REFUNDED') return false;
        return withinRange(order.completedAt || order.createdAt, from, to);
      }
      return withinRange(order.createdAt, from, to);
    });

    const money = (value: unknown) => Number(value || 0);
    let rows: unknown[][];
    if (type === 'revenue') {
      rows = [[
        'Mã đơn hàng', 'Ngày ghi nhận', 'Khách hàng', 'Số điện thoại', 'Email',
        'Tạm tính (VND)', 'Giảm giá (VND)', 'Phí giao hàng (VND)', 'Doanh thu ghi nhận (VND)',
      ]];
      for (const order of filtered) {
        rows.push([
          order.orderCode,
          order.completedAt || order.createdAt,
          order.customerName,
          order.customerPhone,
          order.customerEmail,
          money(order.subtotal),
          money(order.discount),
          money(order.shippingFee),
          money(order.total),
        ]);
      }
      const totalRevenue = filtered.reduce((sum, order) => sum + money(order.total), 0);
      rows.push([]);
      rows.push(['TỔNG DOANH THU', '', '', '', '', '', '', '', totalRevenue]);
    } else {
      rows = [[
        'Mã đơn hàng', 'Ngày tạo', 'Khách hàng', 'Email', 'Điện thoại', 'Địa chỉ giao hàng',
        'Trạng thái đơn', 'Phương thức thanh toán', 'Trạng thái thanh toán', 'Tạm tính (VND)',
        'Giảm giá (VND)', 'Phí giao hàng (VND)', 'Tổng thanh toán (VND)', 'Mã voucher', 'Sản phẩm',
      ]];
      for (const order of filtered) {
        rows.push([
          order.orderCode, order.createdAt, order.customerName, order.customerEmail, order.customerPhone,
          order.shippingAddress, order.orderStatus, order.paymentMethod, order.paymentStatus,
          money(order.subtotal), money(order.discount), money(order.shippingFee), money(order.total),
          order.voucherCode || '', (order.items || []).map(item => `${item.name} x${item.quantity}`).join(' | '),
        ]);
      }
    }

    const csv = toCsv(rows);
    const datePart = nowDatePart();
    const filename = `tay-thi-${type === 'revenue' ? 'doanh-thu' : 'don-hang'}-${datePart}.csv`;
    await systemLog(req, 'SYSTEM_REPORT_EXPORTED', `Xuất báo cáo ${type}; số bản ghi: ${filtered.length}`);
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  },



  // US72: inventory health report based on active products and completed order lines.
  getProductInventoryReport: async (req: AuthRequest, res: Response) => {
    const readInt = (value: unknown, fallback: number, min: number, max: number): number | null => {
      if (value === undefined || value === null || value === '') return fallback;
      if (Array.isArray(value)) return null;
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
    };

    const days = readInt(req.query.days, 30, 1, 365);
    const lowStockThreshold = readInt(req.query.lowStockThreshold, 10, 0, 100000);
    const slowMovingThreshold = readInt(req.query.slowMovingThreshold, 2, 0, 100000);
    if (days === null || lowStockThreshold === null || slowMovingThreshold === null) {
      return res.status(400).json({
        success: false,
        message: 'Tham số báo cáo không hợp lệ: days (1–365), lowStockThreshold (0–100000), slowMovingThreshold (0–100000).',
      });
    }

    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const unitsSoldInPeriod = new Map<string, number>();
    const lastSoldAt = new Map<string, string>();
    const orders = dataStore.getOrders();

    for (const order of orders) {
      // Count fulfilled orders only, and do not count fully refunded purchases as sales.
      if (order.orderStatus !== 'COMPLETED' || order.paymentStatus === 'REFUNDED') continue;
      const completedAt = order.completedAt || order.createdAt;
      const completedTime = new Date(completedAt || '').getTime();
      if (!Number.isFinite(completedTime) || completedTime > now) continue;

      for (const item of order.items || []) {
        const productId = String(item.productId || '');
        if (!productId) continue;
        const previousLastSold = lastSoldAt.get(productId);
        if (!previousLastSold || new Date(previousLastSold).getTime() < completedTime) {
          lastSoldAt.set(productId, completedAt);
        }
        if (completedTime >= cutoff) {
          unitsSoldInPeriod.set(productId, (unitsSoldInPeriod.get(productId) || 0) + Math.max(0, Number(item.quantity) || 0));
        }
      }
    }

    const rows = dataStore.getProducts()
      .filter(product => product.status === 'ACTIVE')
      .map(product => ({
        productId: product.id,
        name: product.name,
        code: product.code,
        categoryName: product.categoryName || '',
        brand: product.brand || '',
        stock: Math.max(0, Number(product.stock) || 0),
        soldInPeriod: unitsSoldInPeriod.get(product.id) || 0,
        price: Number(product.salePrice || product.price || 0),
        lastSoldAt: lastSoldAt.get(product.id) || null,
      }));

    const lowStockAll = rows
      .filter(product => product.stock <= lowStockThreshold)
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name, 'vi'));
    const lowStockProducts = lowStockAll.slice(0, 200);

    // Exclude out-of-stock products from the slow-moving list because lack of stock can suppress sales.
    const slowMovingAll = rows
      .filter(product => product.stock > 0 && product.soldInPeriod <= slowMovingThreshold)
      .sort((a, b) => {
        const lastA = a.lastSoldAt ? new Date(a.lastSoldAt).getTime() : 0;
        const lastB = b.lastSoldAt ? new Date(b.lastSoldAt).getTime() : 0;
        return a.soldInPeriod - b.soldInPeriod || lastA - lastB || a.name.localeCompare(b.name, 'vi');
      });
    const slowMovingProducts = slowMovingAll.slice(0, 200);

    await systemLog(req, 'PRODUCT_INVENTORY_REPORT_VIEWED', `Xem báo cáo tồn kho/bán chậm; kỳ ${days} ngày; ngưỡng tồn ${lowStockThreshold}; ngưỡng bán ${slowMovingThreshold}`);
    return res.json({
      success: true,
      data: {
        generatedAt: new Date(now).toISOString(),
        days,
        lowStockThreshold,
        slowMovingThreshold,
        summary: {
          activeProducts: rows.length,
          lowStockCount: lowStockAll.length,
          outOfStockCount: rows.filter(product => product.stock === 0).length,
          slowMovingCount: slowMovingAll.length,
        },
        lowStockProducts,
        slowMovingProducts,
      },
    });
  },

  // US73: customers created in a selected window, plus best repeat purchasers by completed orders.
  getCustomerInsightsReport: async (req: AuthRequest, res: Response) => {
    const readInt = (value: unknown, fallback: number, min: number, max: number): number | null => {
      if (value === undefined || value === null || value === '') return fallback;
      if (Array.isArray(value)) return null;
      const parsed = Number(value);
      return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
    };

    const days = readInt(req.query.days, 30, 1, 365);
    const limit = readInt(req.query.limit, 20, 1, 100);
    if (days === null || limit === null) {
      return res.status(400).json({ success: false, message: 'Tham số báo cáo không hợp lệ: days (1–365), limit (1–100).' });
    }

    type CustomerPurchaseAggregate = {
      completedOrderCount: number;
      totalSpent: number;
      lastOrderAt: string | null;
    };
    const aggregateById = new Map<string, CustomerPurchaseAggregate>();
    const aggregateByEmail = new Map<string, CustomerPurchaseAggregate>();

    const eligibleOrders = dataStore.getOrders().filter(order =>
      order.orderStatus === 'COMPLETED' && order.paymentStatus !== 'REFUNDED'
    );
    for (const order of eligibleOrders) {
      const email = String(order.customerEmail || '').trim().toLowerCase();
      const customerId = String(order.customerId || '').trim();
      let aggregate: CustomerPurchaseAggregate | undefined;
      if (customerId) aggregate = aggregateById.get(customerId);
      if (!aggregate && email) aggregate = aggregateByEmail.get(email);
      if (!aggregate) aggregate = { completedOrderCount: 0, totalSpent: 0, lastOrderAt: null };
      if (customerId) aggregateById.set(customerId, aggregate);
      if (email) aggregateByEmail.set(email, aggregate);
      aggregate.completedOrderCount += 1;
      aggregate.totalSpent += Math.max(0, Number(order.total) || 0);
      const orderDate = order.completedAt || order.createdAt || null;
      if (orderDate && (!aggregate.lastOrderAt || new Date(aggregate.lastOrderAt).getTime() < new Date(orderDate).getTime())) {
        aggregate.lastOrderAt = orderDate;
      }
    }

    const aggregateFor = (user: { id: string; email: string }): CustomerPurchaseAggregate =>
      aggregateById.get(user.id) || aggregateByEmail.get(String(user.email || '').toLowerCase()) ||
      { completedOrderCount: 0, totalSpent: 0, lastOrderAt: null };

    const now = Date.now();
    const cutoff = now - days * 24 * 60 * 60 * 1000;
    const customerUsers = dataStore.getUsers().filter(user => user.role === 'CUSTOMER');
    const toSafeRow = (user: typeof customerUsers[number]) => {
      const purchases = aggregateFor(user);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        createdAt: user.createdAt,
        completedOrderCount: purchases.completedOrderCount,
        totalSpent: Math.round(purchases.totalSpent),
        lastOrderAt: purchases.lastOrderAt,
      };
    };

    const newCustomersAll = customerUsers
      .filter(user => {
        const createdTime = new Date(user.createdAt || '').getTime();
        return Number.isFinite(createdTime) && createdTime >= cutoff && createdTime <= now;
      })
      .map(toSafeRow)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const newCustomers = newCustomersAll.slice(0, 200);

    const frequentCustomers = customerUsers
      .map(toSafeRow)
      .filter(customer => customer.completedOrderCount > 0)
      .sort((a, b) => b.completedOrderCount - a.completedOrderCount || b.totalSpent - a.totalSpent || a.name.localeCompare(b.name, 'vi'))
      .slice(0, limit);

    await systemLog(req, 'CUSTOMER_INSIGHTS_REPORT_VIEWED', `Xem báo cáo khách hàng; khách mới trong ${days} ngày; top ${limit} khách mua nhiều`);
    return res.json({
      success: true,
      data: {
        generatedAt: new Date(now).toISOString(),
        newCustomerDays: days,
        frequentCustomerLimit: limit,
        summary: {
          newCustomerCount: newCustomersAll.length,
          customersWithCompletedOrders: customerUsers.filter(user => aggregateFor(user).completedOrderCount > 0).length,
        },
        newCustomers,
        frequentCustomers,
      },
    });
  },

  getLogs: async (req: AuthRequest, res: Response) => {
    const rawLimit = Number.parseInt(String(req.query.limit || '100'), 10);
    const limit = Number.isFinite(rawLimit) ? Math.max(1, Math.min(500, rawLimit)) : 100;
    const query = String(req.query.q || '').trim().toLocaleLowerCase('vi');
    const status = String(req.query.status || 'ALL');
    let logs = await getPersistentSystemLogs(500);
    if (query) {
      logs = logs.filter(log => [log.actorName, log.action, log.method, log.path, log.details || ''].join(' ').toLocaleLowerCase('vi').includes(query));
    }
    if (status !== 'ALL') {
      const expected = Number(status);
      if (Number.isFinite(expected)) logs = logs.filter(log => log.statusCode === expected);
    }
    return res.json({ success: true, data: logs.slice(0, limit), total: logs.length });
  },
};

function nowDatePart(): string {
  return new Date().toISOString().slice(0, 10);
}
