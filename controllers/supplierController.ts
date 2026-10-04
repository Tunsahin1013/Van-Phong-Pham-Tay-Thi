import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore.ts';

export const supplierController = {
  // GET /api/suppliers
  getSuppliers: (_req: Request, res: Response) => {
    const list = dataStore.getSuppliers();
    return res.json({ success: true, data: list });
  },

  // POST /api/suppliers
  createSupplier: (req: Request, res: Response) => {
    try {
      const { name, code, contactPerson, phone, email, address } = req.body;
      if (!name || !code) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và mã nhà cung cấp' });
      }

      const newSup = dataStore.createSupplier({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        contactPerson: contactPerson || '',
        phone: phone || '',
        email: email || '',
        address: address || '',
        status: 'ACTIVE',
      });

      return res.status(201).json({ success: true, message: 'Thêm nhà cung cấp thành công', data: newSup });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi tạo nhà cung cấp: ' + (error as Error).message });
    }
  },

  // PUT /api/suppliers/:id
  updateSupplier: (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = dataStore.updateSupplier(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp' });
    }
    return res.json({ success: true, message: 'Cập nhật nhà cung cấp thành công', data: updated });
  },

  // DELETE /api/suppliers/:id
  deleteSupplier: (req: Request, res: Response) => {
    const { id } = req.params;
    const ok = dataStore.deleteSupplier(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy nhà cung cấp để xóa' });
    }
    return res.json({ success: true, message: 'Đã xóa nhà cung cấp thành công' });
  },
};
