import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  RotateCcw,
  PlusCircle,
  Gift,
  CheckCircle,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { walletAPI } from '../../api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import { i18n } from '../../i18n.ts';

export const WalletPage: React.FC = () => {
  const { isAuthenticated, currentUser, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [walletInfo, setWalletInfo] = useState({ balance: 0, loyaltyPoints: 0 });
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Deposit modal state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100000);
  const [depositLoading, setDepositLoading] = useState(false);

  // Redeem modal state
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<number>(50);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const loadData = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [wRes, txRes] = await Promise.all([
        walletAPI.getWallet(),
        walletAPI.getTransactions(),
      ]);
      if (wRes.success) setWalletInfo(wRes.data);
      if (txRes.success) setTransactions(txRes.data);
    } catch (err) {
      console.error('Failed to load wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const handleDeposit = async () => {
    if (depositAmount < 10000) {
      showToast('Số tiền nạp tối thiểu là 10.000đ', 'warning');
      return;
    }
    setDepositLoading(true);
    try {
      const res = await walletAPI.deposit(depositAmount, 'Nạp tiền vào ví qua cổng thanh toán QR');
      if (res.success) {
        showToast(res.message, 'success');
        setShowDepositModal(false);
        await refreshUser();
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi nạp tiền', 'error');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (walletInfo.loyaltyPoints < selectedPoints) {
      showToast('Bạn không đủ điểm thưởng để đổi ưu đãi này', 'warning');
      return;
    }
    setRedeemLoading(true);
    try {
      const res = await walletAPI.redeemPoints(selectedPoints);
      if (res.success) {
        showToast(res.message, 'success');
        setShowRedeemModal(false);
        await refreshUser();
        await loadData();
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi đổi điểm', 'error');
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '32px 20px 60px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>
        Ví Điện Tử & Điểm Thưởng Stationery Pay
      </h1>

      {/* 2 Top Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginBottom: 32 }}>
        {/* Wallet Balance Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            borderRadius: 16,
            padding: 28,
            color: '#ffffff',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 13, color: '#bfdbfe', fontWeight: 600, letterSpacing: 0.5 }}>
                SỐ DƯ KHẢ DỤNG
              </span>
              <div style={{ fontSize: 36, fontWeight: 900, marginTop: 4 }}>
                {i18n.currency(walletInfo.balance)}
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={24} />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setShowDepositModal(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                color: '#1e40af',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              }}
            >
              <PlusCircle size={18} /> Nạp Tiền Vào Ví
            </button>
            <span style={{ fontSize: 12, color: '#dbeafe' }}>
              ✓ Thanh toán đơn hàng không cần thẻ, hoàn tiền tích điểm
            </span>
          </div>
        </div>

        {/* Loyalty Points Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
            borderRadius: 16,
            padding: 28,
            color: '#ffffff',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: 13, color: '#a7f3d0', fontWeight: 600, letterSpacing: 0.5 }}>
                ĐIỂM TÍCH LŨY THÀNH VIÊN
              </span>
              <div style={{ fontSize: 36, fontWeight: 900, marginTop: 4 }}>
                {walletInfo.loyaltyPoints} <span style={{ fontSize: 18, fontWeight: 600 }}>Điểm</span>
              </div>
            </div>
            <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Coins size={24} />
            </div>
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
            <button
              onClick={() => setShowRedeemModal(true)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                backgroundColor: '#ffffff',
                color: '#065f46',
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              }}
            >
              <Gift size={18} /> Đổi Điểm Lấy Voucher
            </button>
            <span style={{ fontSize: 12, color: '#d1fae5' }}>
              ✓ Nhận 1 điểm với mỗi 10.000đ mua sắm
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 16 }}>
          Lịch Sử Giao Dịch Ví
        </h3>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Đang tải lịch sử giao dịch...</div>
        ) : transactions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>
            Chưa có giao dịch phát sinh nào trong ví.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Loại giao dịch</th>
                  <th>Mô tả</th>
                  <th>Số tiền</th>
                  <th>Số dư sau GD</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const isDeposit = tx.type === 'DEPOSIT';
                  const isRefund = tx.type === 'REFUND';
                  return (
                    <tr key={tx.id}>
                      <td style={{ color: '#64748b', fontSize: 13 }}>{i18n.formatDate(tx.createdAt)}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 10px',
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            backgroundColor: isDeposit ? '#dbeafe' : isRefund ? '#ede9fe' : '#fee2e2',
                            color: isDeposit ? '#1d4ed8' : isRefund ? '#6d28d9' : '#b91c1c',
                          }}
                        >
                          {isDeposit ? <ArrowDownLeft size={14} /> : isRefund ? <RotateCcw size={14} /> : <ArrowUpRight size={14} />}
                          {isDeposit ? 'Nạp tiền' : isRefund ? 'Hoàn tiền' : 'Thanh toán'}
                        </span>
                      </td>
                      <td style={{ fontWeight: 500 }}>{tx.description}</td>
                      <td>
                        <strong style={{ color: isDeposit || isRefund ? '#059669' : '#dc2626' }}>
                          {isDeposit || isRefund ? '+' : '-'}{i18n.currency(tx.amount)}
                        </strong>
                      </td>
                      <td style={{ color: '#475569' }}>{i18n.currency(tx.balanceAfter)}</td>
                      <td>
                        <span style={{ color: '#059669', fontWeight: 600, fontSize: 12 }}>
                          ✓ Thành công
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Nạp Tiền Vào Ví Stationery Pay</h3>
              <button className="modal-close-btn" onClick={() => setShowDepositModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">Chọn nhanh mệnh giá nạp:</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[50000, 100000, 200000, 500000, 1000000, 2000000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      style={{
                        padding: '10px 4px',
                        borderRadius: 8,
                        border: '1px solid',
                        borderColor: depositAmount === amt ? 'var(--primary)' : '#cbd5e1',
                        backgroundColor: depositAmount === amt ? 'var(--primary-light)' : '#ffffff',
                        color: depositAmount === amt ? 'var(--primary)' : '#1e293b',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {i18n.currency(amt)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hoặc nhập số tiền tùy chọn (đ)</label>
                <input
                  type="number"
                  step="10000"
                  min="10000"
                  className="form-control"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                />
              </div>

              <div style={{ padding: 12, borderRadius: 8, backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 12, color: '#64748b' }}>
                💡 Hệ thống sẽ tự động ghi nhận số dư tức thì sau khi bấm xác nhận nạp tiền.
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDepositModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleDeposit} disabled={depositLoading}>
                {depositLoading ? 'Đang nạp...' : `Xác Nhận Nạp ${i18n.currency(depositAmount)}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Redeem Loyalty Points Modal */}
      {showRedeemModal && (
        <div className="modal-overlay" onClick={() => setShowRedeemModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3 className="modal-title">Đổi Điểm Thưởng Lấy Mã Giảm Giá</h3>
              <button className="modal-close-btn" onClick={() => setShowRedeemModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
                Điểm tích lũy hiện có: <strong style={{ color: '#059669' }}>{walletInfo.loyaltyPoints} điểm</strong>
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { points: 50, value: 'Voucher 20.000đ (đơn từ 100K)' },
                  { points: 100, value: 'Voucher 25.000đ (đơn từ 120K)' },
                  { points: 200, value: 'Voucher 50.000đ (đơn từ 200K)' },
                ].map((opt) => (
                  <label
                    key={opt.points}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: 14,
                      borderRadius: 10,
                      border: '1px solid',
                      borderColor: selectedPoints === opt.points ? '#059669' : '#e2e8f0',
                      backgroundColor: selectedPoints === opt.points ? '#ecfdf5' : '#ffffff',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="redeemPoints"
                      checked={selectedPoints === opt.points}
                      onChange={() => setSelectedPoints(opt.points)}
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: '#065f46' }}>{opt.value}</div>
                      <div style={{ fontSize: 12, color: '#047857' }}>Tiêu tốn: {opt.points} điểm tích lũy</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRedeemModal(false)}>Hủy</button>
              <button className="btn-primary" onClick={handleRedeem} disabled={redeemLoading || walletInfo.loyaltyPoints < selectedPoints}>
                {redeemLoading ? 'Đang đổi...' : 'Xác Nhận Đổi Voucher'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
