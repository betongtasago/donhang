import React, { useState, useMemo } from 'react';
import {
  Truck,
  Phone,
  Navigation,
  FileText,
  Sliders,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Eye,
  X,
  Clock,
  ArrowRight,
  TrendingUp,
  Download
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { DispatchTrip, FleetTruck, DriverTripRuleConfig } from '../../types';

export const DriverTripSummaryView: React.FC = () => {
  const { trucks, trips, orders, projectDistances, driverTripConfig, updateDriverTripConfig } = useSync();

  // Selected driver for detailed trips modal
  const [selectedTruck, setSelectedTruck] = useState<FleetTruck | null>(null);

  // Config form toggle
  const [showConfig, setShowConfig] = useState(false);
  const [largeThreshold, setLargeThreshold] = useState<number>(driverTripConfig?.largeTripThresholdM3 || 6);
  const [cap8Threshold, setCap8Threshold] = useState<number>(driverTripConfig?.capacity8m3ThresholdM3 || 5.5);
  const [cap10Threshold, setCap10Threshold] = useState<number>(driverTripConfig?.capacity10m3ThresholdM3 || 6);
  const [cap12Threshold, setCap12Threshold] = useState<number>(driverTripConfig?.capacity12m3ThresholdM3 || 7);
  const [configSavedMsg, setConfigSavedMsg] = useState(false);

  // Save new thresholds
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateDriverTripConfig({
      largeTripThresholdM3: Number(largeThreshold),
      capacity8m3ThresholdM3: Number(cap8Threshold),
      capacity10m3ThresholdM3: Number(cap10Threshold),
      capacity12m3ThresholdM3: Number(cap12Threshold)
    });
    setConfigSavedMsg(true);
    setTimeout(() => setConfigSavedMsg(false), 3000);
  };

  // Helper to determine if a trip is large or small based on volume and truck capacity
  const checkIsLargeTrip = (volume: number, truckType?: string) => {
    let threshold = driverTripConfig?.largeTripThresholdM3 || 6;
    if (truckType?.includes('8m')) {
      threshold = driverTripConfig?.capacity8m3ThresholdM3 || 5.5;
    } else if (truckType?.includes('10m')) {
      threshold = driverTripConfig?.capacity10m3ThresholdM3 || 6;
    } else if (truckType?.includes('12m')) {
      threshold = driverTripConfig?.capacity12m3ThresholdM3 || 7;
    }
    return volume >= threshold;
  };

  // Helper to get distance km for a trip
  const getTripDistance = (trip: DispatchTrip) => {
    if (trip.distanceKm) return trip.distanceKm;
    const parentOrder = orders.find(o => o.id === trip.orderId || o.code === trip.orderCode);
    if (parentOrder?.distanceKm) return parentOrder.distanceKm;

    const prj = projectDistances.find(p =>
      p.projectTitle.toLowerCase() === parentOrder?.projectTitle.toLowerCase() ||
      (parentOrder?.customerCode && p.customerCode === parentOrder.customerCode)
    );
    return prj?.distanceKm || 15;
  };

  // Calculate statistics per driver/truck
  const driverStats = useMemo(() => {
    return trucks.map(truck => {
      const truckTrips = trips.filter(t => t.truckPlate === truck.plateNumber);

      let largeTripsCount = 0;
      let smallTripsCount = 0;
      let totalVolume = 0;
      let totalKm = 0; // khứ hồi (distance * 2)

      truckTrips.forEach(t => {
        const isLarge = checkIsLargeTrip(t.volume, truck.truckType);
        if (isLarge) largeTripsCount++;
        else smallTripsCount++;

        totalVolume += t.volume;
        const oneWayKm = getTripDistance(t);
        totalKm += oneWayKm * 2; // Khứ hồi 2 chiều
      });

      return {
        truck,
        trips: truckTrips,
        totalTrips: truckTrips.length,
        largeTripsCount,
        smallTripsCount,
        totalVolume,
        totalKm
      };
    });
  }, [trucks, trips, orders, projectDistances, driverTripConfig]);

  // Overall statistics
  const totalFleetTrips = driverStats.reduce((sum, d) => sum + d.totalTrips, 0);
  const totalFleetLarge = driverStats.reduce((sum, d) => sum + d.largeTripsCount, 0);
  const totalFleetSmall = driverStats.reduce((sum, d) => sum + d.smallTripsCount, 0);
  const totalFleetKm = driverStats.reduce((sum, d) => sum + d.totalKm, 0);

  // Trips of selected driver
  const selectedDriverTrips = useMemo(() => {
    if (!selectedTruck) return [];
    return trips.filter(t => t.truckPlate === selectedTruck.plateNumber);
  }, [selectedTruck, trips]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI summary */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                QUẢN LÝ CHUYẾN & KM LÁI XE
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Tính Chuyến Lớn (≥6m³), Chuyến Nhỏ (&lt;6m³) & Km Công Trình Cho Tài Xế
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Tự động phân loại định mức chuyến theo loại xe (8m³, 10m³) và tính tổng km khứ hồi từ danh mục công trình.
            </p>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Sliders className="w-4 h-4 text-orange-600" />
            <span>{showConfig ? 'Đóng cấu hình ngưỡng' : 'Cấu hình ngưỡng chuyến'}</span>
          </button>
        </div>

        {/* Threshold Rule Configuration Drawer */}
        {showConfig && (
          <form onSubmit={handleSaveConfig} className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="font-bold text-orange-950 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-orange-600" />
                CẤU HÌNH ĐỊNH MỨC PHÂN LOẠI CHUYẾN (THAY ĐỔI THEO LOẠI XE):
              </div>
              {configSavedMsg && (
                <span className="text-emerald-700 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã cập nhật định mức mới!
                </span>
              )}
            </div>

            <p className="text-slate-600 text-[11px]">
              Chuyến lớn được tính khi khối lượng xuất bến bằng hoặc lớn hơn ngưỡng quy định. Dưới ngưỡng sẽ được tính là chuyến nhỏ.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ngưỡng chung mặc định (m³)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={largeThreshold}
                  onChange={(e) => setLargeThreshold(parseFloat(e.target.value) || 6)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-orange-600"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ngưỡng cho Xe 8m³ (m³)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={cap8Threshold}
                  onChange={(e) => setCap8Threshold(parseFloat(e.target.value) || 5.5)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ngưỡng cho Xe 10m³ (m³)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={cap10Threshold}
                  onChange={(e) => setCap10Threshold(parseFloat(e.target.value) || 6)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Ngưỡng cho Xe 12m³ (m³)</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={cap12Threshold}
                  onChange={(e) => setCap12Threshold(parseFloat(e.target.value) || 7)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Áp dụng ngưỡng mới & Tính lại toàn bộ
              </button>
            </div>
          </form>
        )}

        {/* 4 KPI summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">TỔNG CHUYẾN TOÀN ĐỘI</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{totalFleetTrips} chuyến</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{trucks.length} xe bồn vận hành</div>
          </div>

          <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">CHUYẾN LỚN (≥6m³)</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{totalFleetLarge} chuyến</div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {totalFleetTrips > 0 ? Math.round((totalFleetLarge / totalFleetTrips) * 100) : 0}% tổng số chuyến
            </div>
          </div>

          <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200">
            <div className="text-[11px] font-bold text-amber-800 uppercase">CHUYẾN NHỎ (&lt;6m³)</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{totalFleetSmall} chuyến</div>
            <div className="text-[11px] text-amber-600 mt-0.5">Các chuyến lẻ / vét móng</div>
          </div>

          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
            <div className="text-[11px] font-bold text-blue-800 uppercase">TỔNG KM KHỨ HỒI ĐÃ CHẠY</div>
            <div className="text-2xl font-black text-blue-700 mt-1">{totalFleetKm} km</div>
            <div className="text-[11px] text-blue-600 mt-0.5">Tính theo cự ly từng công trình</div>
          </div>
        </div>
      </div>

      {/* Driver Summary Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            BẢNG TỔNG HỢP CÔNG NHẬT, CHUYẾN LỚN/NHỎ VÀ TỔNG KM TỪNG TÀI XẾ
          </h3>
          <span className="text-xs text-slate-500">
            Quy tắc: Chuyến lớn <strong className="text-emerald-700">≥ {driverTripConfig?.largeTripThresholdM3 || 6} m³</strong> • Chuyến nhỏ <strong className="text-amber-700">&lt; {driverTripConfig?.largeTripThresholdM3 || 6} m³</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center">STT</th>
                <th className="py-3 px-4">TÀI XẾ PHỤ TRÁCH</th>
                <th className="py-3 px-3">BIỂN SỐ XE</th>
                <th className="py-3 px-3">LOẠI XE</th>
                <th className="py-3 px-3 text-center">CHUYẾN LỚN (≥6m³)</th>
                <th className="py-3 px-3 text-center">CHUYẾN NHỎ (&lt;6m³)</th>
                <th className="py-3 px-3 text-center">TỔNG CHUYẾN</th>
                <th className="py-3 px-3 text-right">TỔNG M³ CHỞ</th>
                <th className="py-3 px-3 text-right text-blue-700">TỔNG KM KHỨ HỒI</th>
                <th className="py-3 px-3 text-center">CHI TIẾT CHUYẾN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverStats.map((item, idx) => (
                <tr key={item.truck.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>

                  {/* Driver Name & Phone */}
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-xs">{item.truck.driverName}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{item.truck.driverPhone}</span>
                    </div>
                  </td>

                  {/* Truck Plate */}
                  <td className="py-3 px-3 font-mono font-bold text-slate-800">
                    {item.truck.plateNumber}
                  </td>

                  {/* Truck Type */}
                  <td className="py-3 px-3 text-slate-600 font-medium">
                    {item.truck.truckType}
                  </td>

                  {/* Large Trips (>= 6m3) */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {item.largeTripsCount}
                    </span>
                  </td>

                  {/* Small Trips (< 6m3) */}
                  <td className="py-3 px-3 text-center">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                      {item.smallTripsCount}
                    </span>
                  </td>

                  {/* Total Trips */}
                  <td className="py-3 px-3 text-center font-black text-slate-900 text-xs">
                    {item.totalTrips} chuyến
                  </td>

                  {/* Total m3 */}
                  <td className="py-3 px-3 text-right font-black text-orange-600">
                    {item.totalVolume} <span className="text-[10px] text-slate-400 font-normal">m³</span>
                  </td>

                  {/* Total Roundtrip Km */}
                  <td className="py-3 px-3 text-right font-black text-blue-700 whitespace-nowrap">
                    {item.totalKm} <span className="text-[10px] text-slate-400 font-normal">km</span>
                  </td>

                  {/* Action View Detail */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => setSelectedTruck(item.truck)}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-orange-100 hover:text-orange-700 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Xem ({item.totalTrips})</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                <td colSpan={4} className="py-3 px-4 text-right uppercase text-[11px] font-black">
                  TỔNG CỘNG TOÀN ĐỘI:
                </td>
                <td className="py-3 px-3 text-center text-emerald-800 font-black text-sm">
                  {totalFleetLarge}
                </td>
                <td className="py-3 px-3 text-center text-amber-800 font-black text-sm">
                  {totalFleetSmall}
                </td>
                <td className="py-3 px-3 text-center text-slate-900 font-black text-sm">
                  {totalFleetTrips}
                </td>
                <td className="py-3 px-3 text-right text-orange-600 font-black text-sm">
                  {driverStats.reduce((sum, d) => sum + d.totalVolume, 0)} m³
                </td>
                <td className="py-3 px-3 text-right text-blue-700 font-black text-sm">
                  {totalFleetKm} km
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Driver Detail Trips Modal */}
      {selectedTruck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-orange-400" />
                  <h3 className="font-bold text-sm">
                    Chi Tiết Chuyến Xe & Km Lái Xe: {selectedTruck.driverName} ({selectedTruck.plateNumber})
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Loại xe: {selectedTruck.truckType}
                </p>
              </div>
              <button
                onClick={() => setSelectedTruck(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold">TỔNG CHUYẾN</div>
                  <div className="text-lg font-black text-slate-900 mt-0.5">{selectedDriverTrips.length}</div>
                </div>
                <div>
                  <div className="text-[10px] text-emerald-700 uppercase font-bold">CHUYẾN LỚN (≥6m³)</div>
                  <div className="text-lg font-black text-emerald-700 mt-0.5">
                    {selectedDriverTrips.filter(t => checkIsLargeTrip(t.volume, selectedTruck.truckType)).length}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-amber-700 uppercase font-bold">CHUYẾN NHỎ (&lt;6m³)</div>
                  <div className="text-lg font-black text-amber-700 mt-0.5">
                    {selectedDriverTrips.filter(t => !checkIsLargeTrip(t.volume, selectedTruck.truckType)).length}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                      <th className="py-2.5 px-3">SỐ PHIẾU</th>
                      <th className="py-2.5 px-3">MÃ ĐƠN</th>
                      <th className="py-2.5 px-3">CÔNG TRÌNH</th>
                      <th className="py-2.5 px-3 text-right">LƯỢNG XUẤT</th>
                      <th className="py-2.5 px-3 text-center">PHÂN LOẠI CHUYẾN</th>
                      <th className="py-2.5 px-3 text-right">CỰ LY (1 CHIỀU)</th>
                      <th className="py-2.5 px-3 text-right text-blue-700">KM KHỨ HỒI</th>
                      <th className="py-2.5 px-3">XUẤT BẾN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDriverTrips.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          Chưa có chuyến nào được ghi nhận cho tài xế này.
                        </td>
                      </tr>
                    ) : (
                      selectedDriverTrips.map((t) => {
                        const isLarge = checkIsLargeTrip(t.volume, selectedTruck.truckType);
                        const dist = getTripDistance(t);
                        const order = orders.find(o => o.id === t.orderId || o.code === t.orderCode);
                        return (
                          <tr key={t.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{t.ticketNumber}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-600">{t.orderCode}</td>
                            <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[180px] truncate" title={order?.projectTitle}>
                              {order?.projectTitle || 'Dự án KCN Phước Đông'}
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-orange-600">
                              {t.volume} m³
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {isLarge ? (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  Chuyến lớn (≥6m³)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                                  Chuyến nhỏ (&lt;6m³)
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-semibold text-slate-700">
                              {dist} km
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-blue-700">
                              {dist * 2} km
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 font-mono">
                              {t.departureTime}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedTruck(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs"
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
