import React, { useState } from 'react';
import { Factory, Cpu, Layers, Play, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

export const SanXuatPage: React.FC = () => {
  const { plants, orders } = useSync();
  const [selectedPlantId, setSelectedPlantId] = useState(plants[0]?.id || '');

  const activePlant = plants.find(p => p.id === selectedPlantId) || plants[0];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            TRUNG TÂM VẬN HÀNH TRẠM TRỘN
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Giám Sát Sản Xuất & Tồn Kho Silo Vật Liệu
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kết nối PLC tự động hoá trạm cân bê tông, kiểm soát tỷ lệ cấp phối và tồn vật tư.
          </p>
        </div>

        {/* Plant Switcher */}
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

      {/* Main Plant Status Card */}
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
                  <Cpu className="w-4 h-4 text-orange-400 animate-spin" />
                  <span className="font-semibold text-orange-400">ĐANG XỬ LÝ MẺ CÂN TRỘN TỰ ĐỘNG</span>
                  <span className="text-slate-400">• Đơn: <strong>{activePlant.currentOrderCode}</strong></span>
                </div>
                <span className="font-bold text-orange-400">{activePlant.batchProgress || 70}%</span>
              </div>
              <div className="text-sm font-semibold">{activePlant.currentRecipe}</div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-orange-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${activePlant.batchProgress || 70}%` }}
                />
              </div>
            </div>
          )}

          {/* Silos & Aggregate Bins */}
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              TỒN KHO NGUYÊN VẬT LIỆU SILO & KHO BÃI
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {activePlant.silos.map((silo, i) => {
                const percent = Math.round((silo.currentTons / silo.capacityTons) * 100);
                const isLow = percent < 25;
                return (
                  <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">{silo.name}</span>
                      <span className={`text-[11px] font-bold ${isLow ? 'text-rose-600' : 'text-slate-600'}`}>
                        {percent}%
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 truncate" title={silo.material}>
                      {silo.material}
                    </div>

                    <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLow ? 'bg-rose-500' : percent > 75 ? 'bg-emerald-500' : 'bg-orange-500'}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{silo.currentTons} {silo.unit}</span>
                      <span>/ {silo.capacityTons} {silo.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
