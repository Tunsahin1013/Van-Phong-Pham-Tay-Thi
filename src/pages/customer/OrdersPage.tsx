import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Package,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  Eye,
  RotateCcw,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { ordersAPI } from '../../api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import { i18n } from '../../i18n.ts';

export const OrdersPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, currentUser } = useAuth();
  const { showToast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showCancelModal, setShowCancelModal] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState('');

  const successCode = searchParams.get('success');

  const fetchOrders = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await ordersAPI.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [isAuthenticated]);

  const handleCancelOrder = async () => {
    if (!showCancelModal) return;
    try {
      const res = await ordersAPI.cancel(showCancelModal.id, cancelReason || 'Khách hàng đổi ý');
      if (res.success) {
        showToast('Hủy đơn hàng thành công!', 'success');
        setShowCancelModal(null);
        setCancelReason('');
        fetchOrders();
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể hủy đơn hàng', 'error');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Vui lòng đăng nhập</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Bạn cần đăng nhập tài khoản để theo dõi đơn hàng đã mua.</p>
        <Link to="/" className="btn-primary">Về Trang Chủ</Link>
      </div>
    );
  }

  const filteredOrders = activeTab === 'ALL'
    ? orders
    : orders.filter((o) => o.orderStatus === activeTab);

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      {/* Success banner if redirected from checkout */}
      {successCode && (
        <div
          style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #a7f3d0',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            color: '#065f46',
          }}
        >
          <CheckCircle size={24} color="#10b981" />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Đặt hàng thành công! Mã đơn: {successCode}</div>
            <div style={{ fontSize: 13, color: '#047857' }}>
              Stationery Shop đã tiếp nhận đơn và đang chuẩn bị đóng gói hàng hóa để giao đến bạn sớm nhất.
            </div>
          </div>
        </div>
      )}

      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 20 }}>
        Lịch Sử Đơn Hàng Của Tôi
      </h1>

      {/* Status filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          borderBottom: '1px solid #e2e8f0',
          marginBottom: 24,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {[
          { key: 'ALL', label: 'Tất cả đơn' },
          { key: 'PENDING', label: 'Chờ xác nhận' },
          { key: 'CONFIRMED', label: 'Đã xác nhận' },
          { key: 'PREPARING', label: 'Đang đóng gói' },
          { key: 'SHIPPING', label: 'Đang giao' },
          { key: 'COMPLETED', label: 'Hoàn thành' },
          { key: 'CANCELLED', label: 'Đã hủy' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: 14,
              color: activeTab === tab.key ? 'var(--primary)' : '#64748b',
              borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Đang tải danh sách đơn hàng...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0' }}>
          <Package size={44} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>Chưa có đơn hàng nào</h3>
          <p style={{ color: '#64748b', fontSize: 14, marginBottom: 20 }}>Bạn chưa có đơn hàng nào ở trạng thái này.</p>
          <Link to="/products" className="btn-primary">Đặt Mua Ngay</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredOrders.map((order) => {
            const statusConfig = i18n.orderStatus[order.orderStatus as keyof typeof i18n.orderStatus] || {
              label: order.orderStatus,
              color: '#64748b',
              bg: '#f1f5f9',
            };

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #e2e8f0',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {/* Order card header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: 16,
                    borderBottom: '1px solid #f1f5f9',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{order.orderCode}</span>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Ngày đặt: {i18n.formatDate(order.createdAt)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: 9999,
                        fontSize: 12,
                        fontWeight: 700,
                        backgroundColor: statusConfig.bg,
                        color: statusConfig.color,
                      }}
                    >
                      {statusConfig.label}
                    </span>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        backgroundColor: order.paymentStatus === 'PAID' ? '#d1fae5' : '#fef3c7',
                        color: order.paymentStatus === 'PAID' ? '#065f46' : '#92400e',
                      }}
                    >
                      {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </span>
                  </div>
                </div>

                {/* Items preview list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
                  {order.items.map((it: any, idx: number) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={it.image} alt={it.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#1e293b' }}>{it.name}</div>
                          <div style={{ fontSize: 12, color: '#64748b' }}>
                            Số lượng: {it.quantity} {it.unit} x {i18n.currency(it.price)}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#0f172a' }}>{i18n.currency(it.price * it.quantity)}</span>
                    </div>
                  ))}
                </div>

                {/* Card footer */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 16,
                    borderTop: '1px solid #f1f5f9',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, color: '#64748b' }}>Phương thức: </span>
                    <strong style={{ fontSize: 13, color: '#334155' }}>{order.paymentMethod}</strong>
                    {order.voucherCode && (
                      <span style={{ marginLeft: 12, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                        Voucher: {order.voucherCode} (-{i18n.currency(order.discount)})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 13, color: '#64748b' }}>Tổng tiền: </span>
                      <strong style={{ fontSize: 20, color: '#dc2626' }}>{i18n.currency(order.total)}</strong>
                    </div>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Eye size={16} /> Chi Tiết
                    </button>

                    {order.orderStatus === 'PENDING' && (
                      <button
                        onClick={() => setShowCancelModal(order)}
                        style={{
                          padding: '8px 14px',
                          borderRadius: 8,
                          border: '1px solid #fca5a5',
                          backgroundColor: '#fef2f2',
                          color: '#ef4444',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Hủy Đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Receipt size={20} color="var(--primary)" />
                <h3 className="modal-title">Chi Tiết Đơn Hàng {selectedOrder.orderCode}</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedOrder(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div style={{ backgroundColor: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Thông tin người nhận</div>
                <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                  <div>Họ tên: <strong>{selectedOrder.customerName}</strong></div>
                  <div>Số điện thoại: <strong>{selectedOrder.customerPhone}</strong></div>
                  <div>Địa chỉ giao: <strong>{selectedOrder.shippingAddress}</strong></div>
                  {selectedOrder.note && <div>Ghi chú: <em>"{selectedOrder.note}"</em></div>}
                </div>
              </div>

              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Danh sách sản phẩm</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {selectedOrder.items.map((i: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 8, borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{i.name}</span>
                      <div style={{ fontSize: 11, color: '#64748b' }}>x {i.quantity} {i.unit}</div>
                    </div>
                    <strong>{i18n.currency(i.price * i.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Tạm tính tiền hàng:</span>
                  <span>{i18n.currency(selectedOrder.subtotal)}</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                    <span>Giảm giá ({selectedOrder.voucherCode}):</span>
                    <span>-{i18n.currency(selectedOrder.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Phí giao hàng:</span>
                  <span>{i18n.currency(selectedOrder.shippingFee)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, marginTop: 4 }}>
                  <span>Tổng tiền thanh toán:</span>
                  <span style={{ color: '#dc2626' }}>{i18n.currency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#dc2626' }}>Xác Nhận Hủy Đơn Hàng</h3>
              <button className="modal-close-btn" onClick={() => setShowCancelModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: '#334155', marginBottom: 16 }}>
                Bạn có chắc chắn muốn hủy đơn hàng <strong>{showCancelModal.orderCode}</strong> không? Sau khi hủy, tiền đã thanh toán bằng ví sẽ được hoàn lại tự động.
              </p>
              <div className="form-group">
                <label className="form-label">Lý do hủy đơn</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: Đổi mẫu mã khác, đặt nhầm số lượng..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowCancelModal(null)}>
                Quay Lại
              </button>
              <button
                className="btn-primary"
                onClick={handleCancelOrder}
                style={{ backgroundColor: '#dc2626' }}
              >
                Xác Nhận Hủy Đơn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
