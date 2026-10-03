import React, { useState } from 'react';
import {
  Settings,
  Radio,
  RefreshCw,
  Database,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Server,
  User,
  Shield,
  Layers
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { useAuth } from '../../auth/AuthContext';
import { Users, UserPlus } from 'lucide-react';

interface CaiDatPageProps {
  onOpenSyncModal: () => void;
  onOpenMembersModal?: () => void;
}

export const CaiDatPage: React.FC<CaiDatPageProps> = ({ onOpenSyncModal, onOpenMembersModal }) => {
  const {
    syncState,
    secondsSinceSync,
    syncNow,
    toggleAutoSync,
    resetToDefaultData,
    exportDatabaseJSON,
    importDatabaseJSON,
    selectedPlant,
    setSelectedPlant
  } = useSync();
  const { currentUser, isAdmin } = useAuth();

  const [importJson, setImportJson] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const handleExport = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tsg-donhang-full-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg('Đã xuất thành công tệp sao lưu dữ liệu.');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const ok = importDatabaseJSON(importJson);
    if (ok) {
      setImportJson('');
      setStatusMsg('Đã nhập và khôi phục dữ liệu thành công!');
    } else {
      setStatusMsg('Lỗi: Tệp JSON không đúng cấu trúc.');
    }
    setTimeout(() => setStatusMsg(''), 4000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
          <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
          CẤU HÌNH HỆ THỐNG
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Cài Đặt Hệ Thống & Trung Tâm Đồng Bộ Kết Nối
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Quản lý cơ chế truyền dữ liệu thời gian thực, lưu trữ đa kênh và tài khoản điều phối.
        </p>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMsg}
        </div>
      )}

      {/* Sync Engine Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-100 text-orange-600">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tính Năng Đồng Bộ Kết Nối Đa Thiết Bị</h2>
              <p className="text-xs text-slate-500">Kênh truyền BroadcastChannel & Local Database</p>
            </div>
          </div>

          <button
            onClick={onOpenSyncModal}
            className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 rounded-lg text-xs font-bold border border-orange-200 transition"
          >
            Mở bảng điều khiển đồng bộ
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Trạng thái kết nối hiện tại</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                {syncState.status === 'connected' ? 'HOẠT ĐỘNG ỔN ĐỊNH' : syncState.status}
              </span>
            </div>
            <div className="text-slate-600">
              Đồng bộ lần cuối: <strong>{secondsSinceSync === 0 ? 'vừa xong' : `${secondsSinceSync} giây trước`}</strong>
            </div>
            <div className="text-slate-500 text-[11px]">
              Gói tin đã gửi: {syncState.packetsSent} • Gói tin đã nhận: {syncState.packetsReceived}
            </div>
            <button
              onClick={() => syncNow()}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 transition"
            >
              <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
              Đồng bộ thủ công ngay
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="font-bold text-slate-800 flex items-center justify-between">
              <span>Cơ chế tự động đồng bộ (Auto Sync)</span>
              <span className="font-mono text-orange-600 font-bold">Mỗi {syncState.autoSyncIntervalSec}s</span>
            </div>
            <div className="text-slate-600">
              Tự động cập nhật vị trí xe bồn, sản lượng trạm trộn và đẩy trạng thái đơn hàng.
            </div>
            <button
              onClick={toggleAutoSync}
              className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                syncState.isAutoSync
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
              }`}
            >
              {syncState.isAutoSync ? 'Tắt đồng bộ tự động' : 'Bật đồng bộ tự động'}
            </button>
          </div>
        </div>
      </div>

      {/* Database & Backup Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
          <Database className="w-5 h-5 text-orange-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900">Sao Lưu & Quản Trị Cơ Sở Dữ Liệu</h2>
            <p className="text-xs text-slate-500">Bảo đảm an toàn dữ liệu đơn hàng và lịch sử điều phối</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            <Download className="w-4 h-4" />
            Tải tệp sao lưu JSON
          </button>

          <button
            onClick={() => {
              if (confirm('Khôi phục lại toàn bộ dữ liệu mặc định từ nhà máy Tây Ninh?')) {
                resetToDefaultData();
                setStatusMsg('Đã khôi phục dữ liệu gốc!');
                setTimeout(() => setStatusMsg(''), 4000);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-xs transition border border-rose-200"
          >
            <RotateCcw className="w-4 h-4" />
            Khôi phục dữ liệu ban đầu
          </button>
        </div>

        {/* JSON import form */}
        <div className="pt-2 space-y-2">
          <label className="text-xs font-semibold text-slate-700">Dán chuỗi sao lưu JSON để phục hồi:</label>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={3}
            placeholder="Dán JSON vào đây..."
            className="w-full text-xs font-mono p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          {importJson && (
            <button
              onClick={handleImport}
              className="px-4 py-1.5 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg text-xs"
            >
              Nhập dữ liệu
            </button>
          )}
        </div>
      </div>

      {/* Dispatcher Profile Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-orange-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900">Tài Khoản & Phân Quyền Người Dùng</h2>
              <p className="text-xs text-slate-500">Phân quyền vận hành trạm Tây Ninh và tạo tài khoản</p>
            </div>
          </div>

          {onOpenMembersModal && (
            <button
              onClick={onOpenMembersModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Users className="w-3.5 h-3.5" />
              {isAdmin ? 'Quản lý & Tạo tài khoản (+)' : 'Xem danh sách thành viên'}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500">Họ và tên:</span>
            <div className="font-bold text-slate-900 text-sm mt-0.5">{currentUser?.fullName || 'Mai Thị Kim Oanh'}</div>
            <div className="text-[11px] text-slate-500">Email: {currentUser?.email || 'admin@tasago.vn'}</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500">Vai trò hệ thống:</span>
            <div className="font-bold text-orange-600 text-sm mt-0.5">{currentUser?.roleTitle || 'Quản trị viên'}</div>
            <div className="text-[11px] text-slate-500">
              {isAdmin ? 'Quyền cao nhất: Tạo tài khoản, điều xe, xoá sửa đơn' : 'Quyền hạn: Điều xe bồn, cấp phiếu xuất'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
