export type UserRole = 'ADMIN' | 'DISPATCHER' | 'LAB_QC' | 'ACCOUNTANT' | 'STATION_MANAGER';

export interface UserAccount {
  id: string;
  username: string; // e.g. 'admin'
  fullName: string;
  role: UserRole;
  roleTitle: string; // e.g. 'Quản trị viên hệ thống'
  plantLocation: string; // 'Tây Ninh'
  email?: string;
  phone?: string;
  createdAt: string;
  isActive: boolean;
}

export interface StoredUserAccount extends UserAccount {
  passwordHash: string; // plain text / hash for simple auth
}
