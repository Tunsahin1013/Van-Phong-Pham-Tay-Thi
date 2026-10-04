import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore.ts';

export const categoryController = {
  // GET /api/categories
  getCategories: (_req: Request, res: Response) => {
    const list = dataStore.getCategories();
    return res.json({ success: true, data: list });
  },

  // GET /api/categories/:id
  getCategoryById: (req: Request, res: Response) => {
    const { id } = req.params;
    const cat = dataStore.getCategoryById(id);
    if (!cat) {
      return res.status(404).json({ success: false, message: 'Danh mục không tồn tại' });
    }
    return res.json({ success: true, data: cat });
  },

  // POST /api/categories
  createCategory: (req: Request, res: Response) => {
    try {
      const { name, code, description, iconName, displayOrder } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và mã danh mục' });
      }

      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const newCat = dataStore.createCategory({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        slug,
        description: description || '',
        iconName: iconName || 'Folder',
        status: 'ACTIVE',
        displayOrder: Number(displayOrder) || 0,
      });

      return res.status(201).json({ success: true, message: 'Tạo danh mục mới thành công', data: newCat });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi tạo danh mục: ' + (error as Error).message });
    }
  },

  // PUT /api/categories/:id
  updateCategory: (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = req.body;

    if (updates.name && !updates.slug) {
      updates.slug = updates.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, 'd')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    const updated = dataStore.updateCategory(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    return res.json({ success: true, message: 'Cập nhật danh mục thành công', data: updated });
  },

  // DELETE /api/categories/:id
  deleteCategory: (req: Request, res: Response) => {
    const { id } = req.params;
    // Check if products exist in category
    const hasProducts = dataStore.getProducts().some(p => p.categoryId === id);
    if (hasProducts) {
      return res.status(400).json({
        success: false,
        message: 'Không thể xóa danh mục đang có sản phẩm. Vui lòng chuyển hoặc xóa sản phẩm trước.',
      });
    }

    const ok = dataStore.deleteCategory(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }
    return res.json({ success: true, message: 'Đã xóa danh mục thành công' });
  },
};
