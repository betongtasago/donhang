import React, { useState, useMemo } from 'react';
import {
  Truck,
  Calendar,
  FileSpreadsheet,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  Phone,
  Award,
  Filter,
  Eye,
  X,
  FileText,
  UserCheck
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { DispatchTrip, FleetTruck, ConcreteOrder } from '../../types';
import * as XLSX from 'xlsx';

interface DriverMonthlySummary {
  driverName: string;
  driverPhone: string;
  truckPlate: string;
  truckType: string;
  totalTrips: number;
  largeTrips: number; // >= 6m³
  smallTrips: number; // < 6m³
  totalVolume: number; // m³
  totalDistanceKm: number; // Km 1 chiều
  totalRoundTripKm: number; // Km khứ hồi
  trips: Array<{
    trip: DispatchTrip;
    order?: ConcreteOrder;
    dateDmy: string;
    distanceKm: number;
    roundTripKm: number;
  }>;
}

export const TongQuanPage: React.FC = () => {
  const { orders, trips, trucks, projectDistances } = useSync();

  // Tháng và năm dương lịch để đếm thống kê (mặc định: Tháng 10 / 2026)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10); // 1-12 dương lịch

  // Tìm kiếm và sắp xếp
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'trips' | 'km' | 'volume' | 'name'>('trips');

  // Modal xem chi tiết chuyến của một tài xế
  const [selectedDriverDetail, setSelectedDriverDetail] = useState<DriverMonthlySummary | null>(null);

  // Helper tính Km cho chuyến xe
  const getTripDistanceKm = (trip: DispatchTrip, order?: ConcreteOrder): number => {
    if (trip.distanceKm && trip.distanceKm > 0) return trip.distanceKm;
    if (order?.distanceKm && order.distanceKm > 0) return order.distanceKm;

    if (order?.projectTitle) {
      const match = projectDistances.find(
        p => p.projectTitle.toLowerCase().trim() === order.projectTitle.toLowerCase().trim()
      );
      if (match && match.distanceKm) return match.distanceKm;
    }

    // Mặc định dựa trên trạm
    return 15;
  };

  // Helper xác định ngày dương lịch DD/MM/YYYY của chuyến xe
  const getTripGregorianDate = (trip: DispatchTrip, order?: ConcreteOrder): { dmy: string; month: number; year: number } => {
    let raw = trip.deliveryDate || '';
    if (!raw && trip.entryDate) {
      raw = trip.entryDate.split(' ')[0];
    }
    if (!raw && order?.deliveryDate) {
      raw = order.deliveryDate;
    }
    if (!raw) {
      raw = '04/10/2026';
    }

    let d = 4, m = 10, y = 2026;
    if (raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length === 3) {
        d = parseInt(parts[0], 10) || 4;
        m = parseInt(parts[1], 10) || 10;
        y = parseInt(parts[2], 10) || 2026;
      }
    } else if (raw.includes('-')) {
      const parts = raw.split('-');
      if (parts.length === 3) {
        y = parseInt(parts[0], 10) || 2026;
        m = parseInt(parts[1], 10) || 10;
        d = parseInt(parts[2], 10) || 4;
      }
    }

    const dStr = d < 10 ? `0${d}` : `${d}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return {
      dmy: `${dStr}/${mStr}/${y}`,
      month: m,
      year: y
    };
  };

  // Đếm và nhóm total chuyến, km theo từng tài xế trong tháng dương lịch đã chọn
  const driverMonthlyData = useMemo(() => {
    const driverMap = new Map<string, DriverMonthlySummary>();

    // Khởi tạo trước danh sách tài xế từ đội xe (để tài xế chưa có chuyến cũng hiển thị hoặc cập nhật)
    trucks.forEach(t => {
      const name = t.driverName?.trim();
      if (name && !driverMap.has(name)) {
        driverMap.set(name, {
          driverName: name,
          driverPhone: t.driverPhone || '',
          truckPlate: t.plateNumber || '',
          truckType: t.truckType || 'Xe bồn 10m³',
          totalTrips: 0,
          largeTrips: 0,
          smallTrips: 0,
          totalVolume: 0,
          totalDistanceKm: 0,
          totalRoundTripKm: 0,
          trips: []
        });
      }
    });

    // Quét toàn bộ trips lọc theo tháng và năm dương lịch
    trips.forEach(trip => {
      const driver = trip.driverName?.trim() || 'Tài xế giao nhận';
      const ord = orders.find(o => o.id === trip.orderId || o.code === trip.orderCode);
      const { dmy, month, year } = getTripGregorianDate(trip, ord);

      // Chỉ đếm các chuyến thuộc tháng và năm dương lịch đã chọn
      if (month === selectedMonth && year === selectedYear) {
        let summary = driverMap.get(driver);
        if (!summary) {
          summary = {
            driverName: driver,
            driverPhone: trip.driverPhone || '',
            truckPlate: trip.truckPlate || '',
            truckType: 'Xe bồn 10m³',
            totalTrips: 0,
            largeTrips: 0,
            smallTrips: 0,
            totalVolume: 0,
            totalDistanceKm: 0,
            totalRoundTripKm: 0,
            trips: []
          };
          driverMap.set(driver, summary);
        }

        const km = getTripDistanceKm(trip, ord);
        const roundKm = km * 2;
        const vol = trip.volume || 0;

        summary.totalTrips += 1;
        if (vol >= 6) {
          summary.largeTrips += 1;
        } else {
          summary.smallTrips += 1;
        }
        summary.totalVolume += vol;
        summary.totalDistanceKm += km;
        summary.totalRoundTripKm += roundKm;

        summary.trips.push({
          trip,
          order: ord,
          dateDmy: dmy,
          distanceKm: km,
          roundTripKm: roundKm
        });
      }
    });

    let result = Array.from(driverMap.values());

    // Tìm kiếm
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        d =>
          d.driverName.toLowerCase().includes(q) ||
          d.truckPlate.toLowerCase().includes(q) ||
          d.driverPhone.includes(q)
      );
    }

    // Sắp xếp
    result.sort((a, b) => {
      if (sortBy === 'trips') return b.totalTrips - a.totalTrips;
      if (sortBy === 'km') return b.totalDistanceKm - a.totalDistanceKm;
      if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
      return a.driverName.localeCompare(b.driverName, 'vi');
    });

    return result;
  }, [trips, orders, trucks, projectDistances, selectedMonth, selectedYear, searchTerm, sortBy]);

  // Tổng hợp metrics cả đội xe trong tháng
  const monthlyMetrics = useMemo(() => {
    let totalTrips = 0;
    let totalKm = 0;
    let totalRoundKm = 0;
    let totalVolume = 0;
    let largeTrips = 0;
    let smallTrips = 0;

    driverMonthlyData.forEach(d => {
      totalTrips += d.totalTrips;
      totalKm += d.totalDistanceKm;
      totalRoundKm += d.totalRoundTripKm;
      totalVolume += d.totalVolume;
      largeTrips += d.largeTrips;
      smallTrips += d.smallTrips;
    });

    const topDriver = [...driverMonthlyData].sort((a, b) => b.totalTrips - a.totalTrips)[0] || null;

    return {
      totalTrips,
      totalKm,
      totalRoundKm,
      totalVolume: Math.round(totalVolume * 10) / 10,
      largeTrips,
      smallTrips,
      activeDriversCount: driverMonthlyData.filter(d => d.totalTrips > 0).length,
      topDriver
    };
  }, [driverMonthlyData]);

  // Tiến lùi tháng dương lịch
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Xuất file Excel báo cáo tháng
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Tài Xế',
      'Số Điện Thoại',
      'Biển Số Xe',
      'Tổng Chuyến Trong Tháng',
      'Chuyến Lớn (>=6m³)',
      'Chuyến Nhỏ (<6m³)',
      'Tổng Khối Lượng (m³)',
      'Tổng Km 1 Chiều',
      'Tổng Km Khứ Hồi',
      'Km TB/Chuyến'
    ];

    const rows = driverMonthlyData.map((d, idx) => [
      idx + 1,
      d.driverName,
      d.driverPhone,
      d.truckPlate,
      d.totalTrips,
      d.largeTrips,
      d.smallTrips,
      d.totalVolume,
      d.totalDistanceKm,
      d.totalRoundTripKm,
      d.totalTrips > 0 ? (d.totalDistanceKm / d.totalTrips).toFixed(1) : 0
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      [`BÁO CÁO TỔNG HỢP CHUYẾN & KM TÀI XẾ - THÁNG ${selectedMonth}/${selectedYear} (DƯƠNG LỊCH)`],
      [`Đơn vị: Bê Tông TSG - TNT Operations | Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
      [],
      headers,
      ...rows
    ]);

    XLSX.utils.book_append_sheet(wb, ws, `TaiXe_T${selectedMonth}_${selectedYear}`);
    XLSX.writeFile(wb, `Bao_Cao_Chuyen_Km_Tai_Xe_T${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1700px] mx-auto animate-in fade-in duration-150">
      {/* 1. Header Toolbar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
              PHÂN HỆ THEO DÕI VẬN TẢI & TÀI XẾ TSG-TNT
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Dữ Liệu Đếm Total Chuyến & Km Từng Tài Xế Trong Tháng
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Thời gian tính theo <strong>Dương lịch</strong>. Tự động tính chuyến lớn (≥6m³), chuyến nhỏ (&lt;6m³) và cự ly km từng công trình.
          </p>
        </div>

        {/* Date Selector for Gregorian Month */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Stepper Month Picker */}
          <div className="flex items-center bg-slate-50 border border-slate-300 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer active:scale-95"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-3">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="font-mono font-black text-xs sm:text-sm text-blue-950">
                Tháng {selectedMonth} / {selectedYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition cursor-pointer active:scale-95"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Quick jump to current month */}
          <button
            type="button"
            onClick={() => {
              setSelectedMonth(10);
              setSelectedYear(2026);
            }}
            className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 transition cursor-pointer"
          >
            Tháng hiện tại (10/2026)
          </button>

          {/* Export Excel button */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Tổng chuyến */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng Chuyến Xe Xuất
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-blue-900">{monthlyMetrics.totalTrips}</span>
              <span className="text-xs text-slate-500 font-semibold">chuyến</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              <strong className="text-emerald-700">{monthlyMetrics.largeTrips}</strong> chuyến lớn ·{' '}
              <strong className="text-amber-700">{monthlyMetrics.smallTrips}</strong> chuyến nhỏ
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Tổng Km vận chuyển */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng Cự Ly Chạy (1 chiều)
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-900">{monthlyMetrics.totalKm}</span>
              <span className="text-xs text-slate-500 font-semibold">Km</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Khứ hồi: <strong>{monthlyMetrics.totalRoundKm} Km</strong>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Tổng m³ vận chuyển */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng Khối Lượng Bê Tông
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-orange-900">{monthlyMetrics.totalVolume}</span>
              <span className="text-xs text-slate-500 font-semibold">m³</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {monthlyMetrics.totalTrips > 0
                ? `TB: ${(monthlyMetrics.totalVolume / monthlyMetrics.totalTrips).toFixed(1)} m³/chuyến`
                : 'Chưa có chuyến'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Tài xế năng suất nhất */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tài Xế Dẫn Đầu Tháng
            </p>
            <div className="mt-1 truncate">
              <span className="text-lg font-black text-slate-900 truncate block">
                {monthlyMetrics.topDriver ? monthlyMetrics.topDriver.driverName : 'Chưa có dữ liệu'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 truncate">
              {monthlyMetrics.topDriver
                ? `${monthlyMetrics.topDriver.totalTrips} chuyến · ${monthlyMetrics.topDriver.totalDistanceKm} Km`
                : '0 chuyến'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Search and Sort Filter Toolbar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Search Input */}
          <div className="relative min-w-[240px] max-w-md flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên tài xế, biển số xe, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="trips">Nhiều chuyến nhất</option>
              <option value="km">Nhiều Km nhất</option>
              <option value="volume">Nhiều khối lượng m³ nhất</option>
              <option value="name">Tên tài xế (A - Z)</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-semibold text-xs">
          Tổng cộng: <strong>{driverMonthlyData.length}</strong> tài xế ({monthlyMetrics.activeDriversCount} có chuyến trong tháng)
        </div>
      </div>

      {/* 4. Main Driver Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span className="font-black text-slate-900 uppercase">
              Bảng Đếm Total Chuyến & Km Từng Tài Xế (Tháng {selectedMonth}/{selectedYear})
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">
            * Bấm vào từng dòng để xem chi tiết danh sách chuyến xe của tài xế
          </span>
        </div>

        {/* Desktop Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Tài Xế</th>
                <th className="py-3 px-3">Xe Bồn</th>
                <th className="py-3 px-3 text-center bg-blue-50/60 text-blue-900">Total Chuyến</th>
                <th className="py-3 px-3 text-center">Chuyến Lớn (≥6m³)</th>
                <th className="py-3 px-3 text-center">Chuyến Nhỏ (&lt;6m³)</th>
                <th className="py-3 px-3 text-right">Tổng Khối Lượng</th>
                <th className="py-3 px-3 text-right bg-emerald-50/60 text-emerald-900">Total Km (1 chiều)</th>
                <th className="py-3 px-3 text-right">Km Khứ Hồi</th>
                <th className="py-3 px-3 text-center">TB (Km/Chuyến)</th>
                <th className="py-3 px-3 text-center w-24">Chi Tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {driverMonthlyData.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500 font-semibold">
                    Không tìm thấy dữ liệu tài xế nào trong tháng {selectedMonth}/{selectedYear}.
                  </td>
                </tr>
              ) : (
                driverMonthlyData.map((d, index) => {
                  const avgKm = d.totalTrips > 0 ? (d.totalDistanceKm / d.totalTrips).toFixed(1) : '0';
                  const isTop = index === 0 && d.totalTrips > 0;

                  return (
                    <tr
                      key={d.driverName}
                      onClick={() => setSelectedDriverDetail(d)}
                      className="hover:bg-blue-50/40 transition cursor-pointer group"
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {isTop ? (
                          <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black inline-flex items-center justify-center shadow-xs">
                            1
                          </span>
                        ) : (
                          index + 1
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 text-xs group-hover:text-blue-600 transition flex items-center gap-1.5">
                          <span>{d.driverName}</span>
                          {isTop && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-bold">
                              Dẫn đầu
                            </span>
                          )}
                        </div>
                        {d.driverPhone && (
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{d.driverPhone}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-slate-800 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {d.truckPlate || '---'}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[120px]">
                          {d.truckType}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center bg-blue-50/30">
                        <span className="font-mono font-black text-sm text-blue-700 bg-blue-100/70 px-2.5 py-1 rounded-lg border border-blue-200 inline-block">
                          {d.totalTrips}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-emerald-700">
                        {d.largeTrips}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-700">
                        {d.smallTrips}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {d.totalVolume} m³
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-black text-sm text-emerald-800 bg-emerald-50/30">
                        {d.totalDistanceKm} Km
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">
                        {d.totalRoundTripKm} Km
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-500 font-semibold text-xs">
                        {avgKm} Km
                      </td>

                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDriverDetail(d);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-blue-600 hover:text-white text-blue-700 font-bold text-[11px] rounded-lg transition cursor-pointer"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Xem Chi Tiết Chuyến Của 1 Tài Xế */}
      {selectedDriverDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <span>Chi Tiết Chuyến Xe Của Tài Xế:</span>
                    <span className="text-amber-400 font-black">{selectedDriverDetail.driverName}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Tháng {selectedMonth} / {selectedYear} (Dương lịch) • Xe: {selectedDriverDetail.truckPlate} • SĐT:{' '}
                    {selectedDriverDetail.driverPhone || '---'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDriverDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metrics Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Tổng Chuyến:</span>
                <span className="font-mono font-black text-blue-700 text-base">{selectedDriverDetail.totalTrips} chuyến</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Tổng Km 1 Chiều:</span>
                <span className="font-mono font-black text-emerald-700 text-base">{selectedDriverDetail.totalDistanceKm} Km</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Tổng Khối Lượng:</span>
                <span className="font-mono font-black text-orange-700 text-base">{selectedDriverDetail.totalVolume} m³</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Phân Loại:</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedDriverDetail.largeTrips} lớn / {selectedDriverDetail.smallTrips} nhỏ
                </span>
              </div>
            </div>

            {/* Trips List Table inside Modal */}
            <div className="p-4 overflow-y-auto space-y-3">
              {selectedDriverDetail.trips.length === 0 ? (
                <div className="py-12 text-center text-slate-500 font-semibold text-xs">
                  Tài xế này chưa có chuyến xe nào được ghi nhận trong tháng {selectedMonth}/{selectedYear}.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-600 font-bold text-[11px] uppercase">
                        <th className="py-2.5 px-3 text-center">STT</th>
                        <th className="py-2.5 px-3">Ngày (Dương Lịch)</th>
                        <th className="py-2.5 px-3">Giờ Xuất</th>
                        <th className="py-2.5 px-3">Mã Đơn / Phiếu</th>
                        <th className="py-2.5 px-3">Khách Hàng & Công Trình</th>
                        <th className="py-2.5 px-3 text-center">Mác Bê Tông</th>
                        <th className="py-2.5 px-3 text-center">Khối Lượng</th>
                        <th className="py-2.5 px-3 text-right">Cự Ly Km</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDriverDetail.trips.map((item, idx) => (
                        <tr key={item.trip.id} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.dateDmy}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{item.trip.departureTime || '---'}</td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                              {item.trip.orderCode}
                            </span>
                            {item.trip.ticketNumber && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Phiếu: {item.trip.ticketNumber}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{item.order?.customerName || 'Khách hàng'}</div>
                            <div className="text-[11px] text-slate-500">{item.order?.projectTitle || 'Công trình'}</div>
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-800">
                            {item.trip.grade || item.order?.grade || 'M300'}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono font-bold text-orange-600">
                            {item.trip.volume} m³
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">
                            {item.distanceKm} Km <span className="text-[10px] text-slate-400 font-normal">({item.roundTripKm} khứ hồi)</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDriverDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
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
