import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext.tsx';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import { CartProvider } from './contexts/CartContext.tsx';
import { NotificationProvider } from './contexts/NotificationContext.tsx';
import { Header } from './components/Header.tsx';
import { Footer } from './components/Footer.tsx';
import { ChatWidget } from './components/ChatWidget.tsx';
import { AuthModal } from './components/AuthModal.tsx';

// Customer Pages
import { HomePage } from './pages/customer/HomePage.tsx';
import { ProductsPage } from './pages/customer/ProductsPage.tsx';
import { ProductDetailPage } from './pages/customer/ProductDetailPage.tsx';
import { CartPage } from './pages/customer/CartPage.tsx';
import { CheckoutPage } from './pages/customer/CheckoutPage.tsx';
import { OrdersPage } from './pages/customer/OrdersPage.tsx';
import { WalletPage } from './pages/customer/WalletPage.tsx';
import { VouchersPage } from './pages/customer/VouchersPage.tsx';

// Staff & Admin Pages
import { EmployeeDashboard } from './pages/employee/EmployeeDashboard.tsx';
import { AdminDashboard } from './pages/admin/AdminDashboard.tsx';

// Protected Route Guard
const ProtectedRoute: React.FC<{
  allowedRoles: Array<'ADMIN' | 'EMPLOYEE' | 'CUSTOMER'>;
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#dc2626', marginBottom: 12 }}>
          Quyền truy cập bị từ chối (403 Forbidden)
        </h2>
        <p style={{ color: '#64748b', marginBottom: 24 }}>
          Tài khoản của bạn ({currentUser.role}) không có quyền truy cập vào phân hệ này. Vui lòng chuyển sang tài khoản có quyền tương ứng trên thanh Demo Bar.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <>{children}</>;
};

const MainLayout: React.FC = () => {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header onOpenAuthModal={() => setAuthModalOpen(true)} />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/vouchers" element={<VouchersPage />} />

          {/* Employee Workspace */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute allowedRoles={['EMPLOYEE', 'ADMIN']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Management Suite */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Footer />
      <ChatWidget />
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <BrowserRouter>
              <MainLayout />
            </BrowserRouter>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
