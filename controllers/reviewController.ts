import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import { dataStore } from '../services/dataStore.ts';

const REVIEW_EDIT_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REVIEW_LENGTH = 2000;
const MAX_REPLY_LENGTH = 2000;

export const reviewController = {
  // GET /api/reviews/product/:productId
  getByProduct: (req: AuthRequest, res: Response) => {
    const { productId } = req.params;
    // Public visitors see approved reviews. A signed-in customer can also see
    // their own hidden review so they can edit it and request moderation again.
    const reviews = dataStore.getReviews(productId).filter(
      review => review.status === 'APPROVED' || review.customerId === req.user?.id,
    );
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

      const normalizedRating = Number(rating);
      const normalizedComment = typeof comment === 'string' ? comment.trim() : '';
      if (!productId || !Number.isInteger(normalizedRating) || normalizedRating < 1 || normalizedRating > 5 || !normalizedComment) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn số sao từ 1 đến 5 và nhập nhận xét' });
      }
      if (normalizedComment.length > MAX_REVIEW_LENGTH) {
        return res.status(400).json({ success: false, message: `Nhận xét không được vượt quá ${MAX_REVIEW_LENGTH} ký tự` });
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
        rating: normalizedRating,
        comment: normalizedComment,
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

  // PUT /api/reviews/:id — customer edits their own review within 7 days.
  updateReview: (req: AuthRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để chỉnh sửa đánh giá' });
    }
    if (req.user.role !== 'CUSTOMER') {
      return res.status(403).json({ success: false, message: 'Chỉ khách hàng mới được chỉnh sửa đánh giá cá nhân' });
    }

    const review = dataStore.getReviews().find(item => item.id === req.params.id);
    if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    if (review.customerId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Bạn chỉ có thể chỉnh sửa đánh giá của chính mình' });
    }

    const createdAt = new Date(review.createdAt).getTime();
    if (!Number.isFinite(createdAt) || createdAt > Date.now() || Date.now() - createdAt > REVIEW_EDIT_WINDOW_MS) {
      return res.status(403).json({ success: false, message: 'Đã hết thời hạn chỉnh sửa đánh giá (7 ngày kể từ ngày gửi)' });
    }

    const rating = Number(req.body?.rating);
    const comment = typeof req.body?.comment === 'string' ? req.body.comment.trim() : '';
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !comment) {
      return res.status(400).json({ success: false, message: 'Số sao phải từ 1 đến 5 và nội dung đánh giá không được để trống' });
    }
    if (comment.length > MAX_REVIEW_LENGTH) {
      return res.status(400).json({ success: false, message: `Nội dung đánh giá không được vượt quá ${MAX_REVIEW_LENGTH} ký tự` });
    }

    const updated = dataStore.updateReviewContent(review.id, rating, comment);
    if (!updated) return res.status(404).json({ success: false, message: 'Không thể cập nhật đánh giá' });
    return res.json({ success: true, message: 'Đã cập nhật đánh giá thành công', data: updated });
  },

  // PUT /api/reviews/:id/reply — admin replies to a customer review.
  replyToReview: (req: AuthRequest, res: Response) => {
    const reply = typeof req.body?.reply === 'string' ? req.body.reply.trim() : '';
    if (!reply) return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung phản hồi' });
    if (reply.length > MAX_REPLY_LENGTH) {
      return res.status(400).json({ success: false, message: `Phản hồi không được vượt quá ${MAX_REPLY_LENGTH} ký tự` });
    }
    const updated = dataStore.updateReviewReply(req.params.id, reply, req.user?.name || 'Quản trị viên');
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    return res.json({ success: true, message: 'Đã lưu phản hồi của cửa hàng', data: updated });
  },

  // DELETE /api/reviews/:id/reply — admin removes the reply, not the review.
  deleteReviewReply: (req: AuthRequest, res: Response) => {
    const updated = dataStore.deleteReviewReply(req.params.id);
    if (!updated) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá' });
    return res.json({ success: true, message: 'Đã xóa phản hồi của cửa hàng', data: updated });
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
