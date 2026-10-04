import React, { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  AlertTriangle,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Plus,
  Send,
  User,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { ordersAPI, inventoryAPI, productsAPI, chatsAPI } from '../../api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import { i18n } from '../../i18n.ts';

export const EmployeeDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'chat'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [loading, setLoading] = useState(true);

  // Filter state for orders
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderSearch, setOrderSearch] = useState('');

  // Selected Order Modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  // Stock In Modal
  const [showStockInModal, setShowStockInModal] = useState<any>(null);
  const [stockInQty, setStockInQty] = useState(50);
  const [stockInNote, setStockInNote] = useState('');

  const loadAll = async () => {
    try {
      setLoading(true);
      const [ordRes, prodRes, chatRes] = await Promise.all([
        ordersAPI.getAll({ limit: 50 }),
        productsAPI.getAll({ limit: 50 }),
        chatsAPI.getConversations(),
      ]);

      if (ordRes.success) setOrders(ordRes.data);
      if (prodRes.success) setProducts(prodRes.data);
      if (chatRes.success) {
        setConversations(chatRes.data);
        if (chatRes.data.length > 0 && !activeChat) {
          setActiveChat(chatRes.data[0]);
          loadMessages(chatRes.data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load employee data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const loadMessages = async (convId: string) => {
    try {
      const res = await chatsAPI.getMessages(convId);
      if (res.success) setChatMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: string) => {
    try {
      const res = await ordersAPI.updateStatus(orderId, { orderStatus: nextStatus });
      if (res.success) {
        showToast(`Đã chuyển trạng thái đơn hàng sang ${nextStatus}`, 'success');
        if (selectedOrder) setSelectedOrder(res.data);
        loadAll();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  };

  const handleStockIn = async () => {
    if (!showStockInModal || stockInQty <= 0) return;
    try {
      const res = await inventoryAPI.stockIn({
        productId: showStockInModal.id,
        quantity: stockInQty,
        note: stockInNote || 'Nhân viên nhập hàng bổ sung',
      });
      if (res.success) {
        showToast(`Đã nhập thêm ${stockInQty} ${showStockInModal.unit} thành công!`, 'success');
        setShowStockInModal(null);
        setStockInNote('');
        loadAll();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi nhập hàng', 'error');
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChat) return;

    const text = chatInput.trim();
    setChatInput('');
    try {
      const res = await chatsAPI.sendMessage(activeChat.id, text, activeChat.customerId);
      if (res.success) {
        setChatMessages((prev) => [...prev, res.data]);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi gửi tin', 'error');
    }
  };

  // Metrics
  const pendingOrders = orders.filter((o) => o.orderStatus === 'PENDING');
  const preparingOrders = orders.filter((o) => o.orderStatus === 'PREPARING' || o.orderStatus === 'CONFIRMED');
  const shippingOrders = orders.filter((o) => o.orderStatus === 'SHIPPING');
  const completedOrders = orders.filter((o) => o.orderStatus === 'COMPLETED');
  const lowStockProducts = products.filter((p) => p.stock < 50);

  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'ALL' && o.orderStatus !== orderStatusFilter) return false;
    if (orderSearch) {
      const q = orderSearch.toLowerCase();
      return (
        o.orderCode.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      {/* Top Welcome Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#059669', textTransform: 'uppercase' }}>
            KHÔNG GIAN LÀM VIỆC NHÂN VIÊN
          </span>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>
            Bàn Điều Phối & Xử Lý Đơn Hàng
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            Xin chào <strong>{currentUser?.name}</strong>! Hôm nay có <strong>{pendingOrders.length} đơn hàng mới</strong> cần xác nhận.
          </p>
        </div>

        {/* Workspace tabs */}
        <div style={{ display: 'flex', gap: 8, backgroundColor: '#e2e8f0', padding: 4, borderRadius: 10 }}>
          <button
            onClick={() => setActiveTab('orders')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === 'orders' ? '#ffffff' : 'transparent',
              color: activeTab === 'orders' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'orders' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Đơn Hàng ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === 'inventory' ? '#ffffff' : 'transparent',
              color: activeTab === 'inventory' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'inventory' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Kho & Sản Phẩm ({lowStockProducts.length} cảnh báo)
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === 'chat' ? '#ffffff' : 'transparent',
              color: activeTab === 'chat' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              boxShadow: activeTab === 'chat' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            Tin Nhắn Khách ({conversations.length})
          </button>
        </div>
      </div>

      {/* 4 Metric Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700 }}>ĐƠN CHỜ DUYỆT</span>
            <Clock size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
            {pendingOrders.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#2563eb', fontWeight: 700 }}>ĐANG ĐÓNG GÓI</span>
            <Package size={20} color="#2563eb" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
            {preparingOrders.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#7c3aed', fontWeight: 700 }}>ĐANG VẬN CHUYỂN</span>
            <Truck size={20} color="#7c3aed" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
            {shippingOrders.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', borderRadius: 12, padding: 18, border: '1px solid #e2e8f0', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 700 }}>KHO SẮP HẾT HÀNG</span>
            <AlertTriangle size={20} color="#dc2626" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', marginTop: 4 }}>
            {lowStockProducts.length}
          </div>
        </div>
      </div>

      {/* Tab 1: Orders Management */}
      {activeTab === 'orders' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          {/* Filters & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Tìm mã đơn, tên, sđt khách..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  width: 240,
                  outline: 'none',
                }}
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid #cbd5e1',
                  fontSize: 13,
                  outline: 'none',
                  fontWeight: 600,
                }}
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="PENDING">Chờ xác nhận</option>
                <option value="CONFIRMED">Đã xác nhận</option>
                <option value="PREPARING">Đang đóng gói</option>
                <option value="SHIPPING">Đang giao hàng</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </select>
            </div>
            <span style={{ fontSize: 13, color: '#64748b' }}>
              Hiển thị {filteredOrders.length} đơn hàng
            </span>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn hàng</th>
                  <th>Khách hàng</th>
                  <th>Số điện thoại</th>
                  <th>Tổng tiền</th>
                  <th>Thanh toán</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((ord) => {
                  const statusConf = i18n.orderStatus[ord.orderStatus as keyof typeof i18n.orderStatus] || {
                    label: ord.orderStatus,
                    color: '#64748b',
                    bg: '#f1f5f9',
                  };
                  return (
                    <tr key={ord.id}>
                      <td>
                        <strong>{ord.orderCode}</strong>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{i18n.formatDate(ord.createdAt)}</div>
                      </td>
                      <td>{ord.customerName}</td>
                      <td>{ord.customerPhone}</td>
                      <td>
                        <strong style={{ color: '#dc2626' }}>{i18n.currency(ord.total)}</strong>
                      </td>
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
                          {ord.paymentStatus} ({ord.paymentMethod})
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
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => setSelectedOrder(ord)}
                            style={{
                              padding: '6px 10px',
                              borderRadius: 6,
                              border: '1px solid #cbd5e1',
                              background: '#f8fafc',
                              cursor: 'pointer',
                              fontSize: 12,
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Eye size={14} /> Xử lý
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Inventory & Products View */}
      {activeTab === 'inventory' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Danh Sách Tồn Kho & Sản Phẩm</h3>
              <p style={{ fontSize: 13, color: '#64748b' }}>Nhân viên có thể kiểm tra tồn kho và nhập hàng bổ sung khi lượng tồn giảm xuống thấp.</p>
            </div>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Mã SKU</th>
                  <th>Danh mục</th>
                  <th>Đơn giá</th>
                  <th>Tồn kho</th>
                  <th>Đã bán</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLow = p.stock < 50;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={p.image} alt={p.name} style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.name}</div>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Thương hiệu: {p.brand}</div>
                          </div>
                        </div>
                      </td>
                      <td><strong>{p.code}</strong></td>
                      <td>{p.categoryName}</td>
                      <td>{i18n.currency(p.salePrice || p.price)}</td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            backgroundColor: isLow ? '#fee2e2' : '#d1fae5',
                            color: isLow ? '#dc2626' : '#059669',
                          }}
                        >
                          {p.stock} {p.unit} {isLow && '⚠️ Sắp hết'}
                        </span>
                      </td>
                      <td>{p.sold || 0}</td>
                      <td>
                        <button
                          onClick={() => setShowStockInModal(p)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: 6,
                            backgroundColor: 'var(--primary-light)',
                            color: 'var(--primary)',
                            border: '1px solid #bfdbfe',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Plus size={14} /> Nhập Hàng
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

      {/* Tab 3: Customer Live Chat Console */}
      {activeTab === 'chat' && (
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e2e8f0',
            display: 'grid',
            gridTemplateColumns: '320px 1fr',
            height: 540,
            overflow: 'hidden',
          }}
        >
          {/* Conversation List */}
          <div style={{ borderRight: '1px solid #e2e8f0', overflowY: 'auto' }}>
            <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', fontWeight: 700, fontSize: 15 }}>
              Hội Thoại Khách Hàng ({conversations.length})
            </div>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setActiveChat(c);
                  loadMessages(c.id);
                }}
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f1f5f9',
                  backgroundColor: activeChat?.id === c.id ? '#f1f5f9' : '#ffffff',
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 14 }}>{c.customerName}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>
                    {new Date(c.lastMessageAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.lastMessage}
                </div>
              </div>
            ))}
          </div>

          {/* Active Chat Conversation Body */}
          {activeChat ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {activeChat.customerName.charAt(0)}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{activeChat.customerName}</div>
                  <div style={{ fontSize: 11, color: '#059669' }}>Khách hàng đang trực tuyến</div>
                </div>
              </div>

              {/* Chat Message List */}
              <div style={{ flex: 1, padding: 20, overflowY: 'auto', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {chatMessages.map((m) => {
                  const isStaff = m.senderRole !== 'CUSTOMER';
                  return (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: isStaff ? 'flex-end' : 'flex-start',
                        maxWidth: '75%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isStaff ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isStaff ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                          backgroundColor: isStaff ? '#059669' : '#ffffff',
                          color: isStaff ? '#ffffff' : '#1e293b',
                          border: isStaff ? 'none' : '1px solid #e2e8f0',
                          fontSize: 13,
                        }}
                      >
                        {m.message}
                      </div>
                      <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                        {m.senderName} • {new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendChatMessage} style={{ padding: 14, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10 }}>
                <input
                  type="text"
                  placeholder="Nhập câu trả lời cho khách hàng..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none' }}
                />
                <button type="submit" className="btn-primary" style={{ padding: '0 18px' }}>
                  <Send size={16} /> Gửi
                </button>
              </form>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
              Chọn một cuộc trò chuyện để bắt đầu hỗ trợ
            </div>
          )}
        </div>
      )}

      {/* Selected Order Processing Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <h3 className="modal-title">Xử Lý Đơn Hàng: {selectedOrder.orderCode}</h3>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, backgroundColor: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Khách hàng</div>
                  <div style={{ fontWeight: 700 }}>{selectedOrder.customerName}</div>
                  <div style={{ fontSize: 13 }}>{selectedOrder.customerPhone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>Địa chỉ giao hàng</div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{selectedOrder.shippingAddress}</div>
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Sản phẩm cần chuẩn bị đóng gói:</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {selectedOrder.items.map((i: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <span>{i.name} (x{i.quantity} {i.unit})</span>
                    <strong>{i18n.currency(i.price * i.quantity)}</strong>
                  </div>
                ))}
              </div>

              {/* Status transition action buttons */}
              <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Chuyển đổi trạng thái xử lý:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CONFIRMED')}
                    disabled={selectedOrder.orderStatus !== 'PENDING'}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#3b82f6', color: '#ffffff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: selectedOrder.orderStatus === 'PENDING' ? 1 : 0.4 }}
                  >
                    1. Xác Nhận Đơn
                  </button>

                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'PREPARING')}
                    disabled={selectedOrder.orderStatus !== 'CONFIRMED'}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#8b5cf6', color: '#ffffff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: selectedOrder.orderStatus === 'CONFIRMED' ? 1 : 0.4 }}
                  >
                    2. Đang Đóng Gói
                  </button>

                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'SHIPPING')}
                    disabled={selectedOrder.orderStatus !== 'PREPARING'}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#0284c7', color: '#ffffff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: selectedOrder.orderStatus === 'PREPARING' ? 1 : 0.4 }}
                  >
                    3. Giao Cho Shipper
                  </button>

                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'COMPLETED')}
                    disabled={selectedOrder.orderStatus !== 'SHIPPING'}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#10b981', color: '#ffffff', fontWeight: 600, fontSize: 13, cursor: 'pointer', opacity: selectedOrder.orderStatus === 'SHIPPING' ? 1 : 0.4 }}
                  >
                    4. Hoàn Thành Đơn
                  </button>

                  <button
                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, 'CANCELLED')}
                    disabled={selectedOrder.orderStatus === 'COMPLETED' || selectedOrder.orderStatus === 'CANCELLED'}
                    style={{ padding: '8px 14px', borderRadius: 8, border: 'none', backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                  >
                    Hủy Đơn Hàng
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock In Modal */}
      {showStockInModal && (
        <div className="modal-overlay" onClick={() => setShowStockInModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Nhập Thêm Hàng Vào Kho</h3>
              <button className="modal-close-btn" onClick={() => setShowStockInModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{showStockInModal.name}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  Mã SKU: {showStockInModal.code} | Tồn hiện tại: {showStockInModal.stock} {showStockInModal.unit}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Số lượng nhập thêm ({showStockInModal.unit})</label>
                <input
                  type="number"
                  min="1"
                  className="form-control"
                  value={stockInQty}
                  onChange={(e) => setStockInQty(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú phiếu nhập</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Nhập bổ sung đợt 2 theo đề xuất nhân viên"
                  value={stockInNote}
                  onChange={(e) => setStockInNote(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowStockInModal(null)}>Hủy</button>
              <button className="btn-primary" onClick={handleStockIn}>Xác Nhận Nhập Hàng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
