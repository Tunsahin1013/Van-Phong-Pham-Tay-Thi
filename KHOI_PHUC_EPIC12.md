# Khôi phục source Tây Thi (Epic 12 và các chức năng đã bổ sung)

Bản phục hồi này được dựng từ snapshot source đã qua kiểm tra TypeScript (`npm run lint` thành công trong môi trường tạo gói). Nó bao gồm source frontend/backend và các chức năng hiện có: thiết kế header/banner, mega menu, gỡ ví điện tử khỏi luồng sử dụng, Epic 12, báo cáo US72/US73, biểu đồ doanh thu ngày/tháng/năm và chức năng chỉnh sửa/phản hồi đánh giá.

## Trước khi áp dụng
1. Dừng server bằng `Ctrl+C`.
2. Sao chép toàn bộ thư mục dự án hiện tại làm backup.
3. Không đưa `.env` lên GitHub. Snapshot JSON cũ đã được đổi tên thành `data/db.legacy.backup` và chỉ dùng cho migration một lần sang MongoDB Atlas.
4. Giải nén nội dung ZIP vào thư mục gốc của dự án, nơi có `package.json`. ZIP không chứa `.git`, `node_modules`, `dist` hoặc `.env`; vì vậy nó không thay Git history hay cấu hình môi trường.

## Cài/chạy lại
```powershell
npm install
npm run lint
npm run build
npm run migrate:mongo
npm run dev
```

Nếu `npm run lint` có lỗi, đừng commit/push; lưu lại toàn bộ log và kiểm tra file/line được báo. Build cần chạy trong môi trường Windows cục bộ vì build trong môi trường đóng gói Linux có thể bị chặn bởi quyền thực thi native Vite/Rolldown.

## MongoDB Atlas
- Tạo `.env` từ `.env.example`, điền `MONGODB_URI` và `JWT_SECRET` thật; không chia sẻ file này.
- Chạy `npm run migrate:mongo` để nhập dữ liệu legacy một lần và đồng bộ collection. Script ưu tiên dữ liệu MongoDB nếu trùng ID.
- Log mong đợi: `Đã kết nối MongoDB Atlas` và `MongoDB Atlas là nguồn dữ liệu chính`. Nếu Atlas không kết nối, server sẽ dừng; không có JSON fallback.

## GitHub
Sau khi chạy thử, dùng `git status --short` rà từng file. Không chạy `git add .` theo thói quen nếu còn file secrets hoặc dữ liệu. Chỉ commit source đã kiểm tra.
