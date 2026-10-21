import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

export const loyaltyController = {
  redeemPoints: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đổi điểm thưởng.' });
    }
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ success: false, message: 'Chỉ tài khoản khách hàng mới được đổi điểm thưởng.' });
    }

    const points = Number(req.body?.points);
    if (![50, 100, 200].includes(points)) {
      return res.status(400).json({ success: false, message: 'Số điểm đổi không hợp lệ. Vui lòng chọn 50, 100 hoặc 200 điểm.' });
    }

    const result = dataStore.redeemLoyaltyPoints(req.user.id, points);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({ success: true, message: result.message, voucher: result.voucher });
  },
};
