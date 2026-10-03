import React, { useState } from 'react';
import { SyncProvider, useSync } from './sync/SyncContext';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LoginScreen } from './auth/LoginScreen';
import { MemberManagementModal } from './auth/MemberManagementModal';
import { PrintReceiptModal } from './components/print/PrintReceiptModal';
import { SyncModal } from './sync/SyncModal';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ConcreteOrder, DispatchTrip } from './types';

// Distinct folder pages
import { DonHangPage } from './pages/don-hang';
import { TongQuanPage } from './pages/tong-quan';
import { CongNoPage } from './pages/cong-no';
import { SanXuatPage } from './pages/san-xuat';
import { QuanLyLaiXePage } from './pages/quan-ly-lai-xe';
import { ThiNghiemPage } from './pages/thi-nghiem';
import { XangDauPage } from './pages/xang-dau';
import { CaiDatPage } from './pages/cai-dat';

const VALID_PAGES = [
  'don-hang',
  'tong-quan',
  'cong-no',
  'san-xuat',
  'quan-ly-lai-xe',
  'thi-nghiem',
  'xang-dau',
  'cai-dat'
];

const getInitialPage = (): string => {
  if (typeof window !== 'undefined') {
    // 1. Kiểm tra URL hash (ví dụ: #/san-xuat)
    const rawHash = window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[0];
    if (rawHash && VALID_PAGES.includes(rawHash)) {
      return rawHash;
    }
    // 2. Kiểm tra bộ nhớ localStorage
    try {
      const saved = localStorage.getItem('tsg_current_page');
      if (saved && VALID_PAGES.includes(saved)) {
        return saved;
      }
    } catch {
      // Ignore
    }
  }
  return 'don-hang';
};

export const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const { orders, trips } = useSync();

  const [currentPage, setCurrentPage] = useState<string>(getInitialPage);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);

  // Đồng bộ trang hiện tại vào URL Hash & localStorage khi người dùng chuyển trang
  React.useEffect(() => {
    try {
      localStorage.setItem('tsg_current_page', currentPage);
      if (window.location.hash !== `#/${currentPage}`) {
        window.location.hash = `#/${currentPage}`;
      }
    } catch {
      // Ignore
    }
  }, [currentPage]);

  // Lắng nghe sự kiện đổi hash (ví dụ bấm Back/Forward trình duyệt)
  React.useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace(/^#\/?/, '').split('?')[0].split('/')[0];
      if (rawHash && VALID_PAGES.includes(rawHash) && rawHash !== currentPage) {
        setCurrentPage(rawHash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [currentPage]);

  // Print Receipt modal state
  const [printState, setPrintState] = useState<{
    isOpen: boolean;
    order: ConcreteOrder | null;
    trip: DispatchTrip | null;
  }>({
    isOpen: false,
    order: null,
    trip: null
  });

  // If not logged in, enforce login screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  const handleOpenPrintModal = (order?: ConcreteOrder, trip?: DispatchTrip) => {
    const targetOrder = order || orders[0];
    const targetTrip = trip || (targetOrder ? trips.find(t => t.orderId === targetOrder.id || t.orderCode === targetOrder.code) : null) || trips[0];
    setPrintState({
      isOpen: true,
      order: targetOrder || null,
      trip: targetTrip || null
    });
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'don-hang':
        return (
          <DonHangPage
            onOpenPrintModal={(ord, trp) => handleOpenPrintModal(ord, trp)}
          />
        );
      case 'tong-quan':
        return <TongQuanPage />;
      case 'cong-no':
        return <CongNoPage />;
      case 'san-xuat':
        return <SanXuatPage />;
      case 'quan-ly-lai-xe':
        return <QuanLyLaiXePage />;
      case 'thi-nghiem':
        return <ThiNghiemPage />;
      case 'xang-dau':
        return <XangDauPage />;
      case 'cai-dat':
        return (
          <CaiDatPage
            onOpenSyncModal={() => setIsSyncModalOpen(true)}
            onOpenMembersModal={() => setIsMembersModalOpen(true)}
          />
        );
      default:
        return (
          <DonHangPage
            onOpenPrintModal={(ord, trp) => handleOpenPrintModal(ord, trp)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onSelectPage={(page) => {
          setCurrentPage(page);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenMembersModal={() => setIsMembersModalOpen(true)}
        onOpenPrintModal={() => handleOpenPrintModal()}
      />

      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          currentPage={currentPage}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onOpenMembersModal={() => setIsMembersModalOpen(true)}
          onOpenPrintModal={() => handleOpenPrintModal()}
        />

        <main className="flex-1 overflow-y-auto bg-[#f8fafc]">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Global Sync Modal Drawer */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Member Management Modal (Admin only can create) */}
      <MemberManagementModal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
      />

      {/* Print Receipt Modal matching Image 2 */}
      {printState.isOpen && printState.order && (
        <PrintReceiptModal
          isOpen={printState.isOpen}
          order={printState.order}
          trip={printState.trip}
          onClose={() => setPrintState(prev => ({ ...prev, isOpen: false }))}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SyncProvider>
        <AppContent />
      </SyncProvider>
    </AuthProvider>
  );
}
