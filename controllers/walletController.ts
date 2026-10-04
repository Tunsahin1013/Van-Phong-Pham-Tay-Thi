import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

export const walletController = {
  // GET /api/wallet
  getWallet: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const user = dataStore.getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin tài khoản' });
    }

    return res.json({
      success: true,
      data: {
        balance: user.walletBalance || 0,
        loyaltyPoints: user.loyaltyPoints || 0,
      },
    });
  },

  // POST /api/wallet/deposit
  deposit: (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      }

      const { amount, method = 'Nạp tiền QR Ngân hàng / Thẻ ATM' } = req.body;
      const numAmount = Number(amount);

      if (!numAmount || numAmount < 10000) {
        return res.status(400).json({ success: false, message: 'Số tiền nạp tối thiểu là 10.000đ' });
      }

      const result = dataStore.depositWallet(req.user.id, numAmount, method);
      if (!result.success) {
        return res.status(400).json({ success: false, message: 'Không thể nạp tiền vào ví' });
      }

      return res.json({
        success: true,
        message: `Đã nạp thành công +${numAmount.toLocaleString('vi-VN')}đ vào ví Stationery Pay!`,
        newBalance: result.newBalance,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi nạp tiền ví: ' + (error as Error).message });
    }
  },

  // GET /api/wallet/transactions
  getTransactions: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    // Admin sees all or query user, customer sees only theirs
    const isStaff = req.user.role === 'ADMIN' || req.user.role === 'EMPLOYEE';
    const targetUserId = isStaff && req.query.customerId ? (req.query.customerId as string) : isStaff ? undefined : req.user.id;

    const txs = dataStore.getWalletTransactions(targetUserId);
    return res.json({ success: true, data: txs });
  },

  // POST /api/wallet/redeem-points
  redeemPoints: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const { points } = req.body;
    const numPoints = Number(points);

    if (!numPoints || numPoints < 50) {
      return res.status(400).json({ success: false, message: 'Cần tối thiểu 50 điểm để đổi voucher ưu đãi' });
    }

    const result = dataStore.redeemLoyaltyPoints(req.user.id, numPoints);
    if (!result.success) {
      return res.status(400).json({ success: false, message: result.message });
    }

    return res.json({
      success: true,
      message: result.message,
      voucher: result.voucher,
    });
  },
};
