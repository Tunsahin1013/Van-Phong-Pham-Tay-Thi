export const i18n = {
  appName: 'Stationery Shop',
  tagline: 'Hệ thống dịch vụ văn phòng phẩm chất lượng cao',
  currency: (amount: number) => {
    return (amount || 0).toLocaleString('vi-VN') + ' đ';
  },
  formatDate: (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  },
  orderStatus: {
    PENDING: { label: 'Chờ xác nhận', color: '#f59e0b', bg: '#fef3c7' },
    CONFIRMED: { label: 'Đã xác nhận', color: '#3b82f6', bg: '#dbeafe' },
    PREPARING: { label: 'Đang đóng gói', color: '#8b5cf6', bg: '#ede9fe' },
    SHIPPING: { label: 'Đang giao hàng', color: '#0284c7', bg: '#e0f2fe' },
    COMPLETED: { label: 'Giao thành công', color: '#10b981', bg: '#d1fae5' },
    CANCELLED: { label: 'Đã hủy đơn', color: '#ef4444', bg: '#fee2e2' },
  },
  paymentStatus: {
    UNPAID: { label: 'Chưa thanh toán', color: '#f59e0b', bg: '#fef3c7' },
    PAID: { label: 'Đã thanh toán', color: '#10b981', bg: '#d1fae5' },
    REFUNDED: { label: 'Đã hoàn tiền', color: '#6b7280', bg: '#f3f4f6' },
  },
  paymentMethods: {
    COD: 'Thanh toán tiền mặt khi nhận hàng (COD)',
    WALLET: 'Thanh toán bằng ví Stationery Pay',
    BANKING: 'Chuyển khoản QR Ngân hàng 24/7',
  },
  roles: {
    ADMIN: 'Quản trị viên',
    EMPLOYEE: 'Nhân viên hệ thống',
    CUSTOMER: 'Khách hàng',
  },
};
