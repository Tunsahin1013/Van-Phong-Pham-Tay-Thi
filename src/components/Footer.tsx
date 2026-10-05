import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Phone, Mail, MapPin, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer">
      <div className="container">
        {/* Top 4 Core Commitments */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24, paddingBottom: 40, marginBottom: 40, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Award size={36} color="#38bdf8" />
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 15 }}>100% Chính Hãng</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Cam kết nguồn gốc xuất xứ</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Truck size={36} color="#38bdf8" />
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 15 }}>Giao Hỏa Tốc 2H</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Miễn phí từ đơn 300K</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <RefreshCw size={36} color="#38bdf8" />
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 15 }}>Đổi Trả 7 Ngày</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Thủ tục nhanh chóng tiện lợi</div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ShieldCheck size={36} color="#38bdf8" />
            <div>
              <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 15 }}>Hóa Đơn VAT Đỏ</div>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Xuất đầy đủ cho doanh nghiệp</div>
            </div>
          </div>
        </div>

        {/* Footer Navigation Columns */}
        <div className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff' }}>
                <Layers size={20} />
              </div>
              <span style={{ fontSize: 20, fontWeight: 800, color: '#ffffff' }}>Tây Thi Stationery</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, marginBottom: 20, color: '#94a3b8' }}>
              Hệ thống cung cấp giải pháp văn phòng phẩm trọn gói cho học sinh, sinh viên và doanh nghiệp. Chất lượng đỉnh cao, giá thành cạnh tranh nhất thị trường.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={16} color="#38bdf8" /> 10 Ngõ 226 Cầu Giấy, Nghĩa Đô, Cầu Giấy, Hà Nội
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Phone size={16} color="#38bdf8" /> Hotline: 1900 6868 - (028) 3823 4850
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mail size={16} color="#38bdf8" /> Email: lienhe@stationery.vn
              </div>
            </div>
          </div>

          <div>
            <h4 className="footer-title">Danh Mục Hàng Đầu</h4>
            <ul className="footer-links">
              <li><Link to="/products?categoryId=cat_but">Bút Bi & Bút Gel</Link></li>
              <li><Link to="/products?categoryId=cat_vo">Vở Học Sinh Campus</Link></li>
              <li><Link to="/products?categoryId=cat_giay">Giấy In Double A A4</Link></li>
              <li><Link to="/products?categoryId=cat_so_tay">Sổ Tay Bìa Da Khóa Từ</Link></li>
              <li><Link to="/products?categoryId=cat_dung_cu_van_phong">Dụng Cụ Văn Phòng Deli</Link></li>
              <li><Link to="/products?categoryId=cat_file_bia">Bìa Còng & File Tài Liệu</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Chính Sách & Hỗ Trợ</h4>
            <ul className="footer-links">
              <li><Link to="/orders">Tra Cứu Tiến Độ Đơn Hàng</Link></li>
              <li><Link to="/vouchers">Mã Khuyến Mãi & Giảm Giá</Link></li>
              <li><Link to="/wallet">Ví Tiền & Điểm Thưởng</Link></li>
              <li><a href="#policy">Chính Sách Đổi Trả & Bảo Hành</a></li>
              <li><a href="#business">Hợp Đồng Khách Hàng Doanh Nghiệp</a></li>
              <li><a href="#faq">Câu Hỏi Thường Gặp (FAQ)</a></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Nhận Bản Tin Ưu Đãi</h4>
            <p style={{ fontSize: 13, marginBottom: 14 }}>Đăng ký nhận mã giảm giá 50.000đ và các đợt flash sale văn phòng phẩm lớn trong tháng.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="email"
                placeholder="Nhập email của bạn..."
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.15)',
                  backgroundColor: 'rgba(255,255,255,0.05)',
                  color: '#ffffff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
              <button className="btn-primary" style={{ padding: '10px 16px', fontSize: 13 }}>Gửi</button>
            </div>
            <div style={{ marginTop: 20, fontSize: 12, color: '#64748b' }}>
              Phương thức thanh toán hỗ trợ: Tiền mặt COD, Ví Stationery Pay, QR Ngân hàng Napas 247, Momo, VNPAY.
            </div>
          </div>
        </div>

        {/* Footer Bottom Copyright */}
        <div className="footer-bottom">
          <div>© 2026 Stationery Shop. Đề tài: Phát triển website dịch vụ bán văn phòng phẩm.</div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Phát triển phần mềm hướng dịch vụ</span>
            <span>•</span>
            <span>REST API & Express</span>
            <span>•</span>
            <span>MongoDB / JSON Fallback</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
