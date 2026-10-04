import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

export const reviewController = {
  // GET /api/reviews/product/:productId
  getByProduct: (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    const reviews = dataStore.getReviews(productId).filter(r => r.status === 'APPROVED');
    return res.json({ success: true, data: reviews });
  },

  // GET /api/reviews (Admin)
  getAllReviews: (_req: AuthRequest, res: Response) => {
    const reviews = dataStore.getReviews();
    return res.json({ success: true, data: reviews });
  },

  // POST /api/reviews
  addReview: (req: AuthRequest, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đánh giá' });
      }

      const { productId, orderId, rating, comment } = req.body;

      if (!productId || !rating || !comment) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao đánh giá và nhập nhận xét' });
      }

      // Check if product exists
      const product = dataStore.getProductById(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
      }

      // Check if customer already purchased this product in a COMPLETED order (verified buyer rule)
      const customerOrders = dataStore.getOrdersByCustomer(req.user.id);
      const hasPurchased = customerOrders.some(
        o => o.orderStatus === 'COMPLETED' && o.items.some(item => item.productId === productId)
      );

      if (!hasPurchased && req.user.role === 'CUSTOMER') {
        return res.status(403).json({
          success: false,
          message: 'Chỉ khách hàng đã mua và hoàn thành đơn hàng cho sản phẩm này mới có thể viết đánh giá.',
        });
      }

      const newReview = dataStore.createReview({
        productId,
        orderId: orderId || 'VERIFIED_PURCHASE',
        customerId: req.user.id,
        customerName: req.user.name,
        customerAvatar: req.user.avatar,
        rating: Math.min(5, Math.max(1, Number(rating))),
        comment: comment.trim(),
        status: 'APPROVED',
      });

      return res.status(201).json({
        success: true,
        message: 'Cảm ơn bạn đã gửi đánh giá cho sản phẩm!',
        data: newReview,
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Lỗi gửi đánh giá: ' + (error as Error).message });
    }
  },

  // PUT /api/reviews/:id/status
  updateStatus: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'HIDDEN'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const updated = dataStore.updateReviewStatus(id, status);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    }

    return res.json({ success: true, message: `Đã đổi trạng thái đánh giá thành ${status}`, data: updated });
  },

  // DELETE /api/reviews/:id
  deleteReview: (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const ok = dataStore.deleteReview(id);
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá để xóa' });
    }
    return res.json({ success: true, message: 'Đã xóa đánh giá thành công' });
  },
};
