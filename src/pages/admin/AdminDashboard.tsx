import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Boxes,
  Truck,
  Ticket,
  Users,
  MessageSquare,
  BarChart3,
  Bell,
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  Shield,
  Layers,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  reportsAPI,
  productsAPI,
  categoriesAPI,
  ordersAPI,
  inventoryAPI,
  suppliersAPI,
  vouchersAPI,
  usersAPI,
  reviewsAPI,
  notificationsAPI,
} from '../../api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import { i18n } from '../../i18n.ts';

type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'inventory'
  | 'suppliers'
  | 'vouchers'
  | 'users'
  | 'reviews'
  | 'reports'
  | 'notifications';

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);

  // Data states
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Search & Filter
  const [filterSearch, setFilterSearch] = useState('');

  // Modals
  const [showProductModal, setShowProductModal] = useState<any>(null); // null = closed, {} = add, obj = edit
  const [showCategoryModal, setShowCategoryModal] = useState<any>(null);
  const [showVoucherModal, setShowVoucherModal] = useState<any>(null);
  const [showSupplierModal, setShowSupplierModal] = useState<any>(null);
  const [showUserModal, setShowUserModal] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Form states for Product
  const [prodForm, setProdForm] = useState({
    name: '',
    code: '',
    categoryId: '',
    brand: 'Thiên Long',
    price: 30000,
    salePrice: 25000,
    unit: 'Cây',
    stock: 100,
    image: 'https://images.unsplash.com/photo-1585336261026-0a6eb9df69b8?auto=format&fit=crop&w=800&q=80',
    description: '',
    specification: '',
  });

  // Form state for Broadcast Notification
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [dashRes, prodRes, catRes, ordRes, invRes, supRes, vouchRes, usrRes, revRes] =
        await Promise.all([
          reportsAPI.getDashboard(),
          productsAPI.getAll({ limit: 100 }),
          categoriesAPI.getAll(),
          ordersAPI.getAll({ limit: 100 }),
          inventoryAPI.getLogs(),
          suppliersAPI.getAll(),
          vouchersAPI.getAll(true),
          usersAPI.getAll(),
          reviewsAPI.getAll(),
        ]);

      if (dashRes.success) setDashboardData(dashRes.data);
      if (prodRes.success) setProducts(prodRes.data);
      if (catRes.success) setCategories(catRes.data);
      if (ordRes.success) setOrders(ordRes.data);
      if (invRes.success) setInventoryLogs(invRes.data);
      if (supRes.success) setSuppliers(supRes.data);
      if (vouchRes.success) setVouchers(vouchRes.data);
      if (usrRes.success) setUsers(usrRes.data);
      if (revRes.success) setReviews(revRes.data);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handlers for Products
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (showProductModal?.id) {
        // Update
        const res = await productsAPI.update(showProductModal.id, prodForm);
        if (res.success) {
          showToast('Cập nhật sản phẩm thành công', 'success');
          setShowProductModal(null);
          loadData();
        }
      } else {
        // Create
        const res = await productsAPI.create(prodForm);
        if (res.success) {
          showToast('Thêm sản phẩm mới thành công', 'success');
          setShowProductModal(null);
          loadData();
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi lưu sản phẩm', 'error');
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi hệ thống?')) return;
    try {
      const res = await productsAPI.delete(id);
      if (res.success) {
        showToast('Đã xóa sản phẩm thành công', 'success');
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi xóa sản phẩm', 'error');
    }
  };

  // Handlers for Orders
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await ordersAPI.updateStatus(orderId, { orderStatus: nextStatus });
      if (res.success) {
        showToast(`Đã chuyển đơn hàng sang trạng thái ${nextStatus}`, 'success');
        if (selectedOrder) setSelectedOrder(res.data);
        loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật đơn hàng', 'error');
    }
  };

  // Handlers for Reviews
  const handleToggleReviewStatus = async (reviewId: string, currentStatus: string) => {
    const next = currentStatus === 'APPROVED' ? 'HIDDEN' : 'APPROVED';
    try {
      await reviewsAPI.updateStatus(reviewId, next as any);
      showToast(`Đã đổi trạng thái đánh giá thành ${next}`, 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật đánh giá', 'error');
    }
  };

  // Handlers for Broadcast Notification
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;
    try {
      const res = await notificationsAPI.broadcast({
        title: broadcastTitle,
        message: broadcastMessage,
        userId: 'ALL',
        type: 'SYSTEM',
      });
      if (res.success) {
        showToast('Đã phát thông báo hệ thống đến tất cả khách hàng & nhân viên!', 'success');
        setBroadcastTitle('');
        setBroadcastMessage('');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi gửi thông báo', 'error');
    }
  };

  // Summary Metrics from API
  const summary = dashboardData?.summary || {
    totalRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalCustomers: 0,
    totalEmployees: 0,
    lowStockCount: 0,
  };

  const monthlyRevData = dashboardData?.monthlyRevenue || [];
  const statusPieData = dashboardData?.orderStatusBreakdown || [];
  const categoryStats = dashboardData?.categoryStats || [];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Stationery Shop</div>
            <div style={{ fontSize: 10, color: '#38bdf8', fontWeight: 600 }}>QUẢN TRỊ VIÊN TOÀN QUYỀN</div>
          </div>
        </div>

        <nav className="admin-nav-group">
          <button
            className={`admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <LayoutDashboard size={18} /> Dashboard Thống Kê
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <Package size={18} /> Quản Lý Sản Phẩm
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
            onClick={() => setActiveTab('categories')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <FolderTree size={18} /> Danh Mục Văn Phòng
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <ShoppingBag size={18} /> Quản Lý Đơn Hàng
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <Boxes size={18} /> Quản Lý Kho & Nhập Hàng
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'suppliers' ? 'active' : ''}`}
            onClick={() => setActiveTab('suppliers')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <Truck size={18} /> Nhà Cung Cấp VPP
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'vouchers' ? 'active' : ''}`}
            onClick={() => setActiveTab('vouchers')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <Ticket size={18} /> Mã Giảm Giá & Voucher
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <Users size={18} /> Khách Hàng & Nhân Viên
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <MessageSquare size={18} /> Đánh Giá & Kiểm Duyệt
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <BarChart3 size={18} /> Báo Cáo Doanh Thu
          </button>
          <button
            className={`admin-nav-item ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <Bell size={18} /> Phát Thông Báo
          </button>
        </nav>
      </aside>

      {/* Main Container */}
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Shield size={20} color="var(--primary)" />
            <h2 className="admin-page-title">
              {activeTab === 'dashboard' && 'Dashboard Tổng Quan Hệ Thống'}
              {activeTab === 'products' && 'Quản Lý Sản Phẩm Văn Phòng Phẩm'}
              {activeTab === 'categories' && 'Quản Lý Danh Mục Mặt Hàng'}
              {activeTab === 'orders' && 'Quản Lý Toàn Bộ Đơn Hàng'}
              {activeTab === 'inventory' && 'Kiểm Soát Tồn Kho & Lịch Sử Nhập Hàng'}
              {activeTab === 'suppliers' && 'Danh Sách Nhà Phân Phối & Cung Cấp'}
              {activeTab === 'vouchers' && 'Quản Lý Chương Trình Khuyến Mãi'}
              {activeTab === 'users' && 'Quản Lý Tài Khoản Người Dùng & Nhân Viên'}
              {activeTab === 'reviews' && 'Kiểm Duyệt Nhận Xét Của Khách Hàng'}
              {activeTab === 'reports' && 'Báo Cáo Hoạt Động & Doanh Thu'}
              {activeTab === 'notifications' && 'Hệ Thống Thông Báo Nội Bộ & Khách Hàng'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Admin: <strong>{currentUser?.name}</strong>
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content">
          {/* TAB 1: DASHBOARD & RECHARTS */}
          {activeTab === 'dashboard' && (
            <div>
              {/* 4 Stat Cards */}
              <div className="stat-cards-grid">
                <div className="stat-card">
                  <div>
                    <div className="stat-val">{i18n.currency(summary.totalRevenue)}</div>
                    <div className="stat-label">Tổng Doanh Thu Đã Hoàn Thành</div>
                  </div>
                  <div className="stat-icon" style={{ backgroundColor: '#ecfdf5', color: '#059669' }}>
                    <DollarSign size={26} />
                  </div>
                </div>

                <div className="stat-card">
                  <div>
                    <div className="stat-val">{summary.totalOrders}</div>
                    <div className="stat-label">Tổng Đơn Hàng Trong Hệ Thống</div>
                  </div>
                  <div className="stat-icon" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                    <ShoppingBag size={26} />
                  </div>
                </div>

                <div className="stat-card">
                  <div>
                    <div className="stat-val">{summary.totalProducts}</div>
                    <div className="stat-label">Sản Phẩm Đang Kinh Doanh</div>
                  </div>
                  <div className="stat-icon" style={{ backgroundColor: '#fef3c7', color: '#d97706' }}>
                    <Package size={26} />
                  </div>
                </div>

                <div className="stat-card">
                  <div>
                    <div className="stat-val">{summary.totalCustomers}</div>
                    <div className="stat-label">Khách Hàng Đã Đăng Ký</div>
                  </div>
                  <div className="stat-icon" style={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}>
                    <Users size={26} />
                  </div>
                </div>
              </div>

              {/* Recharts Analytics Charts */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24, marginBottom: 28 }}>
                {/* Revenue Trend Area Chart */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Biểu Đồ Doanh Thu Theo Tháng (VND)</h3>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyRevData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 1000000}M`} />
                        <Tooltip formatter={(value: any) => [i18n.currency(value), 'Doanh thu']} />
                        <Area type="monotone" dataKey="revenue" stroke="#2563eb" fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Orders Status Pie Chart */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Tỷ Lệ Trạng Thái Đơn Hàng</h3>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusPieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="count"
                        >
                          {statusPieData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color || '#3b82f6'} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Best Selling Categories & Top Selling Products */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Category Sales Bar Chart */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Sản Lượng Bán Theo Danh Mục (Món)</h3>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryStats.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="sold" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Best Selling Products list */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Top Sản Phẩm Bán Chạy Nhất</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {dashboardData?.bestSellingProducts?.slice(0, 5).map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderBottom: '1px solid #f8fafc', paddingBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={p.image} alt={p.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Kho: {p.stock} {p.unit}</div>
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, color: '#059669' }}>Đã bán: {p.sold}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {activeTab === 'products' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã sản phẩm..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, width: 260 }}
                  />
                </div>
                <button
                  className="btn-primary"
                  onClick={() => {
                    setProdForm({
                      name: '',
                      code: `VPP-${Math.floor(100 + Math.random() * 900)}`,
                      categoryId: categories[0]?.id || '',
                      brand: 'Thiên Long',
                      price: 35000,
                      salePrice: 29000,
                      unit: 'Cây',
                      stock: 100,
                      image: 'https://images.unsplash.com/photo-1585336261026-0a6eb9df69b8?auto=format&fit=crop&w=800&q=80',
                      description: 'Mô tả chi tiết sản phẩm văn phòng phẩm chính hãng...',
                      specification: 'Quy cách chuẩn văn phòng học sinh',
                    });
                    setShowProductModal({});
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
                >
                  <Plus size={16} /> Thêm Sản Phẩm Mới
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Mã SP</th>
                      <th>Danh mục</th>
                      <th>Giá gốc</th>
                      <th>Giá bán</th>
                      <th>Tồn kho</th>
                      <th>Đã bán</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter((p) => !filterSearch || p.name.toLowerCase().includes(filterSearch.toLowerCase()) || p.code.toLowerCase().includes(filterSearch.toLowerCase()))
                      .map((p) => (
                        <tr key={p.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img src={p.image} alt={p.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                              <div>
                                <div style={{ fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>Hãng: {p.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td><strong>{p.code}</strong></td>
                          <td>{p.categoryName}</td>
                          <td style={{ color: '#64748b' }}>{i18n.currency(p.price)}</td>
                          <td><strong style={{ color: '#dc2626' }}>{i18n.currency(p.salePrice || p.price)}</strong></td>
                          <td>
                            <span style={{ fontWeight: 700, color: p.stock < 50 ? '#dc2626' : '#059669' }}>
                              {p.stock} {p.unit}
                            </span>
                          </td>
                          <td>{p.sold || 0}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button
                                onClick={() => {
                                  setProdForm({ ...p });
                                  setShowProductModal(p);
                                }}
                                style={{ padding: 6, borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}
                                title="Chỉnh sửa"
                              >
                                <Edit size={14} color="#2563eb" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                style={{ padding: 6, borderRadius: 6, border: '1px solid #fca5a5', background: '#fef2f2', cursor: 'pointer' }}
                                title="Xóa"
                              >
                                <Trash2 size={14} color="#ef4444" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Danh Mục Văn Phòng Phẩm ({categories.length})</h3>
                <button
                  className="btn-primary"
                  onClick={() => setShowCategoryModal({})}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13 }}
                >
                  <Plus size={16} /> Thêm Danh Mục
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên danh mục</th>
                      <th>Mã danh mục</th>
                      <th>Đường dẫn (slug)</th>
                      <th>Mô tả</th>
                      <th>Số SP hiện có</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => {
                      const count = products.filter((p) => p.categoryId === c.id).length;
                      return (
                        <tr key={c.id}>
                          <td><strong>{c.name}</strong></td>
                          <td><code>{c.code}</code></td>
                          <td style={{ color: '#64748b' }}>/{c.slug}</td>
                          <td style={{ color: '#475569', fontSize: 13 }}>{c.description}</td>
                          <td><span style={{ fontWeight: 700, color: 'var(--primary)' }}>{count} sản phẩm</span></td>
                          <td>
                            <span style={{ color: '#059669', fontWeight: 600, fontSize: 12 }}>✓ Hoạt động</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS MANAGEMENT */}
          {activeTab === 'orders' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Tất Cả Đơn Hàng ({orders.length})</h3>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã đơn hàng</th>
                      <th>Khách hàng</th>
                      <th>Ngày đặt</th>
                      <th>Tổng tiền</th>
                      <th>Thanh toán</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((ord) => {
                      const statusConf = i18n.orderStatus[ord.orderStatus as keyof typeof i18n.orderStatus] || {
                        label: ord.orderStatus,
                        color: '#64748b',
                        bg: '#f1f5f9',
                      };
                      return (
                        <tr key={ord.id}>
                          <td><strong>{ord.orderCode}</strong></td>
                          <td>
                            <div>{ord.customerName}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{ord.customerPhone}</div>
                          </td>
                          <td style={{ color: '#64748b', fontSize: 12 }}>{i18n.formatDate(ord.createdAt)}</td>
                          <td><strong style={{ color: '#dc2626' }}>{i18n.currency(ord.total)}</strong></td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                backgroundColor: ord.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7',
                                color: ord.paymentStatus === 'PAID' ? '#065f46' : '#92400e',
                              }}
                            >
                              {ord.paymentStatus}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '4px 10px',
                                borderRadius: 9999,
                                fontSize: 12,
                                fontWeight: 700,
                                backgroundColor: statusConf.bg,
                                color: statusConf.color,
                              }}
                            >
                              {statusConf.label}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => setSelectedOrder(ord)}
                              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <Eye size={14} /> Xem / Cập nhật
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: INVENTORY LOGS */}
          {activeTab === 'inventory' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>Lịch Sử Nhập - Xuất - Điều Chỉnh Kho</h3>
                  <p style={{ fontSize: 13, color: '#64748b' }}>Ghi nhận nhật ký biến động kho chính xác phục vụ kiểm kê</p>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Thời gian</th>
                      <th>Sản phẩm</th>
                      <th>Loại biến động</th>
                      <th>Số lượng</th>
                      <th>Tồn trước đó</th>
                      <th>Tồn sau đó</th>
                      <th>Ghi chú</th>
                      <th>Người thực hiện</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventoryLogs.slice(0, 30).map((log) => {
                      const isStockIn = log.type === 'IN';
                      return (
                        <tr key={log.id}>
                          <td style={{ fontSize: 12, color: '#64748b' }}>{i18n.formatDate(log.createdAt)}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{log.productName}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>SKU: {log.productCode}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                backgroundColor: isStockIn ? '#dbeafe' : '#fef2f2',
                                color: isStockIn ? '#1d4ed8' : '#dc2626',
                              }}
                            >
                              {log.type === 'IN' ? 'Nhập kho' : log.type === 'OUT' ? 'Xuất đơn hàng' : 'Điều chỉnh'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: isStockIn ? '#059669' : '#dc2626' }}>
                              {isStockIn ? '+' : ''}{log.quantity}
                            </strong>
                          </td>
                          <td style={{ color: '#64748b' }}>{log.previousStock}</td>
                          <td><strong style={{ color: '#0f172a' }}>{log.newStock}</strong></td>
                          <td style={{ fontSize: 13, color: '#475569' }}>{log.note}</td>
                          <td style={{ fontSize: 12, color: '#64748b' }}>{log.createdBy}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: SUPPLIERS */}
          {activeTab === 'suppliers' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Danh Sách Nhà Cung Cấp VPP ({suppliers.length})</h3>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tên nhà cung cấp</th>
                      <th>Mã NCC</th>
                      <th>Người phụ trách</th>
                      <th>Số điện thoại</th>
                      <th>Email liên hệ</th>
                      <th>Địa chỉ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((sup) => (
                      <tr key={sup.id}>
                        <td><strong>{sup.name}</strong></td>
                        <td><code>{sup.code}</code></td>
                        <td>{sup.contactPerson}</td>
                        <td>{sup.phone}</td>
                        <td style={{ color: '#2563eb' }}>{sup.email}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{sup.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: VOUCHERS */}
          {activeTab === 'vouchers' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Danh Sách Mã Khuyến Mãi & Giảm Giá ({vouchers.length})</h3>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Mã code</th>
                      <th>Tên chương trình</th>
                      <th>Loại giảm</th>
                      <th>Giá trị</th>
                      <th>Đơn tối thiểu</th>
                      <th>Lượt đã dùng</th>
                      <th>Hạn sử dụng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => (
                      <tr key={v.id}>
                        <td><strong style={{ color: 'var(--primary)' }}>{v.code}</strong></td>
                        <td style={{ fontWeight: 600 }}>{v.name}</td>
                        <td>{v.type === 'PERCENTAGE' ? 'Theo %' : 'Cố định (VND)'}</td>
                        <td>
                          <strong>{v.type === 'PERCENTAGE' ? `${v.value}%` : i18n.currency(v.value)}</strong>
                        </td>
                        <td>{i18n.currency(v.minimumOrder)}</td>
                        <td>{v.usedCount} / {v.usageLimit}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{i18n.formatDate(v.endDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: USERS */}
          {activeTab === 'users' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700 }}>Danh Sách Người Dùng & Nhân Viên ({users.length})</h3>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Họ và tên</th>
                      <th>Email</th>
                      <th>Vai trò (Role)</th>
                      <th>Số điện thoại</th>
                      <th>Số dư ví</th>
                      <th>Điểm tích lũy</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isAdm = u.role === 'ADMIN';
                      const isEmp = u.role === 'EMPLOYEE';
                      return (
                        <tr key={u.id}>
                          <td><strong>{u.name}</strong></td>
                          <td style={{ color: '#2563eb' }}>{u.email}</td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                backgroundColor: isAdm ? '#fee2e2' : isEmp ? '#ecfdf5' : '#eff6ff',
                                color: isAdm ? '#dc2626' : isEmp ? '#059669' : '#2563eb',
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td>{u.phone || 'Chưa cập nhật'}</td>
                          <td><strong>{i18n.currency(u.walletBalance || 0)}</strong></td>
                          <td style={{ color: '#d97706', fontWeight: 700 }}>{u.loyaltyPoints || 0}</td>
                          <td>
                            <span style={{ color: '#059669', fontWeight: 600, fontSize: 12 }}>✓ Hoạt động</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 9: REVIEWS MODERATION */}
          {activeTab === 'reviews' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Kiểm Duyệt Nhận Xét Của Khách Hàng ({reviews.length})</h3>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm</th>
                      <th>Khách hàng</th>
                      <th>Số sao</th>
                      <th>Nội dung nhận xét</th>
                      <th>Thời gian</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reviews.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>{r.productId}</td>
                        <td>{r.customerName}</td>
                        <td><strong style={{ color: '#f59e0b' }}>{r.rating} ★</strong></td>
                        <td style={{ maxWidth: 300, fontSize: 13, lineHeight: 1.4 }}>{r.comment}</td>
                        <td style={{ fontSize: 12, color: '#64748b' }}>{i18n.formatDate(r.createdAt)}</td>
                        <td>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              backgroundColor: r.status === 'APPROVED' ? '#d1fae5' : '#fee2e2',
                              color: r.status === 'APPROVED' ? '#065f46' : '#dc2626',
                            }}
                          >
                            {r.status === 'APPROVED' ? 'Hiển thị' : 'Đã ẩn'}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleReviewStatus(r.id, r.status)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              fontSize: 12,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {r.status === 'APPROVED' ? 'Ẩn nhận xét' : 'Duyệt nhận xét'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 10: REPORTS */}
          {activeTab === 'reports' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Báo Cáo Chi Tiết Doanh Thu & Khách Hàng</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Doanh thu tích lũy hoàn tất</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>
                    {i18n.currency(summary.totalRevenue)}
                  </div>
                </div>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Tỷ lệ đơn hàng thành công</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#2563eb', marginTop: 4 }}>
                    {summary.totalOrders > 0 ? Math.round((summary.completedOrdersCount / summary.totalOrders) * 100) : 100}%
                  </div>
                </div>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ fontSize: 13, color: '#64748b' }}>Khách hàng đã chi tiêu</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#7c3aed', marginTop: 4 }}>
                    {summary.totalCustomers} tài khoản
                  </div>
                </div>
              </div>

              <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Top Khách Hàng Chi Tiêu Nhiều Nhất</h4>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Khách hàng</th>
                      <th>Email</th>
                      <th>Số điện thoại</th>
                      <th>Tổng số đơn</th>
                      <th>Tổng tiền chi tiêu</th>
                      <th>Điểm thưởng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData?.customerSpending?.map((c: any) => (
                      <tr key={c.id}>
                        <td><strong>{c.name}</strong></td>
                        <td style={{ color: '#2563eb' }}>{c.email}</td>
                        <td>{c.phone}</td>
                        <td>{c.orderCount} đơn hàng</td>
                        <td><strong style={{ color: '#dc2626' }}>{i18n.currency(c.totalSpent)}</strong></td>
                        <td style={{ color: '#d97706', fontWeight: 700 }}>{c.points} điểm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 11: BROADCAST NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, maxWidth: 600 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Phát Thông Báo Toàn Hệ Thống</h3>
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
                Thông báo sẽ xuất hiện trên quả chuông của tất cả các tài khoản khách hàng và nhân viên ngay lập tức.
              </p>

              <form onSubmit={handleBroadcast}>
                <div className="form-group">
                  <label className="form-label">Tiêu đề thông báo *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Đại lễ khuyến mãi văn phòng phẩm giảm 20%"
                    value={broadcastTitle}
                    onChange={(e) => setBroadcastTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nội dung chi tiết *</label>
                  <textarea
                    className="form-control"
                    rows={4}
                    placeholder="Nhập nội dung thông báo gửi đến người dùng..."
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bell size={16} /> Gửi Thông Báo Cho Toàn Bộ User
                </button>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* Edit/Add Product Modal */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">{showProductModal.id ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h3>
              <button className="modal-close-btn" onClick={() => setShowProductModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label">Tên sản phẩm *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={prodForm.name}
                    onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Mã sản phẩm (SKU) *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={prodForm.code}
                      onChange={(e) => setProdForm({ ...prodForm, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Thương hiệu *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={prodForm.brand}
                      onChange={(e) => setProdForm({ ...prodForm, brand: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Danh mục *</label>
                    <select
                      className="form-control"
                      value={prodForm.categoryId}
                      onChange={(e) => setProdForm({ ...prodForm, categoryId: e.target.value })}
                      required
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Đơn vị tính</label>
                    <input
                      type="text"
                      className="form-control"
                      value={prodForm.unit}
                      onChange={(e) => setProdForm({ ...prodForm, unit: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Giá niêm yết (VND) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={prodForm.price}
                      onChange={(e) => setProdForm({ ...prodForm, price: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giá khuyến mãi (VND) *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={prodForm.salePrice}
                      onChange={(e) => setProdForm({ ...prodForm, salePrice: Number(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Số lượng tồn kho *</label>
                    <input
                      type="number"
                      className="form-control"
                      value={prodForm.stock}
                      onChange={(e) => setProdForm({ ...prodForm, stock: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Đường dẫn hình ảnh (URL)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={prodForm.image}
                    onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Mô tả sản phẩm</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={prodForm.description}
                    onChange={(e) => setProdForm({ ...prodForm, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowProductModal(null)}>Hủy</button>
                <button type="submit" className="btn-primary">Lưu Sản Phẩm</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Status Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Quản Trị Đơn Hàng: {selectedOrder.orderCode}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
                <div>Khách hàng: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerPhone})</div>
                <div>Địa chỉ: <strong>{selectedOrder.shippingAddress}</strong></div>
                <div>Thanh toán: <strong>{selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})</strong></div>
                <div>Tổng thanh toán: <strong style={{ color: '#dc2626' }}>{i18n.currency(selectedOrder.total)}</strong></div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Sản phẩm trong đơn:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {selectedOrder.items.map((i: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #f1f5f9', paddingBottom: 6 }}>
                    <span>{i.name} (x{i.quantity} {i.unit})</span>
                    <strong>{i18n.currency(i.price * i.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Cập nhật trạng thái trực tiếp:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'COMPLETED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: '1px solid',
                      borderColor: selectedOrder.orderStatus === st ? '#2563eb' : '#cbd5e1',
                      backgroundColor: selectedOrder.orderStatus === st ? '#eff6ff' : '#ffffff',
                      color: selectedOrder.orderStatus === st ? '#2563eb' : '#1e293b',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
