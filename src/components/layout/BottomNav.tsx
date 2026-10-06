import React, { useState } from 'react';
import {
  ClipboardList,
  Factory,
  Truck,
  CreditCard,
  Menu,
  LayoutDashboard,
  FlaskConical,
  Settings,
  Radio,
  LogOut,
  X,
  Plus,
  RefreshCw
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { useAuth } from '../../auth/AuthContext';

interface BottomNavProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  onOpenSyncModal: () => void;
  onOpenMembersModal?: () => void;
  onOpenCreateOrder?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onSelectPage,
  onOpenSyncModal,
  onOpenMembersModal,
  onOpenCreateOrder
}) => {
  const { orders, syncState, secondsSinceSync, syncNow } = useSync();
  const { currentUser, logout, isAdmin } = useAuth();
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const mainTabs = [
    {
      id: 'don-hang',
      label: 'Đơn hàng',
      icon: ClipboardList,
      badge: orders.length
    },
    {
      id: 'san-xuat',
      label: 'Sản xuất',
      icon: Factory
    },
    {
      id: 'thong-ke-tai-xe',
      label: 'Chuyến & Km',
      icon: Truck
    },
    {
      id: 'cong-no',
      label: 'Công nợ',
      icon: CreditCard
    }
  ];

  const moreItems = [
    { id: 'thi-nghiem', label: 'Thí nghiệm & QC Lab', icon: FlaskConical },
    { id: 'cai-dat', label: 'Cài đặt hệ thống', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Drawer Menu when "Thêm" is clicked */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden animate-in fade-in duration-200">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="fixed bottom-0 inset-x-0 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 p-5 z-10 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            {/* Header of Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#e25822] text-white flex items-center justify-center font-black text-xs shadow-xs">
                  TSG
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Menu Thao Tác Nhanh</h3>
                  <p className="text-[11px] text-slate-500">
                    {currentUser?.fullName} ({currentUser?.role})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions in Drawer */}
            <div className="grid grid-cols-2 gap-2.5 py-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  onOpenSyncModal();
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-orange-50/70 border border-orange-200 text-left transition active:scale-98 cursor-pointer"
              >
                <Radio className="w-4 h-4 text-orange-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-orange-950 truncate">Đồng bộ Cloud</div>
                  <div className="text-[10px] text-orange-700 truncate">
                    {secondsSinceSync === 0 ? 'Vừa xong' : `${secondsSinceSync}s trước`}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  syncNow();
                  setIsMoreMenuOpen(false);
                }}
                className="flex items-center gap-2 p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-left transition active:scale-98 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-bold text-blue-950 truncate">Làm mới dữ liệu</div>
                  <div className="text-[10px] text-blue-700 truncate">Cập nhật tức thì</div>
                </div>
              </button>
            </div>

            {/* Navigation links in Drawer */}
            <div className="py-3 space-y-1">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                Phân Hệ Mở Rộng
              </div>
              {moreItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectPage(item.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isActive
                        ? 'bg-[#e25822] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Logout button */}
            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Đăng xuất khỏi hệ thống</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Bottom Nav Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="grid grid-cols-5 h-14 items-center">
          {mainTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentPage === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onSelectPage(tab.id)}
                className={`flex flex-col items-center justify-center h-full transition-all active:scale-95 cursor-pointer relative ${
                  isActive ? 'text-[#e25822]' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'}`} />
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="absolute -top-1 -right-2 px-1 py-0.2 bg-[#e25822] text-white rounded-full text-[9px] font-black leading-none shadow-2xs">
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? 'font-black text-[#e25822]' : 'font-medium'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-1 w-5 h-0.5 rounded-full bg-[#e25822]" />
                )}
              </button>
            );
          })}

          {/* Tab 5: "Thêm" Menu */}
          <button
            type="button"
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center h-full transition-all active:scale-95 cursor-pointer ${
              isMoreMenuOpen || ['tong-quan', 'thi-nghiem', 'cai-dat'].includes(currentPage)
                ? 'text-[#e25822]'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Menu className="w-5 h-5 stroke-[1.8]" />
            <span className="text-[10px] mt-0.5 font-medium tracking-tight">Thêm</span>
          </button>
        </div>
      </nav>
    </>
  );
};
