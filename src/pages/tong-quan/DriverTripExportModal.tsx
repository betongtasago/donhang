import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  CheckSquare,
  Square,
  Download,
  CheckCircle2,
  AlertCircle,
  Truck,
  MapPin,
  Clock,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Eye,
  Sparkles
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { DispatchTrip, ConcreteOrder, FleetTruck, ProjectDistance } from '../../types';

interface DriverTripExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMonth: number;
  selectedYear: number;
  trips: DispatchTrip[];
  orders: ConcreteOrder[];
  trucks: FleetTruck[];
  projectDistances: ProjectDistance[];
  getTripDistanceKm: (trip: DispatchTrip, order?: ConcreteOrder) => number;
  getTripGregorianDate: (trip: DispatchTrip, order?: ConcreteOrder) => { dmy: string; month: number; year: number; day?: number };
}

export const DriverTripExportModal: React.FC<DriverTripExportModalProps> = ({
  isOpen,
  onClose,
  selectedMonth,
  selectedYear,
  trips,
  orders,
  trucks,
  projectDistances,
  getTripDistanceKm,
  getTripGregorianDate
}) => {
  if (!isOpen) return null;

  // Số ngày trong tháng dương lịch
  const daysInMonth = useMemo(() => {
    return new Date(selectedYear, selectedMonth, 0).getDate();
  }, [selectedYear, selectedMonth]);

  // Thứ của ngày 1 trong tháng (0 = CN, 1 = T2, ...)
  const getWeekdayName = (day: number): string => {
    const dt = new Date(selectedYear, selectedMonth - 1, day);
    const names = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return names[dt.getDay()];
  };

  // Quét toàn bộ chuyến xe trong tháng này và nhóm theo ngày
  const monthTripsWithDetails = useMemo(() => {
    return trips
      .map(trip => {
        const ord = orders.find(o => o.id === trip.orderId || o.code === trip.orderCode);
        const { dmy, month, year } = getTripGregorianDate(trip, ord);
        // Lấy ngày trong tháng
        let day = 1;
        if (dmy.includes('/')) {
          day = parseInt(dmy.split('/')[0], 10) || 1;
        }
        const km = getTripDistanceKm(trip, ord);
        return {
          trip,
          order: ord,
          dmy,
          day,
          month,
          year,
          km,
          roundKm: km * 2,
          vol: trip.volume || 0,
          driver: trip.driverName?.trim() || 'Tài xế giao nhận',
          plate: trip.truckPlate || ''
        };
      })
      .filter(item => item.month === selectedMonth && item.year === selectedYear);
  }, [trips, orders, selectedMonth, selectedYear, getTripDistanceKm, getTripGregorianDate]);

  // Đếm số chuyến theo từng ngày trong tháng
  const tripCountByDay = useMemo(() => {
    const map: Record<number, number> = {};
    monthTripsWithDetails.forEach(item => {
      map[item.day] = (map[item.day] || 0) + 1;
    });
    return map;
  }, [monthTripsWithDetails]);

  // Các ngày có chuyến xe
  const daysWithTrips = useMemo(() => {
    return Object.keys(tripCountByDay)
      .map(d => parseInt(d, 10))
      .filter(d => tripCountByDay[d] > 0)
      .sort((a, b) => a - b);
  }, [tripCountByDay]);

  // State: Các ngày được chọn (Set<number>)
  // Mặc định chọn tất cả các ngày có chuyến hoặc từ ngày 1 đến 4
  const [selectedDays, setSelectedDays] = useState<number[]>(() => {
    if (daysWithTrips.length > 0) {
      return [...daysWithTrips];
    }
    return [1, 2, 3, 4];
  });

  // Tùy chọn cấu hình xuất
  const [includeDetailSheet, setIncludeDetailSheet] = useState<boolean>(true);
  const [onlyActiveDrivers, setOnlyActiveDrivers] = useState<boolean>(true);
  const [exportMode, setExportMode] = useState<'MATRIX' | 'STANDARD'>('MATRIX');
  const [previewTab, setPreviewTab] = useState<'SUMMARY' | 'DETAIL'>('SUMMARY');

  // Range inputs
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(Math.min(7, daysInMonth));

  // Toggle 1 ngày
  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  // Các preset chọn nhanh
  const handleSelectAllDays = () => {
    const all = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    setSelectedDays(all);
  };

  const handleDeselectAll = () => {
    setSelectedDays([]);
  };

  const handleSelectOnlyWithTrips = () => {
    if (daysWithTrips.length > 0) {
      setSelectedDays([...daysWithTrips]);
    } else {
      setSelectedDays([1, 2, 3, 4]);
    }
  };

  const handleSelectToday = () => {
    const todayDay = 4; // Mock date 04/10/2026
    setSelectedDays([todayDay]);
  };

  const handleSelectLast3Days = () => {
    setSelectedDays([2, 3, 4].filter(d => d <= daysInMonth));
  };

  const handleSelectFirst7Days = () => {
    const days = Array.from({ length: Math.min(7, daysInMonth) }, (_, i) => i + 1);
    setSelectedDays(days);
  };

  const handleSelectFirst15Days = () => {
    const days = Array.from({ length: Math.min(15, daysInMonth) }, (_, i) => i + 1);
    setSelectedDays(days);
  };

  const handleApplyRange = () => {
    const start = Math.max(1, Math.min(rangeStart, rangeEnd));
    const end = Math.min(daysInMonth, Math.max(rangeStart, rangeEnd));
    const days: number[] = [];
    for (let i = start; i <= end; i++) {
      days.push(i);
    }
    setSelectedDays(days);
  };

  // Lọc các chuyến xe nằm trong các ngày đã chọn
  const filteredTrips = useMemo(() => {
    const daySet = new Set(selectedDays);
    return monthTripsWithDetails.filter(t => daySet.has(t.day));
  }, [monthTripsWithDetails, selectedDays]);

  // Nhóm theo tài xế trong các ngày đã chọn
  const driverSummaryData = useMemo(() => {
    const driverMap = new Map<string, {
      driverName: string;
      driverPhone: string;
      truckPlate: string;
      truckType: string;
      dayCounts: Record<number, number>; // Số chuyến theo từng ngày
      dayVolumes: Record<number, number>; // Khối lượng theo từng ngày
      totalTrips: number;
      largeTrips: number;
      smallTrips: number;
      totalVolume: number;
      totalKm: number;
      totalRoundKm: number;
      tripsList: typeof filteredTrips;
    }>();

    // Khởi tạo danh sách tài xế từ đội xe
    trucks.forEach(trk => {
      const name = trk.driverName?.trim();
      if (name && !driverMap.has(name)) {
        driverMap.set(name, {
          driverName: name,
          driverPhone: trk.driverPhone || '',
          truckPlate: trk.plateNumber || '',
          truckType: trk.truckType || 'Xe bồn 10m³',
          dayCounts: {},
          dayVolumes: {},
          totalTrips: 0,
          largeTrips: 0,
          smallTrips: 0,
          totalVolume: 0,
          totalKm: 0,
          totalRoundKm: 0,
          tripsList: []
        });
      }
    });

    // Điền dữ liệu từ các chuyến đã lọc theo ngày đã chọn
    filteredTrips.forEach(item => {
      let d = driverMap.get(item.driver);
      if (!d) {
        d = {
          driverName: item.driver,
          driverPhone: item.trip.driverPhone || '',
          truckPlate: item.plate,
          truckType: 'Xe bồn 10m³',
          dayCounts: {},
          dayVolumes: {},
          totalTrips: 0,
          largeTrips: 0,
          smallTrips: 0,
          totalVolume: 0,
          totalKm: 0,
          totalRoundKm: 0,
          tripsList: []
        };
        driverMap.set(item.driver, d);
      }

      d.dayCounts[item.day] = (d.dayCounts[item.day] || 0) + 1;
      d.dayVolumes[item.day] = (d.dayVolumes[item.day] || 0) + item.vol;
      d.totalTrips += 1;
      if (item.vol >= 6) {
        d.largeTrips += 1;
      } else {
        d.smallTrips += 1;
      }
      d.totalVolume += item.vol;
      d.totalKm += item.km;
      d.totalRoundKm += item.roundKm;
      d.tripsList.push(item);
    });

    let list = Array.from(driverMap.values());
    if (onlyActiveDrivers) {
      list = list.filter(d => d.totalTrips > 0);
    }

    // Sắp xếp theo số chuyến giảm dần
    list.sort((a, b) => b.totalTrips - a.totalTrips || a.driverName.localeCompare(b.driverName, 'vi'));
    return list;
  }, [trucks, filteredTrips, onlyActiveDrivers]);

  // Thống kê nhanh selection
  const selectionStats = useMemo(() => {
    const totalTrips = filteredTrips.length;
    const totalVolume = filteredTrips.reduce((s, t) => s + t.vol, 0);
    const totalKm = filteredTrips.reduce((s, t) => s + t.km, 0);
    const totalRoundKm = totalKm * 2;
    const activeDrivers = driverSummaryData.filter(d => d.totalTrips > 0).length;
    const largeTrips = filteredTrips.filter(t => t.vol >= 6).length;
    const smallTrips = filteredTrips.filter(t => t.vol < 6).length;

    return {
      totalTrips,
      totalVolume: Math.round(totalVolume * 10) / 10,
      totalKm,
      totalRoundKm,
      activeDrivers,
      largeTrips,
      smallTrips
    };
  }, [filteredTrips, driverSummaryData]);

  // Thực hiện xuất file Excel
  const handleExecuteExportExcel = () => {
    if (selectedDays.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ngày để xuất báo cáo!');
      return;
    }

    const sortedDays = [...selectedDays].sort((a, b) => a - b);
    const daysStrLabel = sortedDays.length <= 5
      ? `Ngày ${sortedDays.join(', ')}`
      : `${sortedDays.length} ngày (Ngày ${sortedDays[0]} -> Ngày ${sortedDays[sortedDays.length - 1]})`;

    const wb = XLSX.utils.book_new();

    // -------------------------------------------------------------
    // SHEET 1: BẢNG MA TRẬN / TỔNG HỢP THEO TÙY CHỌN NGÀY
    // -------------------------------------------------------------
    const headers: string[] = [
      'STT',
      'Họ Và Tên Tài Xế',
      'Số Điện Thoại',
      'Biển Số Xe Bồn',
      'Loại Xe'
    ];

    if (exportMode === 'MATRIX') {
      // Thêm cột cho từng ngày được chọn
      sortedDays.forEach(d => {
        const dStr = d < 10 ? `0${d}` : `${d}`;
        const weekday = getWeekdayName(d);
        headers.push(`Ng.${dStr} (${weekday})`);
      });
    }

    headers.push(
      'TỔNG CHUYẾN',
      'Chuyến Lớn (>=6m³)',
      'Chuyến Nhỏ (<6m³)',
      'Tổng Khối Lượng (m³)',
      'Tổng Km 1 Chiều',
      'Tổng Km Khứ Hồi',
      'Km TB/Chuyến'
    );

    const rows: any[][] = [];

    driverSummaryData.forEach((d, idx) => {
      const row: any[] = [
        idx + 1,
        d.driverName,
        d.driverPhone,
        d.truckPlate,
        d.truckType
      ];

      if (exportMode === 'MATRIX') {
        sortedDays.forEach(dayNum => {
          const count = d.dayCounts[dayNum] || 0;
          row.push(count > 0 ? count : '-');
        });
      }

      row.push(
        d.totalTrips,
        d.largeTrips,
        d.smallTrips,
        Math.round(d.totalVolume * 10) / 10,
        d.totalKm,
        d.totalRoundKm,
        d.totalTrips > 0 ? (d.totalKm / d.totalTrips).toFixed(1) : '0'
      );

      rows.push(row);
    });

    // Dòng TỔNG CỘNG
    const totalRow: any[] = [
      '',
      'TỔNG CỘNG ĐỘI XE',
      '',
      `${driverSummaryData.length} tài xế`,
      ''
    ];

    if (exportMode === 'MATRIX') {
      sortedDays.forEach(dayNum => {
        const dayTotal = filteredTrips.filter(t => t.day === dayNum).length;
        totalRow.push(dayTotal);
      });
    }

    totalRow.push(
      selectionStats.totalTrips,
      selectionStats.largeTrips,
      selectionStats.smallTrips,
      selectionStats.totalVolume,
      selectionStats.totalKm,
      selectionStats.totalRoundKm,
      selectionStats.totalTrips > 0 ? (selectionStats.totalKm / selectionStats.totalTrips).toFixed(1) : '0'
    );
    rows.push(totalRow);

    const titleRows = [
      [`BÁO CÁO ĐẾM CHUYẾN & KM TÀI XẾ - ${daysStrLabel.toUpperCase()} - THÁNG ${selectedMonth}/${selectedYear} (DƯƠNG LỊCH)`],
      [`Đơn vị: BÊ TÔNG TÂN NHẬT NGUYỆT (TSG-TNT) | Ngày xuất file: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
      [`Phạm vi thống kê: ${selectedDays.length} ngày đã chọn | Tổng chuyến: ${selectionStats.totalTrips} chuyến | Tổng m³: ${selectionStats.totalVolume} m³ | Tổng Km: ${selectionStats.totalKm} km`],
      []
    ];

    const ws1Data = [...titleRows, headers, ...rows];
    const ws1 = XLSX.utils.aoa_to_sheet(ws1Data);

    // Căn chỉnh độ rộng cột
    const colWidths = [
      { wch: 6 },  // STT
      { wch: 24 }, // Tên tài xế
      { wch: 15 }, // SĐT
      { wch: 14 }, // Biển số
      { wch: 16 }  // Loại xe
    ];

    if (exportMode === 'MATRIX') {
      sortedDays.forEach(() => colWidths.push({ wch: 12 }));
    }

    colWidths.push(
      { wch: 14 }, // Tổng chuyến
      { wch: 18 }, // Chuyến lớn
      { wch: 18 }, // Chuyến nhỏ
      { wch: 20 }, // Tổng m3
      { wch: 16 }, // Km 1 chiều
      { wch: 16 }, // Km khứ hồi
      { wch: 14 }  // Km TB
    );
    ws1['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws1, `TongHop_Ngay_${selectedDays.slice(0, 3).join('_')}`);

    // -------------------------------------------------------------
    // SHEET 2: CHI TIẾT TỪNG CHUYẾN XE (NẾU ĐƯỢC CHỌN)
    // -------------------------------------------------------------
    if (includeDetailSheet && filteredTrips.length > 0) {
      const detailHeaders = [
        'STT',
        'Ngày Chạy',
        'Giờ Xuất',
        'Biển Số Xe',
        'Tên Tài Xế',
        'SĐT Tài Xế',
        'Mã Đơn Hàng',
        'Tên Khách Hàng',
        'Công Trình',
        'Hạng Mục',
        'Mác Bê Tông',
        'Độ Sụt',
        'Khối Lượng m³',
        'Cự Ly Km (1 Chiều)',
        'Km Khứ Hồi',
        'Số Phiếu PKX',
        'Số Niêm Chì',
        'Trạng Thái',
        'Trạm Sản Xuất'
      ];

      const detailRows = filteredTrips.map((item, idx) => [
        idx + 1,
        item.dmy,
        item.trip.departureTime || '15:00',
        item.plate,
        item.driver,
        item.trip.driverPhone || '',
        item.order?.code || item.trip.orderCode,
        item.order?.customerName || 'CÔNG TY TSG-TNT',
        item.order?.projectTitle || 'CÔNG TRÌNH TÂY NINH',
        item.order?.categoryItem || 'Sàn',
        item.trip.grade || item.order?.grade || 'M350',
        item.trip.slumpTested || item.order?.slump || '10+-2',
        item.vol,
        item.km,
        item.roundKm,
        item.trip.ticketNumber || '',
        item.trip.sealNumber || '',
        item.trip.status === 'HOAN_THANH' ? 'Hoàn thành' : 'Đang chạy',
        item.trip.plantLocation || item.order?.plantLocation || 'Tây Ninh'
      ]);

      const ws2Data = [
        [`CHI TIẾT TOÀN BỘ CHUYẾN XE XUẤT BẾN - ${daysStrLabel.toUpperCase()} - THÁNG ${selectedMonth}/${selectedYear}`],
        [`Tổng cộng: ${filteredTrips.length} chuyến xe | Đơn vị: Bê Tông TSG - TNT Operations`],
        [],
        detailHeaders,
        ...detailRows
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(ws2Data);
      ws2['!cols'] = [
        { wch: 6 },
        { wch: 13 },
        { wch: 10 },
        { wch: 14 },
        { wch: 22 },
        { wch: 15 },
        { wch: 16 },
        { wch: 32 },
        { wch: 30 },
        { wch: 22 },
        { wch: 16 },
        { wch: 10 },
        { wch: 14 },
        { wch: 16 },
        { wch: 14 },
        { wch: 15 },
        { wch: 14 },
        { wch: 14 },
        { wch: 14 }
      ];

      XLSX.utils.book_append_sheet(wb, ws2, 'ChiTiet_Tung_Chuyen');
    }

    // Tên file xuất thông minh
    const dayTag = sortedDays.length === daysInMonth
      ? 'Ca_Thang'
      : sortedDays.length <= 4
        ? `Ngay_${sortedDays.join('_')}`
        : `${sortedDays.length}_Ngay_Tu_${sortedDays[0]}_den_${sortedDays[sortedDays.length - 1]}`;

    const fileName = `Bao_Cao_Chuyen_Tai_Xe_${dayTag}_T${selectedMonth}_${selectedYear}.xlsx`;
    XLSX.writeFile(wb, fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  XUẤT EXCEL TÙY CHỌN NGÀY
                </span>
                <span className="text-xs text-slate-300">
                  Dương Lịch Tháng {selectedMonth}/{selectedYear}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight mt-1">
                Xuất Báo Cáo Chuyến & Km Tài Xế Theo 1, 2, 3... Nhiều Ngày
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* 1. Quick Presets Toolbar */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Filter className="w-4 h-4 text-blue-600" />
                <span>CHỌN NHANH CÁC NGÀY TRONG THÁNG {selectedMonth}/{selectedYear}:</span>
              </div>

              <div className="text-xs font-mono font-bold text-blue-900 bg-blue-100/80 px-2.5 py-1 rounded-lg">
                Đã chọn: <span className="text-blue-700 font-black">{selectedDays.length}</span> / {daysInMonth} ngày
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={handleSelectAllDays}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-blue-800 border border-slate-200 font-bold text-xs transition cursor-pointer shadow-2xs hover:border-blue-300"
              >
                🌟 Chọn tất cả (1 → {daysInMonth})
              </button>

              <button
                type="button"
                onClick={handleSelectOnlyWithTrips}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-slate-200 font-bold text-xs transition cursor-pointer shadow-2xs hover:border-emerald-300"
              >
                ⚡ Chỉ ngày có chuyến ({daysWithTrips.length} ngày)
              </button>

              <button
                type="button"
                onClick={handleSelectToday}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                🎯 Ngày 04 (Hôm nay)
              </button>

              <button
                type="button"
                onClick={handleSelectLast3Days}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                📅 3 ngày gần nhất (2, 3, 4)
              </button>

              <button
                type="button"
                onClick={handleSelectFirst7Days}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                📅 7 ngày đầu tháng (1 → 7)
              </button>

              <button
                type="button"
                onClick={handleSelectFirst15Days}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                📅 15 ngày đầu tháng (1 → 15)
              </button>

              <button
                type="button"
                onClick={handleDeselectAll}
                className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
              >
                ❌ Bỏ chọn hết
              </button>
            </div>

            {/* Custom Range Selector: Từ ngày X đến ngày Y */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/70 text-xs">
              <span className="font-semibold text-slate-600">Hoặc chọn khoảng ngày:</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Từ ngày</span>
                <input
                  type="number"
                  min={1}
                  max={daysInMonth}
                  value={rangeStart}
                  onChange={e => setRangeStart(parseInt(e.target.value, 10) || 1)}
                  className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800"
                />
                <span className="text-slate-500">đến ngày</span>
                <input
                  type="number"
                  min={1}
                  max={daysInMonth}
                  value={rangeEnd}
                  onChange={e => setRangeEnd(parseInt(e.target.value, 10) || daysInMonth)}
                  className="w-14 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-slate-800"
                />
                <button
                  type="button"
                  onClick={handleApplyRange}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </div>
          </div>

          {/* 2. Interactive Multi-Day Selection Grid (1, 2, 3, ..., 31) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>BẢNG TÙY CHỌN TỪNG NGÀY TRONG THÁNG {selectedMonth}/{selectedYear} (Bấm vào ngày để Bật/Tắt):</span>
              </span>
              <span className="text-[11px] text-slate-400">
                Thứ: CN, T2, T3, T4, T5, T6, T7
              </span>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-8 lg:grid-cols-11 gap-1.5 sm:gap-2">
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const isSelected = selectedDays.includes(day);
                const tripsCount = tripCountByDay[day] || 0;
                const weekday = getWeekdayName(day);
                const isWeekend = weekday === 'CN' || weekday === 'T7';

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`relative p-2 rounded-xl text-center transition cursor-pointer border flex flex-col items-center justify-center gap-0.5 active:scale-95 ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-700 shadow-sm ring-2 ring-blue-300'
                        : tripsCount > 0
                          ? 'bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-950 border-emerald-300'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {/* Top small tag: Weekday */}
                    <span
                      className={`text-[9px] font-bold ${
                        isSelected
                          ? 'text-blue-100'
                          : isWeekend
                            ? 'text-red-500'
                            : 'text-slate-400'
                      }`}
                    >
                      {weekday}
                    </span>

                    {/* Day number */}
                    <span className="font-mono font-black text-sm sm:text-base leading-none">
                      {day < 10 ? `0${day}` : day}
                    </span>

                    {/* Trip count badge */}
                    {tripsCount > 0 ? (
                      <span
                        className={`text-[9px] font-bold px-1 py-0.2 rounded mt-0.5 leading-tight ${
                          isSelected
                            ? 'bg-blue-800 text-emerald-300'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        {tripsCount} ch
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-300 leading-tight">
                        0
                      </span>
                    )}

                    {/* Selected Checkmark overlay icon */}
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Live Selection Statistics Banner */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-4 text-white shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                  TỔNG HỢP THEO {selectedDays.length} NGÀY ĐÃ CHỌN
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {selectedDays.length > 0 ? (
                    <span>
                      Các ngày: <strong className="text-emerald-300 font-mono">
                        {selectedDays.length <= 10
                          ? selectedDays.join(', ')
                          : `${selectedDays.slice(0, 8).join(', ')}... (+${selectedDays.length - 8} ngày nữa)`}
                      </strong>
                    </span>
                  ) : (
                    <span className="text-amber-300">Chưa chọn ngày nào! Vui lòng chọn ít nhất 1 ngày bên trên.</span>
                  )}
                </h4>
              </div>

              {/* 4 KPI Metrics */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-center">
                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                  <div className="text-[10px] text-slate-300 uppercase font-semibold">Tổng Chuyến</div>
                  <div className="font-mono font-black text-lg text-emerald-300">
                    {selectionStats.totalTrips}
                  </div>
                </div>

                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                  <div className="text-[10px] text-slate-300 uppercase font-semibold">Tổng Khối Lượng</div>
                  <div className="font-mono font-black text-lg text-blue-200">
                    {selectionStats.totalVolume} <span className="text-xs font-normal">m³</span>
                  </div>
                </div>

                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                  <div className="text-[10px] text-slate-300 uppercase font-semibold">Tổng Km 1 Chiều</div>
                  <div className="font-mono font-black text-lg text-amber-300">
                    {selectionStats.totalKm} <span className="text-xs font-normal">km</span>
                  </div>
                </div>

                <div className="bg-white/10 px-3 py-1.5 rounded-xl border border-white/15">
                  <div className="text-[10px] text-slate-300 uppercase font-semibold">Tài Xế Hoạt Động</div>
                  <div className="font-mono font-black text-lg text-white">
                    {selectionStats.activeDrivers} <span className="text-xs font-normal">người</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Export Configuration Options */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/90 space-y-3">
            <h5 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>CẤU HÌNH ĐỊNH DẠNG TỆP EXCEL (.XLSX):</span>
            </h5>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Option 1: Matrix vs Standard */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Kiểu hiển thị bảng tổng hợp:</label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'MATRIX'}
                      onChange={() => setExportMode('MATRIX')}
                      className="text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">
                      Bảng Ma Trận (Cột Ngày 1, Ngày 2, Ngày 3... + Tổng)
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'STANDARD'}
                      onChange={() => setExportMode('STANDARD')}
                      className="text-blue-600"
                    />
                    <span className="font-semibold text-slate-700">
                      Bảng Chuẩn (Chỉ cột Tổng Chuyến & Tổng Km)
                    </span>
                  </label>
                </div>
              </div>

              {/* Option 2: Include Detail Sheet */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Kèm Sheet chi tiết từng chuyến xe:</label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDetailSheet}
                    onChange={e => setIncludeDetailSheet(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <span className="text-slate-700 font-semibold leading-tight">
                    Tạo thêm Sheet 2: Danh sách chi tiết từng chuyến xe (Ngày, giờ xuất, khách hàng, công trình, số phiếu, niêm chì)
                  </span>
                </label>
              </div>

              {/* Option 3: Only Active Drivers */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                <label className="font-bold text-slate-800 block">Danh sách tài xế:</label>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyActiveDrivers}
                    onChange={e => setOnlyActiveDrivers(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600"
                  />
                  <span className="text-slate-700 font-semibold leading-tight">
                    Chỉ xuất các tài xế có phát sinh chuyến trong các ngày đã chọn (Ẩn tài xế 0 chuyến)
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 5. Live Table Preview */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold text-slate-800">
                  XEM TRƯỚC BẢNG SẼ XUẤT EXCEL ({driverSummaryData.length} tài xế):
                </span>
              </div>

              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewTab('SUMMARY')}
                  className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                    previewTab === 'SUMMARY' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Bảng Tổng Hợp
                </button>
                {includeDetailSheet && (
                  <button
                    type="button"
                    onClick={() => setPreviewTab('DETAIL')}
                    className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                      previewTab === 'DETAIL' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Chi Tiết ({filteredTrips.length} Chuyến)
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-64 overflow-x-auto overflow-y-auto bg-white">
              {previewTab === 'SUMMARY' ? (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2 text-center w-10">STT</th>
                      <th className="p-2 min-w-[140px]">Tài Xế</th>
                      <th className="p-2 min-w-[100px]">Biển Số</th>
                      {exportMode === 'MATRIX' &&
                        selectedDays.map(d => (
                          <th key={d} className="p-2 text-center min-w-[60px] bg-blue-50/70 border-x border-slate-200 font-mono">
                            Ng.{d < 10 ? `0${d}` : d}
                          </th>
                        ))}
                      <th className="p-2 text-right min-w-[90px] font-bold text-blue-800">Tổng Chuyến</th>
                      <th className="p-2 text-right min-w-[80px]">Chuyến Lớn</th>
                      <th className="p-2 text-right min-w-[80px]">Chuyến Nhỏ</th>
                      <th className="p-2 text-right min-w-[90px]">Tổng m³</th>
                      <th className="p-2 text-right min-w-[90px]">Tổng Km</th>
                      <th className="p-2 text-right min-w-[90px]">Km Khứ Hồi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {driverSummaryData.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="p-6 text-center text-slate-400">
                          Không có dữ liệu chuyến xe nào trong các ngày đã chọn.
                        </td>
                      </tr>
                    ) : (
                      driverSummaryData.map((d, idx) => (
                        <tr key={d.driverName} className="hover:bg-slate-50">
                          <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-900">{d.driverName}</td>
                          <td className="p-2 font-mono text-slate-700">{d.truckPlate}</td>
                          {exportMode === 'MATRIX' &&
                            selectedDays.map(dayNum => {
                              const cnt = d.dayCounts[dayNum] || 0;
                              return (
                                <td key={dayNum} className="p-2 text-center font-mono border-x border-slate-100 font-bold text-slate-700">
                                  {cnt > 0 ? cnt : '-'}
                                </td>
                              );
                            })}
                          <td className="p-2 text-right font-mono font-bold text-blue-700">{d.totalTrips}</td>
                          <td className="p-2 text-right font-mono text-emerald-700">{d.largeTrips}</td>
                          <td className="p-2 text-right font-mono text-amber-700">{d.smallTrips}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">{Math.round(d.totalVolume * 10) / 10}</td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">{d.totalKm}</td>
                          <td className="p-2 text-right font-mono text-slate-700">{d.totalRoundKm}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      <th className="p-2 text-center w-10">STT</th>
                      <th className="p-2 min-w-[90px]">Ngày</th>
                      <th className="p-2 min-w-[70px]">Giờ</th>
                      <th className="p-2 min-w-[100px]">Biển Số</th>
                      <th className="p-2 min-w-[130px]">Tài Xế</th>
                      <th className="p-2 min-w-[180px]">Khách Hàng / Công Trình</th>
                      <th className="p-2 text-right min-w-[70px]">m³</th>
                      <th className="p-2 text-right min-w-[70px]">Km</th>
                      <th className="p-2 min-w-[90px]">Số Phiếu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTrips.map((item, idx) => (
                      <tr key={item.trip.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="p-2 font-mono text-slate-800">{item.dmy}</td>
                        <td className="p-2 font-mono text-slate-600">{item.trip.departureTime || '15:00'}</td>
                        <td className="p-2 font-mono font-bold text-slate-900">{item.plate}</td>
                        <td className="p-2 font-bold text-slate-800">{item.driver}</td>
                        <td className="p-2 text-slate-700 truncate max-w-[200px]">
                          {item.order?.customerName || 'TSG-TNT'} - {item.order?.projectTitle}
                        </td>
                        <td className="p-2 text-right font-mono font-bold text-blue-700">{item.vol}</td>
                        <td className="p-2 text-right font-mono text-slate-700">{item.km}</td>
                        <td className="p-2 font-mono text-slate-600">{item.trip.ticketNumber || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            {selectedDays.length > 0 ? (
              <span>
                Sẵn sàng xuất file với <strong>{selectedDays.length} ngày</strong> ({selectionStats.totalTrips} chuyến xe, {driverSummaryData.length} tài xế).
              </span>
            ) : (
              <span className="text-amber-600 font-bold">
                Vui lòng chọn ít nhất 1 ngày để kích hoạt nút xuất.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleExecuteExportExcel}
              disabled={selectedDays.length === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white shadow-md transition cursor-pointer active:scale-95 ${
                selectedDays.length === 0
                  ? 'bg-slate-400 cursor-not-allowed opacity-60'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>
                📥 TẢI FILE EXCEL BÁO CÁO ({selectedDays.length} NGÀY ĐÃ CHỌN)
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
