import React, { useState } from 'react';
import { Menu, Bell, ChevronDown, RefreshCw, Radio, Check, CheckCircle2, LogOut, Users, Printer } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { useAuth } from '../../auth/AuthContext';

interface HeaderProps {
  currentPage: string;
  onToggleSidebar: () => void;
  onOpenSyncModal: () => void;
  onOpenMembersModal?: () => void;
  onOpenPrintModal?: () => void;
}

const PAGE_TITLES: Record<string, { group: string; name: string }> = {
  'tong-quan': { group: 'Báo cáo', name: 'Tổng quan' },
  'don-hang': { group: 'Kinh doanh', name: 'Đơn hàng' },
  'cong-no': { group: 'Kế toán', name: 'Công nợ' },
  'san-xuat': { group: 'Kỹ thuật', name: 'Sản xuất' },
  'quan-ly-lai-xe': { group: 'Đội xe', name: 'Quản lý lái xe' },
  'thi-nghiem': { group: 'KCS / Lab', name: 'Thí nghiệm' },
  'xang-dau': { group: 'Vật tư', name: 'Xăng dầu' },
  'cai-dat': { group: 'Hệ thống', name: 'Cài đặt' },
};

export const Header: React.FC<HeaderProps> = ({
  currentPage,
  onToggleSidebar,
  onOpenSyncModal,
  onOpenMembersModal,
  onOpenPrintModal
}) => {
  const { syncState, secondsSinceSync, syncNow } = useSync();
  const { currentUser, logout, isAdmin } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const breadcrumb = PAGE_TITLES[currentPage] || { group: 'Điều hành', name: 'Phân hệ' };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 lg:hidden transition"
          aria-label="Toggle navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <span className="font-normal text-slate-400">{breadcrumb.group}</span>
          <span className="text-slate-300">/</span>
          <span className="font-bold text-slate-800 tracking-tight">{breadcrumb.name}</span>
        </div>
      </div>

      {/* Right: Print Button, Sync Indicator, Notifications, and User Pill */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Print Button */}
        {onOpenPrintModal && (
          <button
            onClick={onOpenPrintModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-orange-700 transition"
            title="In phiếu giao nhận bê tông"
          >
            <Printer className="w-3.5 h-3.5 text-orange-600" />
            <span className="hidden sm:inline">In phiếu</span>
          </button>
        )}

        {/* Quick Sync trigger */}
        <button
          onClick={onOpenSyncModal}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-600 transition"
          title="Bấm để xem chi tiết đồng bộ dữ liệu"
        >
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${
                syncState.status === 'connected' ? 'bg-emerald-400 animate-ping' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                syncState.status === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
          </span>
          <span className="hidden md:inline font-medium">
            {secondsSinceSync === 0 ? 'Đã đồng bộ' : `Đồng bộ ${secondsSinceSync}s trước`}
          </span>
          <Radio className="w-3.5 h-3.5 text-orange-600" />
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-orange-600 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-800">Thông báo điều phối</span>
                <span className="text-[11px] text-orange-600 font-semibold cursor-pointer">Đánh dấu đã đọc</span>
              </div>
              <div className="py-2 space-y-2 text-xs text-slate-600 max-h-60 overflow-y-auto">
                <div className="p-2 rounded-lg bg-orange-50/60 border border-orange-100">
                  <div className="font-semibold text-orange-950">Xe 51M 97571 đã hoàn thành</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Tài xế Bùi Thái Sơn - Phiếu 0160190</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="font-semibold text-slate-800">Đơn hàng mới DH-260930-004</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Đài móng 120m³ - Cần duyệt cấp xe</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Pill with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-100 border border-slate-200/80 transition"
          >
            <div className="w-7 h-7 rounded-full bg-[#e25822] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {currentUser?.fullName
                ? currentUser.fullName
                    .split(' ')
                    .map((s) => s[0])
                    .slice(-2)
                    .join('')
                : 'MK'}
            </div>
            <span className="text-xs font-bold text-slate-800 tracking-tight hidden sm:inline uppercase">
              {currentUser?.fullName || 'MAI THỊ KIM OANH'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-bold text-slate-800">{currentUser?.fullName}</p>
                <p className="text-[11px] text-orange-600 font-semibold">{currentUser?.roleTitle}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tài khoản: <strong>{currentUser?.username}</strong> {isAdmin && '• [Admin]'}
                </p>
              </div>

              {onOpenMembersModal && (
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    onOpenMembersModal();
                  }}
                  className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    <span>Quản lý thành viên</span>
                  </div>
                  {isAdmin ? (
                    <span className="text-[10px] font-bold text-emerald-600">Quyền tạo</span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Xem</span>
                  )}
                </button>
              )}

              <button
                onClick={() => {
                  setShowUserMenu(false);
                  onOpenSyncModal();
                }}
                className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
              >
                <Radio className="w-4 h-4 text-orange-600" />
                Kiểm tra đồng bộ kết nối
              </button>

              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                  }}
                  className="w-full text-left px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-semibold"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  Đăng xuất tài khoản
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
