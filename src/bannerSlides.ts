export interface BannerSlide {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText: string;
  secondaryCtaLink: string;
  image: string;
  accentColor: string;
}

export const bannerSlides: BannerSlide[] = [
  {
    id: 'slide_1',
    badge: 'MÙA TỰU TRƯỜNG & VĂN PHÒNG MỚI',
    title: 'Khởi Đầu Hoàn Hảo Cùng Dụng Cụ Chính Hãng',
    subtitle: 'Ưu đãi lên đến 35% toàn bộ sản phẩm bút viết, sổ tay & giấy in',
    description: 'Tập hợp các thương hiệu văn phòng phẩm hàng đầu thế giới: Thiên Long, Pentel, Deli, Campus, Double A.',
    ctaText: 'Khám Phá Ngay',
    ctaLink: '/products',
    secondaryCtaText: 'Xem Mã Giảm Giá',
    secondaryCtaLink: '/vouchers',
    image: 'https://i.pinimg.com/1200x/e4/d7/80/e4d78032c15d420f124561020ee1cb55.jpg?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#F21D2F',
  },
  {
    id: 'slide_2',
    badge: 'GIẤY IN & BÌA HỒ SƠ DOANH NGHIỆP',
    title: 'Giải Pháp Văn Phòng Phẩm Trọn Gói',
    subtitle: 'Chiết khấu hấp dẫn cho đơn hàng công ty, giao nhanh 2H nội thành',
    description: 'Tiết kiệm chi phí vận hành với nguồn hàng chuẩn trực tiếp từ các tổng đại lý và nhà sản xuất.',
    ctaText: 'Đặt Hàng Doanh Nghiệp',
    ctaLink: '/products?categoryId=cat_giay',
    secondaryCtaText: 'Chính Sách Chiết Khấu',
    secondaryCtaLink: '/products',
    image: 'https://i.pinimg.com/736x/3a/1b/61/3a1b6158528318b4f5391e93c7fffb78.jpg?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#059669',
  },
  {
    id: 'slide_3',
    badge: 'PHỤ KIỆN BÀN HỌC & DESK SETUP',
    title: 'Không Gian Làm Việc Sáng Tạo',
    subtitle: 'Đèn chống cận, thảm lót da PU, kệ mica và sổ tay cao cấp',
    description: 'Biến góc học tập và làm việc của bạn thành không gian tràn đầy cảm hứng sáng tạo mỗi ngày.',
    ctaText: 'Xem Phụ Kiện Bàn Học',
    ctaLink: '/products?categoryId=cat_phu_kien_ban_hoc',
    secondaryCtaText: 'Mua Thêm Sổ Tay',
    secondaryCtaLink: '/products?categoryId=cat_so_tay',
    image: 'https://i.pinimg.com/736x/84/63/65/8463656b904d9a74937ca802a0098bf0.jpg?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#7c3aed',
  },
];
