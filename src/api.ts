const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('stationery_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('stationery_token', token);
  } else {
    localStorage.removeItem('stationery_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Yêu cầu thất bại, vui lòng thử lại');
  }

  return data;
}

export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),
  register: (data: { name: string; email: string; password: string; phone?: string; address?: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getMe: () => request<{ success: boolean; user: any }>('/auth/me'),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateProfile: (data: any) =>
    request<{ success: boolean; message: string; user: any }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const productsAPI = {
  getAll: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; data: any[]; pagination: any }>(`/products${query ? `?${query}` : ''}`);
  },
  getFeatured: () => request<{ success: boolean; data: any[] }>('/products/featured'),
  getBestSellers: () => request<{ success: boolean; data: any[] }>('/products/best-sellers'),
  getNewArrivals: () => request<{ success: boolean; data: any[] }>('/products/new-arrivals'),
  getById: (id: string) => request<{ success: boolean; data: any }>(`/products/${id}`),
  create: (data: any) =>
    request<{ success: boolean; message: string; data: any }>('/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; message: string; data: any }>(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/products/${id}`, {
      method: 'DELETE',
    }),
};

export const categoriesAPI = {
  getAll: () => request<{ success: boolean; data: any[] }>('/categories'),
  getById: (id: string) => request<{ success: boolean; data: any }>(`/categories/${id}`),
  create: (data: any) =>
    request<{ success: boolean; message: string; data: any }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; message: string; data: any }>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

export const ordersAPI = {
  create: (orderData: any) =>
    request<{ success: boolean; message: string; data: any }>('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    }),
  getMyOrders: () => request<{ success: boolean; data: any[] }>('/orders/my-orders'),
  getAll: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; data: any[]; pagination: any }>(`/orders${query ? `?${query}` : ''}`);
  },
  getById: (id: string) => request<{ success: boolean; data: any }>(`/orders/${id}`),
  updateStatus: (id: string, data: { orderStatus: string; paymentStatus?: string; cancelReason?: string }) =>
    request<{ success: boolean; message: string; data: any }>(`/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  cancel: (id: string, reason?: string) =>
    request<{ success: boolean; message: string; data: any }>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

export const cartAPI = {
  validateCart: (items: any[]) =>
    request<{ success: boolean; data: { items: any[]; subtotal: number; shippingFee: number; total: number; errors: string[] } }>('/cart/validate', {
      method: 'POST',
      body: JSON.stringify({ items }),
    }),
};

export const vouchersAPI = {
  getAll: (all: boolean = false) => request<{ success: boolean; data: any[] }>(`/vouchers${all ? '?all=true' : ''}`),
  validateVoucher: (code: string, orderAmount: number) =>
    request<{ success: boolean; message: string; data: { code: string; name: string; discount: number; voucher: any } }>('/vouchers/validate', {
      method: 'POST',
      body: JSON.stringify({ code, orderAmount }),
    }),
  create: (data: any) =>
    request<{ success: boolean; message: string; data: any }>('/vouchers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; message: string; data: any }>(`/vouchers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/vouchers/${id}`, {
      method: 'DELETE',
    }),
};

export const reviewsAPI = {
  getByProduct: (productId: string) => request<{ success: boolean; data: any[] }>(`/reviews/product/${productId}`),
  getAll: () => request<{ success: boolean; data: any[] }>('/reviews'),
  addReview: (data: { productId: string; orderId?: string; rating: number; comment: string }) =>
    request<{ success: boolean; message: string; data: any }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateReview: (id: string, data: { rating: number; comment: string }) =>
    request<{ success: boolean; message: string; data: any }>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  replyToReview: (id: string, reply: string) =>
    request<{ success: boolean; message: string; data: any }>(`/reviews/${id}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ reply }),
    }),
  deleteReviewReply: (id: string) =>
    request<{ success: boolean; message: string; data: any }>(`/reviews/${id}/reply`, { method: 'DELETE' }),
  updateStatus: (id: string, status: 'APPROVED' | 'HIDDEN') =>
    request<{ success: boolean; message: string; data: any }>(`/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/reviews/${id}`, {
      method: 'DELETE',
    }),
};

export const inventoryAPI = {
  getLogs: () => request<{ success: boolean; data: any[] }>('/inventory/logs'),
  getLowStock: () => request<{ success: boolean; data: any[] }>('/inventory/low-stock'),
  stockIn: (data: { productId: string; quantity: number; supplierId?: string; note?: string }) =>
    request<{ success: boolean; message: string; data: any }>('/inventory/in', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  stockAdjust: (data: { productId: string; adjustmentQty: number; note?: string }) =>
    request<{ success: boolean; message: string; data: any }>('/inventory/adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const loyaltyAPI = {
  redeemPoints: (points: number) =>
    request<{ success: boolean; message: string; voucher?: any }>('/loyalty/redeem-points', {
      method: 'POST',
      body: JSON.stringify({ points }),
    }),
};

export const notificationsAPI = {
  getAll: () => request<{ success: boolean; data: any[]; unreadCount: number }>('/notifications'),
  markAsRead: (id: string) => request<{ success: boolean; message: string }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllAsRead: () => request<{ success: boolean; message: string }>('/notifications/read-all', { method: 'PUT' }),
  broadcast: (data: { title: string; message: string; userId?: string; type?: string; link?: string }) =>
    request<{ success: boolean; message: string; data: any }>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const chatsAPI = {
  getConversations: () => request<{ success: boolean; data: any[] }>('/chats'),
  initConversation: () => request<{ success: boolean; data: any }>('/chats/init', { method: 'POST' }),
  getMessages: (conversationId: string) => request<{ success: boolean; data: any[] }>(`/chats/${conversationId}/messages`),
  sendMessage: (conversationId: string, message: string, receiverId?: string) =>
    request<{ success: boolean; data: any }>(`/chats/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message, receiverId }),
    }),
  markAsRead: (conversationId: string) =>
    request<{ success: boolean; message: string }>(`/chats/${conversationId}/read`, { method: 'PUT' }),
};

export const reportsAPI = {
  getDashboard: () => request<{ success: boolean; data: any }>('/reports/dashboard'),
  getRevenue: () => request<{ success: boolean; data: any }>('/reports/revenue'),
  getOrders: () => request<{ success: boolean; data: any }>('/reports/orders'),
  getProducts: () => request<{ success: boolean; data: any }>('/reports/products'),
};

export const suppliersAPI = {
  getAll: () => request<{ success: boolean; data: any[] }>('/suppliers'),
  create: (data: any) =>
    request<{ success: boolean; message: string; data: any }>('/suppliers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; message: string; data: any }>(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/suppliers/${id}`, {
      method: 'DELETE',
    }),
};

export const usersAPI = {
  getAll: (params: Record<string, any> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<{ success: boolean; data: any[] }>(`/users${query ? `?${query}` : ''}`);
  },
  create: (data: any) =>
    request<{ success: boolean; message: string; data: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) =>
    request<{ success: boolean; message: string; data: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) =>
    request<{ success: boolean; message: string }>(`/users/${id}`, {
      method: 'DELETE',
    }),
};


export const siteContentAPI = {
  get: () => request<{ success: boolean; data: any }>('/site-content'),
  update: (data: any) => request<{ success: boolean; message: string; data: any }>('/site-content', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
};


export interface StoreSettingsData {
  storeName: string;
  logoUrl: string;
  hotline: string;
  address: string;
  email: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface SystemLogData {
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

export interface ProductInventoryReportRow {
  productId: string;
  name: string;
  code: string;
  categoryName: string;
  brand: string;
  stock: number;
  soldInPeriod: number;
  price: number;
  lastSoldAt: string | null;
}

export interface ProductInventoryReportData {
  generatedAt: string;
  days: number;
  lowStockThreshold: number;
  slowMovingThreshold: number;
  summary: { activeProducts: number; lowStockCount: number; outOfStockCount: number; slowMovingCount: number };
  lowStockProducts: ProductInventoryReportRow[];
  slowMovingProducts: ProductInventoryReportRow[];
}

export interface CustomerInsightRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  createdAt: string;
  completedOrderCount: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface CustomerInsightsReportData {
  generatedAt: string;
  newCustomerDays: number;
  frequentCustomerLimit: number;
  summary: { newCustomerCount: number; customersWithCompletedOrders: number };
  newCustomers: CustomerInsightRow[];
  frequentCustomers: CustomerInsightRow[];
}

export const systemAPI = {
  getPublicSettings: () => request<{ success: boolean; data: StoreSettingsData }>('/system/settings/public'),
  getSettings: () => request<{ success: boolean; data: StoreSettingsData }>('/system/settings'),
  updateSettings: (data: StoreSettingsData) => request<{ success: boolean; message: string; data: StoreSettingsData }>('/system/settings', {
    method: 'PUT', body: JSON.stringify(data),
  }),
  getProductInventoryReport: (params: { days?: number; lowStockThreshold?: number; slowMovingThreshold?: number } = {}) => {
    const query = new URLSearchParams(Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null) acc[key] = String(value);
      return acc;
    }, {})).toString();
    return request<{ success: boolean; data: ProductInventoryReportData }>(`/system/reports/product-inventory${query ? `?${query}` : ''}`);
  },
  getCustomerInsightsReport: (params: { days?: number; limit?: number } = {}) => {
    const query = new URLSearchParams(Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null) acc[key] = String(value);
      return acc;
    }, {})).toString();
    return request<{ success: boolean; data: CustomerInsightsReportData }>(`/system/reports/customer-insights${query ? `?${query}` : ''}`);
  },
  getLogs: (params: { limit?: number; q?: string; status?: string } = {}) => {
    const query = new URLSearchParams(Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') acc[key] = String(value);
      return acc;
    }, {})).toString();
    return request<{ success: boolean; data: SystemLogData[]; total: number }>(`/system/logs${query ? `?${query}` : ''}`);
  },
};
