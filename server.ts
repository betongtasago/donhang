import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, StoredUserAccount, UserRole } from './types';

const STORAGE_TOKEN_KEY = 'TSG_TNT_AUTH_TOKEN_V1';
const STORAGE_SESSION_KEY = 'TSG_TNT_CURRENT_SESSION_V1';
const DEFAULT_ADMIN_USERNAME = (import.meta.env.VITE_ADMIN_USERNAME || '').trim().toLowerCase();
const DEFAULT_ADMIN_PASSWORD = (import.meta.env.VITE_ADMIN_PASSWORD || '').trim();

const DEFAULT_USERS: StoredUserAccount[] = DEFAULT_ADMIN_USERNAME && DEFAULT_ADMIN_PASSWORD
  ? [{
      id: 'usr-admin-01',
      username: DEFAULT_ADMIN_USERNAME,
      passwordHash: DEFAULT_ADMIN_PASSWORD,
      fullName: 'Quản Trị Viên Hệ Thống (TSG TNT)',
      role: 'ADMIN',
      roleTitle: 'Tổng Quản Trị Hệ Thống',
      plantLocation: 'Tây Ninh',
      email: 'admin@tasago.vn',
      phone: '0909 888 999',
      createdAt: '2026-09-01T00:00:00.000Z',
      isActive: true
    }]
  : [];

interface AuthContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  createMemberAccount: (data: {
    username: string;
    password: string;
    fullName: string;
    role: UserRole;
    plantLocation?: string;
    email?: string;
    phone?: string;
  }) => { success: boolean; error?: string };
  deleteUserAccount: (userId: string) => { success: boolean; error?: string };
  toggleUserActive: (userId: string) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [storedAccounts, setStoredAccounts] = useState<StoredUserAccount[]>(() => {
    try {
      const saved = sessionStorage.getItem('TSG_TNT_USER_ACCOUNTS_V1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }

    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const savedSession = sessionStorage.getItem(STORAGE_SESSION_KEY);
      if (savedSession) {
        return JSON.parse(savedSession);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem('TSG_TNT_USER_ACCOUNTS_V1', JSON.stringify(storedAccounts));
    } catch (e) {
      console.error(e);
    }
  }, [storedAccounts]);

  useEffect(() => {
    try {
      if (currentUser) {
        sessionStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanUser = username.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUser, password })
      });
      const data = await res.json();

      if (res.ok && data.success && data.user) {
        if (data.token) {
          sessionStorage.setItem(STORAGE_TOKEN_KEY, data.token);
        }
        setCurrentUser(data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'Tên đăng nhập hoặc mật khẩu không đúng.' };
    } catch (err) {
      console.error('Backend authentication failed:', err);
      return { success: false, error: 'Không thể kết nối máy chủ xác thực.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem(STORAGE_TOKEN_KEY);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
  };

  const createMemberAccount = (data: {
    username: string;
    password: string;
    fullName: string;
    role: UserRole;
    plantLocation?: string;
    email?: string;
    phone?: string;
  }): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Chỉ tài khoản Admin mới có quyền tạo tài khoản thành viên.' };
    }

    const cleanUser = data.username.trim().toLowerCase();
    if (!cleanUser || !data.password || !data.fullName.trim()) {
      return { success: false, error: 'Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Họ tên.' };
    }

    if (storedAccounts.some(u => u.username.toLowerCase() === cleanUser)) {
      return { success: false, error: 'Tên đăng nhập này đã tồn tại trên hệ thống.' };
    }

    const roleTitles: Record<UserRole, string> = {
      ADMIN: 'Quản trị viên',
      DISPATCHER: 'Điều phối viên bê tông',
      STATION_MANAGER: 'Trưởng trạm sản xuất',
      LAB_QC: 'Kỹ thuật viên KCS / Lab',
      ACCOUNTANT: 'Kế toán công nợ'
    };

    const newAccount: StoredUserAccount = {
      id: `usr-${Date.now()}`,
      username: cleanUser,
      passwordHash: data.password,
      fullName: data.fullName.trim(),
      role: data.role,
      roleTitle: roleTitles[data.role] || 'Thành viên',
      plantLocation: data.plantLocation || currentUser.plantLocation || 'Tây Ninh',
      email: data.email || `${cleanUser}@tasago.vn`,
      phone: data.phone || '',
      createdAt: new Date().toISOString(),
      isActive: true
    };

    setStoredAccounts(prev => [newAccount, ...prev]);

    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${sessionStorage.getItem(STORAGE_TOKEN_KEY) || ''}`
      },
      body: JSON.stringify({
        ...data,
        username: cleanUser,
        password: data.password
      })
    }).catch(err => console.warn('Could not sync user to backend database:', err));

    return { success: true };
  };

  const deleteUserAccount = (userId: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Chỉ tài khoản Admin mới có quyền xoá tài khoản thành viên.' };
    }

    const target = storedAccounts.find(u => u.id === userId);
    if (target?.username === DEFAULT_ADMIN_USERNAME) {
      return { success: false, error: 'Không thể xoá tài khoản Admin mặc định.' };
    }

    setStoredAccounts(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  const toggleUserActive = (userId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setStoredAccounts(prev =>
      prev.map(u => {
        if (u.id === userId && u.username !== DEFAULT_ADMIN_USERNAME) {
          return { ...u, isActive: !u.isActive };
        }
        return u;
      })
    );
  };

  const publicUsers: UserAccount[] = storedAccounts.map(({ passwordHash, ...rest }) => rest);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users: publicUsers,
        login,
        logout,
        createMemberAccount,
        deleteUserAccount,
        toggleUserActive,
        isAdmin: currentUser?.role === 'ADMIN'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
