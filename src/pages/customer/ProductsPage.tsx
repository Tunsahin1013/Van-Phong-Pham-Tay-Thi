import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ArrowUpDown, X, Check, Search } from 'lucide-react';
import { productsAPI, categoriesAPI } from '../../api.ts';
import { ProductCard } from '../../components/ProductCard.tsx';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);

  // Filters state from URL query
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') || 'all';
  const brand = searchParams.get('brand') || 'all';
  const sort = searchParams.get('sort') || 'newest';
  const inStockOnly = searchParams.get('inStockOnly') === 'true';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const brands = ['Thiên Long', 'Double A', 'Deli', 'Campus', 'Pentel', 'Plus', 'Hồng Hà', 'Staedtler', 'Klaw', 'Bến Nghé'];

  useEffect(() => {
    async function loadCategories() {
      try {
        const res = await categoriesAPI.getAll();
        if (res.success) setCategories(res.data);
      } catch (err) {
        console.error('Failed to load categories', err);
      }
    }
    loadCategories();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);
        const params: Record<string, any> = {
          page,
          limit: 12,
          sort,
        };
        if (search) params.search = search;
        if (categoryId && categoryId !== 'all') params.categoryId = categoryId;
        if (brand && brand !== 'all') params.brand = brand;
        if (inStockOnly) params.inStockOnly = 'true';
        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;

        const res = await productsAPI.getAll(params);
        if (res.success) {
          setProducts(res.data);
          setPagination(res.pagination);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [searchParams, search, categoryId, brand, sort, inStockOnly, minPrice, maxPrice, page]);

  const updateFilter = (key: string, value: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (!value || value === 'all' || value === 'false') {
      nextParams.delete(key);
    } else {
      nextParams.set(key, value);
    }
    nextParams.set('page', '1'); // reset page on filter change
    setSearchParams(nextParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('page', newPage.toString());
    setSearchParams(nextParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container" style={{ padding: '32px 20px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
            {search ? `Kết quả tìm kiếm cho: "${search}"` : 'Danh Mục Văn Phòng Phẩm'}
          </h1>
          <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>
            Tìm thấy {pagination.total} sản phẩm văn phòng phẩm chính hãng
          </p>
        </div>

        {/* Sort Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowUpDown size={16} color="#64748b" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Sắp xếp theo:</span>
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
              fontSize: 13,
              color: '#1e293b',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="newest">Mới nhất</option>
            <option value="best_seller">Bán chạy nhất</option>
            <option value="price_asc">Giá: Thấp đến Cao</option>
            <option value="price_desc">Giá: Cao đến Thấp</option>
            <option value="rating">Đánh giá cao nhất</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Sidebar & Products Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Sidebar Filters */}
        <aside style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 15 }}>
              <Filter size={18} color="var(--primary)" />
              <span>Bộ Lọc Tìm Kiếm</span>
            </div>
            {(categoryId !== 'all' || brand !== 'all' || search || minPrice || inStockOnly) && (
              <button
                onClick={clearAllFilters}
                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
              >
                Xóa tất cả
              </button>
            )}
          </div>

          {/* Categories Filter */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Danh mục sản phẩm</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              <div
                onClick={() => updateFilter('categoryId', 'all')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: categoryId === 'all' ? 700 : 500,
                  backgroundColor: categoryId === 'all' ? 'var(--primary-light)' : 'transparent',
                  color: categoryId === 'all' ? 'var(--primary)' : '#475569',
                  cursor: 'pointer',
                }}
              >
                Tất cả danh mục
              </div>
              {categories.map((c) => (
                <div
                  key={c.id}
                  onClick={() => updateFilter('categoryId', c.id)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: categoryId === c.id ? 700 : 500,
                    backgroundColor: categoryId === c.id ? 'var(--primary-light)' : 'transparent',
                    color: categoryId === c.id ? 'var(--primary)' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {c.name}
                </div>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Thương hiệu</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div
                onClick={() => updateFilter('brand', 'all')}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: brand === 'all' ? 700 : 500,
                  backgroundColor: brand === 'all' ? 'var(--primary-light)' : 'transparent',
                  color: brand === 'all' ? 'var(--primary)' : '#475569',
                  cursor: 'pointer',
                }}
              >
                Tất cả thương hiệu
              </div>
              {brands.map((b) => (
                <div
                  key={b}
                  onClick={() => updateFilter('brand', b)}
                  style={{
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: brand.toLowerCase() === b.toLowerCase() ? 700 : 500,
                    backgroundColor: brand.toLowerCase() === b.toLowerCase() ? 'var(--primary-light)' : 'transparent',
                    color: brand.toLowerCase() === b.toLowerCase() ? 'var(--primary)' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>Khoảng giá</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
              {[
                { label: 'Dưới 50.000đ', min: '', max: '50000' },
                { label: 'Từ 50.000đ - 150.000đ', min: '50000', max: '150000' },
                { label: 'Từ 150.000đ - 300.000đ', min: '150000', max: '300000' },
                { label: 'Trên 300.000đ', min: '300000', max: '' },
              ].map((range, idx) => {
                const isActive = minPrice === range.min && maxPrice === range.max;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      if (range.min) next.set('minPrice', range.min);
                      else next.delete('minPrice');
                      if (range.max) next.set('maxPrice', range.max);
                      else next.delete('maxPrice');
                      next.set('page', '1');
                      setSearchParams(next);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                      color: isActive ? 'var(--primary)' : '#475569',
                      fontWeight: isActive ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {range.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* In stock only toggle */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#334155', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => updateFilter('inStockOnly', e.target.checked ? 'true' : 'false')}
              />
              <span>Chỉ hiện sản phẩm còn hàng</span>
            </label>
          </div>
        </aside>

        {/* Products Grid Content */}
        <div>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#64748b' }}>
              Đang tải danh sách sản phẩm văn phòng phẩm...
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <Search size={48} color="#94a3b8" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', marginBottom: 8 }}>
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>
                Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa bớt các tiêu chí lọc.
              </p>
              <button onClick={clearAllFilters} className="btn-primary">
                Xem Tất Cả Sản Phẩm
              </button>
            </div>
          ) : (
            <>
              <div className="products-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                {products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 32 }}>
                  <button
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: page <= 1 ? '#94a3b8' : '#1e293b',
                      cursor: page <= 1 ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Trang trước
                  </button>
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 6,
                        border: '1px solid',
                        borderColor: p === page ? 'var(--primary)' : '#cbd5e1',
                        backgroundColor: p === page ? 'var(--primary)' : '#ffffff',
                        color: p === page ? '#ffffff' : '#1e293b',
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: 'pointer',
                      }}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => handlePageChange(page + 1)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 6,
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: page >= pagination.totalPages ? '#94a3b8' : '#1e293b',
                      cursor: page >= pagination.totalPages ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Trang sau
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
