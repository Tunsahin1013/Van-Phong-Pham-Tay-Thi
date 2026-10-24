import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';
import { VoucherItem } from '../data/seedData.ts';

const publishExpiringVoucherNotifications = () => {
  const now = Date.now();
  const threeDaysMs = 3 * 24 * 60 * 60 * 1000;

  dataStore.getVouchers().forEach((voucher: VoucherItem) => {
    const startsAt = new Date(voucher.startDate).getTime();
    const endsAt = new Date(voucher.endDate).getTime();
    const remaining = endsAt - now;
    const availableUses = voucher.usageLimit <= 0 || voucher.usedCount < voucher.usageLimit;
    if (voucher.status !== 'ACTIVE' || !Number.isFinite(startsAt) || !Number.isFinite(endsAt) || startsAt > now || remaining <= 0 || remaining > threeDaysMs || !availableUses || voucher.expiryNoticeSentAt) return;

    // Mark first so repeated polling doesn't broadcast duplicate notices.
    dataStore.updateVoucher(voucher.id, { expiryNoticeSentAt: new Date(now).toISOString() });
    dataStore.createNotification({
      userId: 'ALL',
      title: `Voucher ${voucher.code} sắp hết hạn`,
      message: `${voucher.name} sẽ hết hạn vào ${new Date(voucher.endDate).toLocaleDateString('vi-VN')}. Hãy sử dụng trước khi hết hạn.`,
      type: 'VOUCHER',
      link: '/vouchers',
    });
  });
};

export const notificationController = {
  // GET /api/notifications
  getNotifications: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    // US41: lazily evaluate expiry notices whenever an authenticated customer refreshes notifications.
    publishExpiringVoucherNotifications();
    const notifs = dataStore.getNotifications(req.user.id);
    const unreadCount = notifs.filter(n => !n.isRead).length;

    return res.json({
      success: true,
      data: notifs,
      unreadCount,
    });
  },

  // PUT /api/notifications/:id/read
  markAsRead: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const ok = dataStore.markNotificationAsRead(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
    }
    return res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
  },

  // PUT /api/notifications/read-all
  markAllAsRead: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    dataStore.markAllNotificationsAsRead(req.user.id);
    return res.json({ success: true, message: 'Đã đánh dấu đọc tất cả thông báo' });
  },

  // POST /api/notifications (Admin broadcast)
  createNotification: (req: AuthRequest, res: Response) => {
    const { userId = 'ALL', title, message, type = 'SYSTEM', link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tiêu đề và nội dung thông báo' });
    }

    const notif = dataStore.createNotification({
      userId,
      title,
      message,
      type,
      link,
    });

    return res.status(201).json({ success: true, message: 'Đã gửi thông báo thành công', data: notif });
  },
};
