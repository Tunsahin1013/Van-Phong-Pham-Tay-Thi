import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'node:crypto';
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
      const { password: _, walletBalance: _legacyWalletBalance, passwordResetTokenHash: _resetHash, passwordResetExpiresAt: _resetExpires, ...userSafe } = newUser;

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
      const { password: _, walletBalance: _legacyWalletBalance, passwordResetTokenHash: _resetHash, passwordResetExpiresAt: _resetExpires, ...userSafe } = user;

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
    const { password: _, walletBalance: _legacyWalletBalance, passwordResetTokenHash: _resetHash, passwordResetExpiresAt: _resetExpires, ...userSafe } = req.user;
    return res.json({ success: true, user: userSafe });
  },

  // POST /api/auth/forgot-password. Always return the same public message to avoid account enumeration.
  forgotPassword: async (req: Request, res: Response) => {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!email) return res.status(400).json({ success: false, message: 'Vui lòng nhập email đã đăng ký.' });

    const genericMessage = 'Nếu email tồn tại, hướng dẫn khôi phục mật khẩu sẽ được gửi đến hộp thư của bạn.';
    const user = dataStore.getUserByEmail(email);
    if (!user) return res.json({ success: true, message: genericMessage });

    try {
      const rawToken = randomBytes(32).toString('hex');
      const tokenHash = createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      dataStore.updateUser(user.id, { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt });
      const appUrl = (process.env.APP_URL || 'http://localhost:3000').replace(/\/$/, '');
      const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;
      const apiKey = process.env.RESEND_API_KEY;
      const from = process.env.EMAIL_FROM;

      if (apiKey && from) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from,
            to: [user.email],
            subject: 'Khôi phục mật khẩu Tây Thi',
            html: `<p>Xin chào ${user.name.replace(/[&<>"']/g, '')},</p><p>Nhấn liên kết dưới đây để đặt mật khẩu mới. Liên kết hết hạn sau 15 phút.</p><p><a href="${resetUrl}">Khôi phục mật khẩu</a></p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
          }),
        });
        if (!emailResponse.ok) console.error('Email reset could not be sent:', await emailResponse.text());
        return res.json({ success: true, message: genericMessage });
      }

      // Local development only: show reset link so the flow can be tested without an email provider.
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[PASSWORD RESET DEV ONLY] ${user.email}: ${resetUrl}`);
        return res.json({ success: true, message: genericMessage, resetLink: resetUrl });
      }
      console.error('Password reset requested but RESEND_API_KEY and EMAIL_FROM are not configured.');
      return res.json({ success: true, message: genericMessage });
    } catch (error) {
      console.error('Password reset request failed:', error);
      return res.json({ success: true, message: genericMessage });
    }
  },

  // POST /api/auth/reset-password
  resetPassword: (req: Request, res: Response) => {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    const newPassword = typeof req.body.newPassword === 'string' ? req.body.newPassword : '';
    if (!token || newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Mã khôi phục không hợp lệ hoặc mật khẩu mới phải có ít nhất 8 ký tự.' });
    }
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const user = dataStore.getUsers().find((candidate) => candidate.passwordResetTokenHash === tokenHash);
    if (!user || !user.passwordResetExpiresAt || new Date(user.passwordResetExpiresAt).getTime() < Date.now()) {
      if (user) dataStore.updateUser(user.id, { passwordResetTokenHash: undefined, passwordResetExpiresAt: undefined });
      return res.status(400).json({ success: false, message: 'Liên kết khôi phục đã hết hạn hoặc không hợp lệ. Vui lòng yêu cầu liên kết mới.' });
    }
    dataStore.updateUser(user.id, {
      password: bcrypt.hashSync(newPassword, 10),
      passwordResetTokenHash: undefined,
      passwordResetExpiresAt: undefined,
    });
    return res.json({ success: true, message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' });
  },

  // GET /api/auth/addresses
  getAddresses: (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    return res.json({ success: true, data: dataStore.getUserAddresses(req.user.id) });
  },

  // POST /api/auth/addresses
  addAddress: (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    const { label, recipientName, phone, address, isDefault = false } = req.body;
    if (![recipientName, phone, address].every((value) => typeof value === 'string' && value.trim())) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập người nhận, số điện thoại và địa chỉ đầy đủ.' });
    }
    const created = dataStore.addUserAddress(req.user.id, { label: typeof label === 'string' ? label : 'Địa chỉ nhận hàng', recipientName, phone, address, isDefault: Boolean(isDefault) });
    if (!created) return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản.' });
    return res.status(201).json({ success: true, message: 'Đã thêm địa chỉ giao hàng.', data: created });
  },

  // PUT /api/auth/addresses/:addressId
  updateAddress: (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    const updates: Record<string, unknown> = {};
    for (const field of ['label', 'recipientName', 'phone', 'address'] as const) {
      if (req.body[field] !== undefined) {
        if (typeof req.body[field] !== 'string' || !req.body[field].trim()) return res.status(400).json({ success: false, message: `Trường ${field} không hợp lệ.` });
        updates[field] = req.body[field].trim();
      }
    }
    if (req.body.isDefault !== undefined) updates.isDefault = Boolean(req.body.isDefault);
    const updated = dataStore.updateUserAddress(req.user.id, req.params.addressId, updates);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ.' });
    return res.json({ success: true, message: 'Đã cập nhật địa chỉ.', data: updated });
  },

  // PATCH /api/auth/addresses/:addressId/default
  setDefaultAddress: (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    const updated = dataStore.setDefaultUserAddress(req.user.id, req.params.addressId);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ.' });
    return res.json({ success: true, message: 'Đã đặt địa chỉ mặc định.', data: updated });
  },

  // DELETE /api/auth/addresses/:addressId
  deleteAddress: (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    const ok = dataStore.deleteUserAddress(req.user.id, req.params.addressId);
    if (!ok) return res.status(404).json({ success: false, message: 'Không tìm thấy địa chỉ.' });
    return res.json({ success: true, message: 'Đã xóa địa chỉ.' });
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

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' });
    }

    const isMatch = bcrypt.compareSync(currentPassword, req.user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    dataStore.updateUser(req.user.id, { password: newHash, passwordResetTokenHash: undefined, passwordResetExpiresAt: undefined });

    return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  },

  // PUT /api/auth/profile
  updateProfile: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const { name, phone, address, avatar } = req.body;
    if (name !== undefined && (typeof name !== 'string' || !name.trim() || name.trim().length > 120)) {
      return res.status(400).json({ success: false, message: 'Họ tên phải có từ 1 đến 120 ký tự.' });
    }
    if (phone !== undefined && (typeof phone !== 'string' || phone.length > 30)) {
      return res.status(400).json({ success: false, message: 'Số điện thoại không hợp lệ.' });
    }
    if (address !== undefined && (typeof address !== 'string' || address.length > 500)) {
      return res.status(400).json({ success: false, message: 'Địa chỉ không hợp lệ.' });
    }
    if (avatar !== undefined && (typeof avatar !== 'string' || avatar.length > 1000)) {
      return res.status(400).json({ success: false, message: 'Đường dẫn ảnh đại diện không hợp lệ.' });
    }

    const normalizedName = typeof name === 'string' ? name.trim() : req.user.name;
    const normalizedPhone = typeof phone === 'string' ? phone.trim() : req.user.phone;
    const normalizedAddress = typeof address === 'string' ? address.trim() : req.user.address;
    const updated = dataStore.updateUser(req.user.id, {
      name: normalizedName,
      phone: normalizedPhone,
      address: normalizedAddress,
      avatar: avatar ?? req.user.avatar,
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không thể cập nhật thông tin' });
    }

    // Keep the legacy profile address in sync with the selected default saved address.
    if (address !== undefined && Array.isArray(updated.addresses)) {
      const defaultAddress = updated.addresses.find((item) => item.isDefault);
      if (defaultAddress) {
        dataStore.updateUserAddress(req.user.id, defaultAddress.id, {
          address: normalizedAddress,
          ...(phone !== undefined ? { phone: normalizedPhone } : {}),
          ...(name !== undefined ? { recipientName: normalizedName } : {}),
        });
      }
    }

    const safeUpdated = dataStore.getUserById(req.user.id) || updated;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, walletBalance: _legacyWalletBalance, passwordResetTokenHash: _resetHash, passwordResetExpiresAt: _resetExpires, ...userSafe } = safeUpdated;
    return res.json({ success: true, message: 'Cập nhật thông tin thành công', user: userSafe });
  },
};
