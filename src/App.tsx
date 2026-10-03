import React, { useState } from 'react';
import { SyncProvider } from './sync/SyncContext';
import { SyncModal } from './sync/SyncModal';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';

// Distinct folder pages
import { DonHangPage } from './pages/don-hang';
import { TongQuanPage } from './pages/tong-quan';
import { CongNoPage } from './pages/cong-no';
import { SanXuatPage } from './pages/san-xuat';
import { QuanLyLaiXePage } from './pages/quan-ly-lai-xe';
import { ThiNghiemPage } from './pages/thi-nghiem';
import { XangDauPage } from './pages/xang-dau';
import { CaiDatPage } from './pages/cai-dat';

export const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<string>('don-hang');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'don-hang':
        return <DonHangPage />;
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
        return <CaiDatPage onOpenSyncModal={() => setIsSyncModalOpen(true)} />;
      default:
        return <DonHangPage />;
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
    </div>
  );
};

export default function App() {
  return (
    <SyncProvider>
      <AppContent />
    </SyncProvider>
  );
}
