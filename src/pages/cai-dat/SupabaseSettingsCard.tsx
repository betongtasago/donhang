import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  Database,
  Globe,
  Radio
} from 'lucide-react';
import { getStoredSupabaseConfig, testSupabaseConnection } from '../../lib/supabase';
import { syncAllToSupabase } from '../../lib/supabaseSync';
import { useSync } from '../../sync/SyncContext';

export const SupabaseSettingsCard: React.FC = () => {
  const {
    orders,
    trips,
    trucks,
    plants,
    debts,
    labTests,
    fuelLogs,
    projectDistances,
    productionReports,
    driverTripConfig,
    syncState,
    addSyncLog
  } = useSync();
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [isPushing, setIsPushing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const checkConnection = async () => {
    setIsChecking(true);
    const config = getStoredSupabaseConfig();
    if (!config.url || !config.anonKey) {
      setIsConnected(false);
      setStatusMessage({ type: 'error', text: 'Ứng dụng chưa nhận được biến môi trường Supabase từ môi trường triển khai.' });
      setIsChecking(false);
      return;
    }
    const result = await testSupabaseConnection(config.url, config.anonKey);
    setIsConnected(result.success);
    setStatusMessage({ type: result.success ? 'success' : 'error', text: result.success ? 'Supabase đã được cấu hình tự động và sẵn sàng đồng bộ.' : result.message });
    setIsChecking(false);
  };

  useEffect(() => {
    void checkConnection();
  }, []);

  const handlePushAll = async () => {
    setIsPushing(true);
    setStatusMessage(null);
    const result = await syncAllToSupabase({
      orders,
      trips,
      trucks,
      plants,
      debts,
      labTests,
      fuelLogs,
      projectDistances,
      productionReports,
      driverTripConfig
    });
    setIsPushing(false);
    if (result.success) {
      setStatusMessage({ type: 'success', text: `Đã kiểm tra và lưu ${result.count} bản ghi lên Supabase.` });
      addSyncLog(`Đẩy thủ công thành công ${result.count} bản ghi lên Supabase`, 'success');
    } else {
      setStatusMessage({ type: 'error', text: result.error || 'Không thể đồng bộ dữ liệu lên Supabase.' });
    }
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">SUPABASE CLOUD DATA</h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> Đang kết nối
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                  <AlertCircle className="w-3 h-3" /> Chưa kết nối
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Cấu hình được cấp tự động từ môi trường triển khai. Người dùng không cần nhập URL hoặc API key trên từng trình duyệt.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void checkConnection()}
          disabled={isChecking}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          Kiểm tra kết nối
        </button>
      </div>

      {statusMessage && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-start gap-2 ${statusMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : statusMessage.type === 'error' ? 'bg-rose-50 border border-rose-200 text-rose-800' : 'bg-blue-50 border border-blue-200 text-blue-800'}`}>
          {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500"><Globe className="w-3.5 h-3.5" /> Project</div>
          <strong className="block mt-1 text-slate-900 font-mono truncate">{getStoredSupabaseConfig().url || 'Chưa cấp biến môi trường'}</strong>
        </div>
        <div className="p-3 rounded-xl bg-blue-50 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-700"><Radio className="w-3.5 h-3.5" /> Realtime</div>
          <strong className="block mt-1 text-blue-900">{syncState.status === 'connected' ? 'Đang nhận dữ liệu liên phiên' : syncState.status}</strong>
        </div>
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
          <div className="text-amber-700">Hàng đợi retry</div>
          <strong className="block mt-1 text-amber-900">{syncState.unsyncedChanges} bản ghi chờ đồng bộ</strong>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
        <button
          type="button"
          onClick={() => void handlePushAll()}
          disabled={isPushing || !isConnected}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
        >
          {isPushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
          Ghi lại toàn bộ dữ liệu hiện tại
        </button>
        <span className="text-[11px] text-slate-500">
          Realtime tự đồng bộ {orders.length} đơn hàng, {trips.length} chuyến, {trucks.length} xe và các phân hệ liên quan giữa các phiên đăng nhập.
        </span>
      </div>
    </div>
  );
};
