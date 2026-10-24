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

      const normalizedPaymentMethod: 'COD' | 'BANKING' | null =
        paymentMethod === 'BANKING' ? 'BANKING' : paymentMethod === 'COD' ? 'COD' : null;
      if (!normalizedPaymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Ví điện tử đã ngừng hỗ trợ. Vui lòng chọn COD hoặc chuyển khoản ngân hàng.',
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống' });
      }

      if (!shippingAddress || !customerPhone || !customerName) {
        return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ họ tên, số điện thoại và địa chỉ nhận hàng' });
      }

      // Aggregate duplicate product lines before checking available stock. New orders reserve
      // quantities; stock is physically deducted once on completion by DataStoreService.
      const requestedByProduct = new Map<string, number>();
      for (const item of items) {
        const productId = String(item.productId || '');
        const quantity = Number(item.quantity);
        if (!productId || !Number.isInteger(quantity) || quantity <= 0) {
          return res.status(400).json({ success: false, message: 'Sản phẩm hoặc số lượng trong giỏ hàng không hợp lệ.' });
        }
        requestedByProduct.set(productId, (requestedByProduct.get(productId) || 0) + quantity);
      }
      for (const [productId, quantity] of requestedByProduct) {
        const product = dataStore.getProductById(productId);
        if (!product || product.status !== 'ACTIVE') {
          return res.status(400).json({ success: false, message: 'Một sản phẩm trong giỏ hàng hiện không khả dụng.' });
        }
        const available = dataStore.getAvailableStock(productId);
        if (available < quantity) {
          return res.status(400).json({ success: false, message: `Sản phẩm "${product.name}" chỉ còn ${available} ${product.unit} có thể đặt, không đủ số lượng ${quantity}.` });
        }
      }

      // Check stock and calculate subtotal
      let calculatedSubtotal = 0;
      const verifiedItems: OrderItemProduct[] = [];

      for (const item of items) {
        const prod = dataStore.getProductById(item.productId);
        if (!prod || prod.status !== 'ACTIVE') {
          return res.status(400).json({ success: false, message: `Sản phẩm ${item.name || item.productId} hiện không khả dụng` });
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

      const newOrder = dataStore.createOrder({
        customerId: req.user.id,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: req.user.email,
        shippingAddress: shippingAddress.trim(),
        note: note ? note.trim() : '',
        paymentMethod: normalizedPaymentMethod,
        paymentStatus: 'UNPAID',
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

      const allowedStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPING', 'COMPLETED', 'CANCELLED'];
      if (!allowedStatuses.includes(orderStatus)) {
        return res.status(400).json({ success: false, message: 'Trạng thái đơn hàng không hợp lệ.' });
      }
      const existing = dataStore.getOrderById(id);
      if (!existing) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      const transitions: Record<string, string[]> = {
        PENDING: ['CONFIRMED', 'CANCELLED'],
        CONFIRMED: ['PREPARING', 'CANCELLED'],
        PREPARING: ['SHIPPING', 'CANCELLED'],
        SHIPPING: ['COMPLETED', 'CANCELLED'],
        COMPLETED: [],
        CANCELLED: [],
      };
      if (orderStatus !== existing.orderStatus && !(transitions[existing.orderStatus] || []).includes(orderStatus)) {
        return res.status(409).json({ success: false, message: `Không thể chuyển trạng thái từ ${existing.orderStatus} sang ${orderStatus}.` });
      }

      const updated = dataStore.updateOrderStatus(id, orderStatus, paymentStatus, cancelReason, req.user?.name || 'Nhân viên');
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
      }

      return res.json({ success: true, message: `Cập nhật trạng thái đơn hàng thành ${orderStatus}`, data: updated });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái đơn: ' + (error as Error).message });
    }
  },

  // POST /api/orders/:id/return-request — customer requests return/refund review.
  requestReturn: (req: AuthRequest, res: Response) => {
    if (!req.user) return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập.' });
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < 8 || reason.length > 1200) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do từ 8 đến 1.200 ký tự.' });
    }
    try {
      const order = dataStore.createReturnRequest(req.params.id, req.user.id, reason);
      if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng của bạn.' });
      return res.status(201).json({ success: true, message: 'Đã gửi yêu cầu trả hàng/hoàn tiền. Cửa hàng sẽ phản hồi sau khi kiểm tra.', data: order });
    } catch (error) {
      return res.status(400).json({ success: false, message: (error as Error).message });
    }
  },

  // PUT /api/orders/:id/return-request — staff decides the claim; payment refund must be processed separately.
  updateReturnRequest: (req: AuthRequest, res: Response) => {
    const status = req.body.status;
    const resolutionNote = typeof req.body.resolutionNote === 'string' ? req.body.resolutionNote.trim().slice(0, 1200) : '';
    if (!['APPROVED', 'REJECTED', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái xử lý yêu cầu không hợp lệ.' });
    }
    const order = dataStore.updateReturnRequest(req.params.id, status, req.user?.name || 'Nhân viên', resolutionNote);
    if (!order) return res.status(404).json({ success: false, message: 'Đơn hàng chưa có yêu cầu trả hàng/hoàn tiền.' });
    return res.json({ success: true, message: 'Đã cập nhật yêu cầu trả hàng/hoàn tiền.', data: order });
  },

  // POST /api/orders/:id/cancel
  cancelOrder: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const order = dataStore.getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    if (order.orderStatus === 'COMPLETED' || order.orderStatus === 'CANCELLED') {
      return res.status(409).json({ success: false, message: 'Đơn đã hoàn thành hoặc đã hủy không thể hủy lại. Nếu cần khiếu nại, hãy dùng luồng trả hàng/hoàn tiền.' });
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

    // Old wallet-paid orders are historical records only. Do not simulate a refund into a disabled wallet.
    if (order.paymentMethod === 'WALLET' && order.paymentStatus === 'PAID') {
      return res.status(409).json({
        success: false,
        message: 'Đơn hàng cũ đã thanh toán bằng ví điện tử đã ngừng hỗ trợ. Vui lòng kiểm tra và xử lý hoàn tiền thủ công trước khi hủy đơn.',
      });
    }

    const cancelled = dataStore.updateOrderStatus(
      id,
      'CANCELLED',
      'UNPAID',
      reason || 'Khách hàng yêu cầu hủy đơn',
      req.user?.name || 'Khách hàng'
    );

    return res.json({ success: true, message: 'Đã hủy đơn hàng thành công', data: cancelled });
  },
};
