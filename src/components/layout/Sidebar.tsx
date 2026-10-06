import React, { useState } from 'react';
import {
  LayoutDashboard,
  ClipboardList,
  CreditCard,
  Factory,
  Truck,
  FlaskConical,
  Settings,
  ChevronDown,
  ChevronRight,
  Radio,
  Users,
  LogOut,
  Printer,
  Pin,
  PinOff,
  Menu,
  X,
  CalendarRange,
  TableProperties
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
  const { orders, trips, trucks, syncState, secondsSinceSync } = useSync();
  const { currentUser, logout, isAdmin } = useAuth();

  // State: Tab bên trái khi rê chuột vào mới hiện ra
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  const isVisible = isOpen || isHovered || isPinned;

  const navItems = [
    { id: 'don-hang', label: '1. Đơn hàng & Cấp hàng', icon: ClipboardList, badge: orders.length },
    { id: 'thong-ke-tai-xe', label: 'Dữ liệu chuyến & Km tài xế', icon: Truck },
    { id: 'san-xuat', label: 'Sản xuất & Báo cáo', icon: Factory },
    { id: 'cong-no', label: 'Công nợ khách hàng', icon: CreditCard },
    { id: 'thi-nghiem', label: 'Thí nghiệm & QC Lab', icon: FlaskConical },
  ];

  return (
    <>
      {/* Invisible Hover Sensor Zone along the entire left screen edge */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        className="fixed left-0 top-0 bottom-0 w-3 z-40 pointer-events-auto"
        title="Rê chuột vào đây để mở Menu điều hướng"
      />

      {/* Floating Vertical Trigger Tab on the left edge (when collapsed) */}
      {!isVisible && (
        <div
          onMouseEnter={() => setIsHovered(true)}
          onClick={() => setIsHovered(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 bg-[#141923] hover:bg-[#e25822] text-orange-400 hover:text-white border-y border-r border-slate-700/80 py-3 px-1.5 rounded-r-xl shadow-2xl flex flex-col items-center gap-1.5 transition-all duration-200 cursor-pointer group"
          title="Rê chuột vào để mở Tab Menu bên trái"
        >
          <div className="w-5 h-5 rounded bg-[#e25822] text-white flex items-center justify-center font-black text-[10px] shadow-xs">
            TSG
          </div>
          <ChevronRight className="w-3.5 h-3.5 animate-pulse text-orange-400 group-hover:text-white" />
          <span className="text-[9px] font-black uppercase tracking-widest [writing-mode:vertical-lr] py-1 text-slate-400 group-hover:text-white">
            MENU
          </span>
        </div>
      )}

      {/* Subtle Backdrop when sidebar is open via hover (if not pinned) */}
      {isVisible && !isPinned && (
        <div
          onClick={() => setIsHovered(false)}
          className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] transition-opacity duration-300"
        />
      )}

      {/* Main Sidebar (Drawer on hover, fully collapsible) */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          if (!isPinned) setIsHovered(false);
        }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#141923] text-slate-300 flex flex-col justify-between transition-all duration-300 ease-out border-r border-slate-800 shadow-2xl ${
          isVisible ? 'translate-x-0 opacity-100 pointer-events-auto' : '-translate-x-full opacity-0 pointer-events-none'
        }`}
      >
        {/* Top Brand & Workspace Header */}
        <div>
          <div className="p-3.5 flex items-center justify-between border-b border-slate-800/80 bg-[#10141d]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#e25822] flex items-center justify-center font-black text-white text-sm tracking-wider shadow-md">
                TSG
              </div>
              <div>
                <div className="font-bold text-white text-xs tracking-wide flex items-center gap-1.5">
                  TNT OPERATIONS
                </div>
                <div className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase">
                  DISPATCH CENTER
                </div>
              </div>
            </div>

            {/* Pin and Close Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPinned(!isPinned)}
                title={isPinned ? 'Bỏ ghim (Tự động ẩn khi rời chuột)' : 'Ghim thanh bên cố định'}
                className={`p-1.5 rounded-lg text-xs transition cursor-pointer ${
                  isPinned
                    ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                }`}
              >
                {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => {
                  setIsHovered(false);
                  setIsPinned(false);
                }}
                title="Đóng thanh menu"
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="px-3 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectPage(item.id);
                    if (!isPinned) setIsHovered(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e25822] text-white shadow-md shadow-orange-900/20 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
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
        <div className="p-3 border-t border-slate-800/80 space-y-2 bg-[#10141d]/70">
          {/* Sync Status Button */}
          <button
            onClick={() => {
              onOpenSyncModal();
              if (!isPinned) setIsHovered(false);
            }}
            title="Bấm để mở Trung Tâm Đồng Bộ"
            className="w-full text-left p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2 shrink-0">
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
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    syncState.status === 'connected'
                      ? 'bg-emerald-500'
                      : syncState.status === 'syncing'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                />
              </span>
              <div className="overflow-hidden">
                <div className="text-[11px] font-semibold text-slate-200 group-hover:text-white flex items-center gap-1">
                  {syncState.status === 'connected' ? 'Hệ thống hoạt động' : syncState.status === 'syncing' ? 'Đang đồng bộ...' : 'Ngoại tuyến'}
                </div>
                <div className="text-[9px] text-slate-400">
                  {secondsSinceSync === 0 ? 'Đồng bộ tức thời' : `Đồng bộ ${secondsSinceSync}s trước`}
                </div>
              </div>
            </div>
            <Radio className="w-3 h-3 text-slate-500 group-hover:text-orange-400 transition shrink-0" />
          </button>

          {/* Member Management button */}
          {onOpenMembersModal && (
            <button
              onClick={() => {
                onOpenMembersModal();
                if (!isPinned) setIsHovered(false);
              }}
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-orange-400" />
                <span>Quản lý thành viên</span>
              </div>
              {isAdmin && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-950 text-orange-400 font-bold border border-orange-800">
                  Admin
                </span>
              )}
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={() => {
              onSelectPage('cai-dat');
              if (!isPinned) setIsHovered(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              currentPage === 'cai-dat'
                ? 'bg-[#e25822] text-white font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cài đặt & Supabase</span>
          </button>

          {/* User Card with Logout */}
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#1d2432]/80 border border-slate-800/80">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-lg bg-[#e25822] flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                {currentUser?.fullName
                  ? currentUser.fullName
                      .split(' ')
                      .map((s) => s[0])
                      .slice(-2)
                      .join('')
                  : 'MK'}
              </div>
              <div className="truncate">
                <div className="text-[11px] font-bold text-white truncate">
                  {currentUser?.fullName || 'Mai Thị Kim Oanh'}
                </div>
                <div className="text-[9px] text-slate-400 truncate flex items-center gap-1">
                  <span>{currentUser?.roleTitle || 'Điều phối viên'}</span>
                  {isAdmin && <span className="text-orange-400 font-bold">• Admin</span>}
                </div>
              </div>
            </div>

            <button
              onClick={logout}
              className="text-slate-400 hover:text-rose-400 p-1 rounded hover:bg-rose-950/40 transition cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
