export type OrderPrintDocument = 'INVOICE' | 'DELIVERY' | 'STOCK_OUT';

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char] || char));
}

export function printOrderDocument(order: any, type: OrderPrintDocument, storeName = 'Văn phòng phẩm Tây Thi') {
  const title = type === 'INVOICE' ? 'HÓA ĐƠN BÁN HÀNG' : type === 'DELIVERY' ? 'PHIẾU GIAO HÀNG' : 'PHIẾU XUẤT KHO';
  const rows = (Array.isArray(order?.items) ? order.items : []).map((item: any, index: number) => `
    <tr><td>${index + 1}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.code || '')}</td><td class="num">${Number(item.quantity || 0)}</td><td class="num">${Number(item.price || 0).toLocaleString('vi-VN')} đ</td><td class="num">${(Number(item.quantity || 0) * Number(item.price || 0)).toLocaleString('vi-VN')} đ</td></tr>
  `).join('');
  const isStockSlip = type === 'STOCK_OUT';
  const win = window.open('', '_blank', 'width=980,height=760');
  if (!win) {
    window.alert('Trình duyệt đang chặn cửa sổ in. Hãy cho phép pop-up cho trang này rồi thử lại.');
    return;
  }
  win.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${title} ${escapeHtml(order?.orderCode)}</title>
  <style>body{font:14px Arial,sans-serif;color:#111;padding:28px;max-width:1000px;margin:auto}h1{text-align:center;font-size:23px;margin:8px 0 24px}h2{font-size:17px;margin:0 0 6px}.muted{color:#555;font-size:12px}.meta{display:grid;grid-template-columns:1fr 1fr;gap:8px 30px;margin:20px 0}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #bbb;padding:9px 8px;vertical-align:top}th{background:#f2f2f2;text-align:left}.num{text-align:right;white-space:nowrap}.total{margin:18px 0 0 auto;width:320px}.total div{display:flex;justify-content:space-between;padding:5px 0}.sign{display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;margin-top:60px;gap:24px}.sign strong{display:block;margin-bottom:60px}@media print{body{padding:0}.no-print{display:none}}</style></head><body>
  <div><h2>${escapeHtml(storeName)}</h2><div class="muted">${isStockSlip ? 'Chứng từ nội bộ kho' : 'Văn phòng phẩm chính hãng'}</div></div>
  <h1>${title}</h1><div class="meta">
  <div><strong>Mã đơn:</strong> ${escapeHtml(order?.orderCode)}</div><div><strong>Ngày lập:</strong> ${new Date().toLocaleString('vi-VN')}</div>
  <div><strong>Khách hàng:</strong> ${escapeHtml(order?.customerName)}</div><div><strong>Số điện thoại:</strong> ${escapeHtml(order?.customerPhone)}</div>
  <div style="grid-column:1/-1"><strong>Địa chỉ:</strong> ${escapeHtml(order?.shippingAddress)}</div>
  ${isStockSlip ? `<div><strong>Mã phiếu xuất:</strong> ${escapeHtml(order?.stockOutSlipCode || `PX-${order?.orderCode}`)}</div><div><strong>Người lập:</strong> ${escapeHtml(order?.stockOutSlipCreatedBy || 'Nhân viên')}</div>` : `<div><strong>Thanh toán:</strong> ${escapeHtml(order?.paymentMethod)} / ${escapeHtml(order?.paymentStatus)}</div><div><strong>Trạng thái:</strong> ${escapeHtml(order?.orderStatus)}</div>`}
  </div><table><thead><tr><th>#</th><th>Sản phẩm</th><th>Mã SP</th><th class="num">SL</th><th class="num">Đơn giá</th><th class="num">Thành tiền</th></tr></thead><tbody>${rows}</tbody></table>
  ${isStockSlip ? '' : `<div class="total"><div><span>Tạm tính</span><strong>${Number(order?.subtotal || 0).toLocaleString('vi-VN')} đ</strong></div><div><span>Giảm giá</span><strong>${Number(order?.discount || 0).toLocaleString('vi-VN')} đ</strong></div><div><span>Phí vận chuyển</span><strong>${Number(order?.shippingFee || 0).toLocaleString('vi-VN')} đ</strong></div><div style="border-top:2px solid #111;font-size:16px"><span>Tổng cộng</span><strong>${Number(order?.total || 0).toLocaleString('vi-VN')} đ</strong></div></div>`}
  <div class="sign"><div><strong>Người lập phiếu</strong><span class="muted">(Ký, ghi rõ họ tên)</span></div><div><strong>Người giao/nhận</strong><span class="muted">(Ký, ghi rõ họ tên)</span></div><div><strong>Khách hàng</strong><span class="muted">(Ký, ghi rõ họ tên)</span></div></div>
  <button class="no-print" onclick="window.print()">In tài liệu</button><script>window.onload=()=>setTimeout(()=>window.print(),300)</script></body></html>`);
  win.document.close();
}
