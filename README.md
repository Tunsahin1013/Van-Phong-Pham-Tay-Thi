# Tây Thi Stationery - Website Dịch Vụ Bán Văn Phòng Phẩm

Dự án phục vụ môn học: **Phát triển phần mềm hướng dịch vụ**  
Đề tài: **Phát triển website dịch vụ bán văn phòng phẩm trực tuyến**  
Tên hệ thống: **Tây Thi Stationery**

---

## 1. Yêu Cầu Hệ Thống (Requirements)

- **Node.js**: Phiên bản 18+ hoặc 20+
- **npm**: Phiên bản 9+ hoặc yarn/pnpm
- **Hệ điều hành**: Windows, macOS, hoặc Linux
- **Trình duyệt**: Chrome, Firefox, Safari, Edge (khuyến nghị màn hình chuẩn từ 1366px trở lên hoặc kiểm tra responsive trên mobile/tablet)

---

## 2. Công Nghệ Sử Dụng (Tech Stack)

### Frontend:
- **React 18 / 19** & **Vite 5 / 6**
- **React Router DOM v6** (Định tuyến SPA)
- **CSS thuần** (`src/styles.css` - Thiết kế hiện đại, responsive, không phụ thuộc Tailwind)
- **Lucide React** (Bộ biểu tượng hiện đại)
- **Recharts** (Biểu đồ thống kê doanh thu, đơn hàng & sản phẩm)

### Backend:
- **Node.js** & **Express**
- **RESTful API** (Đầy đủ CRUD, cấu trúc Router - Controller - Service - Model)
- **JWT (JSON Web Token)** & **bcryptjs** (Mã hóa mật khẩu và xác thực đa phân quyền)
- **CORS** & **dotenv**

### Cơ Sở Dữ Liệu (Database):
- **MongoDB Atlas** (Mongoose ORM)
- **Cơ chế JSON Data Store Fallback** (Kế thừa từ kiến trúc Canteen-Goo): Khi không cấu hình chuỗi kết nối MongoDB Atlas, hệ thống tự động khởi tạo và lưu trữ liên tục vào `data/db.json` với đầy đủ tính năng CRUD, bảo đảm chạy độc lập 100% không bao giờ bị gián đoạn hay thiếu kết nối!

---

## 3. Cài Đặt (Installation)

Clone hoặc tải thư mục mã nguồn về máy:

```bash
git clone <repository_url>
cd stationery-shop
npm install
```

---

## 4. Cấu Hình Môi Trường (Environment)

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Các biến môi trường:

```env
PORT=3000
MONGODB_URI="" # Để trống để chạy chế độ JSON Fallback siêu tốc, hoặc nhập URI MongoDB Atlas
JWT_SECRET="stationery_shop_super_secret_jwt_key_2026"
```

---

## 5. Tài Khoản Mẫu Mặc Định (Sample Accounts)

Tất cả tài khoản mẫu đều có mật khẩu mặc định là: `123456`

| Vai trò | Email đăng nhập | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **QUẢN TRỊ VIÊN (ADMIN)** | `admin@stationery.vn` | `123456` | Dashboard Recharts, Quản lý sản phẩm, danh mục, đơn hàng, kho, nhà cung cấp, voucher, user, review, báo cáo |
| **NHÂN VIÊN (EMPLOYEE)** | `employee@stationery.vn` | `123456` | Bàn làm việc điều phối, xác nhận & đóng gói đơn hàng, nhập kho, chat trực tiếp với khách hàng |
| **KHÁCH HÀNG (CUSTOMER)** | `customer@stationery.vn` | `123456` | Mua sắm, giỏ hàng, áp mã voucher, thanh toán ví tiền/COD/QR, theo dõi đơn hàng, đánh giá sản phẩm |

*Ghi chú: Trên đầu website có thanh **"Chuyển đổi Role Demo"** giúp chuyển đổi nhanh giữa 3 tài khoản trên chỉ với 1 click chuột.*

---

## 6. Hướng Dẫn Chạy Ứng Dụng (Run Project)

### Chế độ Development (Full-stack Server + React Vite):
```bash
npm run dev
```
Truy cập: `http://localhost:3000`

### Chế độ Production Build:
```bash
npm run build
npm start
```

---

## 7. Danh Sách REST API Chính

### Xác Thực (Authentication):
- `POST /api/auth/register`: Đăng ký tài khoản khách hàng mới
- `POST /api/auth/login`: Đăng nhập & nhận JWT token
- `POST /api/auth/logout`: Đăng xuất
- `GET /api/auth/me`: Lấy thông tin tài khoản hiện tại
- `POST /api/auth/forgot-password`: Cấp lại mật khẩu
- `POST /api/auth/change-password`: Đổi mật khẩu

### Sản Phẩm (Products):
- `GET /api/products`: Danh sách sản phẩm (hỗ trợ search, categoryId, brand, minPrice, maxPrice, sort, page)
- `GET /api/products/:id`: Chi tiết sản phẩm
- `GET /api/products/featured`: Sản phẩm nổi bật
- `GET /api/products/best-sellers`: Sản phẩm bán chạy
- `POST /api/products`: Thêm sản phẩm mới (Admin/Employee)
- `PUT /api/products/:id`: Cập nhật sản phẩm (Admin/Employee)
- `DELETE /api/products/:id`: Xóa sản phẩm (Admin)

### Danh Mục (Categories):
- `GET /api/categories`: Danh sách 10 danh mục văn phòng phẩm
- `POST /api/categories`: Tạo danh mục mới
- `PUT /api/categories/:id`: Cập nhật danh mục
- `DELETE /api/categories/:id`: Xóa danh mục

### Đơn Hàng (Orders):
- `POST /api/orders`: Tạo đơn hàng mới (tự động trừ tồn kho, tính voucher & điểm thưởng)
- `GET /api/orders/my-orders`: Xem đơn hàng của khách hàng hiện tại
- `GET /api/orders`: Quản trị tất cả đơn hàng (Admin/Employee)
- `GET /api/orders/:id`: Chi tiết đơn hàng
- `PUT /api/orders/:id/status`: Đổi trạng thái (PENDING, CONFIRMED, PREPARING, SHIPPING, COMPLETED, CANCELLED)
- `POST /api/orders/:id/cancel`: Hủy đơn hàng

### Kho Hàng (Inventory):
- `GET /api/inventory/logs`: Lịch sử nhập - xuất - kiểm kê kho
- `GET /api/inventory/low-stock`: Cảnh báo sản phẩm sắp hết hàng (< 50)
- `POST /api/inventory/in`: Nhập kho bổ sung hàng hóa
- `POST /api/inventory/adjust`: Điều chỉnh số lượng tồn kho

### Ví Tiền & Điểm Thưởng (Wallet & Loyalty Points):
- `GET /api/wallet`: Số dư ví & điểm thưởng tích lũy
- `POST /api/wallet/deposit`: Nạp tiền vào ví qua cổng thanh toán
- `GET /api/wallet/transactions`: Lịch sử giao dịch nạp/thanh toán/hoàn tiền
- `POST /api/wallet/redeem-points`: Đổi điểm tích lũy lấy mã giảm giá

### Mã Giảm Giá (Vouchers):
- `GET /api/vouchers`: Danh sách voucher đang có hiệu lực
- `POST /api/vouchers/validate`: Kiểm tra và áp dụng mã giảm giá
- `POST /api/vouchers`: Tạo mã voucher mới (Admin)
- `DELETE /api/vouchers/:id`: Xóa mã voucher

### Đánh Giá (Reviews):
- `GET /api/reviews/product/:productId`: Lấy đánh giá của một sản phẩm
- `POST /api/reviews`: Khách hàng gửi đánh giá sau khi mua hàng
- `PUT /api/reviews/:id/status`: Kiểm duyệt ẩn/hiện đánh giá (Admin)

### Tin Nhắn Hỗ Trợ (Chat):
- `GET /api/chats`: Danh sách cuộc trò chuyện
- `POST /api/chats/init`: Khởi tạo hội thoại
- `GET /api/chats/:id/messages`: Lấy tin nhắn
- `POST /api/chats/:id/messages`: Gửi tin nhắn

### Báo Cáo & Thống Kê (Reports):
- `GET /api/reports/dashboard`: Dữ liệu tổng hợp cho biểu đồ Recharts (Doanh thu tháng, cơ cấu trạng thái đơn hàng, doanh số theo danh mục)

---

## 8. Cấu Trúc Thư Mục (Folder Structure)

```text
stationery-shop/
├── config/
│   └── db.ts                 # Kết nối MongoDB Atlas và Fallback engine
├── controllers/
│   ├── authController.ts
│   ├── productController.ts
│   ├── categoryController.ts
│   ├── orderController.ts
│   ├── cartController.ts
│   ├── inventoryController.ts
│   ├── voucherController.ts
│   ├── reviewController.ts
│   ├── walletController.ts
│   ├── notificationController.ts
│   ├── chatController.ts
│   ├── reportController.ts
│   ├── supplierController.ts
│   └── userController.ts
├── data/
│   ├── db.json               # Dữ liệu fallback tự động lưu trữ
│   └── seedData.ts           # Dữ liệu mẫu phong phú (30+ sản phẩm, 10 danh mục, đơn hàng...)
├── middleware/
│   └── auth.ts               # JWT verification & Role-based Authorization
├── models/
│   └── index.ts              # Mongoose Schemas (User, Product, Order, Inventory, v.v.)
├── routes/
│   ├── authRoutes.ts
│   ├── productRoutes.ts
│   ├── categoryRoutes.ts
│   ├── orderRoutes.ts
│   ├── cartRoutes.ts
│   ├── inventoryRoutes.ts
│   ├── voucherRoutes.ts
│   ├── reviewRoutes.ts
│   ├── walletRoutes.ts
│   ├── notificationRoutes.ts
│   ├── chatRoutes.ts
│   ├── reportRoutes.ts
│   ├── supplierRoutes.ts
│   ├── userRoutes.ts
│   └── index.ts              # Router tổng hợp gắn vào /api
├── services/
│   └── dataStore.ts          # Bộ xử lý dữ liệu chuẩn Canteen-Goo
├── src/
│   ├── components/           # Header, Footer, ProductCard, ChatWidget, AuthModal
│   ├── contexts/             # AuthContext, CartContext, NotificationContext, ToastContext
│   ├── pages/
│   │   ├── customer/         # HomePage, ProductsPage, ProductDetailPage, CartPage, CheckoutPage, OrdersPage, WalletPage, VouchersPage
│   │   ├── employee/         # EmployeeDashboard (Xử lý đơn, tồn kho, chat)
│   │   └── admin/            # AdminDashboard (Thống kê Recharts, CRUD 11 phân hệ)
│   ├── api.ts                # HTTP Client gọi REST API
│   ├── bannerSlides.ts       # Dữ liệu banner quảng cáo
│   ├── i18n.ts               # Định dạng tiền tệ, ngày tháng & nhãn tiếng Việt
│   ├── styles.css            # Toàn bộ CSS thuần hiện đại & responsive
│   ├── App.tsx               # Khai báo React Router DOM v6
│   └── main.tsx              # Điểm gắn kết React DOM
├── server.ts                 # Full-stack Express Server kết hợp Vite middleware
├── package.json
└── README.md
```
