import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../api.ts';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';

const fieldStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #D6D7DA', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' };

export const AccountPage: React.FC = () => {
  const { currentUser, refreshUser, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [profile, setProfile] = useState({ name: '', phone: '', address: '', avatar: '' });
  const [addresses, setAddresses] = useState<any[]>([]);
  const [addressForm, setAddressForm] = useState({ label: 'Nhà riêng', recipientName: '', phone: '', address: '', isDefault: false });
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUser) setProfile({ name: currentUser.name || '', phone: currentUser.phone || '', address: currentUser.address || '', avatar: currentUser.avatar || '' });
  }, [currentUser]);

  const loadAddresses = async () => {
    try { const res = await authAPI.getAddresses(); if (res.success) setAddresses(res.data || []); }
    catch (error: any) { showToast(error.message || 'Không tải được sổ địa chỉ.', 'error'); }
  };
  useEffect(() => { if (isAuthenticated) loadAddresses(); }, [isAuthenticated]);

  if (!isAuthenticated || !currentUser) return <div className="container" style={{ padding: 50 }}>Vui lòng đăng nhập để quản lý hồ sơ. <Link to="/">Về trang chủ</Link></div>;

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try { const res = await authAPI.updateProfile(profile); showToast(res.message || 'Đã cập nhật hồ sơ.', 'success'); await refreshUser(); }
    catch (error: any) { showToast(error.message || 'Không cập nhật được hồ sơ.', 'error'); }
    finally { setLoading(false); }
  };
  const saveAddress = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true);
    try {
      if (editingAddress) await authAPI.updateAddress(editingAddress, addressForm);
      else await authAPI.addAddress(addressForm);
      showToast(editingAddress ? 'Đã cập nhật địa chỉ.' : 'Đã thêm địa chỉ giao hàng.', 'success');
      setEditingAddress(null); setAddressForm({ label: 'Nhà riêng', recipientName: currentUser.name, phone: currentUser.phone || '', address: '', isDefault: false });
      await loadAddresses(); await refreshUser();
    } catch (error: any) { showToast(error.message || 'Không lưu được địa chỉ.', 'error'); }
    finally { setLoading(false); }
  };
  const editAddress = (address: any) => { setEditingAddress(address.id); setAddressForm({ label: address.label || '', recipientName: address.recipientName || '', phone: address.phone || '', address: address.address || '', isDefault: Boolean(address.isDefault) }); };
  const deleteAddress = async (id: string) => {
    if (!window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) return;
    try { await authAPI.deleteAddress(id); showToast('Đã xóa địa chỉ.', 'success'); await loadAddresses(); await refreshUser(); }
    catch (error: any) { showToast(error.message || 'Không xóa được địa chỉ.', 'error'); }
  };
  const setDefault = async (id: string) => {
    try { await authAPI.setDefaultAddress(id); showToast('Đã đặt làm địa chỉ mặc định.', 'success'); await loadAddresses(); await refreshUser(); }
    catch (error: any) { showToast(error.message || 'Không đặt được địa chỉ mặc định.', 'error'); }
  };
  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (passwordForm.newPassword.length < 8) { showToast('Mật khẩu mới cần ít nhất 8 ký tự.', 'warning'); return; }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { showToast('Mật khẩu xác nhận không khớp.', 'warning'); return; }
    setLoading(true);
    try { const res = await authAPI.changePassword({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }); showToast(res.message || 'Đổi mật khẩu thành công.', 'success'); setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); }
    catch (error: any) { showToast(error.message || 'Không đổi được mật khẩu.', 'error'); }
    finally { setLoading(false); }
  };

  return <div className="container" style={{ padding: '32px 20px 60px', maxWidth: 1080 }}>
    <h1 style={{ fontSize: 28, fontWeight: 800, color: '#101010', marginBottom: 8 }}>Hồ sơ tài khoản</h1>
    <p style={{ color: '#6B7280', marginBottom: 24 }}>Cập nhật thông tin cá nhân, bảo mật và địa chỉ nhận hàng.</p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 20, alignItems: 'start' }}>
      <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 22 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Thông tin cá nhân</h2>
        <form onSubmit={saveProfile}>
          <label className="form-label">Họ và tên</label><input style={fieldStyle} value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} required maxLength={120}/>
          <label className="form-label" style={{ marginTop: 12, display: 'block' }}>Email (không thể đổi)</label><input style={{ ...fieldStyle, background: '#F3F4F6' }} value={currentUser.email} disabled/>
          <label className="form-label" style={{ marginTop: 12, display: 'block' }}>Số điện thoại</label><input style={fieldStyle} value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} maxLength={30}/>
          <label className="form-label" style={{ marginTop: 12, display: 'block' }}>Địa chỉ mặc định (tương thích hồ sơ cũ)</label><textarea style={fieldStyle} value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} rows={2}/>
          <button className="btn-primary" disabled={loading} style={{ marginTop: 16, width: '100%' }}>{loading ? 'Đang lưu…' : 'Lưu thông tin'}</button>
        </form>
      </section>
      <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 22 }}>
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Đổi mật khẩu</h2>
        <form onSubmit={changePassword}>
          <label className="form-label">Mật khẩu hiện tại</label><input type="password" autoComplete="current-password" style={fieldStyle} value={passwordForm.currentPassword} onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} required/>
          <label className="form-label" style={{ marginTop: 12, display: 'block' }}>Mật khẩu mới (ít nhất 8 ký tự)</label><input type="password" autoComplete="new-password" minLength={8} style={fieldStyle} value={passwordForm.newPassword} onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} required/>
          <label className="form-label" style={{ marginTop: 12, display: 'block' }}>Xác nhận mật khẩu mới</label><input type="password" autoComplete="new-password" minLength={8} style={fieldStyle} value={passwordForm.confirmPassword} onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} required/>
          <button className="btn-primary" disabled={loading} style={{ marginTop: 16, width: '100%' }}>Đổi mật khẩu</button>
        </form>
        <p style={{ color: '#6B7280', fontSize: 12, marginTop: 12 }}>Nếu quên mật khẩu, hãy đăng xuất và dùng chức năng “Quên mật khẩu?” tại màn hình đăng nhập.</p>
      </section>
    </div>
    <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 14, padding: 22, marginTop: 20 }}>
      <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 16 }}>Sổ địa chỉ giao hàng</h2>
      <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
        {addresses.length === 0 ? <div style={{ color: '#6B7280' }}>Bạn chưa lưu địa chỉ giao hàng nào.</div> : addresses.map((a) => <div key={a.id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 12, border: '1px solid #E5E7EB', padding: 14, borderRadius: 10 }}>
          <div><div style={{ fontWeight: 800 }}>{a.label} {a.isDefault && <span style={{ color: '#D90D24', fontSize: 12 }}>• Mặc định</span>}</div><div>{a.recipientName} · {a.phone}</div><div style={{ color: '#6B7280', fontSize: 13 }}>{a.address}</div></div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{!a.isDefault && <button className="btn-secondary" onClick={() => setDefault(a.id)} type="button">Đặt mặc định</button>}<button className="btn-secondary" type="button" onClick={() => editAddress(a)}>Sửa</button><button type="button" onClick={() => deleteAddress(a.id)} style={{ border: '1px solid #fecaca', color: '#D90D24', background: '#fff1f2', borderRadius: 8, padding: '7px 10px' }}>Xóa</button></div>
        </div>)}
      </div>
      <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12 }}>{editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</h3>
      <form onSubmit={saveAddress} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
        <div><label className="form-label">Nhãn địa chỉ</label><input style={fieldStyle} value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })} required/></div>
        <div><label className="form-label">Người nhận</label><input style={fieldStyle} value={addressForm.recipientName} onChange={e => setAddressForm({ ...addressForm, recipientName: e.target.value })} required/></div>
        <div><label className="form-label">Số điện thoại</label><input style={fieldStyle} value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} required/></div>
        <div style={{ gridColumn: '1/-1' }}><label className="form-label">Địa chỉ chi tiết</label><textarea style={fieldStyle} rows={2} value={addressForm.address} onChange={e => setAddressForm({ ...addressForm, address: e.target.value })} required/></div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}><input type="checkbox" checked={addressForm.isDefault} onChange={e => setAddressForm({ ...addressForm, isDefault: e.target.checked })}/> Đặt làm địa chỉ mặc định</label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}><button className="btn-primary" disabled={loading}>{editingAddress ? 'Lưu địa chỉ' : 'Thêm địa chỉ'}</button>{editingAddress && <button className="btn-secondary" type="button" onClick={() => { setEditingAddress(null); setAddressForm({ label: 'Nhà riêng', recipientName: currentUser.name, phone: currentUser.phone || '', address: '', isDefault: false }); }}>Hủy sửa</button>}</div>
      </form>
    </section>
  </div>;
};
