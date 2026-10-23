import fs from 'fs';
import path from 'path';
import {
  getInitialSeedData,
  UserItem,
  CategoryItem,
  ProductItem,
  VoucherItem,
  SupplierItem,
  OrderItem,
  ReviewItem,
  InventoryItem,
  WalletTransactionItem,
  NotificationItem,
  ChatConversationItem,
  ChatMessageItem,
} from '../data/seedData.ts';

export interface SystemLogEntry {
  id: string;
  actorId?: string;
  actorName: string;
  actorRole: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  ip?: string;
  userAgent?: string;
  details?: string;
  createdAt: string;
}

export interface StoreSettings {
  storeName: string;
  logoUrl: string;
  hotline: string;
  address: string;
  email: string;
  updatedAt: string;
  updatedBy: string;
}

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  storeName: 'Văn phòng phẩm Tây Thi',
  logoUrl: '',
  hotline: '1900 6868',
  address: '10 Ngõ 226 Cầu Giấy, Nghĩa Đô, Cầu Giấy, Hà Nội',
  email: 'lienhe@stationery.vn',
  updatedAt: '',
  updatedBy: 'Hệ thống',
};

interface DatabaseSchema {
  users: UserItem[];
  categories: CategoryItem[];
  products: ProductItem[];
  vouchers: VoucherItem[];
  suppliers: SupplierItem[];
  orders: OrderItem[];
  reviews: ReviewItem[];
  inventoryLogs: InventoryItem[];
  walletTransactions: WalletTransactionItem[];
  notifications: NotificationItem[];
  conversations: ChatConversationItem[];
  chatMessages: ChatMessageItem[];
  systemLogs: SystemLogEntry[];
  storeSettings: StoreSettings;
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'db.json');

class DataStoreService {
  private db: DatabaseSchema;
  private isLoaded: boolean = false;

  constructor() {
    this.db = { ...getInitialSeedData(), systemLogs: [], storeSettings: { ...DEFAULT_STORE_SETTINGS } };
    this.init();
  }

  private init() {
    try {
      const dataDir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        // Merge with seed in case fields are missing
        const seed = getInitialSeedData();
        this.db = {
          users: parsed.users?.length ? parsed.users : seed.users,
          categories: parsed.categories?.length ? parsed.categories : seed.categories,
          products: parsed.products?.length ? parsed.products : seed.products,
          vouchers: parsed.vouchers?.length ? parsed.vouchers : seed.vouchers,
          suppliers: parsed.suppliers?.length ? parsed.suppliers : seed.suppliers,
          orders: parsed.orders?.length ? parsed.orders : seed.orders,
          reviews: parsed.reviews?.length ? parsed.reviews : seed.reviews,
          inventoryLogs: parsed.inventoryLogs?.length ? parsed.inventoryLogs : seed.inventoryLogs,
          walletTransactions: Array.isArray(parsed.walletTransactions) ? parsed.walletTransactions : seed.walletTransactions,
          notifications: parsed.notifications?.length ? parsed.notifications : seed.notifications,
          conversations: parsed.conversations?.length ? parsed.conversations : seed.conversations,
          chatMessages: parsed.chatMessages?.length ? parsed.chatMessages : seed.chatMessages,
          systemLogs: Array.isArray(parsed.systemLogs) ? parsed.systemLogs : [],
          storeSettings: {
            ...DEFAULT_STORE_SETTINGS,
            ...(parsed.storeSettings && typeof parsed.storeSettings === 'object' ? parsed.storeSettings : {}),
          },
        };
      } else {
        this.db = { ...getInitialSeedData(), systemLogs: [], storeSettings: { ...DEFAULT_STORE_SETTINGS } };
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error initializing DataStore, using in-memory seed:', err);
      this.db = { ...getInitialSeedData(), systemLogs: [], storeSettings: { ...DEFAULT_STORE_SETTINGS } };
    }
  }

  private persist() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  // --- USERS ---
  getUsers(): UserItem[] {
    return this.db.users;
  }

  getUserById(id: string): UserItem | undefined {
    return this.db.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): UserItem | undefined {
    return this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  createUser(user: Omit<UserItem, 'id' | 'createdAt' | 'updatedAt' | 'loyaltyPoints' | 'walletBalance'> & Partial<Pick<UserItem, 'loyaltyPoints'>>): UserItem {
    const newUser: UserItem = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      loyaltyPoints: user.loyaltyPoints ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...user,
    };
    this.db.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(id: string, updates: Partial<UserItem>): UserItem | null {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.db.users[idx] = {
      ...this.db.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.db.users[idx];
  }

  deleteUser(id: string): boolean {
    const before = this.db.users.length;
    this.db.users = this.db.users.filter(u => u.id !== id);
    const deleted = this.db.users.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  // --- CATEGORIES ---
  getCategories(): CategoryItem[] {
    return this.db.categories.sort((a, b) => a.displayOrder - b.displayOrder);
  }

  getCategoryById(id: string): CategoryItem | undefined {
    return this.db.categories.find(c => c.id === id);
  }

  createCategory(category: Omit<CategoryItem, 'id' | 'createdAt'>): CategoryItem {
    const newCat: CategoryItem = {
      id: 'cat_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...category,
    };
    this.db.categories.push(newCat);
    this.persist();
    return newCat;
  }

  updateCategory(id: string, updates: Partial<CategoryItem>): CategoryItem | null {
    const idx = this.db.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.db.categories[idx] = { ...this.db.categories[idx], ...updates };
    this.persist();
    return this.db.categories[idx];
  }

  deleteCategory(id: string): boolean {
    const before = this.db.categories.length;
    this.db.categories = this.db.categories.filter(c => c.id !== id);
    const deleted = this.db.categories.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  // --- PRODUCTS ---
  getProducts(): ProductItem[] {
    return this.db.products;
  }

  getProductById(id: string): ProductItem | undefined {
    return this.db.products.find(p => p.id === id);
  }

  createProduct(product: Omit<ProductItem, 'id' | 'createdAt' | 'updatedAt' | 'sold' | 'rating' | 'reviewCount'> & Partial<ProductItem>): ProductItem {
    const newProd: ProductItem = {
      id: 'prod_' + Date.now(),
      sold: product.sold ?? 0,
      rating: product.rating ?? 5.0,
      reviewCount: product.reviewCount ?? 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...product,
    };
    this.db.products.push(newProd);

    // Record initial inventory
    if (newProd.stock > 0) {
      this.createInventoryLog({
        productId: newProd.id,
        productName: newProd.name,
        productCode: newProd.code,
        type: 'IN',
        quantity: newProd.stock,
        previousStock: 0,
        newStock: newProd.stock,
        note: 'Tạo sản phẩm mới vào hệ thống',
        createdBy: 'Admin',
      });
    }

    this.persist();
    return newProd;
  }

  updateProduct(id: string, updates: Partial<ProductItem>): ProductItem | null {
    const idx = this.db.products.findIndex(p => p.id === id);
    if (idx === -1) return null;

    const oldStock = this.db.products[idx].stock;
    if (updates.stock !== undefined && updates.stock !== oldStock) {
      const diff = updates.stock - oldStock;
      this.createInventoryLog({
        productId: id,
        productName: updates.name || this.db.products[idx].name,
        productCode: updates.code || this.db.products[idx].code,
        type: diff > 0 ? 'IN' : 'ADJUSTMENT',
        quantity: diff,
        previousStock: oldStock,
        newStock: updates.stock,
        note: 'Điều chỉnh số lượng tồn kho sản phẩm từ trang quản trị',
        createdBy: 'Hệ thống Quản trị',
      });
    }

    this.db.products[idx] = {
      ...this.db.products[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.db.products[idx];
  }

  deleteProduct(id: string): boolean {
    const before = this.db.products.length;
    this.db.products = this.db.products.filter(p => p.id !== id);
    const deleted = this.db.products.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  // --- VOUCHERS ---
  getVouchers(): VoucherItem[] {
    return this.db.vouchers;
  }

  getVoucherByCode(code: string): VoucherItem | undefined {
    return this.db.vouchers.find(v => v.code.toUpperCase() === code.trim().toUpperCase());
  }

  createVoucher(voucher: Omit<VoucherItem, 'id' | 'usedCount' | 'createdAt'>): VoucherItem {
    const newVoucher: VoucherItem = {
      id: 'vouch_' + Date.now(),
      usedCount: 0,
      createdAt: new Date().toISOString(),
      ...voucher,
      code: voucher.code.toUpperCase().trim(),
    };
    this.db.vouchers.push(newVoucher);
    this.persist();
    return newVoucher;
  }

  updateVoucher(id: string, updates: Partial<VoucherItem>): VoucherItem | null {
    const idx = this.db.vouchers.findIndex(v => v.id === id);
    if (idx === -1) return null;
    if (updates.code) updates.code = updates.code.toUpperCase().trim();
    this.db.vouchers[idx] = { ...this.db.vouchers[idx], ...updates };
    this.persist();
    return this.db.vouchers[idx];
  }

  deleteVoucher(id: string): boolean {
    const before = this.db.vouchers.length;
    this.db.vouchers = this.db.vouchers.filter(v => v.id !== id);
    const deleted = this.db.vouchers.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  // --- SUPPLIERS ---
  getSuppliers(): SupplierItem[] {
    return this.db.suppliers;
  }

  getSupplierById(id: string): SupplierItem | undefined {
    return this.db.suppliers.find(s => s.id === id);
  }

  createSupplier(supplier: Omit<SupplierItem, 'id' | 'createdAt'>): SupplierItem {
    const newSup: SupplierItem = {
      id: 'sup_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...supplier,
    };
    this.db.suppliers.push(newSup);
    this.persist();
    return newSup;
  }

  updateSupplier(id: string, updates: Partial<SupplierItem>): SupplierItem | null {
    const idx = this.db.suppliers.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.db.suppliers[idx] = { ...this.db.suppliers[idx], ...updates };
    this.persist();
    return this.db.suppliers[idx];
  }

  deleteSupplier(id: string): boolean {
    const before = this.db.suppliers.length;
    this.db.suppliers = this.db.suppliers.filter(s => s.id !== id);
    const deleted = this.db.suppliers.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  // --- INVENTORY ---
  getInventoryLogs(): InventoryItem[] {
    return this.db.inventoryLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createInventoryLog(log: Omit<InventoryItem, 'id' | 'createdAt'>): InventoryItem {
    const newLog: InventoryItem = {
      id: 'inv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      ...log,
    };
    this.db.inventoryLogs.unshift(newLog);
    this.persist();
    return newLog;
  }

  // Stock In / Import Action
  recordStockIn(productId: string, quantity: number, supplierId: string | undefined, note: string, createdBy: string): ProductItem | null {
    const product = this.getProductById(productId);
    if (!product) return null;

    const previousStock = product.stock;
    const newStock = previousStock + quantity;
    product.stock = newStock;
    product.updatedAt = new Date().toISOString();

    let supplierName = '';
    if (supplierId) {
      const sup = this.getSupplierById(supplierId);
      if (sup) supplierName = sup.name;
    }

    this.createInventoryLog({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: 'IN',
      quantity,
      previousStock,
      newStock,
      supplierId,
      supplierName,
      note: note || 'Nhập thêm hàng vào kho',
      createdBy,
    });

    this.persist();
    return product;
  }

  // Stock Out / Adjustment Action
  recordStockAdjustment(productId: string, adjustmentQty: number, note: string, createdBy: string): ProductItem | null {
    const product = this.getProductById(productId);
    if (!product) return null;

    const previousStock = product.stock;
    const newStock = Math.max(0, previousStock + adjustmentQty);
    product.stock = newStock;
    product.updatedAt = new Date().toISOString();

    this.createInventoryLog({
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      type: adjustmentQty < 0 ? 'OUT' : 'ADJUSTMENT',
      quantity: adjustmentQty,
      previousStock,
      newStock,
      note: note || 'Điều chỉnh tồn kho',
      createdBy,
    });

    this.persist();
    return product;
  }

  // --- ORDERS ---
  getOrders(): OrderItem[] {
    return this.db.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrderById(id: string): OrderItem | undefined {
    return this.db.orders.find(o => o.id === id);
  }

  getOrdersByCustomer(customerId: string): OrderItem[] {
    return this.db.orders
      .filter(o => o.customerId === customerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createOrder(orderData: Omit<OrderItem, 'id' | 'orderCode' | 'createdAt' | 'updatedAt' | 'pointsEarned'> & { voucherCode?: string }): OrderItem {
    const codeSuffix = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const orderCode = `ORD-${dateStr}-${codeSuffix}`;

    // Calculate points earned: 1 point per 10,000 VND
    const pointsEarned = Math.floor(orderData.total / 10000);

    const newOrder: OrderItem = {
      id: 'ord_' + Date.now(),
      orderCode,
      pointsEarned,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...orderData,
    };

    // Deduct stock for all items
    for (const item of newOrder.items) {
      const prod = this.getProductById(item.productId);
      if (prod) {
        const prevStock = prod.stock;
        prod.stock = Math.max(0, prod.stock - item.quantity);
        prod.sold = (prod.sold || 0) + item.quantity;
        prod.updatedAt = new Date().toISOString();

        this.createInventoryLog({
          productId: prod.id,
          productName: prod.name,
          productCode: prod.code,
          type: 'OUT',
          quantity: item.quantity,
          previousStock: prevStock,
          newStock: prod.stock,
          note: `Xuất kho xử lý đơn hàng ${orderCode}`,
          createdBy: 'Hệ thống tự động',
        });
      }
    }

    // Increment voucher usedCount if applicable
    if (newOrder.voucherCode) {
      const voucher = this.getVoucherByCode(newOrder.voucherCode);
      if (voucher) {
        voucher.usedCount = (voucher.usedCount || 0) + 1;
      }
    }

    this.db.orders.unshift(newOrder);

    // Create notification for customer
    this.createNotification({
      userId: newOrder.customerId,
      title: 'Đặt hàng thành công! 📦',
      message: `Đơn hàng ${newOrder.orderCode} trị giá ${newOrder.total.toLocaleString('vi-VN')}đ đã được tạo và đang chờ xử lý.`,
      type: 'ORDER',
      link: '/orders',
    });

    this.persist();
    return newOrder;
  }

  updateOrderStatus(
    orderId: string,
    orderStatus: OrderItem['orderStatus'],
    paymentStatus?: OrderItem['paymentStatus'],
    cancelReason?: string
  ): OrderItem | null {
    const order = this.getOrderById(orderId);
    if (!order) return null;

    const prevStatus = order.orderStatus;
    order.orderStatus = orderStatus;
    order.updatedAt = new Date().toISOString();

    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
    }

    if (orderStatus === 'COMPLETED') {
      order.completedAt = new Date().toISOString();
      order.paymentStatus = 'PAID';

      // Award loyalty points to customer
      const customer = this.getUserById(order.customerId);
      if (customer && order.pointsEarned > 0) {
        customer.loyaltyPoints = (customer.loyaltyPoints || 0) + order.pointsEarned;
      }

      this.createNotification({
        userId: order.customerId,
        title: 'Đơn hàng hoàn thành! 🎉',
        message: `Đơn hàng ${order.orderCode} đã giao thành công. Bạn nhận được +${order.pointsEarned} điểm tích lũy!`,
        type: 'ORDER',
        link: '/orders',
      });
    }

    if (orderStatus === 'CANCELLED') {
      order.cancelledAt = new Date().toISOString();
      order.cancelReason = cancelReason || 'Đơn hàng bị hủy';

      // Restore product stock if not previously cancelled
      if (prevStatus !== 'CANCELLED') {
        for (const item of order.items) {
          const prod = this.getProductById(item.productId);
          if (prod) {
            const prevStock = prod.stock;
            prod.stock += item.quantity;
            prod.sold = Math.max(0, (prod.sold || 0) - item.quantity);
            prod.updatedAt = new Date().toISOString();

            this.createInventoryLog({
              productId: prod.id,
              productName: prod.name,
              productCode: prod.code,
              type: 'IN',
              quantity: item.quantity,
              previousStock: prevStock,
              newStock: prod.stock,
              note: `Hoàn kho do hủy đơn hàng ${order.orderCode}`,
              createdBy: 'Hệ thống tự động',
            });
          }
        }
      }

      this.createNotification({
        userId: order.customerId,
        title: 'Đơn hàng đã bị hủy ⚠️',
        message: `Đơn hàng ${order.orderCode} đã được hủy thành công. Lý do: ${order.cancelReason}`,
        type: 'ORDER',
        link: '/orders',
      });
    }

    if (orderStatus === 'CONFIRMED') {
      this.createNotification({
        userId: order.customerId,
        title: 'Đơn hàng đã được xác nhận! ✅',
        message: `Đơn hàng ${order.orderCode} đã được nhân viên tiếp nhận và tiến hành đóng gói.`,
        type: 'ORDER',
        link: '/orders',
      });
    }

    if (orderStatus === 'SHIPPING') {
      this.createNotification({
        userId: order.customerId,
        title: 'Đơn hàng đang trên đường giao! 🛵',
        message: `Đơn hàng ${order.orderCode} đã được giao cho shipper. Bạn vui lòng chú ý điện thoại nhé!`,
        type: 'ORDER',
        link: '/orders',
      });
    }

    this.persist();
    return order;
  }

  // --- REVIEWS ---
  getReviews(productId?: string): ReviewItem[] {
    if (productId) {
      return this.db.reviews.filter(r => r.productId === productId);
    }
    return this.db.reviews;
  }

  private recalculateProductRating(productId: string): void {
    const product = this.getProductById(productId);
    if (!product) return;

    const approved = this.db.reviews.filter(r => r.productId === productId && r.status === 'APPROVED');
    product.reviewCount = approved.length;
    product.rating = approved.length
      ? Number((approved.reduce((sum, review) => sum + review.rating, 0) / approved.length).toFixed(1))
      : 0;
  }

  createReview(review: Omit<ReviewItem, 'id' | 'createdAt'>): ReviewItem {
    const now = new Date().toISOString();
    const newRev: ReviewItem = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      createdAt: now,
      updatedAt: now,
      ...review,
    };
    this.db.reviews.unshift(newRev);
    this.recalculateProductRating(review.productId);
    this.persist();
    return newRev;
  }

  updateReviewContent(id: string, rating: number, comment: string): ReviewItem | null {
    const review = this.db.reviews.find(r => r.id === id);
    if (!review) return null;
    review.rating = rating;
    review.comment = comment;
    review.updatedAt = new Date().toISOString();
    this.recalculateProductRating(review.productId);
    this.persist();
    return review;
  }

  updateReviewReply(id: string, reply: string, adminName: string): ReviewItem | null {
    const review = this.db.reviews.find(r => r.id === id);
    if (!review) return null;
    review.adminReply = reply;
    review.adminReplyAt = new Date().toISOString();
    review.adminReplyBy = adminName;
    this.persist();
    return review;
  }

  deleteReviewReply(id: string): ReviewItem | null {
    const review = this.db.reviews.find(r => r.id === id);
    if (!review) return null;
    delete review.adminReply;
    delete review.adminReplyAt;
    delete review.adminReplyBy;
    this.persist();
    return review;
  }

  updateReviewStatus(id: string, status: ReviewItem['status']): ReviewItem | null {
    const rev = this.db.reviews.find(r => r.id === id);
    if (!rev) return null;
    rev.status = status;
    this.recalculateProductRating(rev.productId);
    this.persist();
    return rev;
  }

  deleteReview(id: string): boolean {
    const review = this.db.reviews.find(r => r.id === id);
    if (!review) return false;
    this.db.reviews = this.db.reviews.filter(r => r.id !== id);
    this.recalculateProductRating(review.productId);
    this.persist();
    return true;
  }


  redeemLoyaltyPoints(customerId: string, points: number): { success: boolean; message: string; voucher?: VoucherItem } {
    const customer = this.getUserById(customerId);
    if (!customer) return { success: false, message: 'Người dùng không tồn tại' };

    if ((customer.loyaltyPoints || 0) < points) {
      return { success: false, message: 'Số điểm tích lũy không đủ để đổi ưu đãi' };
    }

    // Determine voucher reward based on points
    let voucherValue = 20000;
    let minOrder = 100000;
    if (points >= 200) {
      voucherValue = 50000;
      minOrder = 200000;
    } else if (points >= 100) {
      voucherValue = 25000;
      minOrder = 120000;
    }

    customer.loyaltyPoints -= points;

    const voucherCode = `LOYALTY-${points}P-${Math.floor(100 + Math.random() * 900)}`;
    const newVoucher = this.createVoucher({
      code: voucherCode,
      name: `Voucher đổi từ ${points} điểm tích lũy`,
      type: 'FIXED',
      value: voucherValue,
      minimumOrder: minOrder,
      maximumDiscount: voucherValue,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      usageLimit: 1,
      status: 'ACTIVE',
    });

    this.createNotification({
      userId: customerId,
      title: 'Đổi điểm thưởng thành công! 🎁',
      message: `Bạn vừa đổi ${points} điểm lấy mã giảm giá ${voucherCode} trị giá ${voucherValue.toLocaleString('vi-VN')}đ.`,
      type: 'VOUCHER',
      link: '/products',
    });

    this.persist();
    return { success: true, message: 'Đổi điểm thành công', voucher: newVoucher };
  }

  // --- NOTIFICATIONS ---
  getNotifications(userId: string): NotificationItem[] {
    return this.db.notifications
      .filter(n => n.userId === userId || n.userId === 'ALL')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(notif: Omit<NotificationItem, 'id' | 'isRead' | 'createdAt'>): NotificationItem {
    const newNotif: NotificationItem = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      isRead: false,
      createdAt: new Date().toISOString(),
      ...notif,
    };
    this.db.notifications.unshift(newNotif);
    this.persist();
    return newNotif;
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.db.notifications.find(n => n.id === id);
    if (!notif) return false;
    notif.isRead = true;
    this.persist();
    return true;
  }

  markAllNotificationsAsRead(userId: string): boolean {
    this.db.notifications.forEach(n => {
      if (n.userId === userId || n.userId === 'ALL') {
        n.isRead = true;
      }
    });
    this.persist();
    return true;
  }

  // --- CHAT ---
  getConversations(): ChatConversationItem[] {
    return this.db.conversations.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
  }

  getOrCreateConversation(customerId: string, customerName: string): ChatConversationItem {
    let conv = this.db.conversations.find(c => c.customerId === customerId);
    if (!conv) {
      conv = {
        id: 'conv_' + customerId,
        customerId,
        customerName,
        lastMessage: 'Cuộc trò chuyện mới được tạo',
        lastMessageAt: new Date().toISOString(),
        unreadCountEmployee: 0,
        unreadCountCustomer: 0,
      };
      this.db.conversations.unshift(conv);
      this.persist();
    }
    return conv;
  }

  getChatMessages(conversationId: string): ChatMessageItem[] {
    return this.db.chatMessages
      .filter(m => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  sendChatMessage(messageData: Omit<ChatMessageItem, 'id' | 'isRead' | 'createdAt'>): ChatMessageItem {
    const newMsg: ChatMessageItem = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      isRead: false,
      createdAt: new Date().toISOString(),
      ...messageData,
    };
    this.db.chatMessages.push(newMsg);

    // Update conversation metadata
    const conv = this.db.conversations.find(c => c.id === messageData.conversationId);
    if (conv) {
      conv.lastMessage = messageData.message;
      conv.lastMessageAt = newMsg.createdAt;
      if (messageData.senderRole === 'CUSTOMER') {
        conv.unreadCountEmployee = (conv.unreadCountEmployee || 0) + 1;
      } else {
        conv.unreadCountCustomer = (conv.unreadCountCustomer || 0) + 1;
      }
    }

    this.persist();
    return newMsg;
  }

  markChatMessagesAsRead(conversationId: string, readerRole: 'CUSTOMER' | 'STAFF'): boolean {
    const conv = this.db.conversations.find(c => c.id === conversationId);
    if (conv) {
      if (readerRole === 'STAFF') {
        conv.unreadCountEmployee = 0;
      } else {
        conv.unreadCountCustomer = 0;
      }
    }

    this.db.chatMessages.forEach(m => {
      if (m.conversationId === conversationId) {
        if (readerRole === 'STAFF' && m.senderRole === 'CUSTOMER') {
          m.isRead = true;
        } else if (readerRole === 'CUSTOMER' && m.senderRole !== 'CUSTOMER') {
          m.isRead = true;
        }
      }
    });

    this.persist();
    return true;
  }

  // --- SYSTEM ADMINISTRATION ---
  getBackupSnapshot(): DatabaseSchema {
    // Return detached data so a downloader cannot mutate the live in-memory store.
    return JSON.parse(JSON.stringify(this.db)) as DatabaseSchema;
  }

  getSystemLogs(limit = 100): SystemLogEntry[] {
    const safeLimit = Math.max(1, Math.min(500, Math.floor(limit) || 100));
    return [...this.db.systemLogs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, safeLimit);
  }

  addSystemLog(entry: Omit<SystemLogEntry, 'id' | 'createdAt'> & Partial<Pick<SystemLogEntry, 'createdAt'>>): SystemLogEntry {
    const log: SystemLogEntry = {
      ...entry,
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      createdAt: entry.createdAt || new Date().toISOString(),
    };
    this.db.systemLogs.push(log);
    if (this.db.systemLogs.length > 2000) this.db.systemLogs.splice(0, this.db.systemLogs.length - 2000);
    this.persist();
    return log;
  }

  getStoreSettings(): StoreSettings {
    return { ...DEFAULT_STORE_SETTINGS, ...this.db.storeSettings };
  }

  updateStoreSettings(
    updates: Partial<Pick<StoreSettings, 'storeName' | 'logoUrl' | 'hotline' | 'address' | 'email'>>,
    updatedBy: string,
  ): StoreSettings {
    this.db.storeSettings = {
      ...this.getStoreSettings(),
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy || 'Quản trị viên',
    };
    this.persist();
    return this.getStoreSettings();
  }

  // --- REPORTS & ANALYTICS ---
  getReports() {
    const totalOrders = this.db.orders.length;
    const completedOrders = this.db.orders.filter(o => o.orderStatus === 'COMPLETED');
    const cancelledOrders = this.db.orders.filter(o => o.orderStatus === 'CANCELLED');
    const pendingOrders = this.db.orders.filter(o => o.orderStatus === 'PENDING' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PREPARING');

    // Revenue charts use completed orders only and exclude refunded orders.
    const revenueOrders = completedOrders.filter(o => o.paymentStatus !== 'REFUNDED');
    const totalRevenue = revenueOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

    const customers = this.db.users.filter(u => u.role === 'CUSTOMER');
    const employees = this.db.users.filter(u => u.role === 'EMPLOYEE');
    const lowStockProducts = this.db.products.filter(p => p.stock < 50);

    // Best sellers
    const bestSellingProducts = [...this.db.products]
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 6);

    // Revenue trend data is calculated from actual order records, not demo values.
    // Prefer completedAt; fall back to createdAt for legacy orders without completion dates.
    // Use Vietnam local calendar dates (UTC+7), regardless of the server timezone.
    const revenueByDay = new Map<string, { revenue: number; orders: number }>();
    const revenueByMonth = new Map<string, { revenue: number; orders: number }>();
    const revenueByYear = new Map<string, { revenue: number; orders: number }>();
    const vietnamOffsetMs = 7 * 60 * 60 * 1000;
    const addToBucket = (map: Map<string, { revenue: number; orders: number }>, key: string, amount: number) => {
      const current = map.get(key) || { revenue: 0, orders: 0 };
      current.revenue += amount;
      current.orders += 1;
      map.set(key, current);
    };

    for (const order of revenueOrders) {
      const orderDate = new Date(order.completedAt || order.createdAt);
      if (!Number.isFinite(orderDate.getTime())) continue;

      const vietnamDate = new Date(orderDate.getTime() + vietnamOffsetMs);
      const dateKey = vietnamDate.toISOString().slice(0, 10);
      const monthKey = dateKey.slice(0, 7);
      const yearKey = dateKey.slice(0, 4);
      const amount = Number(order.total) || 0;

      addToBucket(revenueByDay, dateKey, amount);
      addToBucket(revenueByMonth, monthKey, amount);
      addToBucket(revenueByYear, yearKey, amount);
    }

    const now = new Date();
    const vietnamNow = new Date(now.getTime() + vietnamOffsetMs);
    const todayUtc = new Date(Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth(), vietnamNow.getUTCDate()));

    // Last 30 calendar days including today.
    const dailyRevenue = Array.from({ length: 30 }, (_, index) => {
      const date = new Date(todayUtc);
      date.setUTCDate(todayUtc.getUTCDate() - (29 - index));
      const key = date.toISOString().slice(0, 10);
      const bucket = revenueByDay.get(key) || { revenue: 0, orders: 0 };
      const day = String(date.getUTCDate()).padStart(2, '0');
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      return { date: key, day: `${day}/${month}`, label: `${day}/${month}`, ...bucket };
    });

    // Last 12 calendar months including current month.
    const monthlyRevenue = Array.from({ length: 12 }, (_, index) => {
      const date = new Date(Date.UTC(vietnamNow.getUTCFullYear(), vietnamNow.getUTCMonth() - (11 - index), 1));
      const key = date.toISOString().slice(0, 7);
      const month = String(date.getUTCMonth() + 1).padStart(2, '0');
      const year = String(date.getUTCFullYear()).slice(-2);
      const label = `T${month}/${year}`;
      const bucket = revenueByMonth.get(key) || { revenue: 0, orders: 0 };
      return { month: label, label, period: key, ...bucket };
    });

    // Last 6 calendar years including current year.
    const currentYear = vietnamNow.getUTCFullYear();
    const yearlyRevenue = Array.from({ length: 6 }, (_, index) => {
      const year = String(currentYear - 5 + index);
      const bucket = revenueByYear.get(year) || { revenue: 0, orders: 0 };
      return { year, label: year, ...bucket };
    });

    // Order status breakdown
    const orderStatusBreakdown = [
      { name: 'Đã hoàn thành', count: completedOrders.length, color: '#10b981' },
      { name: 'Đang xử lý', count: pendingOrders.length, color: '#3b82f6' },
      { name: 'Đang giao', count: this.db.orders.filter(o => o.orderStatus === 'SHIPPING').length, color: '#f59e0b' },
      { name: 'Đã hủy', count: cancelledOrders.length, color: '#ef4444' },
    ];

    // Category Sales breakdown
    const categoryStats = this.db.categories.map(cat => {
      const catProducts = this.db.products.filter(p => p.categoryId === cat.id);
      const totalSold = catProducts.reduce((sum, p) => sum + (p.sold || 0), 0);
      return {
        name: cat.name,
        sold: totalSold,
        productCount: catProducts.length,
      };
    }).sort((a, b) => b.sold - a.sold);

    // Top Customers by spending
    const customerSpending = customers.map(cust => {
      const custOrders = completedOrders.filter(o => o.customerId === cust.id);
      const totalSpent = custOrders.reduce((sum, o) => sum + o.total, 0);
      return {
        id: cust.id,
        name: cust.name,
        email: cust.email,
        phone: cust.phone,
        orderCount: custOrders.length,
        totalSpent,
        points: cust.loyaltyPoints,
      };
    }).sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5);

    return {
      summary: {
        totalRevenue,
        totalOrders,
        completedOrdersCount: completedOrders.length,
        cancelledOrdersCount: cancelledOrders.length,
        pendingOrdersCount: pendingOrders.length,
        totalProducts: this.db.products.length,
        totalCustomers: customers.length,
        totalEmployees: employees.length,
        lowStockCount: lowStockProducts.length,
      },
      dailyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      orderStatusBreakdown,
      categoryStats,
      bestSellingProducts,
      lowStockProducts,
      customerSpending,
    };
  }
}

export const dataStore = new DataStoreService();
