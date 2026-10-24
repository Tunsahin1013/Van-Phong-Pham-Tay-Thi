import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../api.ts';
import { useToast } from '../../contexts/ToastContext.tsx';

export const ResetPasswordPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const token = params.get('token') || '';
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token) { showToast('Liên kết khôi phục không có mã token.', 'error'); return; }
    if (newPassword.length < 8) { showToast('Mật khẩu cần ít nhất 8 ký tự.', 'warning'); return; }
    if (newPassword !== confirmPassword) { showToast('Mật khẩu xác nhận không khớp.', 'warning'); return; }
    setLoading(true);
    try { const res = await authAPI.resetPassword({ token, newPassword }); showToast(res.message, 'success'); navigate('/', { replace: true }); }
    catch (error: any) { showToast(error.message || 'Không đặt lại được mật khẩu.', 'error'); }
    finally { setLoading(false); }
  };
  return <div className="container" style={{ maxWidth: 480, padding: '60px 20px' }}><section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24 }}><h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Đặt lại mật khẩu</h1><p style={{ color: '#6B7280', marginBottom: 20 }}>Liên kết chỉ dùng một lần và hết hạn sau 15 phút.</p><form onSubmit={submit}><label className="form-label">Mật khẩu mới</label><input type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-control"/><label className="form-label" style={{ marginTop: 12, display: 'block' }}>Nhập lại mật khẩu mới</label><input type="password" autoComplete="new-password" minLength={8} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="form-control"/><button className="btn-primary" style={{ width: '100%', marginTop: 18 }} disabled={loading}>{loading ? 'Đang xử lý…' : 'Lưu mật khẩu mới'}</button></form><Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: 14, color: '#D90D24' }}>Quay về trang chủ</Link></section></div>;
};
