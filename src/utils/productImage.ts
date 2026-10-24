/**
 * Local product artwork keyed by SKU. The mapping deliberately does not touch
 * bannerSlides.ts: banner images remain exactly as authored there.
 *
 * Some records already stored in MongoDB or localStorage still have old image
 * URLs. Resolve them at render time by SKU / product id / product name so the
 * catalogue is corrected without mutating existing customer/order data.
 */
export interface ProductImageRecord {
  id?: unknown;
  productId?: unknown;
  code?: unknown;
  name?: unknown;
  image?: unknown;
}

const IMAGE_BY_CODE: Record<string, string> = {
  'BUT-TL-B01': '/images/products/BUT-TL-B01.webp',
  'BUT-TL-027': '/images/products/BUT-TL-027.webp',
  'BUT-DELI-HL06': '/images/products/BUT-DELI-HL06.webp',
  'BUT-PENT-GG1000': '/images/products/BUT-PENT-GG1000.webp',
  'VO-CAMP-120': '/images/products/VO-CAMP-120.webp',
  'VO-HH-96': '/images/products/VO-HH-96.webp',
  'SO-DELI-A5DA': '/images/products/SO-DELI-A5DA.webp',
  'SO-KLAW-A5DOT': '/images/products/SO-KLAW-A5DOT.webp',
  'GIAY-DA-A470': '/images/products/GIAY-DA-A470.webp',
  'GIAY-IK-A480': '/images/products/GIAY-IK-A480.webp',
  'DCHT-DELI-THUOC4': '/images/products/DCHT-DELI-THUOC4.webp',
  'DCHT-DELI-COMPA': '/images/products/DCHT-DELI-COMPA.webp',
  'DCVP-DELI-BAM10': '/images/products/DCVP-DELI-BAM10.webp',
  'DCVP-DELI-KEP25': '/images/products/DCVP-DELI-KEP25.webp',
  'DCVP-DELI-KEO18': '/images/products/DCVP-DELI-KEO18.webp',
  'DCVP-DELI-DUC20': '/images/products/DCVP-DELI-DUC20.webp',
  'DDHS-DELI-BALO': '/images/products/DDHS-DELI-BALO.webp',
  'DDHS-CANVAS-HB': '/images/products/DDHS-CANVAS-HB.webp',
  'DDCS-DELI-KE3N': '/images/products/DDCS-DELI-KE3N.webp',
  'DDCS-BANG-6080': '/images/products/DDCS-BANG-6080.webp',
  'BIA-KJ-A47CM': '/images/products/BIA-KJ-A47CM.webp',
  'BIA-DELI-NUT10': '/images/products/BIA-DELI-NUT10.webp',
  'PKBH-DEN-LED3C': '/images/products/PKBH-DEN-LED3C.webp',
  'PKBH-THAM-DA80': '/images/products/PKBH-THAM-DA80.webp',
  'DCHT-DELI-GOT0620': '/images/products/DCHT-DELI-GOT0620.webp',
  'DCVP-PLUS-XOAKEO': '/images/products/DCVP-PLUS-XOAKEO.webp',
  'BUT-PENT-BL407': '/images/products/BUT-PENT-BL407.webp',
  'SO-DELI-NOTE76': '/images/products/SO-DELI-NOTE76.webp',
  'DCVP-DELI-BK2M': '/images/products/DCVP-DELI-BK2M.webp',
  'DCHT-STAED-GOM': '/images/products/DCHT-STAED-GOM.webp',
  'BIA-PLUS-LA10': '/images/products/BIA-PLUS-LA10.webp',
  'PKBH-DELI-GIA4016': '/images/products/PKBH-DELI-GIA4016.webp',
};

const IMAGE_BY_ID: Record<string, string> = {
  'prod_1': '/images/products/BUT-TL-B01.webp',
  'prod_2': '/images/products/BUT-TL-027.webp',
  'prod_3': '/images/products/BUT-DELI-HL06.webp',
  'prod_4': '/images/products/BUT-PENT-GG1000.webp',
  'prod_5': '/images/products/VO-CAMP-120.webp',
  'prod_6': '/images/products/VO-HH-96.webp',
  'prod_7': '/images/products/SO-DELI-A5DA.webp',
  'prod_8': '/images/products/SO-KLAW-A5DOT.webp',
  'prod_9': '/images/products/GIAY-DA-A470.webp',
  'prod_10': '/images/products/GIAY-IK-A480.webp',
  'prod_11': '/images/products/DCHT-DELI-THUOC4.webp',
  'prod_12': '/images/products/DCHT-DELI-COMPA.webp',
  'prod_13': '/images/products/DCVP-DELI-BAM10.webp',
  'prod_14': '/images/products/DCVP-DELI-KEP25.webp',
  'prod_15': '/images/products/DCVP-DELI-KEO18.webp',
  'prod_16': '/images/products/DCVP-DELI-DUC20.webp',
  'prod_17': '/images/products/DDHS-DELI-BALO.webp',
  'prod_18': '/images/products/DDHS-CANVAS-HB.webp',
  'prod_19': '/images/products/DDCS-DELI-KE3N.webp',
  'prod_20': '/images/products/DDCS-BANG-6080.webp',
  'prod_21': '/images/products/BIA-KJ-A47CM.webp',
  'prod_22': '/images/products/BIA-DELI-NUT10.webp',
  'prod_23': '/images/products/PKBH-DEN-LED3C.webp',
  'prod_24': '/images/products/PKBH-THAM-DA80.webp',
  'prod_25': '/images/products/DCHT-DELI-GOT0620.webp',
  'prod_26': '/images/products/DCVP-PLUS-XOAKEO.webp',
  'prod_27': '/images/products/BUT-PENT-BL407.webp',
  'prod_28': '/images/products/SO-DELI-NOTE76.webp',
  'prod_29': '/images/products/DCVP-DELI-BK2M.webp',
  'prod_30': '/images/products/DCHT-STAED-GOM.webp',
  'prod_31': '/images/products/BIA-PLUS-LA10.webp',
  'prod_32': '/images/products/PKBH-DELI-GIA4016.webp',
};

const NAME_IMAGE_MATCHES: Array<[string, string]> = [
  ['bút gel thiên long bizner', '/images/products/BUT-TL-B01.webp'],
  ['bút bi thiên long tl-027', '/images/products/BUT-TL-027.webp'],
  ['bút dạ quang', '/images/products/BUT-DELI-HL06.webp'],
  ['graphgear', '/images/products/BUT-PENT-GG1000.webp'],
  ['campus adventure', '/images/products/VO-CAMP-120.webp'],
  ['hồng hà school', '/images/products/VO-HH-96.webp'],
  ['sổ tay bìa da', '/images/products/SO-DELI-A5DA.webp'],
  ['klaw', '/images/products/SO-KLAW-A5DOT.webp'],
  ['double a', '/images/products/GIAY-DA-A470.webp'],
  ['ik plus', '/images/products/GIAY-IK-A480.webp'],
  ['thước kẻ kỹ thuật', '/images/products/DCHT-DELI-THUOC4.webp'],
  ['compa học sinh', '/images/products/DCHT-DELI-COMPA.webp'],
  ['dập ghim', '/images/products/DCVP-DELI-BAM10.webp'],
  ['kẹp bướm', '/images/products/DCVP-DELI-KEP25.webp'],
  ['kéo cắt giấy', '/images/products/DCVP-DELI-KEO18.webp'],
  ['đục lỗ', '/images/products/DCVP-DELI-DUC20.webp'],
  ['balo chống gù', '/images/products/DDHS-DELI-BALO.webp'],
  ['canvas', '/images/products/DDHS-CANVAS-HB.webp'],
  ['kệ đựng hồ sơ', '/images/products/DDCS-DELI-KE3N.webp'],
  ['bảng từ trắng', '/images/products/DDCS-BANG-6080.webp'],
  ['kingjim', '/images/products/BIA-KJ-A47CM.webp'],
  ['bìa nút', '/images/products/BIA-DELI-NUT10.webp'],
  ['đèn bàn học led', '/images/products/PKBH-DEN-LED3C.webp'],
  ['thảm trải bàn', '/images/products/PKBH-THAM-DA80.webp'],
  ['gọt bút chì', '/images/products/DCHT-DELI-GOT0620.webp'],
  ['whiper', '/images/products/DCVP-PLUS-XOAKEO.webp'],
  ['energel', '/images/products/BUT-PENT-BL407.webp'],
  ['sticky note', '/images/products/SO-DELI-NOTE76.webp'],
  ['giấy ghi chú', '/images/products/SO-DELI-NOTE76.webp'],
  ['băng keo hai mặt', '/images/products/DCVP-DELI-BK2M.webp'],
  ['staedtler', '/images/products/DCHT-STAED-GOM.webp'],
  ['bìa lá nhựa a4 plus', '/images/products/BIA-PLUS-LA10.webp'],
  ['giá đỡ sách', '/images/products/PKBH-DELI-GIA4016.webp'],
 ];

function normalizeName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function getProductImage(product?: ProductImageRecord | null): string {
  if (!product) return '/images/products/BUT-TL-B01.webp';

  const code = String(product.code ?? '').trim().toUpperCase();
  if (code && IMAGE_BY_CODE[code]) return IMAGE_BY_CODE[code];

  const id = String(product.productId ?? product.id ?? '').trim();
  if (id && IMAGE_BY_ID[id]) return IMAGE_BY_ID[id];

  const name = normalizeName(String(product.name ?? ''));
  if (name) {
    for (const [needle, image] of NAME_IMAGE_MATCHES) {
      if (name.includes(normalizeName(needle))) return image;
    }
  }

  const existingImage = typeof product.image === 'string' ? product.image.trim() : '';
  return existingImage || '/images/products/BUT-TL-B01.webp';
}
