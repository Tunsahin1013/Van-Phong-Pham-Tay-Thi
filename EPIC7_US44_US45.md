# Epic 7 – Đánh giá sản phẩm

## US44 – Khách hàng chỉnh sửa đánh giá

**Yêu cầu:** Khách hàng có thể chỉnh sửa đánh giá của chính mình trong thời gian cho phép.

**Đã có trong source:**
- Frontend chi tiết sản phẩm có chế độ chỉnh sửa sao và nội dung đánh giá.
- Cửa sổ chỉnh sửa mặc định là 7 ngày từ `createdAt`.
- Backend kiểm tra đăng nhập, vai trò `CUSTOMER`, quyền sở hữu review, thời hạn, rating nguyên từ 1–5, comment không rỗng và tối đa 2.000 ký tự.
- Tác vụ cập nhật sửa nội dung và `updatedAt`, sau đó tính lại điểm trung bình/số lượng đánh giá được duyệt.
- Endpoint: `PUT /api/reviews/:id`.

## US45 – Admin quản lý phản hồi đánh giá

**Yêu cầu:** Quản trị viên phản hồi, cập nhật hoặc xóa phản hồi của cửa hàng để giải đáp thắc mắc và tiếp nhận góp ý.

**Đã có trong source:**
- Tab đánh giá trong Admin hiển thị phản hồi hiện tại, biểu mẫu phản hồi và thao tác cập nhật/xóa phản hồi.
- Backend giới hạn các endpoint phản hồi cho vai trò `ADMIN`.
- Dữ liệu phản hồi gồm `adminReply`, `adminReplyBy`, `adminReplyAt`.
- Endpoint: `PUT /api/reviews/:id/reply`, `DELETE /api/reviews/:id/reply`.
- Xóa phản hồi không xóa đánh giá gốc.
- Phản hồi được hiển thị bên dưới đánh giá công khai trên trang chi tiết sản phẩm.

## Kiểm thử chấp nhận đề xuất

1. Khách A sửa review của chính mình trong 7 ngày: thành công.
2. Khách A sửa review của khách B: bị từ chối `403`.
3. Sửa review sau 7 ngày: bị từ chối `403`.
4. Rating ngoài 1–5 hoặc comment trống/quá 2.000 ký tự: bị từ chối `400`.
5. Người chưa đăng nhập gọi API sửa review: bị từ chối `401`.
6. User không phải Admin gọi API phản hồi: bị từ chối theo middleware xác thực/phân quyền.
7. Admin gửi/cập nhật phản hồi: nội dung và người phản hồi được lưu và xuất hiện ở trang sản phẩm.
8. Admin xóa phản hồi: chỉ trường phản hồi bị xóa, đánh giá gốc còn nguyên.
9. Ẩn/duyệt/xóa đánh giá: số lượng và điểm trung bình sản phẩm được tính lại theo đánh giá `APPROVED`.

## Lưu ý về persistence

Các hàm review hiện dùng `DataStoreService`. Trong source này, DataStore ghi dữ liệu lõi vào `data/db.json`; nếu môi trường production đang dùng JSON fallback trên Vercel, các thay đổi có thể không bền vững qua redeploy. Cần đảm bảo cơ chế persistence thật đang bật trước khi đưa dữ liệu người dùng thật vào production.
