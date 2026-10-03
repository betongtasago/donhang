import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  Clock,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Factory,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

export const TongQuanPage: React.FC = () => {
  const { orders, trucks, plants, trips, selectedPlant } = useSync();

  const totalVolume = orders.reduce((sum, o) => sum + o.totalVolume, 0);
  const deliveredVolume = orders.reduce((sum, o) => sum + o.deliveredVolume, 0);
  const percentCompleted = totalVolume > 0 ? Math.round((deliveredVolume / totalVolume) * 100) : 0;
  const activeTrucks = trucks.filter(t => t.status === 'DANG_CHAY' || t.status === 'DANG_XA').length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            HỆ THỐNG ĐIỀU HÀNH TỔNG THỂ
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Tổng quan Hoạt Động Cung Cấp Bê Tông
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Báo cáo tức thời sản lượng, công suất trạm trộn và vận hành toàn hệ thống TSG TNT.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-600 shadow-xs">
          <Calendar className="w-4 h-4 text-orange-600" />
          <span>Ca làm việc: <strong>Hôm nay, 30/09/2026</strong></span>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            TỔNG SẢN LƯỢNG ĐÃ GIAO
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{deliveredVolume} m³</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> {percentCompleted}%
            </span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-[#e25822] h-full rounded-full transition-all duration-500"
              style={{ width: `${percentCompleted}%` }}
            />
          </div>
          <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
            <span>Kế hoạch: {totalVolume} m³</span>
            <span>Còn lại: {totalVolume - deliveredVolume} m³</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            ĐƠN HÀNG ĐANG THỰC HIỆN
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {orders.filter(o => o.status === 'DANG_CHAY' || o.status === 'DA_DUYET').length}
            </span>
            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
              Tổng {orders.length} đơn
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Đã hoàn thành {orders.filter(o => o.status === 'HOAN_THANH').length} đơn trong ngày
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            ĐỘI XE HOẠT ĐỘNG
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{activeTrucks} / {trucks.length} xe</span>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
              {trucks.filter(t => t.status === 'SAN_SANG').length} sẵn sàng
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Tổng cộng {trips.length} chuyến xe đã xuất bến hôm nay
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            HIỆU SUẤT TRẠM TRỘN
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">210 m³/h</span>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
              2 Trạm sẵn sàng
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Thời gian trộn trung bình: 65 giây / mẻ 3m³
          </p>
        </div>
      </div>

      {/* Middle Section: Batching plants & Active orders breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plant status */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Trạng Thái Trạm Trộn Sản Xuất
              </h2>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Vận hành liên tục
            </span>
          </div>

          <div className="space-y-4">
            {plants.map((plant) => (
              <div key={plant.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{plant.name}</h3>
                    <p className="text-[11px] text-slate-500">
                      Công suất: {plant.capacityM3PerHour} m³/h • Sản lượng hôm nay: <strong>{plant.todayOutputM3} m³</strong>
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    plant.status === 'DANG_TRON'
                      ? 'bg-amber-100 text-amber-800 animate-pulse'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {plant.status === 'DANG_TRON' ? 'Đang trộn nạp xe' : 'Sẵn sàng'}
                  </span>
                </div>

                {plant.currentOrderCode && (
                  <div className="text-xs bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                    <div className="flex justify-between text-slate-600 text-[11px]">
                      <span>Đơn: <strong>{plant.currentOrderCode}</strong></span>
                      <span>Mẻ: {plant.currentRecipe}</span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-orange-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${plant.batchProgress || 40}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Deliveries Timeline & Quick Alert */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-orange-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Chuyến Xe Bồn Đang Trên Tuyến
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">GPS Realtime</span>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{trip.truckPlate}</span>
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                      {trip.volume} m³
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">[{trip.ticketNumber}]</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Tài xế: <strong>{trip.driverName}</strong> • {trip.orderCode} • Độ sụt: {trip.slumpTested}
                  </div>
                </div>

                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    trip.status === 'DANG_XA'
                      ? 'bg-emerald-100 text-emerald-800'
                      : trip.status === 'DANG_CHAY'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {trip.status === 'DANG_XA' ? 'Đang xả' : trip.status === 'DANG_CHAY' ? 'Đang chạy' : 'Đang nạp'}
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">Xuất: {trip.departureTime}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
