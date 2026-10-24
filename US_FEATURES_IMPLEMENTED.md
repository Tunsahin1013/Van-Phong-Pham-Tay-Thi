# Tây Thi — User Stories US04–US38 đã tích hợp

> Đây là bản tích hợp trên source snapshot hiện có trong phiên làm việc; chưa được đối chiếu trực tiếp với trạng thái mới nhất trên GitHub. Hãy review diff trước khi merge.

## Epic 1 — Tài khoản người dùng

- **US04 — Cập nhật hồ sơ:** trang `/account` cho phép sửa họ tên, điện thoại, địa chỉ và ảnh đại diện; email không cho đổi qua form.
- **US05 — Đổi mật khẩu:** yêu cầu mật khẩu hiện tại; mật khẩu mới tối thiểu 8 ký tự; sau khi đổi sẽ vô hiệu hóa token reset đang tồn tại.
- **US06 — Khôi phục qua email:** token ngẫu nhiên lưu dạng SHA-256 hash, hết hạn sau 15 phút, không tiết lộ email có tồn tại hay không. Production cần cấu hình `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`. Môi trường development trả link test trong phản hồi.
- **US07 — Nhiều địa chỉ:** CRUD địa chỉ, đặt mặc định, dùng sổ địa chỉ ở checkout. Dữ liệu hồ sơ cũ được chuẩn hóa thành địa chỉ mặc định khi có thể.
- **US09 — Khóa/mở khóa:** Admin đổi `ACTIVE`/`INACTIVE`; tài khoản bị khóa không thể login hoặc dùng token hiện có. Không cho khóa Admin hoạt động cuối cùng.
- **US10 — Phân quyền:** Admin gán `ADMIN`, `EMPLOYEE`, `CUSTOMER`; backend kiểm tra role/status và chặn tự hạ quyền/tự khóa. Có bảo vệ tránh hạ quyền Admin hoạt động cuối cùng.

## Epic 2 — Quản lý sản phẩm

- **US15 — Bật/tắt kinh doanh:** Admin dùng nút trạng thái trong màn hình sản phẩm; API `PATCH /api/products/:id/status` chỉ cho Admin. Sản phẩm `INACTIVE` bị ẩn khỏi khách và không đặt hàng được. Endpoint `PUT` cũng không cho Employee sửa field `status`.

## Epic 4 — Quản lý đơn hàng

- **US24 — Theo dõi trạng thái:** trang đơn hàng khách hàng tải lại danh sách định kỳ mỗi 15 giây và hiển thị timeline `trackingEvents` có thời gian/người thực hiện. Đây là polling gần thời gian thực, chưa phải WebSocket.
- **US25 — Trả hàng/hoàn tiền:** khách gửi yêu cầu trong 7 ngày sau khi đơn hoàn thành, nhập lý do; Admin/Employee chấp thuận, từ chối hoặc đánh dấu đã xử lý. Chức năng này ghi nhận yêu cầu/kết quả xử lý, **không tự thực hiện giao dịch hoàn tiền từ cổng thanh toán**.
- **US30 — In hóa đơn/phiếu giao hàng:** Admin và Employee có nút in hóa đơn/phiếu giao hàng; Employee có thêm tạo và in phiếu xuất kho.

## Epic 5 — Kho hàng & nhập xuất

- **US32 — Phiếu nhập:** Employee chọn sản phẩm, nhà cung cấp đang hoạt động, số lượng nguyên dương; lưu nhật ký nhập với tồn trước/sau, nhà cung cấp và người thực hiện.
- **US33 — Phiếu xuất theo đơn:** tạo mã phiếu xuất cho đơn đã xác nhận/xử lý; phiếu không trừ tồn riêng để tránh trừ kho hai lần. Tồn thực tế được trừ tại lúc đơn hoàn thành theo US36.
- **US34 — Điều chỉnh tồn:** Employee nhập mức chênh lệch nguyên và lý do; backend cấm tồn âm và cấm giảm dưới lượng đã được giữ cho đơn đang xử lý.
- **US35 — Sắp hết/hết hàng:** API `GET /api/inventory/low-stock`; màn hình kho Employee có bộ lọc chỉ xem sản phẩm sắp hết/hết hàng.
- **US36 — Tự động trừ kho:** đơn mới giữ lượng tồn có thể đặt; khi chuyển sang `COMPLETED`, backend kiểm tra đủ tồn thực tế rồi trừ một lần, cập nhật `sold`, ghi log xuất kho và cộng điểm một lần. Đơn không hoàn tất sẽ không bị trừ tồn theo cơ chế này.
- **US37 — Cảnh báo tồn:** khi số lượng có thể cấp cho đơn vượt ngưỡng xuống dưới hoặc hết hàng, thông báo được gửi đến tài khoản Admin/Employee đang hoạt động (không broadcast lý do/chi tiết đơn cho khách hàng). Cảnh báo cũng phát sinh khi tạo sản phẩm mới với tồn dưới ngưỡng.
- **US38 — Lịch sử kho:** bảng Admin xem lịch sử nhập/xuất/điều chỉnh; endpoint log chỉ cho Admin. Log chứa thời gian, sản phẩm, số lượng, tồn trước/sau, ghi chú, người thực hiện và mã đơn/phiếu khi có.

## File chính đã cập nhật

- `controllers/authController.ts`, `routes/authRoutes.ts`, `src/pages/customer/AccountPage.tsx`, `src/pages/customer/ResetPasswordPage.tsx`
- `controllers/userController.ts`, `routes/userRoutes.ts`, `src/pages/admin/AdminDashboard.tsx`
- `controllers/productController.ts`, `routes/productRoutes.ts`
- `controllers/orderController.ts`, `routes/orderRoutes.ts`, `src/pages/customer/OrdersPage.tsx`
- `controllers/inventoryController.ts`, `routes/inventoryRoutes.ts`, `src/pages/employee/EmployeeDashboard.tsx`
- `services/dataStore.ts`, `data/seedData.ts`, `src/api.ts`, `src/App.tsx`, `src/components/Header.tsx`, `src/components/AuthModal.tsx`, `controllers/notificationController.ts`, `middleware/auth.ts` (nếu được cập nhật ở các phần liên quan), `utils/printOrder.ts`.

## Kiểm tra đã chạy

- `npm run lint` (`tsc --noEmit`): **thành công** sau khi tích hợp.
- `npm run build`: **chưa xác minh được** trong môi trường tạo gói. Vite bị chặn thực thi script trong môi trường này; khi gọi trực tiếp JS thì thiếu native binding Rolldown của Linux. Chạy lại trên Windows bằng `npm run build` trước khi push/merge.

## Giới hạn lưu trữ cần biết

Các controller nghiệp vụ người dùng, sản phẩm, đơn hàng, đánh giá, voucher và kho trong source hiện vẫn dùng `DataStoreService` lưu vào `data/db.json`. Kết nối MongoDB Atlas hiện được dùng rõ ràng cho nội dung website và một số chức năng quản trị/persistence; đặt `MONGODB_URI` đúng **không tự động chuyển toàn bộ nghiệp vụ sang MongoDB**. Không dùng file JSON local làm nguồn dữ liệu production bền vững trên Vercel nếu chưa hoàn thiện migration sang MongoDB cho các model nghiệp vụ.
