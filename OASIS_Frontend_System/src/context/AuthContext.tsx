import React, { createContext, useState, ReactNode } from 'react';
import { User as UserType } from '../types';
import { logoutApi } from '../api';

type AuthContextProps = {
  currentUser: UserType | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<UserType | null>>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Đọc user từ localStorage ĐỒNG BỘ ngay khi khởi tạo state
  // (lazy initializer chạy TRƯỚC render đầu tiên, tránh RequireAuth redirect sai)
  const [currentUser, setCurrentUser] = useState<UserType | null>(() => {
    try {
      const saved = localStorage.getItem('saas_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const logout = async () => {
    await logoutApi();
    localStorage.removeItem('saas_user');
    localStorage.removeItem('saas_token');
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider value={{ currentUser, setCurrentUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
