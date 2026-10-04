import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

export const notificationController = {
  // GET /api/notifications
  getNotifications: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

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
