import React from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Factory,
  Truck,
  FlaskConical,
  Fuel,
  Settings,
  ChevronDown,
  MoreHorizontal,
  Radio,
  CheckCircle2,
  AlertTriangle,
  Users,
  LogOut,
  Printer
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { useAuth } from '../../auth/AuthContext';

interface SidebarProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  isOpen: boolean;
  onOpenSyncModal: () => void;
  onOpenMembersModal?: () => void;
  onOpenPrintModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPage,
  onSelectPage,
  isOpen,
  onOpenSyncModal,
  onOpenMembersModal,
  onOpenPrintModal
}) => {
  const { orders, syncState, secondsSinceSync, selectedPlant, setSelectedPlant } = useSync();
  const { currentUser, logout, isAdmin } = useAuth();

  const navItems = [
    { id: 'tong-quan', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'don-hang', label: 'Đơn hàng', icon: ClipboardList, badge: orders.length },
    { id: 'cong-no', label: 'Công nợ', icon: CreditCard },
    { id: 'san-xuat', label: 'Sản xuất', icon: Factory },
    { id: 'quan-ly-lai-xe', label: 'Quản lý lái xe', icon: Truck },
    { id: 'thi-nghiem', label: 'Thí nghiệm', icon: FlaskConical },
    { id: 'xang-dau', label: 'Xăng dầu', icon: Fuel },
  ];

  const plantOptions = [
    { id: 'Tây Ninh', label: 'TN - Điều độ Tây Ninh', sub: 'TNT - Production' },
    { id: 'Bình Dương', label: 'BD - Điều độ Bình Dương', sub: 'TNT - Bến Cát' },
    { id: 'Long An', label: 'LA - Điều độ Long An', sub: 'TNT - Đức Hoà' },
    { id: 'TP.HCM', label: 'SG - Điều độ TP.HCM', sub: 'TNT - Củ Chi' },
  ];

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#141923] text-slate-300 flex flex-col justify-between transition-transform duration-300 ease-in-out border-r border-slate-800 ${
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top brand header */}
      <div>
        <div className="p-4 flex items-center gap-3 border-b border-slate-800/80">
          <div className="w-10 h-10 rounded-lg bg-[#e25822] flex items-center justify-center font-black text-white text-base tracking-wider shadow-md">
            TSG
          </div>
          <div>
            <div className="font-bold text-white text-sm tracking-wide flex items-center gap-1.5">
              TNT OPERATIONS
            </div>
            <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              DISPATCH CENTER
            </div>
          </div>
        </div>

        {/* Workspace selector */}
        <div className="px-3 pt-4 pb-2">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider px-2 mb-1.5">
            KHÔNG GIAN LÀM VIỆC
          </div>

          <div className="relative group">
            <select
              value={selectedPlant}
              onChange={(e) => setSelectedPlant(e.target.value)}
              className="w-full appearance-none bg-[#1d2432] hover:bg-[#232c3d] text-white text-xs font-medium rounded-xl p-2.5 pr-8 border border-slate-700/60 focus:outline-none focus:ring-1 focus:ring-orange-500 transition cursor-pointer"
            >
              {plantOptions.map((opt) => (
                <option key={opt.id} value={opt.id} className="bg-slate-900 text-white py-1">
                  {opt.label} ({opt.sub})
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-slate-400">
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectPage(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#e25822] text-white shadow-md shadow-orange-900/20 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                      isActive ? 'bg-orange-800/80 text-white' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom section: Sync Status & Settings & User profile */}
      <div className="p-3 border-t border-slate-800/80 space-y-2">
        {/* Sync Status Button - Clickable to open Sync Center */}
        <button
          onClick={onOpenSyncModal}
          title="Bấm để mở Trung Tâm Đồng Bộ & Kết Nối"
          className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group"
        >
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  syncState.status === 'connected'
                    ? 'bg-emerald-400 animate-ping'
                    : syncState.status === 'syncing'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-rose-400'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  syncState.status === 'connected'
                    ? 'bg-emerald-500'
                    : syncState.status === 'syncing'
                    ? 'bg-amber-500'
                    : 'bg-rose-500'
                }`}
              />
            </span>
            <div className="overflow-hidden">
              <div className="text-[12px] font-semibold text-slate-200 group-hover:text-white flex items-center gap-1">
                {syncState.status === 'connected' ? 'Hệ thống đang hoạt động' : syncState.status === 'syncing' ? 'Đang đồng bộ...' : 'Chế độ Ngoại tuyến'}
              </div>
              <div className="text-[10px] text-slate-400">
                {syncState.status === 'syncing'
                  ? 'Đang gửi bản tin...'
                  : secondsSinceSync === 0
                  ? 'Đồng bộ tức thời'
                  : `Đồng bộ ${secondsSinceSync} giây trước`}
              </div>
            </div>
          </div>
          <Radio className="w-3.5 h-3.5 text-slate-500 group-hover:text-orange-400 transition shrink-0" />
        </button>

        {/* Member Management button (Only Admin can create, visible to all or Admin) */}
        {onOpenMembersModal && (
          <button
            onClick={onOpenMembersModal}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-orange-400" />
              <span>Quản lý thành viên</span>
            </div>
            {isAdmin && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-950 text-orange-400 font-semibold border border-orange-800">
                Admin
              </span>
            )}
          </button>
        )}

        {/* Quick Print button */}
        {onOpenPrintModal && (
          <button
            onClick={onOpenPrintModal}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            <Printer className="w-4 h-4 text-orange-400" />
            <span>In phiếu giao nhận</span>
          </button>
        )}

        {/* Settings button */}
        <button
          onClick={() => onSelectPage('cai-dat')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition ${
            currentPage === 'cai-dat'
              ? 'bg-[#e25822] text-white font-semibold'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cài đặt</span>
        </button>

        {/* User Card with Logout */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#1d2432]/80 border border-slate-800/80">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[#e25822] flex items-center justify-center font-bold text-white text-xs shrink-0">
              {currentUser?.fullName
                ? currentUser.fullName
                    .split(' ')
                    .map((s) => s[0])
                    .slice(-2)
                    .join('')
                : 'MK'}
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">
                {currentUser?.fullName || 'Mai Thị Kim Oanh'}
              </div>
              <div className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                <span>{currentUser?.roleTitle || 'Điều phối viên'}</span>
                {isAdmin && <span className="text-orange-400 font-bold">• Admin</span>}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-rose-950/40 transition"
            title="Đăng xuất khỏi hệ thống"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
