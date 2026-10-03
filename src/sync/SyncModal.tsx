import React, { useState } from 'react';
import { useSync } from './SyncContext';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Radio,
  Server,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  Clock,
  Send,
  Inbox,
  X,
  FileJson
} from 'lucide-react';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SyncModal: React.FC<SyncModalProps> = ({ isOpen, onClose }) => {
  const {
    syncState,
    secondsSinceSync,
    syncNow,
    toggleAutoSync,
    clearSyncLogs,
    resetToDefaultData,
    exportDatabaseJSON,
    importDatabaseJSON
  } = useSync();

  const [isExporting, setIsExporting] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const handleManualSync = async () => {
    await syncNow();
  };

  const handleExport = () => {
    setIsExporting(true);
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tsg-donhang-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setIsExporting(false);
  };

  const handleImport = () => {
    setImportError('');
    if (!importText.trim()) {
      setImportError('Vui lòng dán chuỗi JSON hợp lệ.');
      return;
    }
    const ok = importDatabaseJSON(importText);
    if (ok) {
      setShowImportBox(false);
      setImportText('');
    } else {
      setImportError('Định dạng JSON không hợp lệ hoặc thiếu dữ liệu.');
    }
  };

  const getStatusDisplay = () => {
    if (syncState.status === 'syncing') {
      return {
        label: 'Đang truyền dữ liệu...',
        bg: 'bg-amber-50 text-amber-700 border-amber-200',
        dot: 'bg-amber-500 animate-ping'
      };
    }
    if (syncState.status === 'offline') {
      return {
        label: 'Ngoại tuyến (Offline mode)',
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        dot: 'bg-rose-500'
      };
    }
    return {
      label: 'Đang hoạt động & Kết nối ổn định',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse'
    };
  };

  const statusStyle = getStatusDisplay();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white shadow-md">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Trung Tâm Đồng Bộ & Kết Nối Dữ Liệu</h2>
              <p className="text-xs text-slate-400">Tasago Concrete Realtime Synchronization Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Status banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between ${statusStyle.bg}`}>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3.5 w-3.5">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${statusStyle.dot}`} />
                <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${syncState.status === 'connected' ? 'bg-emerald-500' : syncState.status === 'syncing' ? 'bg-amber-500' : 'bg-rose-500'}`} />
              </span>
              <div>
                <div className="font-semibold text-sm">{statusStyle.label}</div>
                <div className="text-xs opacity-80">
                  Đồng bộ lần cuối: {secondsSinceSync === 0 ? 'vừa xong' : `${secondsSinceSync} giây trước`}
                </div>
              </div>
            </div>

            <button
              onClick={handleManualSync}
              disabled={syncState.status === 'syncing'}
              className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.status === 'syncing' ? 'animate-spin text-orange-600' : ''}`} />
              Đồng bộ ngay
            </button>
          </div>

          {/* Sync Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center text-slate-500 text-xs gap-1.5 mb-1">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                Phiên kết nối
              </div>
              <div className="text-lg font-bold text-slate-800">{syncState.activePeers} tab / máy</div>
              <div className="text-[11px] text-slate-400">BroadcastChannel</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center text-slate-500 text-xs gap-1.5 mb-1">
                <Send className="w-3.5 h-3.5 text-emerald-600" />
                Gói tin gửi đi
              </div>
              <div className="text-lg font-bold text-slate-800">{syncState.packetsSent}</div>
              <div className="text-[11px] text-emerald-600 font-medium">Bản tin thay đổi</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center text-slate-500 text-xs gap-1.5 mb-1">
                <Inbox className="w-3.5 h-3.5 text-purple-600" />
                Gói tin nhận
              </div>
              <div className="text-lg font-bold text-slate-800">{syncState.packetsReceived}</div>
              <div className="text-[11px] text-purple-600 font-medium">Nhận tức thì</div>
            </div>

            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
              <div className="flex items-center text-slate-500 text-xs gap-1.5 mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                Chu kỳ tự động
              </div>
              <div className="text-lg font-bold text-slate-800">
                {syncState.isAutoSync ? `${syncState.autoSyncIntervalSec}s` : 'Tắt'}
              </div>
              <button
                onClick={toggleAutoSync}
                className="text-[11px] text-blue-600 hover:underline font-medium"
              >
                {syncState.isAutoSync ? 'Tắt tự động' : 'Bật tự động'}
              </button>
            </div>
          </div>

          {/* Backup & Restore Controls */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Server className="w-4 h-4 text-orange-600" />
              Sao lưu & Di chuyển dữ liệu đơn hàng
            </h3>
            <p className="text-xs text-slate-500">
              Xuất tệp JSON để di chuyển sang thiết bị điều phối khác hoặc nhập dữ liệu mới để phục hồi nhanh.
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Download className="w-3.5 h-3.5" />
                Xuất tệp dữ liệu (JSON)
              </button>

              <button
                onClick={() => setShowImportBox(!showImportBox)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                <Upload className="w-3.5 h-3.5" />
                Nhập từ JSON
              </button>

              <button
                onClick={() => {
                  if (confirm('Bạn có chắc chắn muốn nạp lại dữ liệu mẫu gốc từ nhà máy bê tông Tây Ninh?')) {
                    resetToDefaultData();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold transition ml-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Nạp lại dữ liệu gốc
              </button>
            </div>

            {showImportBox && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileJson className="w-4 h-4 text-orange-600" />
                  Dán chuỗi JSON đã xuất:
                </label>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Dán toàn bộ nội dung JSON vào đây..."
                  rows={4}
                  className="w-full text-xs font-mono p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                {importError && (
                  <div className="text-xs text-rose-600 font-medium">{importError}</div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowImportBox(false)}
                    className="px-3 py-1 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                  >
                    Huỷ
                  </button>
                  <button
                    onClick={handleImport}
                    className="px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white font-semibold text-xs rounded-lg shadow-sm"
                  >
                    Xác nhận nhập
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sync Event Logs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Nhật ký đồng bộ trực tiếp (Live Stream)
              </h3>
              <button
                onClick={clearSyncLogs}
                className="text-xs text-slate-400 hover:text-slate-600"
              >
                Xoá nhật ký
              </button>
            </div>

            <div className="bg-slate-900 rounded-xl p-3 text-xs font-mono text-slate-300 max-h-48 overflow-y-auto space-y-1.5 border border-slate-800">
              {syncState.logs.length === 0 ? (
                <div className="text-slate-500 italic py-2 text-center">Chưa có bản tin đồng bộ nào.</div>
              ) : (
                syncState.logs.map(log => {
                  let color = 'text-slate-300';
                  if (log.type === 'success') color = 'text-emerald-400';
                  if (log.type === 'warning') color = 'text-amber-400';
                  if (log.type === 'network') color = 'text-cyan-400';

                  return (
                    <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                      <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                      <span className={color}>{log.message}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
            <span>Kênh truyền: <strong className="text-slate-700">tsg_tnt_dispatch_sync_channel</strong></span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
