import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dataStore } from '../services/dataStore.ts';
import { generateToken, AuthRequest } from '../middleware/auth.ts';

export const authController = {
  // POST /api/auth/register
  register: (req: Request, res: Response) => {
    try {
      const { name, email, password, phone, address } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu' });
      }

      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có tối thiểu 6 ký tự' });
      }

      const existingUser = dataStore.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email này đã được đăng ký tài khoản' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = dataStore.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'CUSTOMER',
        phone: phone || '',
        address: address || '',
        status: 'ACTIVE',
        loyaltyPoints: 0,
        walletBalance: 0,
      });

      // Welcome notification
      dataStore.createNotification({
        userId: newUser.id,
        title: 'Chào mừng bạn đến với Stationery Shop! 🎒',
        message: 'Tài khoản của bạn đã được khởi tạo thành công. Sử dụng mã WELCOME50 để nhận ưu đãi 50K cho đơn hàng đầu tiên!',
        type: 'SYSTEM',
        link: '/products',
      });

      const token = generateToken(newUser);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userSafe } = newUser;

      return res.status(201).json({
        success: true,
        message: 'Đăng ký tài khoản thành công',
        token,
        user: userSafe,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký: ' + (error as Error).message });
    }
  },

  // POST /api/auth/login
  login: (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email và mật khẩu' });
      }

      const user = dataStore.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      }

      if (user.status === 'INACTIVE') {
        return res.status(403).json({ success: false, message: 'Tài khoản đã bị tạm khóa bởi quản trị viên' });
      }

      const isMatch = bcrypt.compareSync(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Email hoặc mật khẩu không chính xác' });
      }

      const token = generateToken(user);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userSafe } = user;

      return res.json({
        success: true,
        message: 'Đăng nhập thành công',
        token,
        user: userSafe,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi server khi đăng nhập: ' + (error as Error).message });
    }
  },

  // POST /api/auth/logout
  logout: (_req: Request, res: Response) => {
    return res.json({ success: true, message: 'Đăng xuất thành công' });
  },

  // GET /api/auth/me
  getMe: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userSafe } = req.user;
    return res.json({ success: true, user: userSafe });
  },

  // POST /api/auth/forgot-password
  forgotPassword: (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email đã đăng ký' });
    }

    const user = dataStore.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này' });
    }

    // Reset password to default 123456 for convenience in test/demo
    const newHash = bcrypt.hashSync('123456', 10);
    dataStore.updateUser(user.id, { password: newHash });

    dataStore.createNotification({
      userId: user.id,
      title: 'Mật khẩu đã được cấp lại 🔑',
      message: 'Mật khẩu tài khoản của bạn đã được khôi phục về mặc định: 123456. Vui lòng đổi lại mật khẩu sau khi đăng nhập!',
      type: 'SYSTEM',
    });

    return res.json({
      success: true,
      message: 'Hướng dẫn khôi phục mật khẩu đã được gửi. Mật khẩu tạm thời đã đặt về: 123456',
    });
  },

  // POST /api/auth/change-password
  changePassword: (req: AuthRequest, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu hiện tại và mật khẩu mới' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    dataStore.updateUser(req.user.id, { password: newHash });

    return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  },

  // PUT /api/auth/profile
  updateProfile: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const { name, phone, address, avatar } = req.body;
    const updated = dataStore.updateUser(req.user.id, {
      name: name ?? req.user.name,
      phone: phone ?? req.user.phone,
      address: address ?? req.user.address,
      avatar: avatar ?? req.user.avatar,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không thể cập nhật thông tin' });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userSafe } = updated;
    return res.json({ success: true, message: 'Cập nhật thông tin thành công', user: userSafe });
  },
};
