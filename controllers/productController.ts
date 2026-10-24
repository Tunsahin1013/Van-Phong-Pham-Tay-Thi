import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

export const productController = {
  // GET /api/products
  getProducts: (req: AuthRequest, res: Response) => {
    try {
      const {
        search,
        categoryId,
        brand,
        minPrice,
        maxPrice,
        inStockOnly,
        status,
        featured,
        sort,
        page = '1',
        limit = '12',
      } = req.query;

      let list = dataStore.getProducts();

      // Only show ACTIVE to public if status is not explicitly set
      if (status === 'ALL') {
        if (req.user?.role !== 'ADMIN') list = list.filter(p => p.status === 'ACTIVE');
      } else if (!status) {
        list = list.filter(p => p.status === 'ACTIVE');
      } else if (req.user?.role === 'ADMIN') {
        list = list.filter(p => p.status === status);
      } else {
        // Public and non-admin callers never see inactive products, even if they pass ?status=INACTIVE.
        list = list.filter(p => p.status === 'ACTIVE');
      }

      // Search keyword
      if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        list = list.filter(
          p =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.categoryName.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q)
        );
      }

      // Category filter
      if (categoryId && typeof categoryId === 'string' && categoryId !== 'all') {
        list = list.filter(p => p.categoryId === categoryId);
      }

      // Brand filter
      if (brand && typeof brand === 'string' && brand !== 'all') {
        list = list.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
      }

      // Price filter
      if (minPrice) {
        const min = Number(minPrice);
        if (!isNaN(min)) list = list.filter(p => (p.salePrice || p.price) >= min);
      }
      if (maxPrice) {
        const max = Number(maxPrice);
        if (!isNaN(max)) list = list.filter(p => (p.salePrice || p.price) <= max);
      }

      // In-stock only
      if (inStockOnly === 'true') {
        list = list.filter(p => p.stock > 0);
      }

      // Featured
      if (featured === 'true') {
        list = list.filter(p => p.isFeatured);
      }

      // Sort
      if (sort === 'price_asc') {
        list.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
      } else if (sort === 'price_desc') {
        list.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
      } else if (sort === 'best_seller') {
        list.sort((a, b) => (b.sold || 0) - (a.sold || 0));
      } else if (sort === 'rating') {
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      } else {
        // default newest
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      // Pagination
      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 12;
      const total = list.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedItems = list.slice(startIndex, startIndex + limitNum);

      return res.json({
        success: true,
        data: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách sản phẩm: ' + (error as Error).message });
    }
  },

  // GET /api/products/featured
  getFeatured: (_req: Request, res: Response) => {
    const list = dataStore.getProducts().filter(p => p.status === 'ACTIVE' && p.isFeatured);
    return res.json({ success: true, data: list });
  },

  // GET /api/products/best-sellers
  getBestSellers: (_req: Request, res: Response) => {
    const list = [...dataStore.getProducts()]
      .filter(p => p.status === 'ACTIVE')
      .sort((a, b) => (b.sold || 0) - (a.sold || 0))
      .slice(0, 8);
    return res.json({ success: true, data: list });
  },

  // GET /api/products/new-arrivals
  getNewArrivals: (_req: Request, res: Response) => {
    const list = [...dataStore.getProducts()]
      .filter(p => p.status === 'ACTIVE')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);
    return res.json({ success: true, data: list });
  },

  // GET /api/products/:id
  getProductById: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const product = dataStore.getProductById(id);
    if (!product || (product.status !== 'ACTIVE' && req.user?.role !== 'ADMIN')) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm này' });
    }
    return res.json({ success: true, data: product });
  },

  // POST /api/products
  createProduct: (req: Request, res: Response) => {
    try {
      const {
        name,
        code,
        categoryId,
        brand,
        price,
        salePrice,
        unit,
        stock,
        image,
        description,
        specification,
        isFeatured,
        isNewArrival,
        isBestSeller,
        minStock,
      } = req.body;

      if (!name || !code || !categoryId || !brand || price === undefined) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc của sản phẩm' });
      }

      const normalizedStock = stock === undefined || stock === null || stock === '' ? 0 : Number(stock);
      if (!Number.isInteger(normalizedStock) || normalizedStock < 0) {
        return res.status(400).json({ success: false, message: 'Tồn kho phải là số nguyên không âm.' });
      }
      const normalizedMinStock = minStock === undefined || minStock === null || minStock === '' ? 10 : Number(minStock);
      if (!Number.isInteger(normalizedMinStock) || normalizedMinStock < 0) {
        return res.status(400).json({ success: false, message: 'Ngưỡng tồn kho phải là số nguyên không âm.' });
      }

      // Check category
      const category = dataStore.getCategoryById(categoryId);
      if (!category) {
        return res.status(400).json({ success: false, message: 'Danh mục sản phẩm không tồn tại' });
      }

      const newProduct = dataStore.createProduct({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        categoryId,
        categoryName: category.name,
        brand: brand.trim(),
        price: Number(price),
        salePrice: salePrice ? Number(salePrice) : Number(price),
        unit: unit || 'Cái',
        stock: normalizedStock,
        image: image || 'https://images.unsplash.com/photo-1585336261026-0a6eb9df69b8?auto=format&fit=crop&w=800&q=80',
        description: description || '',
        specification: specification || '',
        status: 'ACTIVE',
        minStock: normalizedMinStock,
        isFeatured: Boolean(isFeatured),
        isNewArrival: Boolean(isNewArrival),
        isBestSeller: Boolean(isBestSeller),
      });

      return res.status(201).json({ success: true, message: 'Thêm sản phẩm mới thành công', data: newProduct });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi khi tạo sản phẩm: ' + (error as Error).message });
    }
  },


  // PATCH /api/products/:id/status (Admin only)
  updateStatus: (req: Request, res: Response) => {
    const { status } = req.body;
    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái kinh doanh không hợp lệ.' });
    }
    const product = dataStore.getProductById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    const updated = dataStore.updateProduct(req.params.id, { status });
    return res.json({ success: true, message: status === 'ACTIVE' ? 'Đã bật kinh doanh sản phẩm.' : 'Đã tạm ẩn sản phẩm khỏi cửa hàng.', data: updated });
  },

  // PUT /api/products/:id
  updateProduct: (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates = { ...req.body };

      // US15: business visibility is controlled only by Admin, even if an Employee calls PUT directly.
      if (updates.status !== undefined) {
        if (req.user?.role !== 'ADMIN') {
          return res.status(403).json({ success: false, message: 'Chỉ quản trị viên mới được bật/tắt trạng thái kinh doanh.' });
        }
        if (!['ACTIVE', 'INACTIVE'].includes(updates.status)) {
          return res.status(400).json({ success: false, message: 'Trạng thái kinh doanh không hợp lệ.' });
        }
      }

      // Only accept fields supported by this form; never allow clients to overwrite counters/IDs.
      const allowedFields = ['name', 'code', 'categoryId', 'categoryName', 'brand', 'price', 'salePrice', 'unit', 'stock', 'image', 'description', 'specification', 'isFeatured', 'isNewArrival', 'isBestSeller', 'status', 'minStock'];
      for (const key of Object.keys(updates)) if (!allowedFields.includes(key)) delete updates[key];

      if (updates.categoryId) {
        const cat = dataStore.getCategoryById(updates.categoryId);
        if (cat) updates.categoryName = cat.name;
      }

      if (updates.stock !== undefined) {
        const newStock = Number(updates.stock);
        const currentProduct = dataStore.getProductById(id);
        if (!currentProduct) return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật' });
        if (!Number.isInteger(newStock) || newStock < 0) return res.status(400).json({ success: false, message: 'Tồn kho phải là số nguyên không âm.' });
        const difference = newStock - currentProduct.stock;
        delete updates.stock;
        if (difference !== 0) {
          const stockUpdated = dataStore.recordStockAdjustment(id, difference, 'Điều chỉnh tồn kho từ màn hình quản lý sản phẩm', req.user?.name || 'Quản trị viên');
          if (!stockUpdated) return res.status(404).json({ success: false, message: 'Không thể cập nhật tồn kho.' });
        }
      }
      if (updates.minStock !== undefined) {
        const minStock = Number(updates.minStock);
        if (!Number.isInteger(minStock) || minStock < 0) return res.status(400).json({ success: false, message: 'Ngưỡng tồn kho phải là số nguyên không âm.' });
        updates.minStock = minStock;
      }
      const updated = dataStore.updateProduct(id, updates);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để cập nhật' });
      }

      return res.json({ success: true, message: 'Cập nhật thông tin sản phẩm thành công', data: updated });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi cập nhật sản phẩm: ' + (error as Error).message });
    }
  },

  // DELETE /api/products/:id
  deleteProduct: (req: Request, res: Response) => {
    const { id } = req.params;
    const ok = dataStore.deleteProduct(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm để xóa' });
    }
    return res.json({ success: true, message: 'Đã xóa sản phẩm thành công' });
  },
};
