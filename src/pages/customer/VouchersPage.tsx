import React, { useState, useEffect } from 'react';
import { Tag, Clock, Check, Copy, Gift, Coins } from 'lucide-react';
import { loyaltyAPI, vouchersAPI } from '../../api.ts';
import { useCart } from '../../contexts/CartContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import { i18n } from '../../i18n.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';

export const VouchersPage: React.FC = () => {
  const { applyVoucher, appliedVoucher } = useCart();
  const { showToast } = useToast();
  const { currentUser, isAuthenticated, refreshUser } = useAuth();
  const [selectedPoints, setSelectedPoints] = useState(50);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadVouchers() {
      try {
        setLoading(true);
        const res = await vouchersAPI.getAll();
        if (res.success) setVouchers(res.data);
      } catch (err) {
        console.error('Failed to load vouchers', err);
      } finally {
        setLoading(false);
      }
    }
    loadVouchers();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Đã sao chép mã ${code} vào bộ nhớ tạm!`, 'success');
  };

  const handleApplyNow = async (code: string) => {
    const ok = await applyVoucher(code);
    if (ok) {
      showToast(`Đã áp dụng mã ${code} vào giỏ hàng!`, 'success');
    }
  };

  const handleRedeemPoints = async () => {
    if (!isAuthenticated || !currentUser) {
      showToast('Vui lòng đăng nhập để đổi điểm thưởng.', 'warning');
      return;
    }
    if ((currentUser.loyaltyPoints || 0) < selectedPoints) {
      showToast('Bạn không đủ điểm thưởng để đổi voucher này.', 'warning');
      return;
    }

    setRedeemLoading(true);
    try {
      const result = await loyaltyAPI.redeemPoints(selectedPoints);
      if (result.success) {
        showToast(result.message || 'Đổi điểm thành công.', 'success');
        await refreshUser();
        const voucherResult = await vouchersAPI.getAll();
        if (voucherResult.success) setVouchers(voucherResult.data);
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể đổi điểm lúc này.', 'error');
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, backgroundColor: '#fef3c7', color: '#b45309', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          <Tag size={16} /> KHO MÃ ƯU ĐÃI STATIONERY SHOP
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#101010', marginBottom: 10 }}>
          Săn Voucher Giảm Giá Văn Phòng Phẩm
        </h1>
        <p style={{ fontSize: 15, color: '#5f5e5e' }}>
          Tiết kiệm chi phí mua sắm sách vở, dụng cụ học tập và vật tư doanh nghiệp với các mã giảm giá tốt nhất tháng.
        </p>
      </div>

      {isAuthenticated && currentUser?.role === 'CUSTOMER' && (
        <section style={{ marginBottom: 32, padding: 24, borderRadius: 16, border: '1px solid #E2E3E1', background: 'linear-gradient(135deg, #101010 0%, #292929 100%)', color: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: '#F21D2F' }}><Gift size={22} /></div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Đổi điểm thưởng lấy voucher</h2>
                <p style={{ margin: '4px 0 0', color: '#D1D5DB', fontSize: 13 }}>Điểm thưởng được giữ độc lập với phương thức thanh toán.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', borderRadius: 10, background: '#202124', border: '1px solid #4B4B4B' }}>
              <Coins size={18} color="#F21D2F" />
              <span>Điểm của bạn: <strong style={{ color: '#FFFFFF' }}>{currentUser.loyaltyPoints || 0}</strong></span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[
              { points: 50, label: 'Voucher 20.000đ', minimum: 'Đơn từ 100.000đ' },
              { points: 100, label: 'Voucher 25.000đ', minimum: 'Đơn từ 120.000đ' },
              { points: 200, label: 'Voucher 50.000đ', minimum: 'Đơn từ 200.000đ' },
            ].map((reward) => {
              const selected = selectedPoints === reward.points;
              const enoughPoints = (currentUser.loyaltyPoints || 0) >= reward.points;
              return (
                <button
                  key={reward.points}
                  type="button"
                  onClick={() => setSelectedPoints(reward.points)}
                  aria-pressed={selected}
                  style={{ textAlign: 'left', padding: 14, borderRadius: 10, border: `1px solid ${selected ? '#F21D2F' : '#4B4B4B'}`, background: selected ? 'rgba(242,29,47,0.14)' : '#202124', color: '#FFFFFF', cursor: 'pointer', opacity: enoughPoints ? 1 : 0.65 }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 4 }}>{reward.label}</div>
                  <div style={{ color: '#D1D5DB', fontSize: 12 }}>{reward.minimum}</div>
                  <div style={{ color: selected ? '#FF5966' : '#A3A3A3', fontSize: 12, marginTop: 8 }}>{reward.points} điểm{enoughPoints ? '' : ' · Chưa đủ điểm'}</div>
                </button>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <button type="button" className="btn-primary" onClick={handleRedeemPoints} disabled={redeemLoading || (currentUser.loyaltyPoints || 0) < selectedPoints} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, opacity: redeemLoading || (currentUser.loyaltyPoints || 0) < selectedPoints ? 0.6 : 1 }}>
              {redeemLoading ? 'Đang đổi...' : `Đổi ${selectedPoints} điểm lấy voucher`}
            </button>
          </div>
        </section>
      )}

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#5f5e5e' }}>Đang tải danh sách voucher...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {vouchers.map((v) => {
            const isApplied = appliedVoucher?.code === v.code;
            return (
              <div
                key={v.id}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  border: isApplied ? '2px solid var(--secondary)' : '1px solid #E2E3E1',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {isApplied && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      fontSize: 11,
                      fontWeight: 700,
                      color: '#059669',
                      backgroundColor: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Check size={12} /> Đang dùng trong giỏ
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: 8,
                        backgroundColor: '#FFE5E8',
                        color: '#D90D24',
                        fontWeight: 800,
                        fontSize: 16,
                        letterSpacing: 0.5,
                        border: '1px dashed #FFE5E8',
                      }}
                    >
                      {v.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(v.code)}
                      style={{ background: 'none', border: 'none', color: '#5f5e5e', cursor: 'pointer', padding: 4 }}
                      title="Sao chép mã"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#101010', marginBottom: 6 }}>
                    {v.name}
                  </h3>

                  <div style={{ fontSize: 13, color: '#5f5e5e', lineHeight: 1.6, marginBottom: 16 }}>
                    <div>• Đơn tối thiểu: <strong>{i18n.currency(v.minimumOrder)}</strong></div>
                    {v.maximumDiscount > 0 && v.type === 'PERCENTAGE' && (
                      <div>• Giảm tối đa: <strong>{i18n.currency(v.maximumDiscount)}</strong></div>
                    )}
                    {Number(v.usageLimit) > 0 && (
                      <div>• Còn lượt sử dụng: <strong>{Math.max(0, Number(v.usageLimit) - Number(v.usedCount || 0))}</strong></div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#777B80', fontSize: 12, marginTop: 4 }}>
                      <Clock size={13} /> Hạn sử dụng: {i18n.formatDate(v.endDate)}
                    </div>
                    {(() => {
                      const remainingMs = new Date(v.endDate).getTime() - Date.now();
                      if (remainingMs > 0 && remainingMs <= 3 * 24 * 60 * 60 * 1000) {
                        return <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 6, background: '#FFF0F1', color: '#D90D24', fontSize: 11, fontWeight: 800 }}>Sắp hết hạn</div>;
                      }
                      return null;
                    })()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleApplyNow(v.code)}
                    className="btn-primary"
                    style={{ flex: 1, padding: '10px 14px', fontSize: 13 }}
                  >
                    {isApplied ? 'Đã Áp Dụng' : 'Áp Dụng Cho Giỏ Hàng'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
