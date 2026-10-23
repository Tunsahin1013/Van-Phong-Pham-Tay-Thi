# Khôi phục source Tây Thi (Epic 12 và các chức năng đã bổ sung)

Bản phục hồi này được dựng từ snapshot source đã qua kiểm tra TypeScript (`npm run lint` thành công trong môi trường tạo gói). Nó bao gồm source frontend/backend và các chức năng hiện có: thiết kế header/banner, mega menu, gỡ ví điện tử khỏi luồng sử dụng, Epic 12, báo cáo US72/US73, biểu đồ doanh thu ngày/tháng/năm và chức năng chỉnh sửa/phản hồi đánh giá.

## Trước khi áp dụng
1. Dừng server bằng `Ctrl+C`.
2. Sao chép toàn bộ thư mục dự án hiện tại làm backup.
3. Giữ riêng file `.env` hiện tại và `data/db.json` cục bộ nếu bạn cần dữ liệu fallback. Hai file này cố ý KHÔNG có trong ZIP để tránh phát tán URI/mật khẩu và dữ liệu cá nhân.
4. Giải nén nội dung ZIP vào thư mục gốc của dự án, nơi có `package.json`. ZIP không chứa `.git`, `node_modules`, `dist`, `.env`, hoặc `data/db.json`; vì vậy nó không thay Git history, không thay cấu hình môi trường và không ghi đè file dữ liệu cục bộ.

## Cài/chạy lại
```powershell
npm install
npm run lint
npm run build
npm run dev
```

Nếu `npm run lint` có lỗi, đừng commit/push; lưu lại toàn bộ log và kiểm tra file/line được báo. Build cần chạy trong môi trường Windows cục bộ vì build trong môi trường đóng gói Linux có thể bị chặn bởi quyền thực thi native Vite/Rolldown.

## MongoDB Atlas
- Mở `.env` cục bộ và giữ nguyên biến `MONGODB_URI` hiện có (không chia sẻ file).
- Log mong đợi: `Connected to MongoDB Atlas successfully!`. Nếu thấy `Falling back to persistent JSON Data Store`, không thực hiện cập nhật dữ liệu demo trước khi kiểm tra kết nối Atlas.
- Không chạy `seedMongo.ts` hoặc `import-json-to-mongodb.mjs` nếu chưa sao lưu Atlas và chưa xác nhận các script không tạo trùng/ghi đè dữ liệu.

## GitHub
Sau khi chạy thử, dùng `git status --short` rà từng file. Không chạy `git add .` theo thói quen nếu còn file secrets hoặc dữ liệu. Chỉ commit source đã kiểm tra.
