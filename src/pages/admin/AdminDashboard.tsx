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
  Settings,
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
import { SystemManagementPanel } from './SystemManagementPanel.tsx';

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
  | 'notifications'
  | 'system';

type VoucherFormState = {
  code: string;
  name: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  minimumOrder: number;
  maximumDiscount: number;
  startDate: string;
  endDate: string;
  usageLimit: number;
  status: 'ACTIVE' | 'INACTIVE';
};

const toDateTimeLocal = (value: string | Date): string => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const createEmptyVoucherForm = (): VoucherFormState => ({
  code: '',
  name: '',
  type: 'PERCENTAGE',
  value: 10,
  minimumOrder: 0,
  maximumDiscount: 0,
  startDate: toDateTimeLocal(new Date()),
  endDate: toDateTimeLocal(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
  usageLimit: 100,
  status: 'ACTIVE',
});

export const AdminDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [loading, setLoading] = useState(true);
  const [revenueGranularity, setRevenueGranularity] = useState<'daily' | 'monthly' | 'yearly'>('monthly');

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
  const [reviewReplyDrafts, setReviewReplyDrafts] = useState<Record<string, string>>({});
  const [savingReviewReplyId, setSavingReviewReplyId] = useState<string | null>(null);

  // Search & Filter
  const [filterSearch, setFilterSearch] = useState('');

  // Modals
  const [showProductModal, setShowProductModal] = useState<any>(null); // null = closed, {} = add, obj = edit
  const [showCategoryModal, setShowCategoryModal] = useState<any>(null);
  const [showVoucherModal, setShowVoucherModal] = useState<any>(null);
  const [voucherForm, setVoucherForm] = useState<VoucherFormState>(() => createEmptyVoucherForm());
  const [savingVoucher, setSavingVoucher] = useState(false);
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
      if (revRes.success) {
        setReviews(revRes.data);
        setReviewReplyDrafts(Object.fromEntries(revRes.data.map((review: any) => [review.id, review.adminReply || ''])));
      }
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

  // Handlers for vouchers (US39/US40)
  const openVoucherModal = (voucher?: any) => {
    if (voucher) {
      setVoucherForm({
        code: voucher.code || '',
        name: voucher.name || '',
        type: voucher.type === 'FIXED' ? 'FIXED' : 'PERCENTAGE',
        value: Number(voucher.value) || 0,
        minimumOrder: Number(voucher.minimumOrder) || 0,
        maximumDiscount: Number(voucher.maximumDiscount) || 0,
        startDate: toDateTimeLocal(voucher.startDate || new Date()),
        endDate: toDateTimeLocal(voucher.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
        usageLimit: Number(voucher.usageLimit) || 0,
        status: voucher.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      setShowVoucherModal({ id: voucher.id });
    } else {
      setVoucherForm(createEmptyVoucherForm());
      setShowVoucherModal({});
    }
  };

  const handleSaveVoucher = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!voucherForm.code.trim() || !voucherForm.name.trim()) {
      showToast('Vui lòng nhập mã và tên voucher', 'warning');
      return;
    }
    if (!Number.isFinite(Number(voucherForm.value)) || Number(voucherForm.value) <= 0 || (voucherForm.type === 'PERCENTAGE' && Number(voucherForm.value) > 100)) {
      showToast('Giá trị giảm không hợp lệ', 'warning');
      return;
    }
    if (Number(voucherForm.minimumOrder) < 0 || Number(voucherForm.maximumDiscount) < 0 || Number(voucherForm.usageLimit) < 0) {
      showToast('Điều kiện voucher không được âm', 'warning');
      return;
    }
    const start = new Date(voucherForm.startDate);
    const end = new Date(voucherForm.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      showToast('Ngày kết thúc phải sau ngày bắt đầu', 'warning');
      return;
    }
    const editingVoucher = showVoucherModal?.id ? vouchers.find((item) => item.id === showVoucherModal.id) : null;
    if (editingVoucher && Number(voucherForm.usageLimit) > 0 && Number(voucherForm.usageLimit) < Number(editingVoucher.usedCount || 0)) {
      showToast('Lượt sử dụng không được nhỏ hơn số lượt đã dùng', 'warning');
      return;
    }

    const payload = {
      ...voucherForm,
      code: voucherForm.code.trim().toUpperCase(),
      name: voucherForm.name.trim(),
      value: Number(voucherForm.value),
      minimumOrder: Number(voucherForm.minimumOrder),
      maximumDiscount: Number(voucherForm.maximumDiscount),
      usageLimit: Number(voucherForm.usageLimit),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
    setSavingVoucher(true);
    try {
      const result = editingVoucher
        ? await vouchersAPI.update(editingVoucher.id, payload)
        : await vouchersAPI.create(payload);
      if (result.success) {
        showToast(editingVoucher ? 'Cập nhật voucher thành công' : 'Tạo voucher thành công; khách hàng đã được thông báo', 'success');
        setShowVoucherModal(null);
        await loadData();
      }
    } catch (error: any) {
      showToast(error.message || 'Không thể lưu voucher', 'error');
    } finally {
      setSavingVoucher(false);
    }
  };

  const handleDeleteVoucher = async (voucher: any) => {
    if (!confirm(`Bạn có chắc muốn xóa voucher ${voucher.code}?`)) return;
    try {
      const result = await vouchersAPI.delete(voucher.id);
      if (result.success) {
        showToast('Đã xóa voucher', 'success');
        await loadData();
      }
    } catch (error: any) {
      showToast(error.message || 'Không thể xóa voucher', 'error');
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

  const handleSaveReviewReply = async (reviewId: string) => {
    const reply = (reviewReplyDrafts[reviewId] || '').trim();
    if (!reply) {
      showToast('Vui lòng nhập nội dung phản hồi', 'warning');
      return;
    }
    if (reply.length > 2000) {
      showToast('Phản hồi không được vượt quá 2.000 ký tự', 'warning');
      return;
    }
    setSavingReviewReplyId(reviewId);
    try {
      const res = await reviewsAPI.replyToReview(reviewId, reply);
      if (res.success && res.data) {
        setReviews((previous) => previous.map((review) => review.id === reviewId ? res.data : review));
        setReviewReplyDrafts((previous) => ({ ...previous, [reviewId]: res.data.adminReply || reply }));
        showToast('Đã lưu phản hồi của cửa hàng', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể lưu phản hồi', 'error');
    } finally {
      setSavingReviewReplyId(null);
    }
  };

  const handleDeleteReviewReply = async (reviewId: string) => {
    if (!confirm('Bạn có chắc muốn xóa phản hồi của cửa hàng cho đánh giá này?')) return;
    setSavingReviewReplyId(reviewId);
    try {
      const res = await reviewsAPI.deleteReviewReply(reviewId);
      if (res.success && res.data) {
        setReviews((previous) => previous.map((review) => review.id === reviewId ? res.data : review));
        setReviewReplyDrafts((previous) => ({ ...previous, [reviewId]: '' }));
        showToast('Đã xóa phản hồi của cửa hàng', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể xóa phản hồi', 'error');
    } finally {
      setSavingReviewReplyId(null);
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

  const dailyRevData = dashboardData?.dailyRevenue || [];
  const monthlyRevData = dashboardData?.monthlyRevenue || [];
  const yearlyRevData = dashboardData?.yearlyRevenue || [];
  const revenueChartData = revenueGranularity === 'daily'
    ? dailyRevData
    : revenueGranularity === 'yearly'
      ? yearlyRevData
      : monthlyRevData;
  const revenueChartTitle = revenueGranularity === 'daily'
    ? 'Biểu Đồ Doanh Thu Theo Ngày (VND)'
    : revenueGranularity === 'yearly'
      ? 'Biểu Đồ Doanh Thu Theo Năm (VND)'
      : 'Biểu Đồ Doanh Thu Theo Tháng (VND)';
  const revenueChartHint = revenueGranularity === 'daily'
    ? '30 ngày gần nhất'
    : revenueGranularity === 'yearly'
      ? '6 năm gần nhất'
      : '12 tháng gần nhất';
  const statusPieData = dashboardData?.orderStatusBreakdown || [];
  const categoryStats = dashboardData?.categoryStats || [];

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div style={{ width: 34, height: 34, borderRadius: 8, background: '#F21D2F', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
            <Layers size={20} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#ffffff' }}>Stationery Shop</div>
            <div style={{ fontSize: 10, color: '#F21D2F', fontWeight: 600 }}>QUẢN TRỊ VIÊN TOÀN QUYỀN</div>
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
          <button
            className={`admin-nav-item ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
            style={{ width: '100%', border: 'none', background: 'none', textAlign: 'left' }}
          >
            <Settings size={18} /> Quản Trị Hệ Thống & Dữ Liệu
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
              {activeTab === 'system' && 'Quản Trị Hệ Thống & Dữ Liệu'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 13, color: '#5f5e5e' }}>
              Admin: <strong>{currentUser?.name}</strong>
            </span>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content">
          {activeTab === 'system' && <SystemManagementPanel />}
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
                  <div className="stat-icon" style={{ backgroundColor: '#FFE5E8', color: '#F21D2F' }}>
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
                {/* Revenue Trend Area Chart: daily / monthly / yearly */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{revenueChartTitle}</h3>
                      <div style={{ fontSize: 12, color: '#777B80', marginTop: 5 }}>{revenueChartHint} · Đơn hoàn thành, chưa hoàn tiền</div>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 12, fontWeight: 700, color: '#555555', whiteSpace: 'nowrap' }}>
                      <span>Kỳ thống kê</span>
                      <select
                        aria-label="Chọn kỳ xem doanh thu"
                        value={revenueGranularity}
                        onChange={(event) => setRevenueGranularity(event.target.value as 'daily' | 'monthly' | 'yearly')}
                        style={{
                          minWidth: 150,
                          appearance: 'auto',
                          border: '1px solid #D1D5DB',
                          borderRadius: 8,
                          padding: '10px 34px 10px 12px',
                          backgroundColor: '#FFFFFF',
                          color: '#101010',
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: 'pointer',
                          outlineColor: '#F21D2F',
                        }}
                      >
                        <option value="daily">Theo ngày</option>
                        <option value="monthly">Theo tháng</option>
                        <option value="yearly">Theo năm</option>
                      </select>
                    </label>
                  </div>
                  <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueChartData}>
                        <defs>
                          <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#F21D2F" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#F21D2F" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEC" />
                        <XAxis
                          dataKey="label"
                          stroke="#777B80"
                          fontSize={12}
                          interval={revenueGranularity === 'daily' ? 4 : 0}
                          minTickGap={revenueGranularity === 'daily' ? 6 : 0}
                        />
                        <YAxis
                          stroke="#777B80"
                          fontSize={12}
                          tickFormatter={(value: number) => value >= 1000000
                            ? `${Number((value / 1000000).toFixed(1))}M`
                            : value >= 1000 ? `${Math.round(value / 1000)}K` : String(value)}
                        />
                        <Tooltip formatter={(value: any) => [i18n.currency(Number(value) || 0), 'Doanh thu']} />
                        <Area type="monotone" dataKey="revenue" stroke="#F21D2F" fillOpacity={1} fill="url(#colorRev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Orders Status Pie Chart */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
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
                            <Cell key={`cell-${index}`} fill={entry.color || '#D90D24'} />
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
                <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Sản Lượng Bán Theo Danh Mục (Món)</h3>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryStats.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEC" />
                        <XAxis dataKey="name" stroke="#777B80" fontSize={11} />
                        <YAxis stroke="#777B80" fontSize={12} />
                        <Tooltip />
                        <Bar dataKey="sold" fill="#059669" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Best Selling Products list */}
                <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Top Sản Phẩm Bán Chạy Nhất</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {dashboardData?.bestSellingProducts?.slice(0, 5).map((p: any) => (
                      <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, borderBottom: '1px solid #F5F5F3', paddingBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={p.image} alt={p.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#101010' }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: '#5f5e5e' }}>Kho: {p.stock} {p.unit}</div>
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    placeholder="Tìm tên hoặc mã sản phẩm..."
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #E7E8EA', fontSize: 13, width: 260 }}
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
                                <div style={{ fontSize: 11, color: '#5f5e5e' }}>Hãng: {p.brand}</div>
                              </div>
                            </div>
                          </td>
                          <td><strong>{p.code}</strong></td>
                          <td>{p.categoryName}</td>
                          <td style={{ color: '#5f5e5e' }}>{i18n.currency(p.price)}</td>
                          <td><strong style={{ color: '#D90D24' }}>{i18n.currency(p.salePrice || p.price)}</strong></td>
                          <td>
                            <span style={{ fontWeight: 700, color: p.stock < 50 ? '#D90D24' : '#059669' }}>
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
                                style={{ padding: 6, borderRadius: 6, border: '1px solid #E7E8EA', background: '#F5F5F3', cursor: 'pointer' }}
                                title="Chỉnh sửa"
                              >
                                <Edit size={14} color="#F21D2F" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                style={{ padding: 6, borderRadius: 6, border: '1px solid #fca5a5', background: '#FFE5E8', cursor: 'pointer' }}
                                title="Xóa"
                              >
                                <Trash2 size={14} color="#F21D2F" />
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
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
                          <td style={{ color: '#5f5e5e' }}>/{c.slug}</td>
                          <td style={{ color: '#5f5e5e', fontSize: 13 }}>{c.description}</td>
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
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
                        color: '#5f5e5e',
                        bg: '#EEEEEC',
                      };
                      return (
                        <tr key={ord.id}>
                          <td><strong>{ord.orderCode}</strong></td>
                          <td>
                            <div>{ord.customerName}</div>
                            <div style={{ fontSize: 11, color: '#5f5e5e' }}>{ord.customerPhone}</div>
                          </td>
                          <td style={{ color: '#5f5e5e', fontSize: 12 }}>{i18n.formatDate(ord.createdAt)}</td>
                          <td><strong style={{ color: '#D90D24' }}>{i18n.currency(ord.total)}</strong></td>
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
                              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #E7E8EA', background: '#F5F5F3', cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700 }}>Lịch Sử Nhập - Xuất - Điều Chỉnh Kho</h3>
                  <p style={{ fontSize: 13, color: '#5f5e5e' }}>Ghi nhận nhật ký biến động kho chính xác phục vụ kiểm kê</p>
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
                          <td style={{ fontSize: 12, color: '#5f5e5e' }}>{i18n.formatDate(log.createdAt)}</td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{log.productName}</div>
                            <div style={{ fontSize: 11, color: '#5f5e5e' }}>SKU: {log.productCode}</div>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                backgroundColor: isStockIn ? '#FFE5E8' : '#FFE5E8',
                                color: isStockIn ? '#D90D24' : '#D90D24',
                              }}
                            >
                              {log.type === 'IN' ? 'Nhập kho' : log.type === 'OUT' ? 'Xuất đơn hàng' : 'Điều chỉnh'}
                            </span>
                          </td>
                          <td>
                            <strong style={{ color: isStockIn ? '#059669' : '#D90D24' }}>
                              {isStockIn ? '+' : ''}{log.quantity}
                            </strong>
                          </td>
                          <td style={{ color: '#5f5e5e' }}>{log.previousStock}</td>
                          <td><strong style={{ color: '#101010' }}>{log.newStock}</strong></td>
                          <td style={{ fontSize: 13, color: '#5f5e5e' }}>{log.note}</td>
                          <td style={{ fontSize: 12, color: '#5f5e5e' }}>{log.createdBy}</td>
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
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
                        <td style={{ color: '#F21D2F' }}>{sup.email}</td>
                        <td style={{ fontSize: 12, color: '#5f5e5e' }}>{sup.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: VOUCHERS */}
          {activeTab === 'vouchers' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Danh Sách Mã Khuyến Mãi & Giảm Giá ({vouchers.length})</h3>
                  <p style={{ fontSize: 12, color: '#777B80', margin: '6px 0 0' }}>Thiết lập loại giảm, đơn tối thiểu, mức giảm tối đa, thời hạn và lượt sử dụng. Khách hàng sẽ nhận thông báo khi có voucher mới hoặc voucher sắp hết hạn.</p>
                </div>
                <button className="btn-primary" onClick={() => openVoucherModal()} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, whiteSpace: 'nowrap' }}>
                  <Plus size={16} /> Tạo voucher
                </button>
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
                      <th>Giảm tối đa</th>
                      <th>Lượt đã dùng</th>
                      <th>Thời hạn</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vouchers.map((v) => {
                      const isExpired = new Date(v.endDate).getTime() < Date.now();
                      const isUpcoming = new Date(v.startDate).getTime() > Date.now();
                      const exhausted = Number(v.usageLimit) > 0 && Number(v.usedCount) >= Number(v.usageLimit);
                      const statusText = v.status !== 'ACTIVE' ? 'Tạm khóa' : isExpired ? 'Hết hạn' : isUpcoming ? 'Sắp diễn ra' : exhausted ? 'Hết lượt' : 'Đang hoạt động';
                      const statusColor = v.status !== 'ACTIVE' || isExpired || exhausted ? '#6B7280' : isUpcoming ? '#B45309' : '#047857';
                      return (
                        <tr key={v.id}>
                          <td><strong style={{ color: 'var(--primary)' }}>{v.code}</strong></td>
                          <td style={{ fontWeight: 600 }}>{v.name}</td>
                          <td>{v.type === 'PERCENTAGE' ? 'Theo %' : 'Cố định (VND)'}</td>
                          <td><strong>{v.type === 'PERCENTAGE' ? `${v.value}%` : i18n.currency(v.value)}</strong></td>
                          <td>{i18n.currency(v.minimumOrder)}</td>
                          <td>{v.type === 'PERCENTAGE' && v.maximumDiscount > 0 ? i18n.currency(v.maximumDiscount) : '—'}</td>
                          <td>{v.usedCount} / {Number(v.usageLimit) > 0 ? v.usageLimit : '∞'}</td>
                          <td style={{ fontSize: 12, color: '#5f5e5e' }}>
                            <div>{i18n.formatDate(v.startDate)}</div>
                            <div>đến {i18n.formatDate(v.endDate)}</div>
                          </td>
                          <td><span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, background: `${statusColor}18`, color: statusColor, fontWeight: 700, fontSize: 11 }}>{statusText}</span></td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button className="btn-secondary" title="Sửa voucher" aria-label={`Sửa voucher ${v.code}`} onClick={() => openVoucherModal(v)} style={{ padding: '6px 8px' }}><Edit size={14} /></button>
                              <button className="btn-secondary" title="Xóa voucher" aria-label={`Xóa voucher ${v.code}`} onClick={() => handleDeleteVoucher(v)} style={{ padding: '6px 8px', color: '#D90D24' }}><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {vouchers.length === 0 && <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: '#777B80' }}>Chưa có voucher. Nhấn “Tạo voucher” để bắt đầu.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 8: USERS */}
          {activeTab === 'users' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
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
                          <td style={{ color: '#F21D2F' }}>{u.email}</td>
                          <td>
                            <span
                              style={{
                                padding: '3px 8px',
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 700,
                                backgroundColor: isAdm ? '#FFE5E8' : isEmp ? '#ecfdf5' : '#FFE5E8',
                                color: isAdm ? '#D90D24' : isEmp ? '#059669' : '#F21D2F',
                              }}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td>{u.phone || 'Chưa cập nhật'}</td>
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
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
                      <th>Phản hồi của cửa hàng</th>
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
                        <td style={{ fontSize: 12, color: '#5f5e5e' }}>{i18n.formatDate(r.createdAt)}</td>
                        <td>
                          <span
                            style={{
                              padding: '3px 8px',
                              borderRadius: 4,
                              fontSize: 11,
                              fontWeight: 700,
                              backgroundColor: r.status === 'APPROVED' ? '#d1fae5' : '#FFE5E8',
                              color: r.status === 'APPROVED' ? '#065f46' : '#D90D24',
                            }}
                          >
                            {r.status === 'APPROVED' ? 'Hiển thị' : 'Đã ẩn'}
                          </span>
                        </td>
                        <td style={{ minWidth: 280, maxWidth: 360 }}>
                          {r.adminReply && (
                            <div style={{ padding: 8, marginBottom: 8, borderLeft: '3px solid #D90D24', background: '#F8F8F8', borderRadius: '0 6px 6px 0' }}>
                              <div style={{ fontSize: 11, fontWeight: 800, color: '#D90D24', marginBottom: 4 }}>Phản hồi hiện tại{r.adminReplyBy ? ` · ${r.adminReplyBy}` : ''}</div>
                              <div style={{ fontSize: 12, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{r.adminReply}</div>
                              {r.adminReplyAt && <div style={{ fontSize: 10, color: '#777B80', marginTop: 4 }}>{i18n.formatDate(r.adminReplyAt)}</div>}
                            </div>
                          )}
                          {currentUser?.role === 'ADMIN' ? (
                            <>
                              <textarea
                                value={reviewReplyDrafts[r.id] ?? ''}
                                onChange={(e) => setReviewReplyDrafts((previous) => ({ ...previous, [r.id]: e.target.value }))}
                                rows={3}
                                maxLength={2000}
                                placeholder="Nhập phản hồi chính thức của cửa hàng..."
                                aria-label={`Phản hồi đánh giá của ${r.customerName}`}
                                style={{ width: '100%', minWidth: 240, resize: 'vertical', boxSizing: 'border-box', border: '1px solid #D1D5DB', borderRadius: 6, padding: 8, fontSize: 12 }}
                              />
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                                <button
                                  onClick={() => handleSaveReviewReply(r.id)}
                                  disabled={savingReviewReplyId === r.id || !(reviewReplyDrafts[r.id] || '').trim()}
                                  style={{ padding: '6px 9px', borderRadius: 6, border: 0, background: '#D90D24', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', opacity: savingReviewReplyId === r.id ? 0.6 : 1 }}
                                >
                                  {savingReviewReplyId === r.id ? 'Đang lưu...' : r.adminReply ? 'Cập nhật phản hồi' : 'Gửi phản hồi'}
                                </button>
                                {r.adminReply && <button onClick={() => handleDeleteReviewReply(r.id)} disabled={savingReviewReplyId === r.id} style={{ padding: '6px 9px', borderRadius: 6, border: '1px solid #E7E8EA', background: '#fff', color: '#B91C1C', fontSize: 11, cursor: 'pointer' }}>Xóa phản hồi</button>}
                              </div>
                              <div style={{ fontSize: 10, color: '#777B80', marginTop: 4 }}>{(reviewReplyDrafts[r.id] || '').length}/2000 ký tự</div>
                            </>
                          ) : (!r.adminReply ? <span style={{ color: '#777B80', fontSize: 12 }}>Chưa có phản hồi</span> : null)}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleReviewStatus(r.id, r.status)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              border: '1px solid #E7E8EA',
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Báo Cáo Chi Tiết Doanh Thu & Khách Hàng</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 32 }}>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: '#F5F5F3', border: '1px solid #E2E3E1' }}>
                  <div style={{ fontSize: 13, color: '#5f5e5e' }}>Doanh thu tích lũy hoàn tất</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', marginTop: 4 }}>
                    {i18n.currency(summary.totalRevenue)}
                  </div>
                </div>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: '#F5F5F3', border: '1px solid #E2E3E1' }}>
                  <div style={{ fontSize: 13, color: '#5f5e5e' }}>Tỷ lệ đơn hàng thành công</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#F21D2F', marginTop: 4 }}>
                    {summary.totalOrders > 0 ? Math.round((summary.completedOrdersCount / summary.totalOrders) * 100) : 100}%
                  </div>
                </div>
                <div style={{ padding: 20, borderRadius: 12, backgroundColor: '#F5F5F3', border: '1px solid #E2E3E1' }}>
                  <div style={{ fontSize: 13, color: '#5f5e5e' }}>Khách hàng đã chi tiêu</div>
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
                        <td style={{ color: '#F21D2F' }}>{c.email}</td>
                        <td>{c.phone}</td>
                        <td>{c.orderCount} đơn hàng</td>
                        <td><strong style={{ color: '#D90D24' }}>{i18n.currency(c.totalSpent)}</strong></td>
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
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1', padding: 24, maxWidth: 600 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Phát Thông Báo Toàn Hệ Thống</h3>
              <p style={{ fontSize: 13, color: '#5f5e5e', marginBottom: 20 }}>
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

      {/* Create/Edit Voucher Modal - US39 / US40 */}
      {showVoucherModal && (
        <div className="modal-overlay" onClick={() => setShowVoucherModal(null)}>
          <div className="modal-content" onClick={(event) => event.stopPropagation()} style={{ maxWidth: 760 }}>
            <div className="modal-header">
              <h3 className="modal-title">{showVoucherModal.id ? 'Cập nhật voucher' : 'Tạo voucher khuyến mãi'}</h3>
              <button className="modal-close-btn" type="button" onClick={() => setShowVoucherModal(null)}>✕</button>
            </div>
            <form onSubmit={handleSaveVoucher}>
              <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Mã voucher *</label>
                    <input className="form-control" required maxLength={40} pattern="[A-Za-z0-9_-]+" title="Chỉ dùng chữ, số, gạch ngang hoặc gạch dưới" placeholder="VD: TAYTHI20" value={voucherForm.code} onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value.toUpperCase() })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tên chương trình *</label>
                    <input className="form-control" required maxLength={120} placeholder="VD: Ưu đãi khách hàng mới" value={voucherForm.name} onChange={(e) => setVoucherForm({ ...voucherForm, name: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Loại giảm giá *</label>
                    <select className="form-control" value={voucherForm.type} onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value as VoucherFormState['type'] })}>
                      <option value="PERCENTAGE">Theo phần trăm (%)</option>
                      <option value="FIXED">Số tiền cố định (VND)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{voucherForm.type === 'PERCENTAGE' ? 'Phần trăm giảm (1–100) *' : 'Số tiền giảm (VND) *'}</label>
                    <input className="form-control" type="number" required min="0.01" max={voucherForm.type === 'PERCENTAGE' ? 100 : undefined} step="any" value={voucherForm.value} onChange={(e) => setVoucherForm({ ...voucherForm, value: Number(e.target.value) })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Đơn hàng tối thiểu (VND)</label>
                    <input className="form-control" type="number" min="0" step="1000" value={voucherForm.minimumOrder} onChange={(e) => setVoucherForm({ ...voucherForm, minimumOrder: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Giảm tối đa (VND, 0 = không giới hạn)</label>
                    <input className="form-control" type="number" min="0" step="1000" disabled={voucherForm.type === 'FIXED'} value={voucherForm.maximumDiscount} onChange={(e) => setVoucherForm({ ...voucherForm, maximumDiscount: Number(e.target.value) })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Bắt đầu sử dụng *</label>
                    <input className="form-control" type="datetime-local" required value={voucherForm.startDate} onChange={(e) => setVoucherForm({ ...voucherForm, startDate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kết thúc *</label>
                    <input className="form-control" type="datetime-local" required min={voucherForm.startDate} value={voucherForm.endDate} onChange={(e) => setVoucherForm({ ...voucherForm, endDate: e.target.value })} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Tổng lượt sử dụng (0 = không giới hạn)</label>
                    <input className="form-control" type="number" min="0" step="1" value={voucherForm.usageLimit} onChange={(e) => setVoucherForm({ ...voucherForm, usageLimit: Number(e.target.value) })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Trạng thái</label>
                    <select className="form-control" value={voucherForm.status} onChange={(e) => setVoucherForm({ ...voucherForm, status: e.target.value as VoucherFormState['status'] })}>
                      <option value="ACTIVE">Hoạt động</option>
                      <option value="INACTIVE">Tạm khóa</option>
                    </select>
                  </div>
                </div>
                <div style={{ padding: 12, borderRadius: 8, background: '#FFF0F1', color: '#8C1420', fontSize: 12, lineHeight: 1.6 }}>
                  Voucher hợp lệ khi đang hoạt động, nằm trong thời hạn và chưa vượt lượt dùng. Khi tạo voucher mới, hệ thống phát thông báo cho khách hàng; thông báo sắp hết hạn được phát một lần trong vòng 3 ngày trước hạn.
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" type="button" onClick={() => setShowVoucherModal(null)} disabled={savingVoucher}>Hủy</button>
                <button className="btn-primary" type="submit" disabled={savingVoucher}>{savingVoucher ? 'Đang lưu…' : showVoucherModal.id ? 'Lưu thay đổi' : 'Tạo voucher & thông báo khách hàng'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              <div style={{ backgroundColor: '#F5F5F3', padding: 16, borderRadius: 10, marginBottom: 16, fontSize: 13, lineHeight: 1.6 }}>
                <div>Khách hàng: <strong>{selectedOrder.customerName}</strong> ({selectedOrder.customerPhone})</div>
                <div>Địa chỉ: <strong>{selectedOrder.shippingAddress}</strong></div>
                <div>Thanh toán: <strong>{selectedOrder.paymentStatus} ({selectedOrder.paymentMethod})</strong></div>
                <div>Tổng thanh toán: <strong style={{ color: '#D90D24' }}>{i18n.currency(selectedOrder.total)}</strong></div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Sản phẩm trong đơn:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                {selectedOrder.items.map((i: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px solid #EEEEEC', paddingBottom: 6 }}>
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
                      borderColor: selectedOrder.orderStatus === st ? '#F21D2F' : '#E7E8EA',
                      backgroundColor: selectedOrder.orderStatus === st ? '#FFE5E8' : '#ffffff',
                      color: selectedOrder.orderStatus === st ? '#F21D2F' : '#101010',
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
