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
}

const DB_FILE_PATH = path.resolve(process.cwd(), 'data', 'db.json');

class DataStoreService {
  private db: DatabaseSchema;
  private isLoaded: boolean = false;

  constructor() {
    this.db = getInitialSeedData();
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
          walletTransactions: parsed.walletTransactions?.length ? parsed.walletTransactions : seed.walletTransactions,
          notifications: parsed.notifications?.length ? parsed.notifications : seed.notifications,
          conversations: parsed.conversations?.length ? parsed.conversations : seed.conversations,
          chatMessages: parsed.chatMessages?.length ? parsed.chatMessages : seed.chatMessages,
        };
      } else {
        this.db = getInitialSeedData();
        this.persist();
      }
      this.isLoaded = true;
    } catch (err) {
      console.error('Error initializing DataStore, using in-memory seed:', err);
      this.db = getInitialSeedData();
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

  createUser(user: Omit<UserItem, 'id' | 'createdAt' | 'updatedAt' | 'loyaltyPoints' | 'walletBalance'> & Partial<UserItem>): UserItem {
    const newUser: UserItem = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      loyaltyPoints: user.loyaltyPoints ?? 0,
      walletBalance: user.walletBalance ?? 0,
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

    // If paid by wallet, deduct customer wallet balance
    if (newOrder.paymentMethod === 'WALLET' && newOrder.paymentStatus === 'PAID') {
      const customer = this.getUserById(newOrder.customerId);
      if (customer) {
        const balanceBefore = customer.walletBalance || 0;
        customer.walletBalance = Math.max(0, balanceBefore - newOrder.total);
        this.createWalletTransaction({
          customerId: customer.id,
          type: 'PAYMENT',
          amount: newOrder.total,
          balanceBefore,
          balanceAfter: customer.walletBalance,
          orderId: newOrder.id,
          description: `Thanh toán đơn hàng văn phòng phẩm ${newOrder.orderCode}`,
          status: 'SUCCESS',
        });
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

        // Refund wallet balance if paid by wallet
        if (order.paymentMethod === 'WALLET' && order.paymentStatus === 'PAID') {
          const customer = this.getUserById(order.customerId);
          if (customer) {
            const balanceBefore = customer.walletBalance || 0;
            customer.walletBalance += order.total;
            order.paymentStatus = 'REFUNDED';

            this.createWalletTransaction({
              customerId: customer.id,
              type: 'REFUND',
              amount: order.total,
              balanceBefore,
              balanceAfter: customer.walletBalance,
              orderId: order.id,
              description: `Hoàn tiền ví đơn hàng ${order.orderCode} bị hủy`,
              status: 'SUCCESS',
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

  createReview(review: Omit<ReviewItem, 'id' | 'createdAt'>): ReviewItem {
    const newRev: ReviewItem = {
      id: 'rev_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...review,
    };
    this.db.reviews.unshift(newRev);

    // Recalculate product rating
    const prodReviews = this.db.reviews.filter(r => r.productId === review.productId && r.status === 'APPROVED');
    const prod = this.getProductById(review.productId);
    if (prod && prodReviews.length > 0) {
      const sum = prodReviews.reduce((acc, curr) => acc + curr.rating, 0);
      prod.rating = Number((sum / prodReviews.length).toFixed(1));
      prod.reviewCount = prodReviews.length;
    }

    this.persist();
    return newRev;
  }

  updateReviewStatus(id: string, status: ReviewItem['status']): ReviewItem | null {
    const rev = this.db.reviews.find(r => r.id === id);
    if (!rev) return null;
    rev.status = status;
    this.persist();
    return rev;
  }

  deleteReview(id: string): boolean {
    const before = this.db.reviews.length;
    this.db.reviews = this.db.reviews.filter(r => r.id !== id);
    const deleted = this.db.reviews.length < before;
    if (deleted) this.persist();
    return deleted;
  }

  // --- WALLET ---
  getWalletTransactions(customerId?: string): WalletTransactionItem[] {
    if (customerId) {
      return this.db.walletTransactions
        .filter(t => t.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return this.db.walletTransactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createWalletTransaction(tx: Omit<WalletTransactionItem, 'id' | 'createdAt'>): WalletTransactionItem {
    const newTx: WalletTransactionItem = {
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
      ...tx,
    };
    this.db.walletTransactions.unshift(newTx);
    this.persist();
    return newTx;
  }

  depositWallet(customerId: string, amount: number, methodDescription: string = 'Nạp tiền vào ví'): { success: boolean; newBalance: number } {
    const customer = this.getUserById(customerId);
    if (!customer) return { success: false, newBalance: 0 };

    const balanceBefore = customer.walletBalance || 0;
    customer.walletBalance = balanceBefore + amount;

    this.createWalletTransaction({
      customerId,
      type: 'DEPOSIT',
      amount,
      balanceBefore,
      balanceAfter: customer.walletBalance,
      description: `${methodDescription} +${amount.toLocaleString('vi-VN')}đ`,
      status: 'SUCCESS',
    });

    this.createNotification({
      userId: customerId,
      title: 'Nạp ví thành công 💰',
      message: `Bạn đã nạp thành công +${amount.toLocaleString('vi-VN')}đ vào ví Stationery Pay. Số dư hiện tại: ${customer.walletBalance.toLocaleString('vi-VN')}đ.`,
      type: 'WALLET',
      link: '/wallet',
    });

    this.persist();
    return { success: true, newBalance: customer.walletBalance };
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

  // --- REPORTS & ANALYTICS ---
  getReports() {
    const totalOrders = this.db.orders.length;
    const completedOrders = this.db.orders.filter(o => o.orderStatus === 'COMPLETED');
    const cancelledOrders = this.db.orders.filter(o => o.orderStatus === 'CANCELLED');
    const pendingOrders = this.db.orders.filter(o => o.orderStatus === 'PENDING' || o.orderStatus === 'CONFIRMED' || o.orderStatus === 'PREPARING');

    const totalRevenue = completedOrders.reduce((sum, o) => sum + o.total, 0);

    const customers = this.db.users.filter(u => u.role === 'CUSTOMER');
    const employees = this.db.users.filter(u => u.role === 'EMPLOYEE');
    const lowStockProducts = this.db.products.filter(p => p.stock < 50);

    // Best sellers
    const bestSellingProducts = [...this.db.products]
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 6);

    // Revenue by Month for charts
    const monthlyRevenue = [
      { month: 'T09/25', revenue: 14200000, orders: 48 },
      { month: 'T10/25', revenue: 18500000, orders: 62 },
      { month: 'T11/25', revenue: 21300000, orders: 75 },
      { month: 'T12/25', revenue: 26800000, orders: 89 },
      { month: 'T01/26', revenue: 31500000, orders: 104 },
      { month: 'T02/26', revenue: totalRevenue + 15400000, orders: totalOrders + 32 },
    ];

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
      monthlyRevenue,
      orderStatusBreakdown,
      categoryStats,
      bestSellingProducts,
      lowStockProducts,
      customerSpending,
    };
  }
}

export const dataStore = new DataStoreService();
