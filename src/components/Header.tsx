import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Bell,
  User as UserIcon,
  Search,
  Wallet,
  LogOut,
  Shield,
  Briefcase,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useCart } from '../contexts/CartContext.tsx';
import { useNotification } from '../contexts/NotificationContext.tsx';
import { i18n } from '../i18n.ts';
import { categoriesAPI, siteContentAPI } from '../api.ts';

interface HeaderProps {
  onOpenAuthModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuthModal }) => {
  const navigate = useNavigate();
  const { currentUser, role, logout, switchRoleDemo } = useAuth();
  const { itemCount } = useCart();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [menuCategories, setMenuCategories] = useState<any[]>([]);
  const [activeMegaMenu, setActiveMegaMenu] = useState<string | null>(null);
  const [siteContent, setSiteContent] = useState<any>(null);

  useEffect(() => {
    let active = true;
    siteContentAPI.get()
      .then((res) => { if (active && res.success && res.data) setSiteContent(res.data); })
      .catch((err) => console.error('Không tải được nội dung header:', err));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    categoriesAPI.getAll().then((res) => { if (mounted && res.success) setMenuCategories(Array.isArray(res.data) ? res.data : []); }).catch((err) => console.error('Không tải được danh mục menu:', err));
    return () => { mounted = false; };
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      navigate('/products');
    }
  };

  return (
    <>
      {/* Top Bar Announcement */}
      <div className="top-announcement">
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{siteContent?.announcementText || '🎉 Miễn phí vận chuyển cho đơn hàng từ 300.000đ | Giao hỏa tốc 2H tại TP.HCM & Hà Nội'}</span>
          <div>
            <span>{siteContent?.hotlineLabel || 'Hotline hỗ trợ doanh nghiệp'}: <strong>{siteContent?.hotline || '1900 6868'}</strong></span>
          </div>
        </div>
      </div>

      {/* Role Switcher Bar for grading & live demonstration
      <div className="role-switcher-banner">
        <div className="container role-switcher-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#fbbf24" />
            <span><strong>Chuyển đổi Role Demo:</strong></span>
            <button
              className={`role-tag-btn ${role === 'CUSTOMER' ? 'active' : ''}`}
              onClick={() => switchRoleDemo('CUSTOMER')}
            >
              Khách hàng (customer@stationery.vn)
            </button>
            <button
              className={`role-tag-btn ${role === 'EMPLOYEE' ? 'active' : ''}`}
              onClick={() => switchRoleDemo('EMPLOYEE')}
            >
              Nhân viên (employee@stationery.vn)
            </button>
            <button
              className={`role-tag-btn ${role === 'ADMIN' ? 'active' : ''}`}
              onClick={() => switchRoleDemo('ADMIN')}
            >
              Quản trị viên (admin@stationery.vn)
            </button>
          </div>
          <div style={{ fontSize: 12, color: '#E7E8EA' }}>
            {currentUser ? (
              <span>Đang đăng nhập: <strong>{currentUser.name}</strong> ({i18n.roles[currentUser.role]})</span>
            ) : (
              <span>Chưa đăng nhập (Khách vãng lai)</span>
            )}
          </div>
        </div>
      </div> */}

      {/* Main Sticky Header */}
      <header className="main-header">
        <div className="container header-inner">
          {/* Logo */}
          <Link to="/" className="logo-brand">
            <div className="logo-icon-box">
              <Layers size={22} />
            </div>
            <div>
              <span>{siteContent?.brandName || 'Tây Thi Stationery'}</span>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: 0.5, marginTop: -4 }}>
                {siteContent?.brandTagline || 'AI BẢO DÂN VĂN PHÒNG KHÔNG ĐƯỢC CHẤT'}
              </div>
            </div>
          </Link>

          {/* Search Form */}
          <form className="search-box-header" onSubmit={handleSearch}>
            <input
              type="text"
              className="search-input-header"
              placeholder="Tìm kiếm bút viết, tập vở, giấy in Double A, Deli..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="search-btn-header">
              <Search size={16} />
            </button>
          </form>

          {/* Header Action Icons */}
          <div className="header-actions">
            {/* Wallet button if logged in as customer */}
            {currentUser && currentUser.role === 'CUSTOMER' && (
              <Link to="/wallet" className="header-action-btn" title="Ví Stationery Pay">
                <Wallet size={18} color="#059669" />
                <span style={{ fontWeight: 600, color: '#059669' }}>
                  {i18n.currency(currentUser.walletBalance || 0)}
                </span>
              </Link>
            )}

            {/* Admin or Employee workspace quick links */}
            {role === 'ADMIN' && (
              <Link to="/admin" className="header-action-btn" style={{ borderColor: '#D90D24', color: '#F21D2F' }}>
                <Shield size={18} />
                <span>Trang Quản Trị</span>
              </Link>
            )}
            {role === 'EMPLOYEE' && (
              <Link to="/employee" className="header-action-btn" style={{ borderColor: '#059669', color: '#059669' }}>
                <Briefcase size={18} />
                <span>Bàn Làm Việc NV</span>
              </Link>
            )}

            {/* Notification Bell */}
            <div style={{ position: 'relative' }}>
              <button
                className="header-action-btn"
                style={{ padding: '8px 12px' }}
                onClick={() => setShowNotifMenu(!showNotifMenu)}
                title="Thông báo"
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="badge-pill">{unreadCount}</span>}
              </button>

              {/* Notification Popover Dropdown */}
              {showNotifMenu && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '120%',
                    width: 340,
                    backgroundColor: '#ffffff',
                    borderRadius: 12,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.2)',
                    border: '1px solid #E2E3E1',
                    zIndex: 1050,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E3E1', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>Thông Báo ({notifications.length})</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                      >
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: 24, textAlign: 'center', color: '#777B80', fontSize: 13 }}>
                        Không có thông báo mới nào
                      </div>
                    ) : (
                      notifications.slice(0, 8).map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markAsRead(n.id);
                            if (n.link) navigate(n.link);
                            setShowNotifMenu(false);
                          }}
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid #EEEEEC',
                            backgroundColor: n.isRead ? '#ffffff' : '#f0fdf4',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#101010', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ fontSize: 12, color: '#5f5e5e', lineHeight: 1.4 }}>{n.message}</div>
                          <div style={{ fontSize: 11, color: '#777B80', marginTop: 4 }}>{i18n.formatDate(n.createdAt)}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart Button */}
            <Link to="/cart" className="header-action-btn" style={{ padding: '8px 14px' }}>
              <ShoppingBag size={18} />
              <span>Giỏ hàng</span>
              {itemCount > 0 && <span className="badge-pill">{itemCount}</span>}
            </Link>

            {/* User Account Menu */}
            <div style={{ position: 'relative' }}>
              {currentUser ? (
                <button
                  className="header-action-btn"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <UserIcon size={18} />
                  <span>{currentUser.name.split(' ').slice(-1)[0]}</span>
                  <ChevronDown size={14} />
                </button>
              ) : (
                <button
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                  onClick={onOpenAuthModal}
                >
                  Đăng Nhập
                </button>
              )}

              {/* User Dropdown */}
              {showUserMenu && currentUser && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '120%',
                    width: 220,
                    backgroundColor: '#ffffff',
                    borderRadius: 10,
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                    border: '1px solid #E2E3E1',
                    zIndex: 1050,
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #EEEEEC' }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{currentUser.name}</div>
                    <div style={{ fontSize: 12, color: '#5f5e5e' }}>{currentUser.email}</div>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    <Link
                      to="/orders"
                      onClick={() => setShowUserMenu(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#202124' }}
                    >
                      <ShoppingBag size={16} /> Đơn hàng của tôi
                    </Link>
                    <Link
                      to="/wallet"
                      onClick={() => setShowUserMenu(false)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#202124' }}
                    >
                      <Wallet size={16} /> Ví tiền & Điểm thưởng
                    </Link>
                    {role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#F21D2F', fontWeight: 600 }}
                      >
                        <Shield size={16} /> Quản trị hệ thống
                      </Link>
                    )}
                    {role === 'EMPLOYEE' && (
                      <Link
                        to="/employee"
                        onClick={() => setShowUserMenu(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', fontSize: 13, color: '#059669', fontWeight: 600 }}
                      >
                        <Briefcase size={16} /> Dashboard Nhân viên
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 16px',
                        fontSize: 13,
                        color: '#F21D2F',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        borderTop: '1px solid #EEEEEC',
                      }}
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Horizontal category navigation with database-backed mega menu */}
      <nav className="sub-navbar tt-category-nav" onMouseLeave={() => setActiveMegaMenu(null)}>
        <div className="container tt-nav-inner"><div className="nav-links tt-nav-links">
          <Link to="/" className="nav-link-item">Trang chủ</Link>
          <Link to="/products" className="nav-link-item">Tất cả sản phẩm</Link>
          {menuCategories.slice(0, 7).map((category) => (
            <div key={category.id} className={`tt-nav-category ${activeMegaMenu === category.id ? 'is-open' : ''}`} onMouseEnter={() => setActiveMegaMenu(category.id)}>
              <Link to={`/products?categoryId=${encodeURIComponent(category.id)}`} className="nav-link-item tt-nav-category-link" aria-haspopup="true" aria-expanded={activeMegaMenu === category.id} onClick={() => setActiveMegaMenu(null)}>{category.name}<ChevronDown size={13} /></Link>
              {activeMegaMenu === category.id && <div className="tt-mega-menu">
                <div className="tt-mega-heading"><span className="tt-mega-kicker">KHÁM PHÁ TÂY THI</span><Link to={`/products?categoryId=${encodeURIComponent(category.id)}`} onClick={() => setActiveMegaMenu(null)}>Xem tất cả {category.name} ↗</Link></div>
                <div className="tt-mega-columns">
                  <div className="tt-mega-column"><strong>{category.name}</strong>
                    <Link to={`/products?categoryId=${encodeURIComponent(category.id)}`} onClick={() => setActiveMegaMenu(null)}>Tất cả sản phẩm</Link>
                    <Link to={`/products?categoryId=${encodeURIComponent(category.id)}&sort=best_seller`} onClick={() => setActiveMegaMenu(null)}>Sản phẩm bán chạy</Link>
                    <Link to={`/products?categoryId=${encodeURIComponent(category.id)}&sort=newest`} onClick={() => setActiveMegaMenu(null)}>Sản phẩm mới</Link>
                  </div>
                  <div className="tt-mega-feature"><span>CHỌN ĐỒ DÙNG • KHƠI Ý TƯỞNG</span><p>Đúng món cần dùng. Sẵn sàng cho ý tưởng lớn.</p><Link to={`/products?categoryId=${encodeURIComponent(category.id)}`} onClick={() => setActiveMegaMenu(null)}>Khám phá danh mục →</Link></div>
                </div>
              </div>}
            </div>
          ))}
          <Link to="/vouchers" className="nav-link-item tt-nav-promo">Khuyến mãi</Link>
          <Link to="/orders" className="nav-link-item">Tra cứu đơn hàng</Link>
        </div></div>
      </nav>
    </>
  );
};
