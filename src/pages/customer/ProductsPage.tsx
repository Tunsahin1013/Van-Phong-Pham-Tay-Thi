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
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#101010' }}>
            {search ? `Kết quả tìm kiếm cho: "${search}"` : 'Danh Mục Văn Phòng Phẩm'}
          </h1>
          <p style={{ fontSize: 14, color: '#5f5e5e', marginTop: 4 }}>
            Tìm thấy {pagination.total} sản phẩm văn phòng phẩm chính hãng
          </p>
        </div>

        {/* Sort Select */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ArrowUpDown size={16} color="#5f5e5e" />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5f5e5e' }}>Sắp xếp theo:</span>
          <select
            value={sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #E7E8EA',
              backgroundColor: '#ffffff',
              fontSize: 13,
              color: '#101010',
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

      {/* Full-width product layout: sidebar filters moved into a compact toolbar */}
      <div className="tt-products-layout">
        <div className="tt-filter-toolbar">
          <label><span>Danh mục</span><select value={categoryId} onChange={(e) => updateFilter('categoryId', e.target.value)} aria-label="Lọc theo danh mục">
            <option value="all">Tất cả danh mục</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select></label>
          <label><span>Thương hiệu</span><select value={brand} onChange={(e) => updateFilter('brand', e.target.value)} aria-label="Lọc theo thương hiệu">
            <option value="all">Tất cả thương hiệu</option>{brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select></label>
          <label><span>Khoảng giá</span><select value={`${minPrice}|${maxPrice}`} onChange={(e) => {
            const [min, max] = e.target.value.split('|'); const next = new URLSearchParams(searchParams);
            min ? next.set('minPrice', min) : next.delete('minPrice'); max ? next.set('maxPrice', max) : next.delete('maxPrice');
            next.set('page', '1'); setSearchParams(next);
          }} aria-label="Lọc theo khoảng giá">
            <option value="|">Mọi mức giá</option><option value="|50000">Dưới 50.000đ</option><option value="50000|150000">50.000đ – 150.000đ</option><option value="150000|300000">150.000đ – 300.000đ</option><option value="300000|">Trên 300.000đ</option>
          </select></label>
          <label className="tt-stock-filter"><input type="checkbox" checked={inStockOnly} onChange={(e) => updateFilter('inStockOnly', e.target.checked ? 'true' : 'false')} /><span>Còn hàng</span></label>
          {(categoryId !== 'all' || brand !== 'all' || search || minPrice || maxPrice || inStockOnly) && <button className="tt-clear-filters" onClick={clearAllFilters}><X size={14} /> Xóa bộ lọc</button>}
        </div>
        {/* Products Grid Content */}
        <div>
          {loading ? (
            <div style={{ padding: 60, textAlign: 'center', color: '#5f5e5e' }}>
              Đang tải danh sách sản phẩm văn phòng phẩm...
            </div>
          ) : products.length === 0 ? (
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #E2E3E1',
                borderRadius: 12,
                padding: '60px 20px',
                textAlign: 'center',
              }}
            >
              <Search size={48} color="#777B80" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#101010', marginBottom: 8 }}>
                Không tìm thấy sản phẩm phù hợp
              </h3>
              <p style={{ fontSize: 14, color: '#5f5e5e', marginBottom: 20 }}>
                Vui lòng thử tìm kiếm bằng từ khóa khác hoặc xóa bớt các tiêu chí lọc.
              </p>
              <button onClick={clearAllFilters} className="btn-primary">
                Xem Tất Cả Sản Phẩm
              </button>
            </div>
          ) : (
            <>
              <div className="products-grid tt-products-grid">
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
                      border: '1px solid #E7E8EA',
                      backgroundColor: '#ffffff',
                      color: page <= 1 ? '#777B80' : '#101010',
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
                        borderColor: p === page ? 'var(--primary)' : '#E7E8EA',
                        backgroundColor: p === page ? 'var(--primary)' : '#ffffff',
                        color: p === page ? '#ffffff' : '#101010',
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
                      border: '1px solid #E7E8EA',
                      backgroundColor: '#ffffff',
                      color: page >= pagination.totalPages ? '#777B80' : '#101010',
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
