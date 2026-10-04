import { Request, Response } from 'express';
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
    const safeUsers = list.map(({ password: _, ...rest }) => rest);
    return res.json({ success: true, data: safeUsers });
  },

  // POST /api/users (Admin create employee or customer)
  createUser: (req: Request, res: Response) => {
    try {
      const { name, email, password, role = 'EMPLOYEE', phone, address, status = 'ACTIVE' } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tên, email và mật khẩu' });
      }

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
        walletBalance: 0,
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...userSafe } = newUser;
      return res.status(201).json({ success: true, message: 'Tạo tài khoản thành công', data: userSafe });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi tạo người dùng: ' + (error as Error).message });
    }
  },

  // PUT /api/users/:id
  updateUser: (req: Request, res: Response) => {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = bcrypt.hashSync(updates.password, 10);
    }

    const updated = dataStore.updateUser(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userSafe } = updated;
    return res.json({ success: true, message: 'Cập nhật tài khoản thành công', data: userSafe });
  },

  // DELETE /api/users/:id
  deleteUser: (req: Request, res: Response) => {
    const { id } = req.params;
    const ok = dataStore.deleteUser(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản để xóa' });
    }
    return res.json({ success: true, message: 'Đã xóa tài khoản thành công' });
  },
};
