# Tây Thi – MongoDB Atlas là nguồn dữ liệu duy nhất

## Dữ liệu nghiệp vụ

Backend vẫn dùng `DataStoreService` làm lớp cache tương thích với controller đồng bộ hiện tại. Cache không phải nguồn lưu trữ bền vững. Trước khi API kết thúc response, middleware chờ `dataStore.flush()` ghi snapshot vào MongoDB Atlas. Nếu ghi thất bại, API trả HTTP 503.

`application_state` là snapshot chuẩn để khôi phục toàn bộ trạng thái nghiệp vụ sau khi restart. Các collection nghiệp vụ được đồng bộ để quản trị viên có thể kiểm tra và truy vấn riêng trong Atlas:

- `users`
- `categories`
- `products`
- `orders`
- `vouchers`
- `suppliers`
- `reviews`
- `inventories`
- `wallettransactions`
- `notifications`
- `conversations`
- `chatmessages`
- `cart_sessions` (giỏ hàng theo mã phiên khách)
- `system_activity_logs`
- `system_store_settings`
- `sitecontents`

## Cài đặt

1. Tạo database MongoDB Atlas, ví dụ `taythi`.
2. Tạo `.env` từ `.env.example`.
3. Điền `MONGODB_URI` và `JWT_SECRET` thật.
4. Chạy `npm install`.
5. Chạy `npm run migrate:mongo` một lần để import snapshot cũ và đồng bộ các collection.
6. Chạy `npm run dev`.

## Migration dữ liệu cũ

Khi `application_state` chưa có, chương trình hợp nhất dữ liệu từ các collection hiện có trong MongoDB với `data/db.legacy.backup`. MongoDB được ưu tiên nếu trùng `id`; dữ liệu legacy còn thiếu được bổ sung. Nếu cả hai nguồn không có dữ liệu cho một collection, dữ liệu khởi tạo từ `seedData.ts` được ghi vào MongoDB.

Sau khi có `application_state`, các lần khởi động sau chỉ đọc MongoDB. `data/db.legacy.backup` không còn được sử dụng.

Không xóa `data/db.legacy.backup` cho đến khi đã kiểm tra số lượng bản ghi và dữ liệu trong Atlas.

## Hóa đơn

Hiện tại chức năng in hóa đơn tạo bản in từ dữ liệu đơn hàng. Đơn hàng, thông tin khách, dòng sản phẩm, đơn giá, số lượng, chiết khấu, phí vận chuyển và tổng tiền được lưu trong collection `orders`. Dự án chưa có thực thể hóa đơn điện tử độc lập hoặc tích hợp nhà cung cấp hóa đơn VAT; không nên hiểu nút “In hóa đơn” là phát hành hóa đơn điện tử.

## Ghi chú

- File `.env` không được đưa vào ZIP hoặc Git.
- JSON backup do chức năng sao lưu quản trị tạo ra chỉ là file xuất tải về, không phải nguồn database.
- JWT token và mã phiên giỏ hàng nằm ở trình duyệt; nội dung giỏ hàng được lưu trong MongoDB.
