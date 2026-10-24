import { Request, Response } from 'express';
import { dataStore } from '../services/dataStore.ts';
import { VoucherItem } from '../data/seedData.ts';

const isValidDate = (value: unknown): value is string | Date => {
  if (!(typeof value === 'string' || value instanceof Date)) return false;
  return !Number.isNaN(new Date(value).getTime());
};

const validateVoucherValues = (voucher: Partial<VoucherItem>) => {
  const errors: string[] = [];
  const code = String(voucher.code ?? '').trim();
  const name = String(voucher.name ?? '').trim();
  const type = voucher.type;
  const value = Number(voucher.value);
  const minimumOrder = Number(voucher.minimumOrder ?? 0);
  const maximumDiscount = Number(voucher.maximumDiscount ?? 0);
  const usageLimit = Number(voucher.usageLimit ?? 100);
  const startDate = voucher.startDate;
  const endDate = voucher.endDate;

  if (!code) errors.push('Vui lòng nhập mã voucher');
  if (code.length > 40 || (code && !/^[A-Za-z0-9_-]+$/.test(code))) errors.push('Mã voucher chỉ được gồm chữ, số, dấu gạch ngang hoặc gạch dưới (tối đa 40 ký tự)');
  if (!name) errors.push('Vui lòng nhập tên chương trình');
  if (!['PERCENTAGE', 'FIXED'].includes(String(type))) errors.push('Loại giảm giá không hợp lệ');
  if (!Number.isFinite(value) || value <= 0) errors.push('Giá trị giảm phải lớn hơn 0');
  if (type === 'PERCENTAGE' && value > 100) errors.push('Mức giảm theo phần trăm không được vượt quá 100%');
  if (!Number.isFinite(minimumOrder) || minimumOrder < 0) errors.push('Đơn hàng tối thiểu không được âm');
  if (!Number.isFinite(maximumDiscount) || maximumDiscount < 0) errors.push('Mức giảm tối đa không được âm');
  if (!Number.isFinite(usageLimit) || usageLimit < 0 || !Number.isInteger(usageLimit)) errors.push('Lượt sử dụng phải là số nguyên không âm; 0 nghĩa là không giới hạn');
  if (!isValidDate(startDate)) errors.push('Ngày bắt đầu không hợp lệ');
  if (!isValidDate(endDate)) errors.push('Ngày kết thúc không hợp lệ');
  if (isValidDate(startDate) && isValidDate(endDate) && new Date(endDate).getTime() <= new Date(startDate).getTime()) {
    errors.push('Ngày kết thúc phải sau ngày bắt đầu');
  }

  return errors;
};

const calculateDiscount = (voucher: VoucherItem, subtotal: number) => {
  if (voucher.type === 'PERCENTAGE') {
    const rawDiscount = Math.round((subtotal * voucher.value) / 100);
    return voucher.maximumDiscount > 0 ? Math.min(rawDiscount, voucher.maximumDiscount) : rawDiscount;
  }
  return Math.min(voucher.value, subtotal);
};

export const voucherController = {
  // GET /api/vouchers
  getVouchers: (req: Request, res: Response) => {
    const { all } = req.query;
    let list = dataStore.getVouchers();
    if (all !== 'true') {
      const now = Date.now();
      list = list.filter(v =>
        v.status === 'ACTIVE' &&
        new Date(v.startDate).getTime() <= now &&
        new Date(v.endDate).getTime() >= now &&
        (Number(v.usageLimit) <= 0 || Number(v.usedCount) < Number(v.usageLimit))
      );
    }
    return res.json({ success: true, data: list });
  },

  // POST /api/vouchers/validate
  validateVoucher: (req: Request, res: Response) => {
    const code = String(req.body?.code ?? '').trim().toUpperCase();
    const subtotal = Number(req.body?.orderAmount);
    if (!code) return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
    if (!Number.isFinite(subtotal) || subtotal < 0) {
      return res.status(400).json({ success: false, message: 'Giá trị đơn hàng không hợp lệ' });
    }

    const voucher = dataStore.getVoucherByCode(code);
    if (!voucher) return res.status(404).json({ success: false, message: 'Mã ưu đãi không tồn tại' });
    if (voucher.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Mã ưu đãi hiện đang bị tạm khóa' });
    }

    const now = Date.now();
    const startsAt = new Date(voucher.startDate).getTime();
    const endsAt = new Date(voucher.endDate).getTime();
    if (Number.isNaN(startsAt) || now < startsAt) {
      return res.status(400).json({ success: false, message: 'Mã ưu đãi chưa đến thời gian sử dụng' });
    }
    if (Number.isNaN(endsAt) || endsAt < now) {
      return res.status(400).json({ success: false, message: 'Mã ưu đãi đã hết hạn sử dụng' });
    }
    if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
      return res.status(400).json({ success: false, message: 'Mã ưu đãi đã hết lượt áp dụng' });
    }
    if (subtotal < voucher.minimumOrder) {
      return res.status(400).json({
        success: false,
        message: `Đơn hàng tối thiểu ${voucher.minimumOrder.toLocaleString('vi-VN')}đ để sử dụng voucher này (Hiện tại: ${subtotal.toLocaleString('vi-VN')}đ)`,
      });
    }

    const discount = calculateDiscount(voucher, subtotal);
    return res.json({
      success: true,
      message: 'Áp dụng mã ưu đãi thành công!',
      data: { code: voucher.code, name: voucher.name, discount, voucher },
    });
  },

  // POST /api/vouchers (Admin only via route middleware)
  createVoucher: (req: Request, res: Response) => {
    try {
      const body = req.body ?? {};
      const payload: Partial<VoucherItem> = {
        code: String(body.code ?? '').trim().toUpperCase(),
        name: String(body.name ?? '').trim(),
        type: body.type,
        value: Number(body.value),
        minimumOrder: Number(body.minimumOrder ?? 0),
        maximumDiscount: Number(body.maximumDiscount ?? 0),
        startDate: body.startDate,
        endDate: body.endDate,
        usageLimit: body.usageLimit === '' || body.usageLimit === undefined ? 100 : Number(body.usageLimit),
        status: body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE',
      };
      const errors = validateVoucherValues(payload);
      if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });
      if (dataStore.getVoucherByCode(payload.code!)) {
        return res.status(409).json({ success: false, message: 'Mã voucher này đã tồn tại trong hệ thống' });
      }

      const newVoucher = dataStore.createVoucher({
        code: payload.code!, name: payload.name!, type: payload.type!, value: payload.value!,
        minimumOrder: payload.minimumOrder!, maximumDiscount: payload.maximumDiscount!,
        startDate: new Date(payload.startDate!).toISOString(), endDate: new Date(payload.endDate!).toISOString(),
        usageLimit: payload.usageLimit!, status: payload.status!,
      });

      // US41: only publish a customer notification for a voucher that is active.
      if (newVoucher.status === 'ACTIVE') {
        const startsAt = new Date(newVoucher.startDate).getTime();
        const startLabel = startsAt > Date.now()
          ? `Bắt đầu từ ${new Date(newVoucher.startDate).toLocaleString('vi-VN')}. `
          : '';
        dataStore.createNotification({
          userId: 'ALL',
          title: `Voucher mới: ${newVoucher.code}`,
          message: `${newVoucher.name}. ${newVoucher.type === 'PERCENTAGE' ? `Giảm ${newVoucher.value}%` : `Giảm ${newVoucher.value.toLocaleString('vi-VN')}đ`}. ${newVoucher.minimumOrder > 0 ? `Đơn tối thiểu ${newVoucher.minimumOrder.toLocaleString('vi-VN')}đ. ` : ''}${startLabel}Hạn dùng đến ${new Date(newVoucher.endDate).toLocaleDateString('vi-VN')}.`,
          type: 'VOUCHER',
          link: '/vouchers',
        });
      }

      return res.status(201).json({ success: true, message: newVoucher.status === 'ACTIVE' ? 'Tạo voucher thành công và đã gửi thông báo tới khách hàng' : 'Tạo voucher nháp/tạm khóa thành công', data: newVoucher });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi tạo voucher: ' + (error as Error).message });
    }
  },

  // PUT /api/vouchers/:id
  updateVoucher: (req: Request, res: Response) => {
    const { id } = req.params;
    const current = dataStore.getVouchers().find(v => v.id === id);
    if (!current) return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });

    const body = req.body ?? {};
    const allowed: Partial<VoucherItem> = {};
    if (body.code !== undefined) allowed.code = String(body.code).trim().toUpperCase();
    if (body.name !== undefined) allowed.name = String(body.name).trim();
    if (body.type !== undefined) allowed.type = body.type;
    if (body.value !== undefined) allowed.value = Number(body.value);
    if (body.minimumOrder !== undefined) allowed.minimumOrder = Number(body.minimumOrder);
    if (body.maximumDiscount !== undefined) allowed.maximumDiscount = Number(body.maximumDiscount);
    if (body.startDate !== undefined) allowed.startDate = body.startDate;
    if (body.endDate !== undefined) allowed.endDate = body.endDate;
    if (body.usageLimit !== undefined) allowed.usageLimit = Number(body.usageLimit);
    if (body.status !== undefined) allowed.status = body.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

    const merged = { ...current, ...allowed };
    const errors = validateVoucherValues(merged);
    if (errors.length) return res.status(400).json({ success: false, message: errors.join('. ') });
    if (merged.code !== current.code && dataStore.getVoucherByCode(merged.code!) ) {
      return res.status(409).json({ success: false, message: 'Mã voucher này đã tồn tại trong hệ thống' });
    }
    if (merged.usageLimit > 0 && merged.usageLimit < current.usedCount) {
      return res.status(400).json({ success: false, message: 'Lượt sử dụng mới không được nhỏ hơn số lượt đã sử dụng' });
    }

    if (body.startDate !== undefined) allowed.startDate = new Date(body.startDate).toISOString();
    if (body.endDate !== undefined) allowed.endDate = new Date(body.endDate).toISOString();
    if (body.endDate !== undefined && String(body.endDate) !== String(current.endDate)) allowed.expiryNoticeSentAt = undefined;

    const updated = dataStore.updateVoucher(id, allowed);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy voucher' });
    return res.json({ success: true, message: 'Cập nhật voucher thành công', data: updated });
  },

  // DELETE /api/vouchers/:id
  deleteVoucher: (req: Request, res: Response) => {
    const { id } = req.params;
    const ok = dataStore.deleteVoucher(id);
    if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy voucher để xóa' });
    return res.json({ success: true, message: 'Đã xóa voucher thành công' });
  },
};
