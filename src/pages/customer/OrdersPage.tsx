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
import { getProductImage } from '../../utils/productImage.ts';

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

  const fetchOrders = async (showLoader = true) => {
    if (!isAuthenticated) return;
    try {
      if (showLoader) setLoading(true);
      const res = await ordersAPI.getMyOrders();
      if (res.success && res.data) {
        setOrders(res.data);
        setSelectedOrder((previous: any) => previous ? (res.data.find((order: any) => order.id === previous.id) || previous) : null);
      }
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    if (!isAuthenticated) return;
    const timer = window.setInterval(() => fetchOrders(false), 15000);
    return () => window.clearInterval(timer);
  }, [isAuthenticated]);

  const handleRequestReturn = async (order: any) => {
    const reason = window.prompt(`Nhập lý do trả hàng/hoàn tiền cho đơn ${order.orderCode} (ví dụ: sản phẩm lỗi, hư hỏng khi vận chuyển):`);
    if (reason === null) return;
    if (reason.trim().length < 8) { showToast('Vui lòng nhập lý do từ 8 ký tự trở lên.', 'warning'); return; }
    try {
      const res = await ordersAPI.requestReturn(order.id, reason.trim());
      if (res.success) { showToast(res.message, 'success'); await fetchOrders(false); }
    } catch (error: any) { showToast(error.message || 'Không gửi được yêu cầu trả hàng.', 'error'); }
  };

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
        <p style={{ color: '#5f5e5e', marginBottom: 20 }}>Bạn cần đăng nhập tài khoản để theo dõi đơn hàng đã mua.</p>
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

      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#101010', marginBottom: 20 }}>
        Lịch Sử Đơn Hàng Của Tôi
      </h1>

      {/* Status filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          borderBottom: '1px solid #E2E3E1',
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
              color: activeTab === tab.key ? 'var(--primary)' : '#5f5e5e',
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
        <div style={{ padding: 60, textAlign: 'center', color: '#5f5e5e' }}>Đang tải danh sách đơn hàng...</div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ padding: 60, textAlign: 'center', backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #E2E3E1' }}>
          <Package size={44} color="#777B80" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 700, color: '#101010', marginBottom: 6 }}>Chưa có đơn hàng nào</h3>
          <p style={{ color: '#5f5e5e', fontSize: 14, marginBottom: 20 }}>Bạn chưa có đơn hàng nào ở trạng thái này.</p>
          <Link to="/products" className="btn-primary">Đặt Mua Ngay</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {filteredOrders.map((order) => {
            const statusConfig = i18n.orderStatus[order.orderStatus as keyof typeof i18n.orderStatus] || {
              label: order.orderStatus,
              color: '#5f5e5e',
              bg: '#EEEEEC',
            };

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  border: '1px solid #E2E3E1',
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
                    borderBottom: '1px solid #EEEEEC',
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#101010' }}>{order.orderCode}</span>
                    <span style={{ fontSize: 13, color: '#5f5e5e' }}>Ngày đặt: {i18n.formatDate(order.createdAt)}</span>
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
                        <img src={getProductImage(it)} alt={it.name} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 600, color: '#101010' }}>{it.name}</div>
                          <div style={{ fontSize: 12, color: '#5f5e5e' }}>
                            Số lượng: {it.quantity} {it.unit} x {i18n.currency(it.price)}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#101010' }}>{i18n.currency(it.price * it.quantity)}</span>
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
                    borderTop: '1px solid #EEEEEC',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <span style={{ fontSize: 13, color: '#5f5e5e' }}>Phương thức: </span>
                    <strong style={{ fontSize: 13, color: '#202124' }}>{order.paymentMethod}</strong>
                    {order.voucherCode && (
                      <span style={{ marginLeft: 12, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                        Voucher: {order.voucherCode} (-{i18n.currency(order.discount)})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div>
                      <span style={{ fontSize: 13, color: '#5f5e5e' }}>Tổng tiền: </span>
                      <strong style={{ fontSize: 20, color: '#D90D24' }}>{i18n.currency(order.total)}</strong>
                    </div>

                    <button
                      onClick={() => setSelectedOrder(order)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 8,
                        border: '1px solid #E7E8EA',
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
                          backgroundColor: '#FFE5E8',
                          color: '#F21D2F',
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Hủy Đơn
                      </button>
                    )}
                    {order.returnRequest && <span style={{ fontSize: 12, color: '#7C2D12', background: '#FFEDD5', borderRadius: 8, padding: '6px 8px' }}>Trả hàng: {({ REQUESTED: 'Chờ xử lý', APPROVED: 'Đã chấp thuận', REJECTED: 'Từ chối', RESOLVED: 'Đã xử lý' } as Record<string, string>)[order.returnRequest.status] || order.returnRequest.status}</span>}
                    {(() => { const completed = new Date(order.completedAt || order.updatedAt || order.createdAt).getTime(); const inWindow = Number.isFinite(completed) && Date.now() - completed <= 7 * 86400000; const pending = ['REQUESTED', 'APPROVED'].includes(order.returnRequest?.status); return order.orderStatus === 'COMPLETED' && inWindow && !pending ? <button type="button" onClick={() => handleRequestReturn(order)} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #FCA5A5', background: '#FFF1F2', color: '#BE123C', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Yêu cầu trả hàng/hoàn tiền</button> : null; })()}
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
              <div style={{ backgroundColor: '#F5F5F3', padding: 16, borderRadius: 10, marginBottom: 20 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Thông tin người nhận</div>
                <div style={{ fontSize: 13, color: '#202124', lineHeight: 1.6 }}>
                  <div>Họ tên: <strong>{selectedOrder.customerName}</strong></div>
                  <div>Số điện thoại: <strong>{selectedOrder.customerPhone}</strong></div>
                  <div>Địa chỉ giao: <strong>{selectedOrder.shippingAddress}</strong></div>
                  {selectedOrder.note && <div>Ghi chú: <em>"{selectedOrder.note}"</em></div>}
                </div>
              </div>

              <div style={{ background: '#FFF1F2', border: '1px solid #FECDD3', borderRadius: 10, padding: 14, marginBottom: 20 }}>
                <div style={{ fontWeight: 800, marginBottom: 10 }}>Theo dõi trạng thái đơn hàng</div>
                <div style={{ display: 'grid', gap: 10 }}>
                  {[...(selectedOrder.trackingEvents || [])].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((event: any, index: number) => <div key={`${event.createdAt}-${index}`} style={{ display: 'grid', gridTemplateColumns: '12px 1fr', gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: 50, background: index === 0 ? '#D90D24' : '#9CA3AF', marginTop: 4 }} /><div><div style={{ fontWeight: 700, fontSize: 13 }}>{i18n.orderStatus[event.status as keyof typeof i18n.orderStatus]?.label || event.status}</div><div style={{ fontSize: 13, color: '#4B5563' }}>{event.message}</div><div style={{ fontSize: 11, color: '#6B7280' }}>{new Date(event.createdAt).toLocaleString('vi-VN')}{event.actor ? ` · ${event.actor}` : ''}</div></div></div>)}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', marginTop: 8 }}>Trạng thái được làm mới tự động khoảng 15 giây một lần khi trang đang mở.</div>
              </div>
              {selectedOrder.returnRequest && <div style={{ padding: 12, border: '1px solid #E5E7EB', borderRadius: 8, marginBottom: 18 }}><strong>Yêu cầu trả hàng/hoàn tiền: {selectedOrder.returnRequest.status}</strong><p style={{ margin: '6px 0 0', fontSize: 13 }}>{selectedOrder.returnRequest.reason}</p>{selectedOrder.returnRequest.resolutionNote && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#6B7280' }}>Phản hồi cửa hàng: {selectedOrder.returnRequest.resolutionNote}</p>}</div>}
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Danh sách sản phẩm</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {selectedOrder.items.map((i: any, idx: number) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingBottom: 8, borderBottom: '1px solid #EEEEEC' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{i.name}</span>
                      <div style={{ fontSize: 11, color: '#5f5e5e' }}>x {i.quantity} {i.unit}</div>
                    </div>
                    <strong>{i18n.currency(i.price * i.quantity)}</strong>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, borderTop: '1px solid #E2E3E1', paddingTop: 14 }}>
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
                  <span style={{ color: '#D90D24' }}>{i18n.currency(selectedOrder.total)}</span>
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
              <h3 className="modal-title" style={{ color: '#D90D24' }}>Xác Nhận Hủy Đơn Hàng</h3>
              <button className="modal-close-btn" onClick={() => setShowCancelModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, color: '#202124', marginBottom: 16 }}>
                Bạn có chắc chắn muốn hủy đơn hàng <strong>{showCancelModal.orderCode}</strong> không? Trạng thái đơn hàng và việc xử lý thanh toán sẽ được cập nhật theo chính sách hiện hành.
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
                style={{ backgroundColor: '#D90D24' }}
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
