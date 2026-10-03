import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  Check,
  Key,
  Globe,
  Code
} from 'lucide-react';
import {
  getStoredSupabaseConfig,
  saveSupabaseConfig,
  testSupabaseConnection,
  SUPABASE_SCHEMA_SQL,
  getSupabaseClient
} from '../../lib/supabase';
import { syncAllToSupabase } from '../../lib/supabaseSync';
import { useSync } from '../../sync/SyncContext';

export const SupabaseSettingsCard: React.FC = () => {
  const { orders, trips, trucks, addSyncLog } = useSync();

  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cfg = getStoredSupabaseConfig();
    setUrl(cfg.url);
    setAnonKey(cfg.anonKey);
    if (cfg.url && cfg.anonKey) {
      setIsConnected(true);
    }
  }, []);

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setStatusMessage(null);

    const res = await testSupabaseConnection(url, anonKey);
    setIsLoading(false);

    if (res.success) {
      saveSupabaseConfig(url, anonKey);
      setIsConnected(true);
      setStatusMessage({ type: 'success', text: res.message });
      addSyncLog(`Kết nối thành công tới Supabase Project: ${url}`, 'success');
    } else {
      setIsConnected(false);
      setStatusMessage({ type: 'error', text: res.message });
      addSyncLog(`Kết nối Supabase thất bại: ${res.message}`, 'error');
    }
  };

  const handlePushAll = async () => {
    setIsPushing(true);
    setStatusMessage(null);

    const res = await syncAllToSupabase(orders, trips, trucks);
    setIsPushing(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: `Đã đẩy thành công ${res.count} bản ghi (đơn hàng, xe bồn, chuyến) lên Supabase!`
      });
      addSyncLog(`Đẩy thành công ${res.count} bản ghi dữ liệu lên Supabase`, 'success');
    } else {
      setStatusMessage({
        type: 'error',
        text: res.error || 'Lỗi khi đồng bộ lên Supabase'
      });
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                KẾT NỐI VÀ LƯU DỮ LIỆU VÀO SUPABASE
              </h2>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đang đồng bộ Supabase
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Sẵn sàng kết nối
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn bộ dữ liệu đơn hàng bê tông, xe bồn và chuyến giao được lưu thực tế vào Supabase & Cloud SQL.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSqlModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer self-start sm:self-auto"
        >
          <Code className="w-3.5 h-3.5 text-slate-600" />
          Mã SQL tạo bảng Supabase
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : statusMessage.type === 'error'
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-blue-50 border border-blue-200 text-blue-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Form credentials */}
      <form onSubmit={handleSaveAndTest} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              Supabase Project URL *
            </label>
            <input
              type="text"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://xyzabcdefghijklm.supabase.co"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
            />
            <div className="text-[10px] text-slate-400">
              Lấy tại: <em>Supabase Dashboard → Project Settings → API → Project URL</em>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-600" />
              Supabase Anon / Public API Key *
            </label>
            <input
              type="password"
              required
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
            />
            <div className="text-[10px] text-slate-400">
              Lấy tại: <em>Supabase Dashboard → Project Settings → API → Project API keys (anon public)</em>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
            <span>Kiểm tra & Lưu cấu hình Supabase</span>
          </button>

          {isConnected && (
            <button
              type="button"
              onClick={handlePushAll}
              disabled={isPushing}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50"
            >
              {isPushing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              <span>Đẩy toàn bộ đơn hàng & xe ({orders.length} đơn) lên Supabase</span>
            </button>
          )}

          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-500 hover:text-emerald-700 font-semibold text-xs ml-auto transition"
          >
            <span>Mở Supabase Dashboard</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </form>

      {/* SQL Script Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Mã SQL Tạo Bảng Trên Supabase (Schema SQL)</h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <p className="text-slate-600">
                Để Supabase tiếp nhận và lưu trữ đúng định dạng các bảng <code>orders</code>, <code>trips</code>, <code>trucks</code>, hãy sao chép đoạn mã SQL bên dưới và dán vào mục <strong>SQL Editor</strong> trên Supabase Dashboard:
              </p>

              <div className="relative">
                <pre className="p-4 bg-slate-900 text-emerald-300 rounded-xl overflow-x-auto font-mono text-[11px] leading-relaxed max-h-72">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
                <button
                  onClick={handleCopySql}
                  className="absolute top-3 right-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép mã SQL'}</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px]">
                <strong>Ghi chú:</strong> Sau khi chạy câu lệnh SQL trên, bạn có thể nhập URL và Anon Key để ứng dụng lập tức ghi và đọc dữ liệu từ Supabase theo thời gian thực.
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
