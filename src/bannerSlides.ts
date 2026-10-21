export interface BannerSlide {
  id: string;
  badge: string;
  title: string;
  /** Optional second headline line highlighted in the brand crimson. */
  accentTitle?: string;
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
    badge: 'VĂN PHÒNG PHẨM CHO MỌI THẾ HỆ',
    title: 'ĐỒ DÙNG HỌC TẬP',
    accentTitle: 'CHO MỌI ƯỚC MƠ',
    subtitle: 'Đa dạng sản phẩm · Chất lượng đảm bảo · Giá tốt mỗi ngày',
    description: 'Từ chiếc bút nhỏ đến góc học tập hoàn chỉnh — chọn đúng dụng cụ, sẵn sàng cho những ý tưởng lớn.',
    ctaText: 'Khám phá ngay',
    ctaLink: '/products',
    secondaryCtaText: 'Xem ưu đãi',
    secondaryCtaLink: '/vouchers',
    image: 'https://i.pinimg.com/1200x/e4/d7/80/e4d78032c15d420f124561020ee1cb55.jpg?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#F21D2F',
  },
  {
    id: 'slide_2',
    badge: 'GIẢI PHÁP DÀNH CHO DOANH NGHIỆP',
    title: 'VẬN HÀNH GỌN GÀNG',
    accentTitle: 'TỐI ƯU MỖI NGÀY',
    subtitle: 'Văn phòng phẩm chính hãng, chiết khấu hấp dẫn',
    description: 'Nguồn hàng đáng tin cậy cho văn phòng, trường học và đội ngũ của bạn — giao nhanh, đặt hàng thuận tiện.',
    ctaText: 'Mua cho doanh nghiệp',
    ctaLink: '/products?categoryId=cat_giay',
    secondaryCtaText: 'Xem ưu đãi',
    secondaryCtaLink: '/vouchers',
    image: 'https://i.pinimg.com/736x/3a/1b/61/3a1b6158528318b4f5391e93c7fffb78.jpg?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#F21D2F',
  },
  {
    id: 'slide_3',
    badge: 'GÓC HỌC TẬP  /  GÓC SÁNG TẠO',
    title: 'SẮP XẾP KHÔNG GIAN',
    accentTitle: 'BẬT CHẤT RIÊNG',
    subtitle: 'Phụ kiện đẹp mắt, tiện dụng cho từng góc bàn',
    description: 'Tạo một góc học tập và làm việc có tổ chức với những món đồ hữu ích, tinh gọn và đầy cảm hứng.',
    ctaText: 'Khám phá phụ kiện',
    ctaLink: '/products?categoryId=cat_phu_kien_ban_hoc',
    secondaryCtaText: 'Khám phá sổ tay',
    secondaryCtaLink: '/products?categoryId=cat_so_tay',
    image: 'https://i.pinimg.com/736x/84/63/65/8463656b904d9a74937ca802a0098bf0.jpg?auto=format&fit=crop&w=1200&q=80',
    accentColor: '#F21D2F',
  },
];
