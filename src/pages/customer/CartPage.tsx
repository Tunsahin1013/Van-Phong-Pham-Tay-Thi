import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, ArrowLeft, Tag, ShieldCheck, Check } from 'lucide-react';
import { useCart } from '../../contexts/CartContext.tsx';
import { i18n } from '../../i18n.ts';

export const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    items,
    updateQuantity,
    removeFromCart,
    clearCart,
    subtotal,
    discount,
    shippingFee,
    total,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setApplying(true);
    try {
      await applyVoucher(couponCode.trim());
      setCouponCode('');
    } finally {
      setApplying(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
          }}
        >
          <ShoppingBag size={40} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>
          Giỏ hàng của bạn đang trống
        </h2>
        <p style={{ color: '#64748b', fontSize: 15, marginBottom: 28 }}>
          Khám phá ngay các dụng cụ học tập, bút viết và sổ tay chính hãng giá tốt!
        </p>
        <Link to="/products" className="btn-primary">
          Tiếp Tục Mua Sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>
        Giỏ Hàng Của Bạn ({items.length} mặt hàng)
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left: Cart Items Table */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Sản phẩm</span>
            <button
              onClick={clearCart}
              style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
            >
              Xóa toàn bộ giỏ hàng
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 20 }}>
            {items.map((item) => (
              <div
                key={item.productId}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr auto auto',
                  gap: 16,
                  alignItems: 'center',
                  paddingBottom: 20,
                  borderBottom: '1px solid #f1f5f9',
                }}
              >
                {/* Thumbnail */}
                <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                {/* Details */}
                <div>
                  <Link
                    to={`/products/${item.productId}`}
                    style={{ fontWeight: 700, fontSize: 14, color: '#0f172a', lineHeight: 1.4, display: 'block', marginBottom: 4 }}
                  >
                    {item.name}
                  </Link>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Mã SP: {item.code} | Đơn vị: {item.unit}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#dc2626', marginTop: 4 }}>
                    {i18n.currency(item.price)}
                  </div>
                </div>

                {/* Quantity Controls */}
                <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    style={{ width: 28, height: 32, background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    -
                  </button>
                  <span style={{ width: 36, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    style={{ width: 28, height: 32, background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700 }}
                  >
                    +
                  </button>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeFromCart(item.productId)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 6 }}
                  title="Xóa sản phẩm"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24 }}>
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
              <ArrowLeft size={16} /> Tiếp tục chọn thêm sản phẩm
            </Link>
          </div>
        </div>

        {/* Right: Order Summary & Voucher */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Coupon Box */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
              <Tag size={16} color="var(--primary)" />
              <span>Mã Giảm Giá / Voucher</span>
            </div>

            {appliedVoucher ? (
              <div
                style={{
                  backgroundColor: 'var(--secondary-light)',
                  border: '1px solid #a7f3d0',
                  borderRadius: 8,
                  padding: '12px 14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 800, fontSize: 14, color: '#065f46' }}>{appliedVoucher.code}</div>
                  <div style={{ fontSize: 12, color: '#047857' }}>{appliedVoucher.name} (-{i18n.currency(discount)})</div>
                </div>
                <button
                  onClick={removeVoucher}
                  style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                >
                  Gỡ bỏ
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  placeholder="Nhập mã: WELCOME50, FREESHIP30..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid #cbd5e1',
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={applying || !couponCode.trim()}
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  {applying ? 'Kiểm tra...' : 'Áp Dụng'}
                </button>
              </form>
            )}
          </div>

          {/* Checkout Breakdown */}
          <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Chi Tiết Đơn Hàng</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14, paddingBottom: 16, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tạm tính tiền hàng:</span>
                <span style={{ fontWeight: 600 }}>{i18n.currency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Giảm giá từ voucher:</span>
                  <span style={{ fontWeight: 700 }}>-{i18n.currency(discount)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Phí vận chuyển hỏa tốc:</span>
                <span style={{ fontWeight: 600 }}>
                  {shippingFee === 0 ? <strong style={{ color: '#059669' }}>Miễn phí (Freeship)</strong> : i18n.currency(shippingFee)}
                </span>
              </div>
              {subtotal < 300000 && (
                <div style={{ fontSize: 12, color: '#f59e0b' }}>
                  💡 Mua thêm {i18n.currency(300000 - subtotal)} để được miễn phí vận chuyển!
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 16, marginBottom: 24 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Tổng thanh toán:</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: '#dc2626' }}>
                {i18n.currency(total)}
              </span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: 15 }}
            >
              Tiến Hành Đặt Hàng <ArrowRight size={18} />
            </button>

            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, color: '#64748b' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>Bảo mật thanh toán & thông tin khách hàng</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
