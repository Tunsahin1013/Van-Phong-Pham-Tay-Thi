import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore.ts';

export const voucherController = {
  // GET /api/vouchers
  getVouchers: (req: Request, res: Response) => {
    const { all } = req.query;
    let list = dataStore.getVouchers();
    if (all !== 'true') {
      const now = new Date();
      list = list.filter(v => v.status === 'ACTIVE' && new Date(v.endDate) >= now);
    }
    return res.json({ success: true, data: list });
  },

  // POST /api/vouchers/validate
  validateVoucher: (req: Request, res: Response) => {
    const { code, orderAmount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
    }

    const voucher = dataStore.getVoucherByCode(code);
    if (!voucher) {
      return res.status(404).json({ success: false, message: 'Mã ưu đãi không tồn tại' });
    }

    if (voucher.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Mã ưu đãi hiện đang bị tạm khóa' });
    }

    const now = new Date();
    if (new Date(voucher.endDate) < now) {
      return res.status(400).json({ success: false, message: 'Mã ưu đãi đã hết hạn sử dụng' });
    }

    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã ưu đãi đã hết lượt áp dụng' });
    }

    const subtotal = Number(orderAmount) || 0;
    if (subtotal < voucher.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${voucher.minimumOrder.toLocaleString('vi-VN')}đ để sử dụng voucher này (Hiện tại: ${subtotal.toLocaleString('vi-VN')}đ)`,
      });
    }

    let discount = 0;
    if (voucher.type === 'PERCENTAGE') {
      discount = Math.round((subtotal * voucher.value) / 100);
      if (voucher.maximumDiscount > 0 && discount > voucher.maximumDiscount) {
        discount = voucher.maximumDiscount;
      }
    } else {
      discount = Math.min(voucher.value, subtotal);
    }

    return res.json({
      success: true,
      message: 'Áp dụng mã ưu đãi thành công!',
      data: {
        code: voucher.code,
        name: voucher.name,
        discount,
        voucher,
      },
    });
  },

  // POST /api/vouchers
  createVoucher: (req: Request, res: Response) => {
    try {
      const { code, name, type, value, minimumOrder, maximumDiscount, startDate, endDate, usageLimit } = req.body;

      if (!code || !name || !type || value === undefined || !endDate) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền các trường bắt buộc của voucher' });
      }

      const existing = dataStore.getVoucherByCode(code);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Mã voucher này đã tồn tại trong hệ thống' });
      }

      const newVoucher = dataStore.createVoucher({
        code,
        name,
        type,
        value: Number(value),
        minimumOrder: Number(minimumOrder) || 0,
        maximumDiscount: Number(maximumDiscount) || 0,
        startDate: startDate || new Date().toISOString(),
        endDate,
        usageLimit: Number(usageLimit) || 100,
        status: 'ACTIVE',
      });

      return res.status(201).json({ success: true, message: 'Tạo mã ưu đãi thành công', data: newVoucher });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi tạo voucher: ' + (error as Error).message });
    }
  },

  // PUT /api/vouchers/:id
  updateVoucher: (req: Request, res: Response) => {
    const { id } = req.params;
    const updated = dataStore.updateVoucher(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
    }
    return res.json({ success: true, message: 'Cập nhật voucher thành công', data: updated });
  },

  // DELETE /api/vouchers/:id
  deleteVoucher: (req: Request, res: Response) => {
    const { id } = req.params;
    const ok = dataStore.deleteVoucher(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy voucher để xóa' });
    }
    return res.json({ success: true, message: 'Đã xóa voucher thành công' });
  },
};
