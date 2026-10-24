# Checklist kiểm thử thủ công — US04–US38

Thực hiện trên môi trường local/dev trước, với dữ liệu test. Không chạy các ca thay đổi tồn kho trên dữ liệu thật.

## Tài khoản
- [ ] US04: đăng nhập CUSTOMER, đổi họ tên/điện thoại/địa chỉ; refresh trang vẫn thấy dữ liệu mới.
- [ ] US05: sai mật khẩu hiện tại phải bị từ chối; mật khẩu mới dưới 8 ký tự bị từ chối; mật khẩu hợp lệ đổi thành công.
- [ ] US06: yêu cầu reset cho email tồn tại/không tồn tại trả thông báo công khai giống nhau; trong development mở `resetLink`, đặt mật khẩu mới; token hết hạn hoặc dùng lại bị từ chối.
- [ ] US07: thêm hai địa chỉ; đặt một địa chỉ mặc định; xóa địa chỉ mặc định thì địa chỉ còn lại được đặt mặc định; checkout dùng địa chỉ đã chọn.
- [ ] US09: Admin khóa CUSTOMER; khách đó không login được và token cũ nhận 403; mở khóa lại cho login được.
- [ ] US10: Admin chuyển CUSTOMER ↔ EMPLOYEE/ADMIN; role mới được áp dụng theo dữ liệu user hiện tại; thử tự hạ quyền và hạ quyền Admin cuối cùng phải bị từ chối.

## Sản phẩm
- [ ] US15: Admin tắt kinh doanh; khách không thấy sản phẩm trong listing/không xem được chi tiết/không đặt được; Admin vẫn xem và bật lại được.
- [ ] US15: Employee gọi API update để thay `status` phải nhận 403.

## Đơn hàng
- [ ] US24: cập nhật trạng thái đơn, kiểm tra timeline xuất hiện theo thứ tự thời gian; trang khách cập nhật trong khoảng 15 giây.
- [ ] US25: khách ngoài chủ đơn không tạo được yêu cầu; đơn chưa hoàn thành hoặc quá 7 ngày bị từ chối; yêu cầu có thể được duyệt/từ chối/đánh dấu xử lý.
- [ ] US30: Admin và Employee in được hóa đơn/phiếu giao hàng; kiểm tra nội dung tiếng Việt và tổng tiền.

## Kho
- [ ] US32: tạo phiếu nhập với nhà cung cấp đang hoạt động và số lượng nguyên dương; tồn tăng đúng; nhật ký có nhà cung cấp/tồn trước/tồn sau.
- [ ] US32: thiếu nhà cung cấp, nhà cung cấp inactive hoặc quantity <= 0 bị từ chối.
- [ ] US33: tạo phiếu xuất cho đơn đã xác nhận/xử lý; mã phiếu được lưu; tạo lại không tạo mã mới.
- [ ] US34: điều chỉnh dương/âm tạo log; điều chỉnh làm tồn âm hoặc thấp hơn số lượng đang giữ cho đơn bị từ chối.
- [ ] US35: bật bộ lọc sắp hết/hết hàng; chỉ sản phẩm dưới ngưỡng được hiển thị.
- [ ] US36: hoàn thành đơn hợp lệ trừ kho đúng một lần, không cho tồn âm; lặp cập nhật `COMPLETED` không trừ lần hai; điểm thưởng không cộng lần hai.
- [ ] US37: tạo/chỉnh tồn vượt qua ngưỡng tối thiểu; tài khoản Admin/Employee nhận thông báo, CUSTOMER không nhận cảnh báo vận hành.
- [ ] US38: Admin xem log; Employee thử gọi `GET /api/inventory/logs` phải nhận 403.

## Trước khi push
- [ ] Chạy `npm run lint`.
- [ ] Chạy `npm run build` trên Windows.
- [ ] Kiểm tra `git status --short`; không stage `.env`, `.files.env`, `data/db.json`, backup JSON, `dist` hoặc `node_modules`.
- [ ] Xác nhận backend đang dùng nguồn lưu dữ liệu phù hợp môi trường; không bỏ qua cảnh báo JSON fallback.
