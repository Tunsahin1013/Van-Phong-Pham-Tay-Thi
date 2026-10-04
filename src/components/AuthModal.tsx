import React, { useState } from 'react';
import { X, Mail, Lock, User, Phone, MapPin, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { authAPI } from '../api.ts';
import { useToast } from '../contexts/ToastContext.tsx';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, defaultTab = 'login' }) => {
  const { login, register, switchRoleDemo } = useAuth();
  const { showToast } = useToast();

  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>(defaultTab);
  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      onClose();
    } catch {
      // handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register({ name, email, password, phone, address });
      onClose();
    } catch {
      // handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      showToast(res.message, 'success');
      setTab('login');
      setPassword('123456');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER') => {
    setLoading(true);
    try {
      await switchRoleDemo(role);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        {/* Header Tabs */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 20 }}>
            <button
              onClick={() => setTab('login')}
              style={{
                background: 'none',
                border: 'none',
                paddingBottom: 14,
                fontSize: 16,
                fontWeight: 700,
                color: tab === 'login' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: tab === 'login' ? '3px solid var(--primary)' : '3px solid transparent',
                cursor: 'pointer',
              }}
            >
              Đăng Nhập
            </button>
            <button
              onClick={() => setTab('register')}
              style={{
                background: 'none',
                border: 'none',
                paddingBottom: 14,
                fontSize: 16,
                fontWeight: 700,
                color: tab === 'register' ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: tab === 'register' ? '3px solid var(--primary)' : '3px solid transparent',
                cursor: 'pointer',
              }}
            >
              Đăng Ký
            </button>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', paddingBottom: 14 }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24 }}>
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email tài khoản</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="customer@stationery.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 13 }} />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Mật khẩu</label>
                  <button
                    type="button"
                    onClick={() => setTab('forgot')}
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, cursor: 'pointer' }}
                  >
                    Quên mật khẩu?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="Mật khẩu của bạn (demo: 123456)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 13 }} />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ví dụ: Nguyễn Văn An"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <User size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 13 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ Email *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-control"
                    placeholder="an.nguyen@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                  <Mail size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 13 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mật khẩu (tối thiểu 6 ký tự) *</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Lock size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 13 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder="0912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                  <Phone size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 13 }} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ giao hàng mặc định</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                  <MapPin size={16} color="#94a3b8" style={{ position: 'absolute', right: 14, top: 13 }} />
                </div>
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
                {loading ? 'Đang tạo tài khoản...' : 'Đăng Ký Thành Viên'}
              </button>
            </form>
          )}

          {tab === 'forgot' && (
            <form onSubmit={handleForgot}>
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <KeyRound size={36} color="var(--primary)" style={{ margin: '0 auto 8px' }} />
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Khôi phục mật khẩu</h4>
                <p style={{ fontSize: 13, color: '#64748b' }}>
                  Nhập email đăng ký của bạn. Hệ thống sẽ cấp lại mật khẩu mặc định (123456).
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Email tài khoản</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="Nhập email..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%' }} disabled={loading}>
                {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu Cấp Lại'}
              </button>

              <button
                type="button"
                onClick={() => setTab('login')}
                style={{ width: '100%', marginTop: 10, background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer' }}
              >
                Quay lại đăng nhập
              </button>
            </form>
          )}

          {/* Quick Demo Login Buttons */}
          <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 10 }}>
              <Sparkles size={14} color="#f59e0b" />
              <span>ĐĂNG NHẬP NHANH TÀI KHOẢN MẪU (Pass: 123456)</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleQuickDemo('CUSTOMER')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#1e293b',
                  cursor: 'pointer',
                }}
              >
                Khách Hàng
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('EMPLOYEE')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#059669',
                  cursor: 'pointer',
                }}
              >
                Nhân Viên
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 6,
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#2563eb',
                  cursor: 'pointer',
                }}
              >
                Quản Trị Viên
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
