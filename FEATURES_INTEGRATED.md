# Features included in this rebuild

## UI and storefront
- Red / black / industrial-grey design direction.
- Horizontal category navigation and multi-column mega menu sourced from real category API data.
- Product list layout without fixed left category sidebar; filtering remains available through toolbar controls.
- Hero content uses `src/bannerSlides.ts` so a stale `heroSlides` array in MongoDB does not override current banner image URLs.
- Store settings (name, logo, hotline, address, email) exposed safely for Header/Footer; admin edit is protected.

## Reviews
- Customer can edit their own review for up to seven days after creation.
- Backend verifies authentication, role, ownership, rating/comment validity and edit deadline.
- Admin can reply/update/delete a reply independently from the review, and moderate or delete reviews.
- Product rating totals recalculate after edits/status changes/deletion.

## Admin reports and data operations
- US72: low-stock/out-of-stock and slow-moving product reports with configurable window/thresholds.
- US73: new-customer report and repeat-purchaser ranking.
- Revenue trend dropdown: daily (30 days), monthly (12 months), yearly (6 years), calculated from completed and not-refunded orders.
- US75: admin JSON backup export.
- US76: CSV order/revenue export with date filters.
- US77: system activity logs and API failure/mutation audit.
- US78: store information settings.
- US72 tables are scrollable and can be dragged to swap their positions within the report section.

## E-wallet removal
- No wallet customer page or active wallet API route is shipped.
- Old `/wallet` frontend route redirects to `/vouchers`.
- Checkout no longer offers wallet payment; legacy wallet fields remain only for compatibility with historical data.

## Safety / environment
- No `.env`, `.files.env`, `.git`, `node_modules`, `dist`, or `data/db.json` in this archive.
- The apply script preserves the user's local `.env`, `.git`, node_modules and existing JSON snapshot.

## Epic 7 – Đánh giá sản phẩm (US44, US45)
- US44: khách hàng sửa đánh giá của chính mình trong 7 ngày; backend xác minh role, quyền sở hữu, thời hạn và dữ liệu nhập.
- US45: Admin gửi/cập nhật/xóa phản hồi của cửa hàng mà không xóa đánh giá gốc; phản hồi hiển thị trên trang sản phẩm.
- Chi tiết và checklist kiểm thử: `EPIC7_US44_US45.md`.
