import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import bcrypt from 'bcryptjs';
import { dataStore } from '../services/dataStore.ts';

export const userController = {
  // GET /api/users
  getUsers: (req: Request, res: Response) => {
    const { role, search } = req.query;
    let list = dataStore.getUsers();

    if (role && role !== 'ALL') {
      list = list.filter(u => u.role === role);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      list = list.filter(
        u =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.phone && u.phone.includes(q))
      );
    }

    // Never return password hashes
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const safeUsers = list.map(({ password: _, walletBalance: _legacyWalletBalance, passwordResetTokenHash: _resetHash, passwordResetExpiresAt: _resetExpires, ...rest }) => rest);
    return res.json({ success: true, data: safeUsers });
  },

  // POST /api/users (Admin create employee or customer)
  createUser: (req: Request, res: Response) => {
    try {
      const { name, email, password, role = 'EMPLOYEE', phone, address, status = 'ACTIVE' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên, email và mật khẩu' });
      }
      if (!['ADMIN', 'EMPLOYEE', 'CUSTOMER'].includes(role) || !['ACTIVE', 'INACTIVE'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Vai trò hoặc trạng thái tài khoản không hợp lệ.' });
      }
      if (String(password).length < 8) return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự.' });

      const existing = dataStore.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const newUser = dataStore.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role,
        phone: phone || '',
        address: address || '',
        status,
        loyaltyPoints: 0,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, walletBalance: _legacyWalletBalance, passwordResetTokenHash: _resetHash, passwordResetExpiresAt: _resetExpires, ...userSafe } = newUser;
      return res.status(201).json({ success: true, message: 'Tạo tài khoản thành công', data: userSafe });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi tạo người dùng: ' + (error as Error).message });
    }
  },

  // PUT /api/users/:id
  updateUser: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const updates = { ...req.body } as Record<string, any>;
    if (updates.role !== undefined && !['ADMIN', 'EMPLOYEE', 'CUSTOMER'].includes(updates.role)) {
      return res.status(400).json({ success: false, message: 'Vai trò không hợp lệ.' });
    }
    if (updates.status !== undefined && !['ACTIVE', 'INACTIVE'].includes(updates.status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái tài khoản không hợp lệ.' });
    }
    if (req.user?.id === id && ((updates.role && updates.role !== 'ADMIN') || updates.status === 'INACTIVE')) {
      return res.status(400).json({ success: false, message: 'Không thể tự hạ quyền hoặc khóa tài khoản quản trị hiện tại.' });
    }
    const existing = dataStore.getUserById(id);
    if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    const activeAdminCount = dataStore.getUsers().filter((user) => user.role === 'ADMIN' && user.status === 'ACTIVE').length;
    const removesActiveAdmin = existing.role === 'ADMIN' && existing.status === 'ACTIVE' && (
      updates.status === 'INACTIVE' || (updates.role !== undefined && updates.role !== 'ADMIN')
    );
    if (removesActiveAdmin && activeAdminCount <= 1) {
      return res.status(409).json({ success: false, message: 'Không thể khóa hoặc hạ quyền quản trị viên hoạt động cuối cùng.' });
    }
    if (updates.name !== undefined && (typeof updates.name !== 'string' || !updates.name.trim() || updates.name.trim().length > 120)) {
      return res.status(400).json({ success: false, message: 'Họ tên phải có từ 1 đến 120 ký tự.' });
    }
    if (updates.password !== undefined && (typeof updates.password !== 'string' || updates.password.length < 8)) {
      return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 8 ký tự.' });
    }
    const allowedFields = ['name', 'phone', 'address', 'avatar', 'role', 'status', 'password'];
    for (const key of Object.keys(updates)) if (!allowedFields.includes(key)) delete updates[key];
    delete updates.walletBalance;

    if (updates.name !== undefined) updates.name = updates.name.trim();
    const shouldInvalidateResetToken = Boolean(updates.password);
    if (updates.password) updates.password = bcrypt.hashSync(updates.password, 10);

    const updated = dataStore.updateUser(id, {
      ...updates,
      ...(shouldInvalidateResetToken ? { passwordResetTokenHash: undefined, passwordResetExpiresAt: undefined } : {}),
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, walletBalance: _legacyWalletBalance, passwordResetTokenHash: _resetHash, passwordResetExpiresAt: _resetExpires, ...userSafe } = updated;
    return res.json({ success: true, message: 'Cập nhật tài khoản thành công', data: userSafe });
  },

  // DELETE /api/users/:id
  deleteUser: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    if (req.user?.id === id) return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản quản trị đang đăng nhập.' });
    const target = dataStore.getUserById(id);
    if (target?.role === 'ADMIN' && dataStore.getUsers().filter((user) => user.role === 'ADMIN' && user.status === 'ACTIVE').length <= 1) {
      return res.status(409).json({ success: false, message: 'Không thể xóa quản trị viên hoạt động cuối cùng.' });
    }
    const ok = dataStore.deleteUser(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản để xóa' });
    }
    return res.json({ success: true, message: 'Đã xóa tài khoản thành công' });
  },
};
