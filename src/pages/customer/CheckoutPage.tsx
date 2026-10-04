import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CreditCard,
  Wallet,
  Truck,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Package,
} from 'lucide-react';
import { ordersAPI } from '../../api.ts';
import { useCart } from '../../contexts/CartContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import { i18n } from '../../i18n.ts';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { items, subtotal, discount, shippingFee, total, appliedVoucher, clearCart } = useCart();
  const { currentUser, isAuthenticated, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [customerPhone, setCustomerPhone] = useState(currentUser?.phone || '');
  const [shippingAddress, setShippingAddress] = useState(currentUser?.address || '');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'WALLET' | 'BANKING'>('COD');
  const [loading, setLoading] = useState(false);

  // If cart is empty, redirect
  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Chưa có sản phẩm nào để thanh toán</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Vui lòng thêm văn phòng phẩm vào giỏ hàng trước khi đặt hàng.</p>
        <Link to="/products" className="btn-primary">Quay Lại Mua Sắm</Link>
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      showToast('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ giao hàng', 'warning');
      return;
    }

    if (paymentMethod === 'WALLET') {
      const balance = currentUser?.walletBalance || 0;
      if (balance < total) {
        showToast(
          `Số dư ví (${i18n.currency(balance)}) không đủ thanh toán đơn ${i18n.currency(total)}. Vui lòng chọn phương thức COD hoặc nạp thêm ví.`,
          'error'
        );
        return;
      }
    }

    setLoading(true);
    try {
      const orderPayload = {
        items: items.map((i) => ({
          productId: i.productId,
          name: i.name,
          quantity: i.quantity,
        })),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        shippingAddress: shippingAddress.trim(),
        note: note.trim(),
        paymentMethod,
        voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
      };

      const res = await ordersAPI.create(orderPayload);
      if (res.success && res.data) {
        clearCart();
        await refreshUser();
        showToast(`Đặt hàng thành công! Mã đơn: ${res.data.orderCode}`, 'success');
        navigate(`/orders?success=${res.data.orderCode}`);
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đặt hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>
        Thanh Toán Đơn Hàng
      </h1>

      <form onSubmit={handlePlaceOrder}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 32, alignItems: 'start' }}>
          {/* Left Column: Delivery & Payment Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* 1. Delivery Information */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                  1
                </div>
                <span>Thông Tin Nhận Hàng</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Họ và tên người nhận *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Nguyễn Văn A"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Số điện thoại liên hệ *</label>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="0912345678"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ nhận hàng chi tiết *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Số nhà, tên tòa nhà, tên đường, phường/xã, quận/huyện..."
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Ghi chú giao hàng (tùy chọn)</label>
                <textarea
                  className="form-control"
                  rows={2}
                  placeholder="Ví dụ: Giao giờ hành chính, gọi trước 15 phút, xuất hóa đơn VAT công ty..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>
            </div>

            {/* 2. Payment Method */}
            <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 16, marginBottom: 20 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                  2
                </div>
                <span>Phương Thức Thanh Toán</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Method 1: COD */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid',
                    borderColor: paymentMethod === 'COD' ? 'var(--primary)' : '#e2e8f0',
                    backgroundColor: paymentMethod === 'COD' ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'COD'}
                    onChange={() => setPaymentMethod('COD')}
                  />
                  <Truck size={24} color="#2563eb" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Thanh toán tiền mặt khi nhận hàng (COD)</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Khách kiểm tra hàng trước khi thanh toán cho shipper</div>
                  </div>
                </label>

                {/* Method 2: Wallet */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid',
                    borderColor: paymentMethod === 'WALLET' ? 'var(--primary)' : '#e2e8f0',
                    backgroundColor: paymentMethod === 'WALLET' ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'WALLET'}
                    onChange={() => setPaymentMethod('WALLET')}
                  />
                  <Wallet size={24} color="#059669" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>Ví Điện Tử Stationery Pay</span>
                      <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>
                        (Số dư: {i18n.currency(currentUser?.walletBalance || 0)})
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Thanh toán tức thì 1 chạm, nhận ngay điểm thưởng x2</div>
                  </div>
                </label>

                {/* Method 3: Banking QR */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: 16,
                    borderRadius: 12,
                    border: '1px solid',
                    borderColor: paymentMethod === 'BANKING' ? 'var(--primary)' : '#e2e8f0',
                    backgroundColor: paymentMethod === 'BANKING' ? 'var(--primary-light)' : '#ffffff',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    checked={paymentMethod === 'BANKING'}
                    onChange={() => setPaymentMethod('BANKING')}
                  />
                  <QrCode size={24} color="#7c3aed" />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>Chuyển khoản VietQR Ngân Hàng Napas 24/7</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Quét mã QR qua app ngân hàng MB, Vietcombank, Techcombank, ACB...</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Review & Submit */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Đơn Hàng Của Bạn ({items.length} món)</h3>

            {/* List items brief */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto', paddingBottom: 16, borderBottom: '1px solid #e2e8f0', marginBottom: 16 }}>
              {items.map((i) => (
                <div key={i.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, maxWidth: '70%' }}>
                    <img src={i.image} alt={i.name} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover' }} />
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <span style={{ fontWeight: 600 }}>{i.name}</span>
                      <div style={{ fontSize: 11, color: '#64748b' }}>x {i.quantity} {i.unit}</div>
                    </div>
                  </div>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>
                    {i18n.currency(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Pricing breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14, paddingBottom: 16, borderBottom: '1px solid #e2e8f0', marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Tiền hàng:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{i18n.currency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Voucher giảm giá ({appliedVoucher?.code}):</span>
                  <span style={{ fontWeight: 700 }}>-{i18n.currency(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Phí vận chuyển:</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>
                  {shippingFee === 0 ? <strong style={{ color: '#059669' }}>Freeship 0đ</strong> : i18n.currency(shippingFee)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                <span>Điểm tích lũy nhận được:</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>+{Math.floor(total / 10000)} điểm</span>
              </div>
            </div>

            {/* Total */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 24 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Tổng tiền:</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#dc2626' }}>
                {i18n.currency(total)}
              </span>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '14px', fontSize: 16 }}
            >
              {loading ? 'Đang tạo đơn hàng...' : 'Xác Nhận Đặt Hàng Ngay'}
            </button>

            <div style={{ marginTop: 16, textAlign: 'center', fontSize: 12, color: '#64748b' }}>
              Nhấn "Xác nhận đặt hàng" đồng nghĩa với việc bạn đồng ý với Điều khoản dịch vụ của Stationery Shop.
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
