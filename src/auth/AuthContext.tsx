import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, StoredUserAccount, UserRole } from './types';

const STORAGE_USERS_KEY = 'TSG_TNT_USER_ACCOUNTS_V1';
const STORAGE_SESSION_KEY = 'TSG_TNT_CURRENT_SESSION_V1';

const DEFAULT_USERS: StoredUserAccount[] = [
  {
    id: 'usr-admin-01',
    username: 'admin',
    passwordHash: 'Tsg2026@',
    fullName: 'Quản Trị Viên Hệ Thống (TSG TNT)',
    role: 'ADMIN',
    roleTitle: 'Tổng Quản Trị Hệ Thống',
    plantLocation: 'Tây Ninh',
    email: 'admin@tasago.vn',
    phone: '0909 888 999',
    createdAt: '2026-09-01T00:00:00.000Z',
    isActive: true
  },
  {
    id: 'usr-oanh-02',
    username: 'oanh.mtk',
    passwordHash: 'Tsg2026@',
    fullName: 'Mai Thị Kim Oanh',
    role: 'DISPATCHER',
    roleTitle: 'Điều Phối Viên Chính',
    plantLocation: 'Tây Ninh',
    email: 'oanh.mtk@tasago.vn',
    phone: '0908 123 456',
    createdAt: '2026-09-10T00:00:00.000Z',
    isActive: true
  }
];

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
      const saved = localStorage.getItem(STORAGE_USERS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Guarantee admin exists with requested password Tsg2026@
          const hasAdmin = parsed.some(u => u.username === 'admin');
          if (!hasAdmin) {
            return [...DEFAULT_USERS, ...parsed];
          }
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
      const savedSession = localStorage.getItem(STORAGE_SESSION_KEY);
      if (savedSession) {
        return JSON.parse(savedSession);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Save users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(storedAccounts));
    } catch (e) {
      console.error(e);
    }
  }, [storedAccounts]);

  // Save session to localStorage
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_SESSION_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Artificial small delay for realistic UX
    await new Promise(r => setTimeout(r, 300));

    const cleanUser = username.trim().toLowerCase();
    const account = storedAccounts.find(
      u => u.username.toLowerCase() === cleanUser && u.passwordHash === password
    );

    if (!account) {
      return { success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' };
    }

    if (!account.isActive) {
      return { success: false, error: 'Tài khoản này đã bị tạm khoá bởi Admin.' };
    }

    const { passwordHash, ...safeUser } = account;
    setCurrentUser(safeUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
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
    return { success: true };
  };

  const deleteUserAccount = (userId: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Chỉ tài khoản Admin mới có quyền xoá tài khoản thành viên.' };
    }

    const target = storedAccounts.find(u => u.id === userId);
    if (target?.username === 'admin') {
      return { success: false, error: 'Không thể xoá tài khoản Admin mặc định.' };
    }

    setStoredAccounts(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  const toggleUserActive = (userId: string) => {
    if (!currentUser || currentUser.role !== 'ADMIN') return;
    setStoredAccounts(prev =>
      prev.map(u => {
        if (u.id === userId && u.username !== 'admin') {
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
