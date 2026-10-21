import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Flame,
  Award,
  Truck,
  ShieldCheck,
  CheckCircle,
  Tag,
  ArrowRight,
  PenTool,
  BookOpen,
  BookMarked,
  Files,
  Ruler,
  Briefcase,
  Backpack,
  Building2,
  FolderArchive,
  Lamp,
} from 'lucide-react';
import { bannerSlides } from '../../bannerSlides.ts';
import { productsAPI, categoriesAPI, vouchersAPI, siteContentAPI } from '../../api.ts';
import { ProductCard } from '../../components/ProductCard.tsx';
import { useCart } from '../../contexts/CartContext.tsx';
import { i18n } from '../../i18n.ts';

const iconMap: Record<string, any> = {
  PenTool,
  BookOpen,
  BookMarked,
  Files,
  Ruler,
  Briefcase,
  Backpack,
  Building2,
  FolderArchive,
  Lamp,
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { applyVoucher } = useCart();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [siteContent, setSiteContent] = useState<any>(null);
  // Use the local bannerSlides.ts as the source of truth for the homepage hero.
  // Site content from the API still powers brand-independent content such as perks,
  // but an older heroSlides array in MongoDB must not silently replace updated image URLs.
  const slides = bannerSlides;
  const perks = siteContent?.perks?.length ? siteContent.perks : [
    { id: 'authentic', title: 'Chính Hãng 100%', description: 'Phân phối trực tiếp từ Thiên Long, Deli, Pentel', icon: 'Award' },
    { id: 'delivery', title: 'Giao Hỏa Tốc 2H', description: 'Miễn phí giao hàng nội thành đơn từ 300K', icon: 'Truck' },
    { id: 'returns', title: 'Đổi Trả 7 Ngày', description: 'Cam kết hoàn tiền nếu sản phẩm lỗi nhà sản xuất', icon: 'CheckCircle' },
    { id: 'discount', title: 'Chiết Khấu Cao', description: 'Ưu đãi đến 20% cho đơn doanh nghiệp & trường học', icon: 'ShieldCheck' },
  ];
  const perkIconMap: Record<string, any> = { Award, Truck, CheckCircle, ShieldCheck };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    siteContentAPI.get()
      .then((res) => {
        if (res.success && res.data) setSiteContent(res.data);
      })
      .catch((err) => console.error('Không tải được nội dung website từ database:', err));
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, featRes, bestRes, newRes, vouchRes] = await Promise.all([
          categoriesAPI.getAll(),
          productsAPI.getFeatured(),
          productsAPI.getBestSellers(),
          productsAPI.getNewArrivals(),
          vouchersAPI.getAll(),
        ]);

        if (catRes.success) setCategories(catRes.data);
        if (featRes.success) setFeaturedProducts(featRes.data);
        if (bestRes.success) setBestSellers(bestRes.data);
        if (newRes.success) setNewArrivals(newRes.data);
        if (vouchRes.success) setVouchers(vouchRes.data.slice(0, 4));
      } catch (err) {
        console.error('Failed to load home page data', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const slide = slides[currentSlide % slides.length];
  const slideTitleText = String(slide?.title ?? 'VĂN PHÒNG PHẨM TÂY THI');
  const slideTitleWords = slideTitleText.trim().split(/\s+/).filter(Boolean);
  const splitTitleAt = Math.ceil(slideTitleWords.length / 2);
  const titleMain = slide.accentTitle || slideTitleWords.length < 4
    ? slideTitleText
    : slideTitleWords.slice(0, splitTitleAt).join(' ');
  const titleAccent = slide.accentTitle || (slideTitleWords.length >= 4
    ? slideTitleWords.slice(splitTitleAt).join(' ')
    : '');

  return (
    <div>
      {/* Hero Banner Slider */}
      <section className="hero-slider-section">
        <div className="container">
          <div className="hero-slide-card tt-hero-card" style={{ position: 'relative' }}>
            <div className="hero-slide-content">
              <span className="hero-badge"><span className="hero-badge-brand">TÂY THI</span><span className="hero-badge-divider" aria-hidden="true">/</span>{slide.badge}</span>
              <h1 className="hero-title">
                <span className="hero-title-main">{titleMain}</span>
                {titleAccent && <span className="hero-title-accent">{titleAccent}</span>}
              </h1>
              <h3 className="hero-subtitle">{slide.subtitle}</h3>
              <p className="hero-desc">{slide.description}</p>
              <div className="hero-cta-group">
                <Link to={slide.ctaLink} className="btn-primary">
                  {slide.ctaText} <ArrowRight size={18} />
                </Link>
                <Link to={slide.secondaryCtaLink} className="btn-secondary">
                  {slide.secondaryCtaText}
                </Link>
              </div>
            </div>

            <div className="hero-slide-image-box">
              <img src={slide.image} alt={`${slide.title}${slide.accentTitle ? ` ${slide.accentTitle}` : ''}`} />
              <div className="hero-image-overlay" aria-hidden="true" />
            </div>

            {/* Slide Navigation Arrows */}
            <button
              aria-label="Banner trước"
              onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #E2E3E1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
              }}
            >
              <ChevronLeft size={20} />
            </button>

            <button
              aria-label="Banner tiếp theo"
              onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
              style={{
                position: 'absolute',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '1px solid #E2E3E1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                zIndex: 10,
              }}
            >
              <ChevronRight size={20} />
            </button>

            <div className="hero-pagination" aria-label="Chọn banner">
              {slides.map((item: any, index: number) => (
                <button
                  key={item.id || index}
                  type="button"
                  className={`hero-pagination-dot ${index === currentSlide ? 'is-active' : ''}`}
                  aria-label={`Chuyển tới banner ${index + 1}`}
                  aria-current={index === currentSlide ? 'true' : undefined}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core perks loaded from MongoDB site content */}
      <section className="container tt-perks-wrap">
        <div className="perks-grid">
          {perks.map((perk: any) => {
            const PerkIcon = perkIconMap[perk.icon] || Award;
            return (
              <div className="perk-card" key={perk.id || perk.title}>
                <div className="perk-icon"><PerkIcon size={24} /></div>
                <div>
                  <div className="perk-title">{perk.title}</div>
                  <div className="perk-desc">{perk.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 10 Stationery Categories */}
      <section className="container categories-bar">
        <div className="section-header">
          <h2 className="section-title">
            <Sparkles size={22} color="var(--primary)" /> Danh Mục Văn Phòng Phẩm
          </h2>
          <Link to="/products" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>

        <div className="category-chips-grid">
          {categories.map((cat) => {
            const Icon = iconMap[cat.iconName] || Files;
            return (
              <div
                key={cat.id}
                className="category-chip"
                onClick={() => navigate(`/products?categoryId=${cat.id}`)}
              >
                <div className="category-chip-icon">
                  <Icon size={22} />
                </div>
                <div className="category-chip-name">{cat.name}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Hot Vouchers Strip */}
      {vouchers.length > 0 && (
        <section className="container" style={{ marginBottom: 40 }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #101010 0%, #101010 100%)',
              borderRadius: 16,
              padding: '24px 28px',
              color: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Tag size={24} color="#f59e0b" />
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Mã Ưu Đãi Dành Riêng Cho Bạn Hôm Nay</h3>
              </div>
              <Link to="/vouchers" style={{ fontSize: 13, color: '#F21D2F', fontWeight: 600 }}>
                Xem tất cả mã giảm giá →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {vouchers.map((v) => (
                <div
                  key={v.id}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    border: '1px dashed rgba(255, 255, 255, 0.25)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#fbbf24', letterSpacing: 0.5 }}>
                      {v.code}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#F5F5F3', marginTop: 4 }}>
                      {v.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#777B80', marginTop: 4 }}>
                      Đơn tối thiểu: {i18n.currency(v.minimumOrder)}
                    </div>
                  </div>
                  <button
                    onClick={() => applyVoucher(v.code)}
                    style={{
                      marginTop: 12,
                      padding: '6px 12px',
                      borderRadius: 6,
                      backgroundColor: '#F21D2F',
                      color: '#ffffff',
                      border: 'none',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      alignSelf: 'flex-start',
                    }}
                  >
                    Lưu mã ngay
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured Products */}
      <section className="container" style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">
            <Flame size={22} color="#D90D24" /> Sản Phẩm Nổi Bật & Bán Chạy Nhất
          </h2>
          <Link to="/products?featured=true" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
            Xem thêm →
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#5f5e5e' }}>Đang tải sản phẩm...</div>
        ) : (
          <div className="products-grid">
            {featuredProducts.slice(0, 8).map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )}
      </section>

      {/* Best Sellers Section */}
      <section className="container" style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">
            <TrendingUp size={22} color="#059669" /> Top Văn Phòng Phẩm Bán Chạy
          </h2>
          <Link to="/products?sort=best_seller" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
            Xem tất cả →
          </Link>
        </div>

        <div className="products-grid">
          {bestSellers.slice(0, 4).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* New Arrivals Section */}
      <section className="container" style={{ marginBottom: 40 }}>
        <div className="section-header">
          <h2 className="section-title">
            <Sparkles size={22} color="#7c3aed" /> Hàng Mới Về Tuần Này
          </h2>
          <Link to="/products?sort=newest" style={{ fontSize: 14, fontWeight: 600, color: 'var(--primary)' }}>
            Xem tất cả →
          </Link>
        </div>

        <div className="products-grid">
          {newArrivals.slice(0, 4).map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Top Brands Showcase */}
      <section className="container" style={{ marginBottom: 50 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#101010' }}>Đối Tác Thương Hiệu Chính Hãng</h3>
          <p style={{ fontSize: 14, color: '#5f5e5e' }}>Stationery Shop là đại lý ủy quyền của các thương hiệu văn phòng phẩm hàng đầu</p>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 28,
            flexWrap: 'wrap',
            padding: '24px 32px',
            backgroundColor: '#ffffff',
            borderRadius: 16,
            border: '1px solid #E2E3E1',
          }}
        >
          {['Thiên Long', 'Double A', 'Deli', 'Campus', 'Pentel', 'Plus', 'Hồng Hà', 'Staedtler'].map((b) => (
            <div
              key={b}
              onClick={() => navigate(`/products?brand=${encodeURIComponent(b)}`)}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                backgroundColor: '#F5F5F3',
                border: '1px solid #E2E3E1',
                fontWeight: 700,
                fontSize: 14,
                color: '#202124',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {b}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
