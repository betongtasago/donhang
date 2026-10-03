import React, { useState } from 'react';
import { useAuth } from './AuthContext';
import { UserRole } from './types';
import { UserPlus, Shield, UserX, Check, AlertCircle, X, Users, Lock, KeyRound } from 'lucide-react';

interface MemberManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MemberManagementModal: React.FC<MemberManagementModalProps> = ({ isOpen, onClose }) => {
  const { users, currentUser, createMemberAccount, deleteUserAccount, toggleUserActive, isAdmin } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('DISPATCHER');
  const [phone, setPhone] = useState('');
  const [plantLocation, setPlantLocation] = useState('Tây Ninh');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const res = createMemberAccount({
      username,
      password,
      fullName,
      role,
      phone,
      plantLocation
    });

    if (res.success) {
      setSuccess(`Đã tạo thành công tài khoản thành viên: ${username}`);
      setUsername('');
      setFullName('');
      setPhone('');
      setPassword('');
      setTimeout(() => setSuccess(''), 4000);
    } else {
      setError(res.error || 'Không thể tạo tài khoản');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-orange-600 text-white shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Quản Lý Tài Khoản Thành Viên TSG
                {isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-400 border border-orange-400/40">
                    Quyền Admin
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">Phân quyền điều phối viên, trạm trưởng, KCS và kế toán</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Admin check alert */}
          {!isAdmin ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-bold">Giới hạn phân quyền</p>
                <p className="text-[11px] mt-0.5">
                  Tài khoản hiện tại của bạn không phải là <strong>Admin</strong>. Chỉ tài khoản Admin mới có quyền tạo và quản lý tài khoản thành viên.
                </p>
              </div>
            </div>
          ) : (
            /* Creation Form for Admin */
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-orange-600" />
                Tạo Tài Khoản Thành Viên Mới (Chỉ dành cho Admin)
              </h3>

              {error && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-600" />
                  {success}
                </div>
              )}

              <form onSubmit={handleCreate} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Tên đăng nhập *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: tuan.nguyen"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Mật khẩu khởi tạo *</label>
                    <input
                      type="text"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Họ và tên thành viên *</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: Nguyễn Văn Tuấn"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Vai trò phân quyền</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as UserRole)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="DISPATCHER">Điều phối viên bê tông</option>
                      <option value="STATION_MANAGER">Trưởng trạm sản xuất</option>
                      <option value="LAB_QC">Kỹ thuật viên KCS / Lab</option>
                      <option value="ACCOUNTANT">Kế toán công nợ</option>
                      <option value="ADMIN">Quản trị viên (Admin)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Trạm / Khu vực</label>
                    <select
                      value={plantLocation}
                      onChange={(e) => setPlantLocation(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Tây Ninh">Trạm Tây Ninh</option>
                      <option value="Bình Dương">Trạm Bến Cát Bình Dương</option>
                      <option value="Long An">Trạm Đức Hoà Long An</option>
                      <option value="TP.HCM">Trạm Củ Chi TP.HCM</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Số điện thoại</label>
                    <input
                      type="text"
                      placeholder="09xx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition"
                  >
                    <UserPlus className="w-4 h-4" />
                    Tạo tài khoản thành viên
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members Table */}
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-800">
              Danh Sách Thành Viên Hệ Thống ({users.length} tài khoản)
            </h3>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                    <th className="py-3 px-4">TÊN ĐĂNG NHẬP</th>
                    <th className="py-3 px-4">HỌ VÀ TÊN</th>
                    <th className="py-3 px-4">VAI TRÒ</th>
                    <th className="py-3 px-4">KHÔNG GIAN TRẠM</th>
                    <th className="py-3 px-4">TRẠNG THÁI</th>
                    {isAdmin && <th className="py-3 px-4 text-center">THAO TÁC</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {u.username}
                        {u.username === 'admin' && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-semibold">
                            Gốc
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {u.fullName}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'DISPATCHER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.roleTitle}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {u.plantLocation}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {u.isActive ? 'Đang hoạt động' : 'Tạm khoá'}
                        </span>
                      </td>

                      {isAdmin && (
                        <td className="py-3 px-4 text-center">
                          {u.username !== 'admin' ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => toggleUserActive(u.id)}
                                className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                                  u.isActive
                                    ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                }`}
                              >
                                {u.isActive ? 'Khoá' : 'Kích hoạt'}
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Bạn có chắc muốn xoá tài khoản ${u.username}?`)) {
                                    deleteUserAccount(u.id);
                                  }
                                }}
                                className="px-2 py-1 rounded text-[11px] font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
                              >
                                Xoá
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">Bảo vệ</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
