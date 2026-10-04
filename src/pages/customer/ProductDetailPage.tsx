import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Star,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  ChevronRight,
  MessageSquare,
  Package,
} from 'lucide-react';
import { productsAPI, reviewsAPI } from '../../api.ts';
import { useCart } from '../../contexts/CartContext.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useToast } from '../../contexts/ToastContext.tsx';
import { i18n } from '../../i18n.ts';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, currentUser } = useAuth();
  const { showToast } = useToast();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'desc' | 'reviews'>('desc');
  const [loading, setLoading] = useState(true);

  // Review submission state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    async function loadProductAndReviews() {
      if (!id) return;
      try {
        setLoading(true);
        const [prodRes, revRes] = await Promise.all([
          productsAPI.getById(id),
          reviewsAPI.getByProduct(id),
        ]);

        if (prodRes.success && prodRes.data) {
          setProduct(prodRes.data);
        }
        if (revRes.success && revRes.data) {
          setReviews(revRes.data);
        }
      } catch (err) {
        console.error('Failed to load product details', err);
      } finally {
        setLoading(false);
      }
    }
    loadProductAndReviews();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
  };

  const handleBuyNow = () => {
    if (!product) return;
    const ok = addToCart(product, quantity);
    if (ok) {
      navigate('/checkout');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showToast('Vui lòng đăng nhập để viết nhận xét về sản phẩm', 'warning');
      return;
    }

    if (!comment.trim()) {
      showToast('Vui lòng nhập nội dung đánh giá của bạn', 'warning');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await reviewsAPI.addReview({
        productId: product.id,
        rating,
        comment: comment.trim(),
      });

      if (res.success && res.data) {
        setReviews((prev) => [res.data, ...prev]);
        setComment('');
        showToast('Cảm ơn bạn đã gửi đánh giá cho sản phẩm!', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi gửi đánh giá', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center', color: '#64748b' }}>
        Đang tải thông tin sản phẩm...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>Không tìm thấy sản phẩm</h2>
        <p style={{ color: '#64748b', marginBottom: 20 }}>Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
        <Link to="/products" className="btn-primary">Quay Lại Cửa Hàng</Link>
      </div>
    );
  }

  const discountPercent =
    product.salePrice < product.price
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="container" style={{ padding: '24px 20px 60px' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b', marginBottom: 20 }}>
        <Link to="/">Trang chủ</Link>
        <ChevronRight size={14} />
        <Link to="/products">Văn phòng phẩm</Link>
        <ChevronRight size={14} />
        <Link to={`/products?categoryId=${product.categoryId}`}>{product.categoryName}</Link>
        <ChevronRight size={14} />
        <span style={{ color: '#0f172a', fontWeight: 600, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {product.name}
        </span>
      </div>

      {/* Main Product Presentation */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 40,
          backgroundColor: '#ffffff',
          borderRadius: 16,
          border: '1px solid #e2e8f0',
          padding: 32,
          marginBottom: 40,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Left: Product Image */}
        <div>
          <div
            style={{
              position: 'relative',
              borderRadius: 12,
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              aspectRatio: '1 / 1',
            }}
          >
            <img
              src={product.image}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {discountPercent > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 16,
                  left: 16,
                  padding: '6px 12px',
                  borderRadius: 6,
                  backgroundColor: '#dc2626',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: 13,
                }}
              >
                GIẢM {discountPercent}%
              </span>
            )}
          </div>
        </div>

        {/* Right: Info & Actions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              {product.brand}
            </span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>Mã SP: {product.code}</span>
            <span style={{ color: '#cbd5e1' }}>•</span>
            <span style={{ fontSize: 13, color: '#64748b' }}>Đã bán: {product.sold || 0}</span>
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginBottom: 12 }}>
            {product.name}
          </h1>

          {/* Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#f59e0b' }}>
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  size={16}
                  fill={i < Math.round(product.rating || 5) ? '#f59e0b' : 'none'}
                  color="#f59e0b"
                />
              ))}
            </div>
            <span style={{ fontWeight: 700, fontSize: 14 }}>{product.rating || 5.0}</span>
            <span style={{ color: '#64748b', fontSize: 13 }}>({product.reviewCount || 0} đánh giá thực tế)</span>
          </div>

          {/* Pricing Box */}
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: '#f8fafc',
              borderRadius: 12,
              border: '1px solid #e2e8f0',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 900, color: '#dc2626' }}>
              {i18n.currency(product.salePrice || product.price)}
            </span>
            {product.salePrice < product.price && (
              <span style={{ fontSize: 18, color: '#94a3b8', textDecoration: 'line-through' }}>
                {i18n.currency(product.price)}
              </span>
            )}
            <span style={{ fontSize: 13, color: '#059669', fontWeight: 600, marginLeft: 'auto' }}>
              Đơn vị: {product.unit}
            </span>
          </div>

          {/* Stock status */}
          <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <span style={{ fontWeight: 600, color: '#475569' }}>Tình trạng kho:</span>
            {isOutOfStock ? (
              <span style={{ color: '#ef4444', fontWeight: 700 }}>Hết hàng tạm thời</span>
            ) : (
              <span style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Check size={16} /> Còn {product.stock} {product.unit} sẵn tại kho
              </span>
            )}
          </div>

          {/* Quantity selector */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#475569' }}>Số lượng:</span>
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #cbd5e1', borderRadius: 8, overflow: 'hidden' }}>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  style={{ width: 36, height: 36, background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    if (!isNaN(v)) setQuantity(Math.max(1, Math.min(product.stock, v)));
                  }}
                  style={{ width: 50, height: 36, textAlign: 'center', border: 'none', fontWeight: 700, fontSize: 14, outline: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  style={{ width: 36, height: 36, background: '#f8fafc', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16 }}
                >
                  +
                </button>
              </div>
            </div>
          )}

          {/* Buttons: Add to cart & Buy now */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 28 }}>
            <button
              className="btn-secondary"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{
                flex: 1,
                padding: '14px 20px',
                borderColor: 'var(--primary)',
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-light)',
                opacity: isOutOfStock ? 0.5 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              }}
            >
              <ShoppingCart size={18} /> Thêm Vào Giỏ Hàng
            </button>
            <button
              className="btn-primary"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              style={{
                flex: 1,
                padding: '14px 20px',
                opacity: isOutOfStock ? 0.5 : 1,
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
              }}
            >
              <Zap size={18} /> Mua Ngay
            </button>
          </div>

          {/* Extra service assurances */}
          <div
            style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: 20,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 16,
              fontSize: 12,
              color: '#64748b',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="#059669" /> Cam kết 100% chính hãng
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Truck size={20} color="#2563eb" /> Giao hàng 2H TP.HCM & HN
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <RotateCcw size={20} color="#7c3aed" /> Đổi trả trong 7 ngày
            </div>
          </div>
        </div>
      </div>

      {/* Product Details & Customer Reviews Tabs */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {/* Tab Headers */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc' }}>
          <button
            onClick={() => setActiveTab('desc')}
            style={{
              padding: '16px 24px',
              fontWeight: 700,
              fontSize: 15,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'desc' ? 'var(--primary)' : '#64748b',
              borderBottom: activeTab === 'desc' ? '3px solid var(--primary)' : '3px solid transparent',
            }}
          >
            Mô Tả & Thông Số Kỹ Thuật
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            style={{
              padding: '16px 24px',
              fontWeight: 700,
              fontSize: 15,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: activeTab === 'reviews' ? 'var(--primary)' : '#64748b',
              borderBottom: activeTab === 'reviews' ? '3px solid var(--primary)' : '3px solid transparent',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <MessageSquare size={16} /> Đánh Giá Từ Khách Hàng ({reviews.length})
          </button>
        </div>

        {/* Tab 1: Description & Specs */}
        {activeTab === 'desc' && (
          <div style={{ padding: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Đặc điểm nổi bật của sản phẩm</h3>
            <p style={{ fontSize: 15, lineHeight: 1.8, color: '#334155', marginBottom: 24 }}>
              {product.description}
            </p>

            {product.specification && (
              <>
                <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Thông số kỹ thuật</h3>
                <div style={{ backgroundColor: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid #e2e8f0', maxWidth: 600 }}>
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                    {product.specification}
                  </p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Reviews */}
        {activeTab === 'reviews' && (
          <div style={{ padding: 32 }}>
            {/* Reviews Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>
                  {product.rating || 5.0}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', color: '#f59e0b', margin: '8px 0 4px' }}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} size={18} fill="#f59e0b" color="#f59e0b" />
                  ))}
                </div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{reviews.length} đánh giá đã duyệt</div>
              </div>
            </div>

            {/* Write a review form */}
            <div style={{ backgroundColor: '#f8fafc', padding: 24, borderRadius: 12, border: '1px solid #e2e8f0', marginBottom: 32 }}>
              <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>
                Gửi đánh giá của bạn về sản phẩm này
              </h4>
              <form onSubmit={handleSubmitReview}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#475569' }}>Đánh giá của bạn:</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                      >
                        <Star
                          size={24}
                          fill={star <= rating ? '#f59e0b' : 'none'}
                          color={star <= rating ? '#f59e0b' : '#cbd5e1'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <textarea
                    className="form-control"
                    placeholder={isAuthenticated ? "Chia sẻ cảm nhận chi tiết của bạn về chất lượng sản phẩm, độ bền, nét chữ..." : "Vui lòng đăng nhập để gửi đánh giá..."}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={!isAuthenticated || submittingReview}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!isAuthenticated || submittingReview || !comment.trim()}
                  style={{ opacity: isAuthenticated && comment.trim() ? 1 : 0.6 }}
                >
                  {submittingReview ? 'Đang gửi...' : 'Gửi Nhận Xét'}
                </button>
              </form>
            </div>

            {/* List of customer reviews */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>
                  Chưa có nhận xét nào cho sản phẩm này. Hãy là người đầu tiên đánh giá!
                </div>
              ) : (
                reviews.map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      border: '1px solid #f1f5f9',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            backgroundColor: '#e2e8f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            color: '#334155',
                            fontSize: 12,
                          }}
                        >
                          {r.customerName.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{r.customerName}</div>
                          <div style={{ fontSize: 11, color: '#059669', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Check size={12} /> Đã mua hàng tại Stationery Shop
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{i18n.formatDate(r.createdAt)}</span>
                    </div>

                    <div style={{ display: 'flex', color: '#f59e0b', marginBottom: 6 }}>
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star key={i} size={14} fill={i < r.rating ? '#f59e0b' : 'none'} color="#f59e0b" />
                      ))}
                    </div>

                    <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>{r.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
