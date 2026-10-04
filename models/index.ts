import mongoose, { Schema, Document } from 'mongoose';

// User Schema
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  loyaltyPoints: number;
  walletBalance: number;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['ADMIN', 'EMPLOYEE', 'CUSTOMER'], default: 'CUSTOMER' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    walletBalance: { type: Number, default: 0, min: 0 },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

// Category Schema
export interface ICategory extends Document {
  name: string;
  code: string;
  slug: string;
  description?: string;
  iconName: string;
  status: 'ACTIVE' | 'INACTIVE';
  displayOrder: number;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    slug: { type: String, required: true },
    description: { type: String, default: '' },
    iconName: { type: String, default: 'Folder' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Product Schema
export interface IProduct extends Document {
  name: string;
  code: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  price: number;
  salePrice: number;
  unit: string;
  stock: number;
  sold: number;
  image: string;
  description: string;
  specification?: string;
  rating: number;
  reviewCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    categoryId: { type: String, required: true },
    categoryName: { type: String, required: true },
    brand: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, required: true, min: 0 },
    unit: { type: String, default: 'Cái' },
    stock: { type: Number, required: true, default: 0, min: 0 },
    sold: { type: Number, default: 0, min: 0 },
    image: { type: String, required: true },
    description: { type: String, default: '' },
    specification: { type: String, default: '' },
    rating: { type: Number, default: 5.0, min: 1, max: 5 },
    reviewCount: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Order Schema
export interface IOrder extends Document {
  orderCode: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  shippingAddress: string;
  note: string;
  paymentMethod: 'COD' | 'WALLET' | 'BANKING';
  paymentStatus: 'UNPAID' | 'PAID' | 'REFUNDED';
  orderStatus: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPING' | 'COMPLETED' | 'CANCELLED';
  items: Array<{
    productId: string;
    code: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
    unit: string;
  }>;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  voucherCode?: string;
  pointsEarned: number;
  cancelReason?: string;
  completedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    orderCode: { type: String, required: true, unique: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: { type: String, default: '' },
    shippingAddress: { type: String, required: true },
    note: { type: String, default: '' },
    paymentMethod: { type: String, enum: ['COD', 'WALLET', 'BANKING'], default: 'COD' },
    paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID' },
    orderStatus: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'COMPLETED', 'CANCELLED'],
      default: 'PENDING',
    },
    items: [
      {
        productId: { type: String, required: true },
        code: { type: String, required: true },
        name: { type: String, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unit: { type: String, default: 'Cái' },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shippingFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    voucherCode: { type: String },
    pointsEarned: { type: Number, default: 0 },
    cancelReason: { type: String },
    completedAt: { type: Date },
    cancelledAt: { type: Date },
  },
  { timestamps: true }
);

// Voucher Schema
export interface IVoucher extends Document {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumOrder: number;
  maximumDiscount: number;
  startDate: Date;
  endDate: Date;
  usageLimit: number;
  usedCount: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
}

const VoucherSchema = new Schema<IVoucher>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'FIXED' },
    value: { type: Number, required: true, min: 0 },
    minimumOrder: { type: Number, default: 0 },
    maximumDiscount: { type: Number, default: 0 },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    usageLimit: { type: Number, default: 100 },
    usedCount: { type: Number, default: 0 },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

// Review Schema
export interface IReview extends Document {
  productId: string;
  orderId: string;
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  rating: number;
  comment: string;
  status: 'APPROVED' | 'HIDDEN';
  createdAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: { type: String, required: true },
    orderId: { type: String, required: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    customerAvatar: { type: String },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
    status: { type: String, enum: ['APPROVED', 'HIDDEN'], default: 'APPROVED' },
  },
  { timestamps: true }
);

// Inventory Schema
export interface IInventory extends Document {
  productId: string;
  productName: string;
  productCode: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  previousStock: number;
  newStock: number;
  supplierId?: string;
  supplierName?: string;
  note: string;
  createdBy: string;
  createdAt: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    productCode: { type: String, required: true },
    type: { type: String, enum: ['IN', 'OUT', 'ADJUSTMENT'], required: true },
    quantity: { type: Number, required: true },
    previousStock: { type: Number, required: true },
    newStock: { type: Number, required: true },
    supplierId: { type: String },
    supplierName: { type: String },
    note: { type: String, default: '' },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

// Supplier Schema
export interface ISupplier extends Document {
  name: string;
  code: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    contactPerson: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: '' },
    status: { type: String, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE' },
  },
  { timestamps: true }
);

// Wallet Transaction Schema
export interface IWalletTransaction extends Document {
  customerId: string;
  type: 'DEPOSIT' | 'PAYMENT' | 'REFUND';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  orderId?: string;
  description: string;
  status: 'SUCCESS' | 'FAILED';
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    customerId: { type: String, required: true },
    type: { type: String, enum: ['DEPOSIT', 'PAYMENT', 'REFUND'], required: true },
    amount: { type: Number, required: true },
    balanceBefore: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    orderId: { type: String },
    description: { type: String, required: true },
    status: { type: String, enum: ['SUCCESS', 'FAILED'], default: 'SUCCESS' },
  },
  { timestamps: true }
);

// Notification Schema
export interface INotification extends Document {
  userId: string;
  title: string;
  message: string;
  type: 'ORDER' | 'VOUCHER' | 'SYSTEM' | 'WALLET';
  isRead: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['ORDER', 'VOUCHER', 'SYSTEM', 'WALLET'], default: 'SYSTEM' },
    isRead: { type: Boolean, default: false },
    link: { type: String },
  },
  { timestamps: true }
);

// Chat Schema
export interface IChatMessage extends Document {
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: 'CUSTOMER' | 'EMPLOYEE' | 'ADMIN';
  receiverId: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>(
  {
    conversationId: { type: String, required: true },
    senderId: { type: String, required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['CUSTOMER', 'EMPLOYEE', 'ADMIN'], required: true },
    receiverId: { type: String, required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export const CategoryModel = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
export const ProductModel = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
export const OrderModel = mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);
export const VoucherModel = mongoose.models.Voucher || mongoose.model<IVoucher>('Voucher', VoucherSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);
export const InventoryModel = mongoose.models.Inventory || mongoose.model<IInventory>('Inventory', InventorySchema);
export const SupplierModel = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);
export const WalletTransactionModel = mongoose.models.WalletTransaction || mongoose.model<IWalletTransaction>('WalletTransaction', WalletTransactionSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
export const ChatMessageModel = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
