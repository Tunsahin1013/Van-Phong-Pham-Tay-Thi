import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';
import { OrderItemProduct } from '../data/seedData.ts';

export const orderController = {
  // POST /api/orders
  createOrder: (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để tiến hành đặt hàng' });
      }

      const {
        items,
        shippingAddress,
        customerPhone,
        customerName,
        note,
        paymentMethod = 'COD',
        voucherCode,
      } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống' });
      }

      if (!shippingAddress || !customerPhone || !customerName) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng' });
      }

      // Check stock and calculate subtotal
      let calculatedSubtotal = 0;
      const verifiedItems: OrderItemProduct[] = [];

      for (const item of items) {
        const prod = dataStore.getProductById(item.productId);
        if (!prod || prod.status !== 'ACTIVE') {
          return res.status(400).json({ success: false, message: `Sản phẩm ${item.name || item.productId} hiện không khả dụng` });
        }

        if (prod.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Sản phẩm "${prod.name}" chỉ còn ${prod.stock} ${prod.unit} trong kho, không đủ số lượng ${item.quantity} bạn yêu cầu`,
          });
        }

        const price = prod.salePrice || prod.price;
        calculatedSubtotal += price * item.quantity;

        verifiedItems.push({
          productId: prod.id,
          code: prod.code,
          name: prod.name,
          image: prod.image,
          price,
          quantity: item.quantity,
          unit: prod.unit,
        });
      }

      // Shipping fee calculation: free if >= 300,000đ, else 20,000đ
      let shippingFee = calculatedSubtotal >= 300000 ? 0 : 20000;

      // Validate voucher if provided
      let discountAmount = 0;
      if (voucherCode) {
        const voucher = dataStore.getVoucherByCode(voucherCode);
        if (!voucher) {
          return res.status(400).json({ success: false, message: 'Mã giảm giá không tồn tại' });
        }

        if (voucher.status !== 'ACTIVE') {
          return res.status(400).json({ success: false, message: 'Mã giảm giá đã tạm dừng áp dụng' });
        }

        const now = new Date();
        if (new Date(voucher.endDate) < now) {
          return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn sử dụng' });
        }

        if (voucher.usageLimit > 0 && voucher.usedCount >= voucher.usageLimit) {
          return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
        }

        if (calculatedSubtotal < voucher.minimumOrder) {
          return res.status(400).json({
            success: false,
            message: `Đơn hàng tối thiểu phải từ ${voucher.minimumOrder.toLocaleString('vi-VN')}đ để áp dụng voucher này`,
          });
        }

        if (voucher.type === 'PERCENTAGE') {
          discountAmount = Math.round((calculatedSubtotal * voucher.value) / 100);
          if (voucher.maximumDiscount > 0 && discountAmount > voucher.maximumDiscount) {
            discountAmount = voucher.maximumDiscount;
          }
        } else {
          // FIXED
          discountAmount = Math.min(voucher.value, calculatedSubtotal);
        }
      }

      const totalAmount = Math.max(0, calculatedSubtotal - discountAmount + shippingFee);

      // If paying by wallet, verify sufficient balance
      if (paymentMethod === 'WALLET') {
        const currentBalance = req.user.walletBalance || 0;
        if (currentBalance < totalAmount) {
          return res.status(400).json({
            success: false,
            message: `Số dư ví Stationery Pay không đủ (Hiện có: ${currentBalance.toLocaleString('vi-VN')}đ, cần thanh toán: ${totalAmount.toLocaleString('vi-VN')}đ). Vui lòng nạp thêm tiền hoặc chọn phương thức COD.`,
          });
        }
      }

      const newOrder = dataStore.createOrder({
        customerId: req.user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: req.user.email,
        shippingAddress: shippingAddress.trim(),
        note: note ? note.trim() : '',
        paymentMethod: paymentMethod as 'COD' | 'WALLET' | 'BANKING',
        paymentStatus: paymentMethod === 'WALLET' ? 'PAID' : 'UNPAID',
        orderStatus: 'PENDING',
        items: verifiedItems,
        subtotal: calculatedSubtotal,
        discount: discountAmount,
        shippingFee,
        total: totalAmount,
        voucherCode: voucherCode ? voucherCode.toUpperCase().trim() : undefined,
      });

      return res.status(201).json({
        success: true,
        message: 'Đặt hàng thành công! Mã đơn của bạn là ' + newOrder.orderCode,
        data: newOrder,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi khi tạo đơn hàng: ' + (error as Error).message });
    }
  },

  // GET /api/orders/my-orders
  getMyOrders: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const orders = dataStore.getOrdersByCustomer(req.user.id);
    return res.json({ success: true, data: orders });
  },

  // GET /api/orders
  getAllOrders: (req: AuthRequest, res: Response) => {
    try {
      const { status, search, paymentMethod, page = '1', limit = '15' } = req.query;

      let list = dataStore.getOrders();

      if (status && status !== 'ALL') {
        list = list.filter(o => o.orderStatus === status);
      }

      if (paymentMethod && paymentMethod !== 'ALL') {
        list = list.filter(o => o.paymentMethod === paymentMethod);
      }

      if (search && typeof search === 'string') {
        const q = search.toLowerCase().trim();
        list = list.filter(
          o =>
            o.orderCode.toLowerCase().includes(q) ||
            o.customerName.toLowerCase().includes(q) ||
            o.customerPhone.toLowerCase().includes(q) ||
            o.shippingAddress.toLowerCase().includes(q)
        );
      }

      const pageNum = parseInt(page as string, 10) || 1;
      const limitNum = parseInt(limit as string, 10) || 15;
      const total = list.length;
      const totalPages = Math.ceil(total / limitNum);
      const startIndex = (pageNum - 1) * limitNum;
      const paginatedItems = list.slice(startIndex, startIndex + limitNum);

      return res.json({
        success: true,
        data: paginatedItems,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách đơn hàng: ' + (error as Error).message });
    }
  },

  // GET /api/orders/:id
  getOrderById: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const order = dataStore.getOrderById(id);

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // Role check: Customer can only view their own order
    if (req.user?.role === 'CUSTOMER' && order.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn không có quyền xem đơn hàng của người khác' });
    }

    return res.json({ success: true, data: order });
  },

  // PUT /api/orders/:id/status
  updateOrderStatus: (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { orderStatus, paymentStatus, cancelReason } = req.body;

      if (!orderStatus) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp trạng thái mới' });
      }

      const updated = dataStore.updateOrderStatus(id, orderStatus, paymentStatus, cancelReason);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      return res.json({ success: true, message: `Cập nhật trạng thái đơn hàng thành ${orderStatus}`, data: updated });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái đơn: ' + (error as Error).message });
    }
  },

  // POST /api/orders/:id/cancel
  cancelOrder: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const order = dataStore.getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    // If customer, only allow canceling PENDING orders
    if (req.user?.role === 'CUSTOMER') {
      if (order.customerId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Bạn không có quyền hủy đơn hàng này' });
      }
      if (order.orderStatus !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Đơn hàng đã được xác nhận hoặc đang vận chuyển, không thể tự hủy. Vui lòng liên hệ hỗ trợ.',
        });
      }
    }

    const cancelled = dataStore.updateOrderStatus(
      id,
      'CANCELLED',
      order.paymentMethod === 'WALLET' ? 'REFUNDED' : 'UNPAID',
      reason || 'Khách hàng yêu cầu hủy đơn'
    );

    return res.json({ success: true, message: 'Đã hủy đơn hàng thành công', data: cancelled });
  },
};
