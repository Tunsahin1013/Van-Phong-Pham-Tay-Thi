import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { useCart } from '../contexts/CartContext.tsx';
import { i18n } from '../i18n.ts';

interface ProductCardProps {
  product: {
    id: string;
    code: string;
    name: string;
    categoryName: string;
    brand: string;
    price: number;
    salePrice: number;
    image: string;
    rating: number;
    reviewCount: number;
    stock: number;
    unit: string;
    sold?: number;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();

  const discountPercent =
    product.salePrice < product.price
      ? Math.round(((product.price - product.salePrice) / product.price) * 100)
      : 0;

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="product-card">
      <Link to={`/products/${product.id}`} className="product-card-img-wrap">
        <img src={product.image} alt={product.name} loading="lazy" />
        {discountPercent > 0 && (
          <span className="product-card-badge">-{discountPercent}%</span>
        )}
        {isOutOfStock && (
          <span
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              backgroundColor: '#334155',
              color: '#ffffff',
              zIndex: 2,
            }}
          >
            Hết hàng
          </span>
        )}
      </Link>

      <div className="product-card-body">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="product-card-brand">{product.brand}</span>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>Kho: {product.stock} {product.unit}</span>
        </div>

        <Link to={`/products/${product.id}`} className="product-card-title" title={product.name}>
          {product.name}
        </Link>

        <div className="product-card-rating">
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          <span style={{ fontWeight: 700, color: '#1e293b' }}>{product.rating || 5.0}</span>
          <span style={{ color: '#94a3b8', fontSize: 11 }}>({product.reviewCount || 0})</span>
          {product.sold ? (
            <span style={{ color: '#64748b', fontSize: 11, marginLeft: 'auto' }}>
              Đã bán {product.sold}
            </span>
          ) : null}
        </div>

        <div className="product-card-prices">
          <span className="price-current">{i18n.currency(product.salePrice || product.price)}</span>
          {product.salePrice < product.price && (
            <span className="price-old">{i18n.currency(product.price)}</span>
          )}
        </div>

        <div className="product-card-footer">
          <button
            className="btn-add-cart"
            onClick={(e) => {
              e.preventDefault();
              addToCart(product, 1);
            }}
            disabled={isOutOfStock}
            style={{ opacity: isOutOfStock ? 0.6 : 1, cursor: isOutOfStock ? 'not-allowed' : 'pointer' }}
          >
            <ShoppingCart size={15} />
            <span>{isOutOfStock ? 'Tạm hết' : 'Thêm vào giỏ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
