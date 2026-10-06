import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  Download,
  Search,
  CheckCircle2,
  Building,
  Layers,
  Clock,
  UserCheck,
  FileText,
  Printer,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ChevronDown,
  X
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder } from '../../types';
import * as XLSX from 'xlsx';

export const BaoCaoSanXuatView: React.FC = () => {
  const { orders, trips } = useSync();

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>('2026-10-04');
  const [dateQuickFilter, setDateQuickFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_3_DAYS' | 'RANGE' | 'CUSTOM'>('TODAY');
  const [rangeFromDate, setRangeFromDate] = useState<string>('2026-10-01');
  const [rangeToDate, setRangeToDate] = useState<string>('2026-10-06');
  const [isRangeOpen, setIsRangeOpen] = useState<boolean>(false);
  const [filterProjectType, setFilterProjectType] = useState<string>('ALL'); // ALL, DA, DD
  const [filterOrderType, setFilterOrderType] = useState<string>('ALL'); // ALL, CHINH, PHAT_SINH
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Bảng Lịch Popover Siêu Nhỏ Gọn
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(9); // 0-indexed: 9 = Tháng 10
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);

  // Chuyển đổi ngày YYYY-MM-DD và DD/MM/YYYY
  const dateInputVal = useMemo(() => {
    if (!selectedDate) return '';
    if (selectedDate.includes('-')) return selectedDate;
    const parts = selectedDate.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1]}-${parts[0]}`;
    return selectedDate;
  }, [selectedDate]);

  // Xử lý khi chọn ngày từ input date
  const handleDateInputChange = (val: string) => {
    if (!val) {
      setSelectedDate('');
      setDateQuickFilter('ALL');
      return;
    }
    setSelectedDate(val);
    setDateQuickFilter('CUSTOM');
    const parts = val.split('-');
    if (parts.length === 3) {
      setCalendarYear(parseInt(parts[0], 10));
      setCalendarMonth(parseInt(parts[1], 10) - 1);
    }
  };

  // Tiến lùi 1 ngày
  const handleStepDate = (direction: -1 | 1) => {
    let curr = new Date(2026, 9, 4);
    if (selectedDate) {
      if (selectedDate.includes('-')) {
        const parts = selectedDate.split('-');
        if (parts.length === 3) {
          curr = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
      } else if (selectedDate.includes('/')) {
        const parts = selectedDate.split('/');
        if (parts.length === 3) {
          curr = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }
    }
    curr.setDate(curr.getDate() + direction);
    const y = curr.getFullYear();
    const m = curr.getMonth() + 1 < 10 ? `0${curr.getMonth() + 1}` : `${curr.getMonth() + 1}`;
    const d = curr.getDate() < 10 ? `0${curr.getDate()}` : `${curr.getDate()}`;
    const nextDate = `${y}-${m}-${d}`;
    setSelectedDate(nextDate);
    setDateQuickFilter('CUSTOM');
    setCalendarYear(y);
    setCalendarMonth(curr.getMonth());
  };

  // Tên thứ trong tuần
  const selectedDateWeekday = useMemo(() => {
    if (!selectedDate) return '';
    let dt: Date;
    if (selectedDate.includes('-')) {
      const parts = selectedDate.split('-');
      dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    } else {
      const parts = selectedDate.split('/');
      dt = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
    }
    const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return days[dt.getDay()];
  }, [selectedDate]);

  // Đếm đơn theo ngày YYYY-MM-DD
  const ordersCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      let d = o.deliveryDate || '';
      if (d.includes('/')) {
        const parts = d.split('/');
        d = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
      if (d) {
        map[d] = (map[d] || 0) + 1;
      }
    });
    return map;
  }, [orders]);

  // Lưới ngày lịch popover
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const days: Array<{
      day: number;
      dateIso: string;
      dateDmy: string;
      isCurrentMonth: boolean;
      ordersCount: number;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let i = 0; i < dayOfWeek; i++) {
      days.push({
        day: 0,
        dateIso: '',
        dateDmy: '',
        isCurrentMonth: false,
        ordersCount: 0,
        isToday: false,
        isSelected: false
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const monthStr = calendarMonth + 1 < 10 ? `0${calendarMonth + 1}` : `${calendarMonth + 1}`;
      const dateIso = `${calendarYear}-${monthStr}-${dayStr}`;
      const dateDmy = `${dayStr}/${monthStr}/${calendarYear}`;
      const count = ordersCountByDate[dateIso] || 0;
      const isToday = dateIso === '2026-10-04';
      const isSelected = selectedDate === dateIso;

      days.push({
        day: d,
        dateIso,
        dateDmy,
        isCurrentMonth: true,
        ordersCount: count,
        isToday,
        isSelected
      });
    }

    return days;
  }, [calendarYear, calendarMonth, ordersCountByDate, selectedDate]);

  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(calendarYear - 1);
    } else {
      setCalendarMonth(calendarMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(calendarYear + 1);
    } else {
      setCalendarMonth(calendarMonth + 1);
    }
  };

  // Quick Date Select handler
  const handleSelectQuickDate = (mode: 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_3_DAYS') => {
    setDateQuickFilter(mode);
    if (mode === 'ALL') {
      setSelectedDate('');
    } else if (mode === 'TODAY') {
      setSelectedDate('2026-10-04');
    } else if (mode === 'YESTERDAY') {
      setSelectedDate('2026-10-03');
    } else if (mode === 'LAST_3_DAYS') {
      setSelectedDate('');
    }
  };

  // Filtered orders for production report
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      // Normalize order date to YYYY-MM-DD
      let oDate = ord.deliveryDate || '';
      if (oDate.includes('/')) {
        const parts = oDate.split('/');
        oDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }

      // Date logic
      if (dateQuickFilter === 'RANGE') {
        if (!oDate) return false;
        if (oDate < rangeFromDate || oDate > rangeToDate) return false;
      } else if (dateQuickFilter === 'LAST_3_DAYS') {
        const last3 = ['2026-10-04', '2026-10-03', '2026-10-02'];
        if (!last3.includes(oDate)) return false;
      } else if (selectedDate) {
        let sDate = selectedDate;
        if (sDate.includes('/')) {
          const parts = sDate.split('/');
          sDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        if (oDate !== sDate) return false;
      }

      const matchProjectType = filterProjectType === 'ALL' || (ord.projectType || 'DA') === filterProjectType;
      const matchOrderType = filterOrderType === 'ALL' || (ord.orderType || 'CHINH') === filterOrderType;
      const matchSearch =
        !searchTerm.trim() ||
        ord.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.customerCode && ord.customerCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ord.technicianName && ord.technicianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        ord.categoryItem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.grade.toLowerCase().includes(searchTerm.toLowerCase());

      return matchProjectType && matchOrderType && matchSearch;
    });
  }, [orders, selectedDate, dateQuickFilter, rangeFromDate, rangeToDate, filterProjectType, filterOrderType, searchTerm]);

  // Totals
  const totalVolume = filteredOrders.reduce((sum, o) => sum + o.totalVolume, 0);
  const totalDelivered = filteredOrders.reduce((sum, o) => sum + o.deliveredVolume, 0);
  const totalProjectDA = filteredOrders.filter(o => (o.projectType || 'DA') === 'DA').reduce((sum, o) => sum + o.totalVolume, 0);
  const totalProjectDD = filteredOrders.filter(o => o.projectType === 'DD').reduce((sum, o) => sum + o.totalVolume, 0);

  // Export to Excel (.xlsx format chuẩn - đồng bộ mã trên phiếu)
  const handleExportXLSX = () => {
    const headers = [
      'STT',
      'Mã đơn hàng',
      'Mã trên phiếu (Số phiếu xuất)',
      'Số niêm chì',
      'Ngày sản xuất',
      'Mã C.Trình',
      'Tên công ty / Khách hàng',
      'Tên công trình',
      'Hạng mục',
      'Mã mác bê tông',
      'Khối lượng đặt (m3)',
      'Khối lượng đã cấp (m3)',
      'Loại C.Trình (DA/DD)',
      'Thời gian cấp',
      'Giao nhận (Kỹ thuật phụ trách)',
      'Phân loại đơn',
      'Mã đơn chính liên kết',
      'Ghi chú trên phiếu'
    ];

    const rows = filteredOrders.map((ord, idx) => {
      const orderTrips = trips.filter(t => t.orderId === ord.id || t.orderCode === ord.code);
      const ticketNumbers = orderTrips.map(t => t.ticketNumber).join(', ') || 'Chưa cấp phiếu';
      const sealNumbers = orderTrips.map(t => t.sealNumber || '---').join(', ') || 'Chưa cấp chì';
      return [
        idx + 1,
        ord.code,
        ticketNumbers,
        sealNumbers,
        ord.deliveryDate,
        ord.customerCode || '---',
        ord.customerName,
        ord.projectTitle,
        ord.categoryItem,
        ord.grade,
        ord.totalVolume,
        ord.deliveredVolume,
        ord.projectType === 'DD' ? 'Dân dụng (DD)' : 'Dự án (DA)',
        ord.deliveryTime,
        ord.technicianName || 'Nguyễn Văn Nam',
        ord.orderType === 'PHAT_SINH' ? 'Phát sinh' : 'Đơn chính',
        ord.parentOrderCode || '---',
        ord.notes || ''
      ];
    });

    const sheetData = [
      ['BÁO CÁO SẢN XUẤT BÊ TÔNG TSG TNT THEO NGÀY (ĐỒNG BỘ MÃ PHIẾU XUẤT)'],
      [`Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
      [`Bộ lọc: ${selectedDate ? 'Ngày ' + selectedDate : 'Tất cả các ngày'} | Tổng sản lượng: ${totalVolume} m3`],
      [],
      headers,
      ...rows,
      [],
      ['TỔNG CỘNG', '', '', '', '', '', '', '', '', totalVolume, totalDelivered, `${totalProjectDA} m3 (DA) / ${totalProjectDD} m3 (DD)`]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 26 },
      { wch: 14 },
      { wch: 14 },
      { wch: 38 },
      { wch: 42 },
      { wch: 20 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 16 },
      { wch: 12 },
      { wch: 22 },
      { wch: 14 },
      { wch: 16 },
      { wch: 30 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'SanXuat');
    const dateStr = selectedDate ? selectedDate.replace(/-/g, '') : 'all';
    XLSX.writeFile(wb, `Bao_Cao_San_Xuat_TSG_TNT_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner and Controls */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                  BÁO CÁO SẢN XUẤT ĐIỀU HÀNH
                </span>
                <span className="text-xs text-slate-500 font-semibold">TSG TNT Concrete ERP</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Báo Cáo Sản Xuất Bê Tông Theo Ngày & Xuất File Excel
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleExportXLSX}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Xuất bảng tính chuẩn Excel (.xlsx) định dạng bảng tính Microsoft Excel"
            >
              <Download className="w-4 h-4" />
              <span>Xuất ra file Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase">TỔNG ĐƠN SẢN XUẤT</div>
            <div className="text-2xl font-black text-slate-900 mt-1">{filteredOrders.length}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {filteredOrders.filter(o => o.orderType === 'CHINH').length} chính • {filteredOrders.filter(o => o.orderType === 'PHAT_SINH').length} phát sinh
            </div>
          </div>

          <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200">
            <div className="text-[11px] font-bold text-orange-800 uppercase">TỔNG KHỐI LƯỢNG ĐẶT</div>
            <div className="text-2xl font-black text-orange-600 mt-1">
              {totalVolume} <span className="text-xs font-semibold text-slate-600">m³</span>
            </div>
            <div className="text-[11px] text-orange-700 mt-0.5">
              Đã cấp thực tế: <strong>{totalDelivered} m³</strong>
            </div>
          </div>

          <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200">
            <div className="text-[11px] font-bold text-blue-800 uppercase">DỰ ÁN (DA)</div>
            <div className="text-2xl font-black text-blue-700 mt-1">
              {totalProjectDA} <span className="text-xs font-semibold text-slate-600">m³</span>
            </div>
            <div className="text-[11px] text-blue-600 mt-0.5">
              {filteredOrders.filter(o => (o.projectType || 'DA') === 'DA').length} công trình dự án
            </div>
          </div>

          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">DÂN DỤNG (DD)</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">
              {totalProjectDD} <span className="text-xs font-semibold text-slate-600">m³</span>
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">
              {filteredOrders.filter(o => o.projectType === 'DD').length} công trình nhà phố, biệt thự
            </div>
          </div>
        </div>

        {/* ============================================================= */}
        {/* THANH TÌM KIẾM & LỌC NGÀY SIÊU NHỎ GỌN (BCSX ULTRA-COMPACT TOOLBAR) */}
        {/* ============================================================= */}
        <div className="bg-white rounded-xl p-2.5 sm:p-3 border border-slate-200/90 shadow-xs space-y-2 relative">
          {/* Row 1: Unified Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Left: Compact Date Stepper, Calendar Popover Trigger, Quick Date Pills */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Stepper Navigator */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleStepDate(-1)}
                  className="p-1 rounded hover:bg-white hover:text-orange-600 text-slate-600 transition cursor-pointer active:scale-95"
                  title="Lùi 1 ngày"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                <input
                  type="date"
                  value={dateInputVal}
                  onChange={(e) => handleDateInputChange(e.target.value)}
                  className="font-mono font-bold text-xs text-orange-950 bg-transparent border-none outline-none px-1 cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => handleStepDate(1)}
                  className="p-1 rounded hover:bg-white hover:text-orange-600 text-slate-600 transition cursor-pointer active:scale-95"
                  title="Tiến 1 ngày"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Day of week tag */}
              {selectedDateWeekday && (
                <span className="hidden sm:inline-block px-2 py-1 rounded-md bg-orange-50 text-orange-900 font-bold text-[11px] border border-orange-200/70">
                  {selectedDateWeekday}
                </span>
              )}

              {/* Calendar Popover Trigger Button */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
                    isCalendarOpen
                      ? 'bg-orange-600 text-white border-orange-700 shadow-xs ring-2 ring-orange-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                  title="Mở bảng lịch chọn ngày sản xuất nhỏ gọn"
                >
                  <CalendarDays className="w-3.5 h-3.5 text-orange-600 group-hover:text-white" />
                  <span>Lịch</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${isCalendarOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Compact Popover Calendar Dropdown */}
                {isCalendarOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setIsCalendarOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-2 z-40 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3.5 animate-in fade-in zoom-in-95">
                      {/* Calendar Month Header */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <button
                            type="button"
                            onClick={handlePrevMonth}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Tháng trước"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="px-1 font-mono font-black text-xs text-orange-950">
                            Tháng {calendarMonth + 1} / {calendarYear}
                          </span>
                          <button
                            type="button"
                            onClick={handleNextMonth}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-600 cursor-pointer"
                            title="Tháng sau"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setCalendarYear(2026);
                              setCalendarMonth(9);
                              setSelectedDate('2026-10-04');
                              setDateQuickFilter('TODAY');
                              setIsCalendarOpen(false);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 hover:bg-orange-100 cursor-pointer"
                          >
                            Hôm nay
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsCalendarOpen(false)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Days of week header */}
                      <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 mb-1">
                        <div>T2</div>
                        <div>T3</div>
                        <div>T4</div>
                        <div>T5</div>
                        <div>T6</div>
                        <div className="text-blue-600">T7</div>
                        <div className="text-red-500">CN</div>
                      </div>

                      {/* Days Grid - Ultra compact */}
                      <div className="grid grid-cols-7 gap-1 text-xs">
                        {calendarDays.map((cd, idx) => {
                          if (!cd.isCurrentMonth) {
                            return <div key={`empty-${idx}`} className="w-8 h-8 sm:w-9 sm:h-9" />;
                          }

                          return (
                            <button
                              key={cd.dateIso}
                              type="button"
                              onClick={() => {
                                setSelectedDate(cd.dateIso);
                                setDateQuickFilter('CUSTOM');
                                setIsCalendarOpen(false);
                              }}
                              className={`w-8 h-8 sm:w-9 sm:h-9 mx-auto rounded-lg flex flex-col items-center justify-center transition cursor-pointer relative ${
                                cd.isSelected
                                  ? 'bg-orange-600 text-white font-black shadow-xs ring-2 ring-orange-300'
                                  : cd.isToday
                                  ? 'bg-orange-50 text-orange-950 font-bold border border-orange-400'
                                  : cd.ordersCount > 0
                                  ? 'bg-emerald-50 text-emerald-950 font-bold hover:bg-emerald-100'
                                  : 'hover:bg-slate-100 text-slate-700'
                              }`}
                              title={`${cd.dateDmy}: ${cd.ordersCount} đơn sản xuất`}
                            >
                              <span className="text-[11px] font-mono leading-none">{cd.day}</span>
                              {cd.ordersCount > 0 && (
                                <span
                                  className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                                    cd.isSelected ? 'bg-white' : 'bg-emerald-500'
                                  }`}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Popover Footer */}
                      <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span>Có đơn</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                            <span>Đang chọn</span>
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDate('');
                            setDateQuickFilter('ALL');
                            setIsCalendarOpen(false);
                          }}
                          className="font-bold text-orange-600 hover:underline cursor-pointer"
                        >
                          Tất cả các ngày
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Compact Quick Date Pills */}
              <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                <button
                  type="button"
                  onClick={() => handleSelectQuickDate('ALL')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
                    dateQuickFilter === 'ALL' || (!selectedDate && dateQuickFilter === 'CUSTOM')
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Tất cả ({orders.length})
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectQuickDate('TODAY')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
                    selectedDate === '2026-10-04'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Hôm nay
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectQuickDate('YESTERDAY')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
                    selectedDate === '2026-10-03'
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Hôm qua
                </button>

                <button
                  type="button"
                  onClick={() => setIsRangeOpen(!isRangeOpen)}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition cursor-pointer shrink-0 ${
                    isRangeOpen || dateQuickFilter === 'RANGE'
                      ? 'bg-amber-500 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Khoảng ngày
                </button>
              </div>
            </div>

            {/* Right: Integrated Search Box, Project Type, Order Type & Counter */}
            <div className="flex flex-wrap items-center gap-2 flex-1 justify-end min-w-[260px]">
              {/* Search Input */}
              <div className="relative min-w-[180px] flex-1 max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Khách hàng, công trình, mã, mác..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-7 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Project Type Filter */}
              <select
                value={filterProjectType}
                onChange={(e) => setFilterProjectType(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">Loại: Tất cả</option>
                <option value="DA">Dự án (DA)</option>
                <option value="DD">Dân dụng (DD)</option>
              </select>

              {/* Order Type Filter */}
              <select
                value={filterOrderType}
                onChange={(e) => setFilterOrderType(e.target.value)}
                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="ALL">Đơn: Tất cả</option>
                <option value="CHINH">Đơn chính</option>
                <option value="PHAT_SINH">Phát sinh</option>
              </select>

              {/* Counter and Reset */}
              <div className="flex items-center gap-1 px-2 py-1 bg-orange-50 text-orange-900 font-bold text-[11px] rounded-lg shrink-0">
                <span>{filteredOrders.length}</span>
                <span className="font-normal text-orange-700">đơn</span>
                {(selectedDate || searchTerm || filterProjectType !== 'ALL' || filterOrderType !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDate('');
                      setSearchTerm('');
                      setFilterProjectType('ALL');
                      setFilterOrderType('ALL');
                      setDateQuickFilter('ALL');
                    }}
                    className="ml-1 text-slate-400 hover:text-red-600 cursor-pointer"
                    title="Xóa bộ lọc"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Collapsible Range Picker (nếu bật Khoảng ngày) - Siêu gọn 1 dòng */}
          {isRangeOpen && (
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs animate-in fade-in">
              <span className="font-bold text-amber-900 text-[11px]">Từ ngày:</span>
              <input
                type="date"
                value={rangeFromDate}
                onChange={(e) => setRangeFromDate(e.target.value)}
                className="px-2 py-0.5 bg-amber-50/50 border border-amber-300 rounded font-mono font-bold text-xs"
              />
              <span className="font-bold text-amber-900 text-[11px]">Đến ngày:</span>
              <input
                type="date"
                value={rangeToDate}
                onChange={(e) => setRangeToDate(e.target.value)}
                className="px-2 py-0.5 bg-amber-50/50 border border-amber-300 rounded font-mono font-bold text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  setDateQuickFilter('RANGE');
                  setSelectedDate('');
                }}
                className="px-2.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs cursor-pointer shadow-2xs"
              >
                Lọc khoảng ngày
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRangeOpen(false);
                  setDateQuickFilter('ALL');
                }}
                className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Production Report Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">
              DANH SÁCH ĐƠN HÀNG SẢN XUẤT THEO NGÀY ({filteredOrders.length} dòng)
            </span>
          </div>
          <span className="text-xs text-slate-500">
            Tổng khối lượng: <strong className="text-orange-600 font-bold">{totalVolume} m³</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-3 text-center">STT</th>
                <th className="py-3 px-3">NGÀY SẢN XUẤT</th>
                <th className="py-3 px-3">MÃ ĐƠN • SỐ PHIẾU • SỐ CHÌ</th>
                <th className="py-3 px-3">MÃ CTRINH - TÊN CÔNG TY</th>
                <th className="py-3 px-4">TÊN CÔNG TRÌNH</th>
                <th className="py-3 px-3">HẠNG MỤC</th>
                <th className="py-3 px-3">MÃ MÁC</th>
                <th className="py-3 px-3 text-right">KHỐI LƯỢNG</th>
                <th className="py-3 px-3 text-center">LOẠI CTRINH</th>
                <th className="py-3 px-3">THỜI GIAN CẤP</th>
                <th className="py-3 px-3">GIAO NHẬN (KỸ THUẬT)</th>
                <th className="py-3 px-3">PHÂN LOẠI</th>
                <th className="py-3 px-4">GHI CHÚ TRÊN PHIẾU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-8 text-center text-slate-400">
                    Không có dữ liệu sản xuất phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord, idx) => {
                  const isPhatSinh = ord.orderType === 'PHAT_SINH';
                  const orderTrips = trips.filter(t => t.orderId === ord.id || t.orderCode === ord.code);
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>

                      {/* Ngày sản xuất */}
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">
                        {ord.deliveryDate.split('-').reverse().join('/')}
                      </td>

                      {/* Mã đơn & Số phiếu xuất & Số niêm chì (Đồng bộ trực tiếp với phiếu giao nhận) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          {ord.code}
                        </div>
                        <div className="flex flex-col gap-1 mt-1 max-w-[240px]">
                          {orderTrips.length === 0 ? (
                            <span className="text-[10px] text-slate-400 font-mono italic">Chưa xuất xe</span>
                          ) : (
                            orderTrips.map(t => (
                              <div
                                key={t.id}
                                className="flex items-center gap-1 font-mono text-[10px]"
                              >
                                <span
                                  className="font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-950 border border-orange-300 shadow-xs"
                                  title={`Số phiếu xuất kho: ${t.ticketNumber} | Xe: ${t.truckPlate}`}
                                >
                                  Phiếu: {t.ticketNumber}
                                </span>
                                <span
                                  className="font-semibold px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-900 border border-cyan-300"
                                  title={`Số niêm chì: ${t.sealNumber || '---'} (khác số phiếu)`}
                                >
                                  Chì: {t.sealNumber || '---'}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </td>

                      {/* Mã Ctrinh - Tên công ty */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 truncate max-w-[200px]" title={ord.customerName}>
                          {ord.customerName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          Mã: {ord.customerCode || '---'}
                        </div>
                      </td>

                      {/* Tên công trình */}
                      <td className="py-3 px-4 font-semibold text-slate-800 max-w-[200px] truncate" title={ord.projectTitle}>
                        {ord.projectTitle}
                      </td>

                      {/* Hạng mục */}
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {ord.categoryItem}
                      </td>

                      {/* Mã mác */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                          {ord.grade}
                        </span>
                      </td>

                      {/* Khối lượng */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <span className="font-black text-slate-900 text-sm">{ord.totalVolume}</span>
                        <span className="text-[10px] text-slate-400 ml-1">m³</span>
                        {ord.deliveredVolume > 0 && (
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            (Đã cấp: {ord.deliveredVolume} m³)
                          </div>
                        )}
                      </td>

                      {/* Loại Ctrinh (DA = Dự án, DD = Dân dụng) */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {ord.projectType === 'DD' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200" title="Dân dụng (DD)">
                            DD (Dân dụng)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200" title="Dự án (DA)">
                            DA (Dự án)
                          </span>
                        )}
                      </td>

                      {/* Thời gian cấp */}
                      <td className="py-3 px-3 whitespace-nowrap text-slate-700 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{ord.deliveryTime}</span>
                        </div>
                      </td>

                      {/* Giao nhận (Kỹ thuật phụ trách) */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-semibold text-slate-800">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{ord.technicianName || 'Nguyễn Văn Nam'}</span>
                        </div>
                      </td>

                      {/* Phân loại đơn */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {isPhatSinh ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-200">
                            Phát sinh
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            Đơn chính
                          </span>
                        )}
                        {ord.parentOrderCode && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Từ: {ord.parentOrderCode}
                          </div>
                        )}
                      </td>

                      {/* Ghi chú trên phiếu */}
                      <td className="py-3 px-4 text-slate-600 max-w-[220px] truncate" title={ord.notes}>
                        {ord.notes || '---'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredOrders.length > 0 && (
              <tfoot>
                <tr className="bg-slate-50 font-bold text-slate-900 border-t border-slate-200">
                  <td colSpan={6} className="py-3 px-4 text-right uppercase text-[11px] font-black">
                    TỔNG CỘNG KHỐI LƯỢNG SẢN XUẤT:
                  </td>
                  <td className="py-3 px-3 text-right text-sm text-orange-600 font-black">
                    {totalVolume} m³
                  </td>
                  <td className="py-3 px-3 text-center text-[10px] text-slate-500" colSpan={5}>
                    Dự án: <strong>{totalProjectDA} m³</strong> • Dân dụng: <strong>{totalProjectDD} m³</strong>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};
