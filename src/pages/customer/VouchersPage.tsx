import React, { useState, useEffect } from 'react';
import { Tag, Clock, ArrowRight, Check, Copy } from 'lucide-react';
import { vouchersAPI } from '../../api.ts';
import { useCart } from '../../contexts/CartContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import { i18n } from '../../i18n.ts';

export const VouchersPage: React.FC = () => {
  const { applyVoucher, appliedVoucher } = useCart();
  const { showToast } = useToast();

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

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, backgroundColor: '#fef3c7', color: '#b45309', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
          <Tag size={16} /> KHO MÃ ƯU ĐÃI STATIONERY SHOP
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 10 }}>
          Săn Voucher Giảm Giá Văn Phòng Phẩm
        </h1>
        <p style={{ fontSize: 15, color: '#64748b' }}>
          Tiết kiệm chi phí mua sắm sách vở, dụng cụ học tập và vật tư doanh nghiệp với các mã giảm giá tốt nhất tháng.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>Đang tải danh sách voucher...</div>
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
                  border: isApplied ? '2px solid var(--secondary)' : '1px solid #e2e8f0',
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
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 800,
                        fontSize: 16,
                        letterSpacing: 0.5,
                        border: '1px dashed #bfdbfe',
                      }}
                    >
                      {v.code}
                    </span>
                    <button
                      onClick={() => handleCopyCode(v.code)}
                      style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
                      title="Sao chép mã"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 6 }}>
                    {v.name}
                  </h3>

                  <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: 16 }}>
                    <div>• Đơn tối thiểu: <strong>{i18n.currency(v.minimumOrder)}</strong></div>
                    {v.maximumDiscount > 0 && (
                      <div>• Giảm tối đa: <strong>{i18n.currency(v.maximumDiscount)}</strong></div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#94a3b8', fontSize: 12, marginTop: 4 }}>
                      <Clock size={13} /> Hạn sử dụng: {i18n.formatDate(v.endDate)}
                    </div>
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
