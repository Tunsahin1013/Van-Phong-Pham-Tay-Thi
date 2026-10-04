import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, getStoredToken, setStoredToken } from '../api.ts';
import { useToast } from './ToastContext.tsx';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER';
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  loyaltyPoints: number;
  walletBalance: number;
  avatar?: string;
  createdAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  role: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER' | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; address?: string }) => Promise<void>;
  logout: () => void;
  switchRoleDemo: (targetRole: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showToast } = useToast();

  const refreshUser = useCallback(async () => {
    const curToken = getStoredToken();
    if (!curToken) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authAPI.getMe();
      if (res.success && res.user) {
        setCurrentUser(res.user);
      } else {
        setStoredToken(null);
        setToken(null);
        setCurrentUser(null);
      }
    } catch {
      setStoredToken(null);
      setToken(null);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await authAPI.login(credentials);
      if (res.success && res.token) {
        setStoredToken(res.token);
        setToken(res.token);
        setCurrentUser(res.user);
        showToast(`Đăng nhập thành công! Chào mừng ${res.user.name}`, 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Đăng nhập không thành công', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; address?: string }) => {
    setIsLoading(true);
    try {
      const res = await authAPI.register(data);
      if (res.success && res.token) {
        setStoredToken(res.token);
        setToken(res.token);
        setCurrentUser(res.user);
        showToast('Đăng ký tài khoản thành công! Tặng bạn 50K ưu đãi chào mừng.', 'success');
      }
    } catch (err: any) {
      showToast(err.message || 'Đăng ký không thành công', 'error');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authAPI.logout().catch(() => {});
    setStoredToken(null);
    setToken(null);
    setCurrentUser(null);
    showToast('Đã đăng xuất tài khoản', 'info');
  };

  // Quick switch role demo helper using the sample accounts
  const switchRoleDemo = async (targetRole: 'ADMIN' | 'EMPLOYEE' | 'CUSTOMER') => {
    setIsLoading(true);
    try {
      let email = 'customer@stationery.vn';
      if (targetRole === 'ADMIN') email = 'admin@stationery.vn';
      if (targetRole === 'EMPLOYEE') email = 'employee@stationery.vn';

      const res = await authAPI.login({ email, password: '123456' });
      if (res.success && res.token) {
        setStoredToken(res.token);
        setToken(res.token);
        setCurrentUser(res.user);
        showToast(`Đã chuyển đổi sang tài khoản demo: ${res.user.name} (${targetRole})`, 'success');
      }
    } catch (err: any) {
      showToast('Không thể chuyển role: ' + err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        role: currentUser ? currentUser.role : null,
        isLoading,
        login,
        register,
        logout,
        switchRoleDemo,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
