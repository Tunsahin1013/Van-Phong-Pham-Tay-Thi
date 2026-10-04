import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

export const chatController = {
  // GET /api/chats
  getConversations: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    if (req.user.role === 'CUSTOMER') {
      const conv = dataStore.getOrCreateConversation(req.user.id, req.user.name);
      return res.json({ success: true, data: [conv] });
    }

    // Employee or Admin: all customer conversations
    const convs = dataStore.getConversations();
    return res.json({ success: true, data: convs });
  },

  // POST /api/chats/init
  initConversation: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const conv = dataStore.getOrCreateConversation(req.user.id, req.user.name);
    return res.json({ success: true, data: conv });
  },

  // GET /api/chats/:id/messages
  getMessages: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const messages = dataStore.getChatMessages(id);
    return res.json({ success: true, data: messages });
  },

  // POST /api/chats/:id/messages
  sendMessage: (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
      }

      const { id } = req.params;
      const { message, receiverId } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống' });
      }

      const newMsg = dataStore.sendChatMessage({
        conversationId: id,
        senderId: req.user.id,
        senderName: req.user.name,
        senderRole: req.user.role,
        receiverId: receiverId || 'STAFF',
        message: message.trim(),
      });

      return res.status(201).json({ success: true, data: newMsg });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi gửi tin nhắn: ' + (error as Error).message });
    }
  },

  // PUT /api/chats/:id/read
  markAsRead: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const { id } = req.params;
    const roleType = req.user.role === 'CUSTOMER' ? 'CUSTOMER' : 'STAFF';
    dataStore.markChatMessagesAsRead(id, roleType);

    return res.json({ success: true, message: 'Đã cập nhật trạng thái đọc tin nhắn' });
  },
};
