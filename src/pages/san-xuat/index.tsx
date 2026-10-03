import React, { useState } from 'react';
import { Factory, Cpu, Layers, Play, CheckCircle2, AlertTriangle, RefreshCw, FileSpreadsheet, Activity } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { BaoCaoSanXuatView } from './BaoCaoSanXuatView';

export const SanXuatPage: React.FC = () => {
  const { plants } = useSync();
  const [activeTab, setActiveTab] = useState<'bao_cao' | 'giam_sat'>(() => {
    try {
      const saved = localStorage.getItem('tsg_san_xuat_tab');
      if (saved === 'bao_cao' || saved === 'giam_sat') return saved;
    } catch {}
    return 'bao_cao';
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('tsg_san_xuat_tab', activeTab);
    } catch {}
  }, [activeTab]);
  const [selectedPlantId, setSelectedPlantId] = useState(plants[0]?.id || '');

  const activePlant = plants.find(p => p.id === selectedPlantId) || plants[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            TRUNG TÂM VẬN HÀNH SẢN XUẤT
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Sản Xuất & Báo Cáo Trạm Bê Tông
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Báo cáo sản xuất chi tiết theo ngày, phân loại dự án/dân dụng, xuất Excel và giám sát cối trộn.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-200/80 rounded-2xl border border-slate-300/80 shrink-0">
          <button
            onClick={() => setActiveTab('bao_cao')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'bao_cao'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Báo cáo sản xuất (Xuất Excel)</span>
          </button>

          <button
            onClick={() => setActiveTab('giam_sat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'giam_sat'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Giám sát Cối trộn & Silo</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Báo Cáo Sản Xuất Theo Ngày (Xuất Excel) */}
      {activeTab === 'bao_cao' && <BaoCaoSanXuatView />}

      {/* Tab 2: Giám Sát Cối Trộn & Silo Vật Tư */}
      {activeTab === 'giam_sat' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-700">Chọn trạm sản xuất:</h2>
            <div className="flex items-center gap-2">
              {plants.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlantId(p.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activePlant.id === p.id
                      ? 'bg-[#e25822] text-white shadow-md shadow-orange-900/20'
                      : 'bg-white hover:bg-slate-50 border border-slate-300 text-slate-700'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {activePlant && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold shadow-md">
                    <Factory className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">{activePlant.name}</h2>
                    <p className="text-xs text-slate-500">
                      Công suất danh định: <strong>{activePlant.capacityM3PerHour} m³/giờ</strong> • Cối trộn 2 trục Sicoma
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    activePlant.status === 'DANG_TRON'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {activePlant.status === 'DANG_TRON' ? '● CỐI ĐANG TRỘN NẠP XE' : '● SẴN SÀNG NHẬN MẺ'}
                  </span>

                  <div className="text-right">
                    <div className="text-[11px] text-slate-400">Sản lượng ca ngày:</div>
                    <div className="text-base font-black text-slate-900">{activePlant.todayOutputM3} m³</div>
                  </div>
                </div>
              </div>

              {/* Current Batch Progress */}
              {activePlant.currentOrderCode && (
                <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-orange-400 animate-pulse" />
                      <span className="font-bold text-orange-400">PLC BATCH CONTROLLER ĐANG CÂN:</span>
                      <span className="font-mono">{activePlant.currentOrderCode}</span>
                    </div>
                    <span className="font-mono text-emerald-400 font-bold">{activePlant.batchProgress || 72}%</span>
                  </div>

                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-orange-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${activePlant.batchProgress || 72}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Silos Inventory */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  TỒN KHO SILO NGUYÊN VẬT LIỆU TẠI TRẠM
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {activePlant.silos.map((silo, idx) => {
                    const percent = Math.round((silo.currentTons / silo.capacityTons) * 100);
                    return (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                          <span>{silo.name}</span>
                          <span className="text-orange-600">{percent}%</span>
                        </div>
                        <div className="text-slate-500 text-[11px]">{silo.material}</div>
                        <div className="text-base font-black text-slate-900">
                          {silo.currentTons} <span className="text-xs font-normal text-slate-500">{silo.unit}</span>
                        </div>
                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${percent < 25 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
