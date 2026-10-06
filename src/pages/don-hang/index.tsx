import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar,
  CalendarDays,
  Search,
  Plus,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
  CheckSquare,
  FileSpreadsheet,
  Truck,
  Clock,
  Gauge,
  MapPin,
  User,
  Copy,
  FileText,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Droplets,
  Building2,
  X,
  Zap,
  Phone
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder, DispatchTrip, OrderType, OrderStatus } from '../../types';
import { CreateOrderModal } from './CreateOrderModal';
import { EditOrderModal } from './EditOrderModal';
import { DispatchAssignModal } from './DispatchAssignModal';
import { EditTripModal } from './EditTripModal';
import * as XLSX from 'xlsx';

interface DonHangPageProps {
  initialView?: string;
  onViewChange?: (view: any) => void;
  onOpenPrintModal?: (order: ConcreteOrder, trip?: any) => void;
}

export const DonHangPage: React.FC<DonHangPageProps> = ({
  onOpenPrintModal
}) => {
  const { orders, trips, trucks, deleteTrip, deleteOrder, updateOrder } = useSync();

  // Selected Order for Dedicated Dispatch Screen (null = Bảng danh sách đơn hàng; non-null = Giao diện cấp hàng của đơn đó)
  const [selectedOrderForDispatchId, setSelectedOrderForDispatchId] = useState<string | null>(null);

  // Search & Filter states for Main Orders List
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('04/10/2026'); // DD/MM/YYYY hoặc rỗng
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlant, setFilterPlant] = useState<string>('ALL');

  // Bảng Lịch Chọn Ngày (Calendar Table Picker State)
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(9); // 0-indexed: 9 = Tháng 10
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(true); // Mở/đóng bảng lịch

  // Selected orders checkbox set for bulk actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Expanded order rows (to view inline linked dispatches directly on table)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createOrderType, setCreateOrderType] = useState<OrderType>('CHINH');
  const [copyFromOrder, setCopyFromOrder] = useState<ConcreteOrder | null>(null);

  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ConcreteOrder | null>(null);

  // Dispatch Assign Modal (Xuất xe bồn / phiếu mới)
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [orderForDispatch, setOrderForDispatch] = useState<ConcreteOrder | null>(null);

  // Edit Trip Modal
  const [editingTrip, setEditingTrip] = useState<DispatchTrip | null>(null);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);

  // Active Order object when in Dedicated Dispatch view
  const currentViewOrder = useMemo(() => {
    if (!selectedOrderForDispatchId) return null;
    return orders.find(o => o.id === selectedOrderForDispatchId) || null;
  }, [orders, selectedOrderForDispatchId]);

  // Đếm số lượng đơn theo từng ngày DD/MM/YYYY để hiển thị huy hiệu trên bảng lịch
  const ordersCountByDate = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      let dStr = o.deliveryDate || '';
      if (dStr.includes('/')) {
        map[dStr] = (map[dStr] || 0) + 1;
      } else if (dStr.includes('-')) {
        const parts = dStr.split('-');
        if (parts.length === 3) {
          const dmy = `${parts[2]}/${parts[1]}/${parts[0]}`;
          map[dmy] = (map[dmy] || 0) + 1;
        }
      }
    });
    return map;
  }, [orders]);

  // Sinh các ngày trong tháng cho Bảng Lịch (Calendar Grid)
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    // T2 = 0, ..., CN = 6:
    const dayOfWeek = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();

    const days: Array<{
      day: number;
      dateStr: string;
      isCurrentMonth: boolean;
      ordersCount: number;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    // Ô trống đầu tháng trước thứ hai
    for (let i = 0; i < dayOfWeek; i++) {
      days.push({
        day: 0,
        dateStr: '',
        isCurrentMonth: false,
        ordersCount: 0,
        isToday: false,
        isSelected: false
      });
    }

    // Các ngày trong tháng
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const monthStr = calendarMonth + 1 < 10 ? `0${calendarMonth + 1}` : `${calendarMonth + 1}`;
      const dateStr = `${dayStr}/${monthStr}/${calendarYear}`;
      const count = ordersCountByDate[dateStr] || 0;
      const isToday = dateStr === '04/10/2026';
      const isSelected = filterDate.trim() === dateStr;

      days.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        ordersCount: count,
        isToday,
        isSelected
      });
    }

    return days;
  }, [calendarYear, calendarMonth, ordersCountByDate, filterDate]);

  // Điều hướng tháng trước / tháng sau trên bảng lịch
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear(prev => prev - 1);
    } else {
      setCalendarMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear(prev => prev + 1);
    } else {
      setCalendarMonth(prev => prev + 1);
    }
  };

  // Quick stats calculation
  const stats = useMemo(() => {
    const totalOrdersCount = orders.length;
    const completedOrders = orders.filter(o => o.status === 'HOAN_THANH').length;
    const activeOrders = orders.filter(o => o.status === 'DANG_CHAY' || o.status === 'DA_DUYET').length;
    const pendingOrders = orders.filter(o => o.status === 'CHO_DUYET').length;

    const totalOrderedVol = orders.reduce((sum, o) => sum + (Number(o.totalVolume) || 0), 0);
    const totalDeliveredVol = orders.reduce((sum, o) => sum + (Number(o.deliveredVolume) || 0), 0);
    const deliveryProgress = totalOrderedVol > 0 ? Math.round((totalDeliveredVol / totalOrderedVol) * 100) : 0;

    const totalTripsCount = trips.length;
    const activeTrucksCount = new Set(trips.map(t => t.truckPlate)).size;

    return {
      totalOrdersCount,
      completedOrders,
      activeOrders,
      pendingOrders,
      totalOrderedVol,
      totalDeliveredVol,
      deliveryProgress,
      totalTripsCount,
      activeTrucksCount
    };
  }, [orders, trips]);

  // Filtered Orders for Main List (Đồng bộ theo Bảng Lịch Chọn Ngày)
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date filter từ Bảng Lịch
      if (filterDate.trim()) {
        const orderDate = order.deliveryDate
          ? (order.deliveryDate.includes('-')
              ? order.deliveryDate.split('-').reverse().join('/')
              : order.deliveryDate)
          : '';
        if (
          orderDate &&
          !orderDate.includes(filterDate.trim()) &&
          (!order.deliveryDate || !order.deliveryDate.includes(filterDate.trim()))
        ) {
          return false;
        }
      }

      // Status filter
      if (filterStatus !== 'ALL') {
        if (order.status !== filterStatus) return false;
      }

      // Plant filter
      if (filterPlant !== 'ALL') {
        if ((order.plantLocation || 'Tây Ninh') !== filterPlant) return false;
      }

      // Search keyword
      if (searchTerm.trim()) {
        const kw = searchTerm.toLowerCase();
        const match =
          order.customerName.toLowerCase().includes(kw) ||
          order.projectTitle.toLowerCase().includes(kw) ||
          order.code.toLowerCase().includes(kw) ||
          order.categoryItem.toLowerCase().includes(kw) ||
          (order.grade && order.grade.toLowerCase().includes(kw)) ||
          (order.notes && order.notes.toLowerCase().includes(kw));
        if (!match) return false;
      }

      return true;
    });
  }, [orders, filterDate, filterStatus, filterPlant, searchTerm]);

  // Triplist for the currently selected order in dedicated dispatch view
  const currentOrderTrips = useMemo(() => {
    if (!currentViewOrder) return [];
    return trips
      .filter(t => t.orderId === currentViewOrder.id || t.orderCode === currentViewOrder.code)
      .sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
  }, [trips, currentViewOrder]);

  // Toggle selection
  const handleToggleSelectAllOrders = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleToggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle expand order row inline
  const handleToggleExpandOrder = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedOrderIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Open Dispatch Modal for specific order
  const handleOpenAssignForOrder = (order: ConcreteOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOrderForDispatch(order);
    setIsAssignOpen(true);
  };

  // Open Print Modal for order or trip
  const handleOpenPrintForOrder = (order: ConcreteOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const orderTrips = trips.filter(t => t.orderId === order.id || t.orderCode === order.code);
    const targetTrip = orderTrips[orderTrips.length - 1] || null;
    if (onOpenPrintModal) {
      onOpenPrintModal(order, targetTrip);
    }
  };

  // Delete Trip
  const handleDeleteTripItem = (trip: DispatchTrip, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Bạn có chắc muốn xóa chuyến xe ${trip.truckPlate} (Tài xế: ${trip.driverName})?`)) {
      deleteTrip(trip.id);
    }
  };

  // Delete Order
  const handleDeleteOrderItem = (order: ConcreteOrder, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm(`Bạn có chắc muốn xóa đơn hàng ${order.code} - ${order.customerName}?`)) {
      deleteOrder(order.id);
      if (selectedOrderForDispatchId === order.id) {
        setSelectedOrderForDispatchId(null);
      }
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    const headers = [
      'Mã Đơn',
      'Tên Khách Hàng',
      'Công Trình',
      'Hạng Mục',
      'Mác Bê Tông',
      'Độ Sụt',
      'Loại Bơm',
      'KL Đặt (m³)',
      'Đã Cấp (m³)',
      'Còn Lại (m³)',
      'Tiến Độ (%)',
      'Giờ KHSX',
      'Thời Gian GH',
      'Trạng Thái',
      'Loại Đơn',
      'Nhà Máy'
    ];
    const rows = filteredOrders.map(o => [
      o.code,
      o.customerName,
      o.projectTitle,
      o.categoryItem,
      o.grade,
      o.slump,
      o.pumpType || '',
      o.totalVolume,
      o.deliveredVolume,
      Math.max(0, o.totalVolume - o.deliveredVolume),
      `${Math.min(100, Math.round((o.deliveredVolume / o.totalVolume) * 100))}%`,
      o.scheduledProductionTime || '',
      o.deliveryTime,
      o.status,
      o.orderType === 'PHAT_SINH' ? 'Phát sinh' : 'Chính',
      o.plantLocation || 'Tây Ninh'
    ]);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['BÁO CÁO ĐƠN HÀNG & TIẾN ĐỘ CẤP BÊ TÔNG TSG-TNT'], [], headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'DonHang');
    XLSX.writeFile(wb, 'Bao_Cao_Don_Hang_TSG_TNT.xlsx');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'HOAN_THANH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3" />
            <span>Hoàn thành</span>
          </span>
        );
      case 'DANG_CHAY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Truck className="w-3 h-3 animate-pulse" />
            <span>Đang cấp hàng</span>
          </span>
        );
      case 'DA_DUYET':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <CheckSquare className="w-3 h-3" />
            <span>Đã duyệt SX</span>
          </span>
        );
      case 'CHO_DUYET':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" />
            <span>Chờ duyệt</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 font-sans pb-16">
      {/* ========================================================================= */}
      {/* TRƯỜNG HỢP 1: GIAO DIỆN CẤP HÀNG CHI TIẾT CỦA MỘT ĐƠN HÀNG ĐƯỢC CHỌN    */}
      {/* (Bấm vào tên công ty hoặc ngày giao trong bảng đơn hàng để vào đây)       */}
      {/* ========================================================================= */}
      {currentViewOrder ? (
        <div className="px-4 sm:px-6 py-5 max-w-[1700px] mx-auto space-y-4 animate-in fade-in duration-200">
          {/* Breadcrumb & Navigation Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrderForDispatchId(null)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer border border-slate-200"
                title="Quay lại danh sách toàn bộ đơn hàng"
              >
                <ArrowLeft className="w-4 h-4 text-slate-600" />
                <span>Quay lại danh sách đơn hàng</span>
              </button>

              <div className="h-5 w-px bg-slate-300 hidden sm:block" />

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {currentViewOrder.code}
                </span>
                <span className="text-xs font-bold text-slate-900 uppercase">
                  GIAO DIỆN CẤP HÀNG & ĐIỀU PHỐI XE BỒN
                </span>
                {currentViewOrder.orderType === 'PHAT_SINH' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    Đơn phát sinh
                  </span>
                )}
              </div>
            </div>

            {/* Top actions in single order dispatch view */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenAssignForOrder(currentViewOrder)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Cấp Xe Bồn Mới</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCreateOrderType('PHAT_SINH');
                  setCopyFromOrder(currentViewOrder);
                  setIsCreateOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
                title="Tạo đơn hàng phát sinh liên kết với đơn này"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tạo Đơn Phát Sinh</span>
              </button>

              {onOpenPrintModal && (
                <button
                  type="button"
                  onClick={() => handleOpenPrintForOrder(currentViewOrder)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-bold text-xs transition cursor-pointer"
                  title="In phiếu giao nhận mới nhất của đơn này"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>In Phiếu</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setOrderToEdit(currentViewOrder);
                  setIsEditOrderOpen(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-blue-700 border border-slate-300 rounded-lg font-bold text-xs transition cursor-pointer"
                title="Sửa thông tin đơn hàng này"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Sửa Đơn</span>
              </button>
            </div>
          </div>

          {/* Detailed Order Card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {currentViewOrder.customerName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1">
                  <div className="flex items-center gap-1 font-semibold text-slate-800">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentViewOrder.projectTitle}</span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hạng mục: <strong className="text-slate-800">{currentViewOrder.categoryItem}</strong></span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <span>Trạm: <strong>{currentViewOrder.plantLocation || 'Tây Ninh'}</strong></span>
                </div>
              </div>

              {/* Status Select */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Trạng thái:</span>
                <select
                  value={currentViewOrder.status}
                  onChange={(e) => updateOrder(currentViewOrder.id, { status: e.target.value as any })}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="CHO_DUYET">Chờ duyệt</option>
                  <option value="DA_DUYET">Đã duyệt</option>
                  <option value="DANG_CHAY">Đang cấp hàng</option>
                  <option value="HOAN_THANH">Hoàn thành</option>
                  <option value="TAM_HOAN">Tạm hoãn</option>
                </select>
              </div>
            </div>

            {/* Technical Specs & Volume Progress */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Mác Bê Tông</span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  {currentViewOrder.grade}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Độ Sụt</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5">
                  {currentViewOrder.slump} cm
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Loại Bơm</span>
                <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                  {currentViewOrder.pumpType || 'Xả trực tiếp'}
                </p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[11px] text-slate-400 font-semibold uppercase">Ngày & Giờ Giao</span>
                <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                  {currentViewOrder.deliveryDate ? currentViewOrder.deliveryDate.split('-').reverse().join('/') : '04/10/2026'} - {currentViewOrder.deliveryTime}
                </p>
              </div>

              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 col-span-2 sm:col-span-1">
                <span className="text-[11px] text-blue-700 font-semibold uppercase">Tiến Độ Cấp</span>
                <p className="font-mono font-bold text-blue-900 text-sm mt-0.5">
                  {currentViewOrder.deliveredVolume} / {currentViewOrder.totalVolume} m³
                </p>
                <div className="w-full bg-blue-200/60 h-1.5 rounded-full mt-1.5 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((currentViewOrder.deliveredVolume / currentViewOrder.totalVolume) * 100)
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* List of Dispatches for This Order */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    DANH SÁCH CÁC CHUYẾN XE BỒN ĐÃ CẤP CHO ĐƠN HÀNG
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Tổng cộng: <strong>{currentOrderTrips.length}</strong> chuyến xe · Đã xuất: <strong>{currentViewOrder.deliveredVolume} m³</strong> · Còn lại:{' '}
                    <strong>{Math.max(0, currentViewOrder.totalVolume - currentViewOrder.deliveredVolume)} m³</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenAssignForOrder(currentViewOrder)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Xuất Thêm Chuyến Xe</span>
                </button>
              </div>
            </div>

            {/* Table of Trips */}
            {currentOrderTrips.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-700 text-sm">Chưa có chuyến xe nào xuất bến</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Đơn hàng này hiện chưa được điều phối xe bồn. Bấm nút dưới để xuất chuyến xe đầu tiên.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAssignForOrder(currentViewOrder)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cấp Xe Bồn Đầu Tiên Ngay</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 text-center w-12">STT</th>
                      <th className="py-2.5 px-3 min-w-[120px]">Số Xe</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Tài Xế & SĐT</th>
                      <th className="py-2.5 px-3 text-center min-w-[100px]">Giờ Xuất</th>
                      <th className="py-2.5 px-3 text-right min-w-[110px]">Lượng Xuất</th>
                      <th className="py-2.5 px-3 text-right min-w-[110px]">Cộng Dồn</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Số Phiếu</th>
                      <th className="py-2.5 px-3 min-w-[110px]">Số Chì</th>
                      <th className="py-2.5 px-3 text-right min-w-[150px]">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {currentOrderTrips.map((tr, trIdx) => (
                      <tr key={tr.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                          {trIdx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900 text-sm">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>{tr.truckPlate}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-800">{tr.driverName}</div>
                          {tr.driverPhone && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{tr.driverPhone}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                          {tr.departureTime}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-blue-700 text-sm">
                          {tr.volume} <span className="text-[10px] text-slate-400 font-normal">m³</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                          {tr.accumulatedVolume || tr.volume} <span className="text-[10px] text-slate-400 font-normal">m³</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                            {tr.ticketNumber || '0160190'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                            {tr.sealNumber || '849201'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {onOpenPrintModal && (
                              <button
                                type="button"
                                onClick={() => onOpenPrintModal(currentViewOrder, tr)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded font-bold text-[11px] transition cursor-pointer"
                                title="In phiếu giao nhận chuyến này chuẩn TSG-TNT"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                <span>In</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTrip(tr);
                                setIsEditTripOpen(true);
                              }}
                              className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                              title="Chỉnh sửa chuyến xe"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteTripItem(tr, e)}
                              className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                              title="Xóa chuyến xe"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TRƯỜNG HỢP 2: BẢNG DANH SÁCH ĐƠN HÀNG CHÍNH                              */
        /* (Bấm vào tên công ty hoặc ngày sẽ chuyển vào giao diện cấp hàng của đơn)  */
        /* ========================================================================= */
        <div className="space-y-4">
          {/* 1. TOP METRICS RIBBON (Hiện đại, tinh tế, tổng quan nhanh) */}
          <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-4 shadow-xs">
            <div className="max-w-[1700px] mx-auto">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* KPI 1: Đơn hàng */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Tổng đơn hàng
                    </p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold text-slate-900">{stats.totalOrdersCount}</span>
                      <span className="text-xs text-blue-600 font-medium">
                        {stats.activeOrders} đang chạy
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {stats.completedOrders} hoàn thành · {stats.pendingOrders} chờ duyệt
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI 2: Khối lượng */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
                  <div className="flex-1 mr-2">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Khối lượng đã cấp
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-bold text-slate-900">{stats.totalDeliveredVol}</span>
                      <span className="text-xs text-slate-500 font-normal">/ {stats.totalOrderedVol} m³</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, stats.deliveryProgress)}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Gauge className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI 3: Chuyến điều phối */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Chuyến cấp hàng
                    </p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold text-slate-900">{stats.totalTripsCount}</span>
                      <span className="text-xs text-orange-600 font-medium">chuyến đã xuất</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {stats.activeTrucksCount} xe bồn đang hoạt động
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5" />
                  </div>
                </div>

                {/* KPI 4: Tỉ lệ hoàn thành */}
                <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Tiến độ bàn giao
                    </p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold text-slate-900">{stats.deliveryProgress}%</span>
                      <span className="text-xs text-emerald-600 font-medium">hoàn thành</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Còn lại: {Math.max(0, stats.totalOrderedVol - stats.totalDeliveredVol)} m³
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. MAIN TOOLBAR: Tạo đơn chính & Đơn phát sinh cho điều phối */}
          <div className="px-4 sm:px-6 max-w-[1700px] mx-auto space-y-3">
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Danh Sách Đơn Hàng & Điều Phối Cấp Bê Tông</h2>
                  <p className="text-[11px] text-slate-500">
                    Nhấp vào <strong>Tên Công Ty</strong> hoặc <strong>Ngày Giao</strong> để mở giao diện cấp hàng của đơn đó
                  </p>
                </div>
              </div>

              {/* Action Buttons: Hỗ trợ tạo đơn chính và đơn phát sinh */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOrderType('CHINH');
                    setCopyFromOrder(null);
                    setIsCreateOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo Đơn Hàng Mới</span>
                </button>

                {/* Nút Tạo Đơn Phát Sinh (Khi điều phối cần xuất xe mà chưa có đơn chính) */}
                <button
                  type="button"
                  onClick={() => {
                    setCreateOrderType('PHAT_SINH');
                    setCopyFromOrder(null);
                    setIsCreateOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-xs shadow-xs transition cursor-pointer"
                  title="Nếu chưa có đơn hàng chính, điều phối có thể bấm vào đây để tạo Đơn hàng phát sinh ngay lập tức"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>+ Tạo Đơn Hàng Phát Sinh</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition cursor-pointer"
                  title="Xuất file Excel báo cáo"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Xuất Excel</span>
                </button>
              </div>
            </div>

            {/* BẢNG LỊCH CHỌN NGÀY GIAO HÀNG (CALENDAR TABLE PICKER) */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
              {/* Calendar Header Bar */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200/90 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <span className="font-black text-slate-900 uppercase text-xs tracking-tight">
                      Bảng Lịch Chọn Ngày Giao Hàng
                    </span>
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-300 shadow-2xs font-bold text-slate-800">
                    <button
                      type="button"
                      onClick={handlePrevMonth}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      title="Tháng trước"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 text-xs font-mono">
                      Tháng {calendarMonth + 1} / {calendarYear}
                    </span>
                    <button
                      type="button"
                      onClick={handleNextMonth}
                      className="p-1 rounded hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                      title="Tháng sau"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Fast Action Buttons in Calendar */}
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarYear(2026);
                      setCalendarMonth(9);
                      setFilterDate('04/10/2026');
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
                      filterDate === '04/10/2026'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    Hôm nay (04/10/2026)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFilterDate('')}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer border ${
                      !filterDate
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                    }`}
                  >
                    Tất cả các ngày
                  </button>
                </div>

                {/* Right side: Active date badge & collapse toggle */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-semibold text-[11px]">
                    <span className="text-slate-500 font-normal">Đang lọc ngày:</span>
                    <strong className="font-mono text-blue-700">
                      {filterDate || 'Tất cả các ngày'}
                    </strong>
                    {filterDate && (
                      <button
                        type="button"
                        onClick={() => setFilterDate('')}
                        className="ml-1 text-slate-400 hover:text-red-600 cursor-pointer"
                        title="Bỏ lọc ngày này"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs transition cursor-pointer"
                  >
                    {isCalendarOpen ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                        <span>Thu gọn lịch</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                        <span>Mở bảng lịch</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Calendar Grid Table */}
              {isCalendarOpen && (
                <div className="p-3 bg-white overflow-x-auto">
                  <div className="min-w-[620px]">
                    {/* Days of week header */}
                    <div className="grid grid-cols-7 gap-1 mb-1 text-center font-bold text-[11px] text-slate-600 bg-slate-100/70 py-1.5 rounded-lg border border-slate-200">
                      <div>Thứ Hai (T2)</div>
                      <div>Thứ Ba (T3)</div>
                      <div>Thứ Tư (T4)</div>
                      <div>Thứ Năm (T5)</div>
                      <div>Thứ Sáu (T6)</div>
                      <div className="text-blue-700">Thứ Bảy (T7)</div>
                      <div className="text-red-600">Chủ Nhật (CN)</div>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {calendarDays.map((cd, idx) => {
                        if (!cd.isCurrentMonth) {
                          return (
                            <div
                              key={`empty-${idx}`}
                              className="h-14 rounded-lg bg-slate-50/50 border border-dashed border-slate-200/60"
                            />
                          );
                        }

                        return (
                          <button
                            key={cd.dateStr}
                            type="button"
                            onClick={() => {
                              if (filterDate === cd.dateStr) {
                                setFilterDate(''); // Click lại ngày đang chọn thì bỏ lọc
                              } else {
                                setFilterDate(cd.dateStr);
                              }
                            }}
                            className={`h-14 rounded-lg p-1.5 flex flex-col justify-between items-start transition cursor-pointer text-left border relative ${
                              cd.isSelected
                                ? 'bg-blue-600 text-white border-blue-700 shadow-md ring-2 ring-blue-300'
                                : cd.isToday
                                ? 'bg-blue-50/70 border-blue-400 hover:bg-blue-100 text-slate-900'
                                : cd.ordersCount > 0
                                ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-100/60 text-slate-900'
                                : 'bg-white border-slate-200 hover:bg-slate-100/70 text-slate-700'
                            }`}
                          >
                            {/* Day number & indicators */}
                            <div className="w-full flex items-center justify-between">
                              <span
                                className={`text-xs font-black font-mono ${
                                  cd.isSelected ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {cd.day}
                              </span>

                              {cd.isToday && (
                                <span
                                  className={`text-[9px] font-bold px-1 rounded uppercase ${
                                    cd.isSelected ? 'bg-blue-800 text-white' : 'bg-blue-200 text-blue-900'
                                  }`}
                                >
                                  Hôm nay
                                </span>
                              )}
                            </div>

                            {/* Orders count badge on this day */}
                            <div className="w-full mt-auto">
                              {cd.ordersCount > 0 ? (
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold leading-none ${
                                    cd.isSelected
                                      ? 'bg-white text-blue-800 shadow-xs'
                                      : 'bg-emerald-600 text-white shadow-2xs'
                                  }`}
                                >
                                  {cd.ordersCount} đơn
                                </span>
                              ) : (
                                <span
                                  className={`text-[9px] ${
                                    cd.isSelected ? 'text-blue-200' : 'text-slate-400'
                                  }`}
                                >
                                  -
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Search Input & Status Filter */}
            <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3 flex-1">
                {/* Search Input */}
                <div className="relative min-w-[240px] max-w-md flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Tìm theo khách hàng, công trình, mã đơn, mác bê tông..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Status filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">Trạng thái:</span>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none"
                  >
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="CHO_DUYET">Chờ duyệt</option>
                    <option value="DA_DUYET">Đã duyệt</option>
                    <option value="DANG_CHAY">Đang cấp hàng</option>
                    <option value="HOAN_THANH">Hoàn thành</option>
                  </select>
                </div>

                {/* Quick Reset */}
                {(searchTerm || filterDate || filterStatus !== 'ALL') && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setFilterDate('');
                      setFilterStatus('ALL');
                    }}
                    className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                )}
              </div>

              <div className="text-slate-500 text-xs">
                Hiển thị <strong>{filteredOrders.length}</strong> đơn hàng
              </div>
            </div>

            {/* Main Orders Table */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                      onChange={handleToggleSelectAllOrders}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Chọn tất cả ({selectedOrderIds.size} đã chọn)</span>
                  </label>
                </div>

                <div className="text-slate-500 text-[11px]">
                  * Bấm vào <strong>Tên Công Ty</strong> hoặc <strong>Ngày Giao</strong> để mở giao diện cấp hàng riêng của đơn đó
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 w-10 text-center"></th>
                      <th className="py-2.5 px-3 min-w-[220px]">
                        <span>Khách Hàng & Công Trình</span>
                        <span className="block text-[9px] font-bold text-blue-600 normal-case">(Bấm để cấp hàng)</span>
                      </th>
                      <th className="py-2.5 px-3 min-w-[130px]">Hạng Mục & Bơm</th>
                      <th className="py-2.5 px-3 min-w-[130px]">Mác & Sụt</th>
                      <th className="py-2.5 px-3 min-w-[170px]">Tiến Độ Cấp Hàng</th>
                      <th className="py-2.5 px-3 min-w-[170px]">Xe Bồn Đang Cấp</th>
                      <th className="py-2.5 px-3 text-center min-w-[110px]">
                        <span>Ngày / Giờ Giao</span>
                        <span className="block text-[9px] font-bold text-blue-600 normal-case">(Bấm để cấp hàng)</span>
                      </th>
                      <th className="py-2.5 px-3 text-center min-w-[100px]">Trạng Thái</th>
                      <th className="py-2.5 px-3 text-right min-w-[150px]">Thao Tác</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-12 text-center text-slate-500 space-y-3">
                          <p className="text-sm font-semibold">Không tìm thấy đơn hàng nào phù hợp với bộ lọc.</p>
                          <p className="text-xs text-slate-400">
                            Nếu chưa có đơn hàng, điều phối có thể tạo đơn hàng phát sinh ngay để xuất xe:
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCreateOrderType('PHAT_SINH');
                              setCopyFromOrder(null);
                              setIsCreateOpen(true);
                            }}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                          >
                            <Zap className="w-4 h-4" />
                            <span>Tạo Đơn Hàng Phát Sinh Để Cấp Xe Ngay</span>
                          </button>
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map(order => {
                        const isSelected = selectedOrderIds.has(order.id);
                        const isExpanded = expandedOrderIds.has(order.id);
                        const orderTrips = trips.filter(
                          t => t.orderId === order.id || t.orderCode === order.code
                        );
                        const percent = Math.min(
                          100,
                          Math.round((order.deliveredVolume / order.totalVolume) * 100)
                        );
                        const remaining = Math.max(0, order.totalVolume - order.deliveredVolume);

                        return (
                          <React.Fragment key={order.id}>
                            <tr className={`hover:bg-blue-50/40 transition ${isSelected ? 'bg-blue-50/70' : ''}`}>
                              {/* Checkbox & Expand Trigger */}
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => handleToggleExpandOrder(order.id, e)}
                                    className="p-1 rounded hover:bg-slate-200 text-slate-500 transition cursor-pointer"
                                    title="Mở xem danh sách các chuyến xe đã cấp của đơn này"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 text-blue-600" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4" />
                                    )}
                                  </button>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleToggleSelectOrder(order.id)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                  />
                                </div>
                              </td>

                              {/* Customer & Project (Bấm vào tên công ty để chuyển sang giao diện cấp hàng của đơn đó) */}
                              <td className="py-3 px-3">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDispatchId(order.id)}
                                  className="font-bold text-slate-900 hover:text-blue-700 hover:underline leading-snug text-left cursor-pointer transition flex items-center gap-1 group text-xs"
                                  title="Bấm vào tên công ty để chuyển vào giao diện cấp hàng của đơn này"
                                >
                                  <span>{order.customerName}</span>
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-500 opacity-60 group-hover:opacity-100 transition shrink-0" />
                                </button>
                                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                  <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span className="font-medium text-slate-700 truncate max-w-[220px]">
                                    {order.projectTitle}
                                  </span>
                                </div>
                                <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                                  <span>Mã: {order.code}</span>
                                  <span>·</span>
                                  <span>{order.plantLocation || 'Tây Ninh'}</span>
                                  {order.orderType === 'PHAT_SINH' && (
                                    <span className="px-1 rounded bg-amber-100 text-amber-800 font-bold">Phát sinh</span>
                                  )}
                                </div>
                              </td>

                              {/* Category & Pump */}
                              <td className="py-3 px-3 text-slate-700">
                                <div className="font-semibold">{order.categoryItem}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {order.pumpType || 'Xả trực tiếp'}
                                </div>
                              </td>

                              {/* Grade & Slump */}
                              <td className="py-3 px-3">
                                <div className="font-mono font-bold text-slate-900">{order.grade}</div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Sụt: <strong>{order.slump} cm</strong>
                                </div>
                              </td>

                              {/* Delivery Progress */}
                              <td className="py-3 px-3">
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-bold text-slate-900">
                                    {order.deliveredVolume} / {order.totalVolume} m³
                                  </span>
                                  <span className={`font-bold ${percent >= 100 ? 'text-emerald-600' : 'text-blue-600'}`}>
                                    {percent}%
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      percent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                                    }`}
                                    style={{ width: `${percent}%` }}
                                  />
                                </div>
                                <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                                  <span>Còn: {remaining} m³</span>
                                  <span>{orderTrips.length} chuyến</span>
                                </div>
                              </td>

                              {/* Linked Dispatched Trucks */}
                              <td className="py-3 px-3">
                                {orderTrips.length === 0 ? (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAssignForOrder(order)}
                                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                                  >
                                    + Cấp xe ngay
                                  </button>
                                ) : (
                                  <div className="flex flex-wrap gap-1">
                                    {orderTrips.slice(0, 3).map(tr => (
                                      <button
                                        key={tr.id}
                                        type="button"
                                        onClick={() => {
                                          setEditingTrip(tr);
                                          setIsEditTripOpen(true);
                                        }}
                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 font-mono text-[10px] border border-slate-200 transition cursor-pointer"
                                        title={`Xe: ${tr.truckPlate} - Tài xế: ${tr.driverName} - ${tr.volume}m³ (Bấm để xem/sửa)`}
                                      >
                                        <Truck className="w-2.5 h-2.5 text-slate-500" />
                                        <span>{tr.truckPlate}</span>
                                        <span className="font-bold text-blue-700">({tr.volume}m³)</span>
                                      </button>
                                    ))}
                                    {orderTrips.length > 3 && (
                                      <span className="text-[10px] text-slate-500 font-bold self-center">
                                        +{orderTrips.length - 3} xe
                                      </span>
                                    )}
                                  </div>
                                )}
                              </td>

                              {/* Delivery Date & Time (Bấm vào ngày để chuyển sang giao diện cấp hàng của đơn đó) */}
                              <td className="py-3 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => setSelectedOrderForDispatchId(order.id)}
                                  className="group inline-flex flex-col items-center p-1 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                                  title="Bấm vào ngày hoặc giờ giao để chuyển vào giao diện cấp hàng của đơn này"
                                >
                                  <div className="font-mono font-bold text-blue-700 group-hover:underline text-xs flex items-center gap-1">
                                    <Calendar className="w-3 h-3 text-blue-500" />
                                    <span>{order.deliveryDate ? order.deliveryDate.split('-').reverse().join('/') : '04/10/2026'}</span>
                                  </div>
                                  <div className="font-mono font-bold text-slate-800 text-[11px] mt-0.5">
                                    {order.deliveryTime}
                                  </div>
                                  {order.scheduledProductionTime && (
                                    <div className="text-[10px] text-slate-400">
                                      KHSX: {order.scheduledProductionTime}
                                    </div>
                                  )}
                                </button>
                              </td>

                              {/* Status */}
                              <td className="py-3 px-3 text-center">
                                {getStatusBadge(order.status)}
                              </td>

                              {/* Actions Toolbar */}
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  {/* Cấp xe nhanh */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenAssignForOrder(order, e)}
                                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                                    title="Cấp xe bồn cho đơn hàng này"
                                  >
                                    <Truck className="w-3 h-3" />
                                    <span>Cấp xe</span>
                                  </button>

                                  {/* In phiếu giao nhận */}
                                  {onOpenPrintModal && (
                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenPrintForOrder(order, e)}
                                      className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                      title="In phiếu giao nhận bê tông"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-orange-600" />
                                    </button>
                                  )}

                                  {/* Sửa đơn */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOrderToEdit(order);
                                      setIsEditOrderOpen(true);
                                    }}
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-blue-600 transition cursor-pointer"
                                    title="Chỉnh sửa đơn hàng"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Xóa */}
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteOrderItem(order, e)}
                                    className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                    title="Xóa đơn hàng"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>

                            {/* INLINE LINKED DISPATCHES DRAWER (Khi bấm mở [▾]) */}
                            {isExpanded && (
                              <tr className="bg-slate-50/90 border-b border-slate-200">
                                <td colSpan={9} className="p-4 pl-12">
                                  <div className="bg-white rounded-lg p-3.5 border border-slate-200 shadow-2xs space-y-3">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                      <div className="flex items-center gap-2">
                                        <Truck className="w-4 h-4 text-emerald-600" />
                                        <span className="font-bold text-slate-900 text-xs">
                                          DANH SÁCH CÁC CHUYẾN XE ĐÃ CẤP CỦA ĐƠN [{order.code}]
                                        </span>
                                        <span className="text-[11px] text-slate-500 font-medium">
                                          (Tổng cộng {orderTrips.length} chuyến · {order.deliveredVolume} m³)
                                        </span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedOrderForDispatchId(order.id)}
                                          className="text-xs text-blue-600 hover:underline font-bold"
                                        >
                                          Mở toàn màn hình cấp hàng →
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleOpenAssignForOrder(order, e)}
                                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs flex items-center gap-1 shadow-xs transition cursor-pointer"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                          <span>Cấp thêm chuyến xe</span>
                                        </button>
                                      </div>
                                    </div>

                                    {orderTrips.length === 0 ? (
                                      <div className="py-6 text-center text-slate-400 text-xs">
                                        Đơn hàng này chưa có chuyến xe nào được điều phối. Bấm nút "Cấp thêm chuyến xe" ở trên để xuất xe.
                                      </div>
                                    ) : (
                                      <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs border-collapse">
                                          <thead>
                                            <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200 text-[10px] uppercase">
                                              <th className="py-2 px-2.5">STT</th>
                                              <th className="py-2 px-2.5">Số Xe</th>
                                              <th className="py-2 px-2.5">Tài Xế</th>
                                              <th className="py-2 px-2.5 text-center">Giờ Khởi Hành</th>
                                              <th className="py-2 px-2.5 text-right">Lượng Xuất</th>
                                              <th className="py-2 px-2.5 text-right">Cộng Dồn</th>
                                              <th className="py-2 px-2.5">Số Phiếu</th>
                                              <th className="py-2 px-2.5">Số Chì</th>
                                              <th className="py-2 px-2.5 text-right">Thao Tác</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100">
                                            {orderTrips.map((tr, trIdx) => (
                                              <tr key={tr.id} className="hover:bg-slate-50 transition">
                                                <td className="py-2 px-2.5 text-slate-500 font-mono text-center w-8">
                                                  {trIdx + 1}
                                                </td>
                                                <td className="py-2 px-2.5 font-bold font-mono text-slate-900">
                                                  {tr.truckPlate}
                                                </td>
                                                <td className="py-2 px-2.5 font-medium text-slate-800">
                                                  {tr.driverName}
                                                </td>
                                                <td className="py-2 px-2.5 text-center font-mono font-bold text-slate-900">
                                                  {tr.departureTime}
                                                </td>
                                                <td className="py-2 px-2.5 text-right font-mono font-bold text-blue-700">
                                                  {tr.volume} m³
                                                </td>
                                                <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-900">
                                                  {tr.accumulatedVolume || tr.volume} m³
                                                </td>
                                                <td className="py-2 px-2.5">
                                                  <span className="font-mono text-[11px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                    {tr.ticketNumber || '0160190'}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-2.5">
                                                  <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                    {tr.sealNumber || '849201'}
                                                  </span>
                                                </td>
                                                <td className="py-2 px-2.5 text-right">
                                                  <div className="flex items-center justify-end gap-1.5">
                                                    {onOpenPrintModal && (
                                                      <button
                                                        type="button"
                                                        onClick={() => onOpenPrintModal(order, tr)}
                                                        className="p-1 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 transition cursor-pointer"
                                                        title="In phiếu giao nhận chuyến xe này"
                                                      >
                                                        <Printer className="w-3.5 h-3.5" />
                                                      </button>
                                                    )}
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEditingTrip(tr);
                                                        setIsEditTripOpen(true);
                                                      }}
                                                      className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition cursor-pointer"
                                                      title="Chỉnh sửa chuyến xe"
                                                    >
                                                      <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => handleDeleteTripItem(tr, e)}
                                                      className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition cursor-pointer"
                                                      title="Xóa chuyến xe"
                                                    >
                                                      <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                  </div>
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS INTEGRATION (Hoàn toàn đồng bộ dữ liệu)                  */}
      {/* ============================================================== */}
      {/* 1. Modal Tạo Đơn hàng mới (Hỗ trợ Đơn chính và Đơn phát sinh) */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultOrderType={createOrderType}
        defaultCopyFromOrder={copyFromOrder}
        onCreated={(newOrder) => {
          setSelectedOrderForDispatchId(newOrder.id);
        }}
      />

      {/* 2. Modal Chỉnh sửa Đơn hàng */}
      <EditOrderModal
        isOpen={isEditOrderOpen}
        order={orderToEdit}
        onClose={() => setIsEditOrderOpen(false)}
      />

      {/* 3. Modal Cấp xe bồn / Phiếu giao hàng mới */}
      {orderForDispatch && (
        <DispatchAssignModal
          order={orderForDispatch}
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
        />
      )}

      {/* 4. Modal Sửa chi tiết chuyến xe (Tài xế, số xe, số phiếu, số chì) */}
      <EditTripModal
        isOpen={isEditTripOpen}
        onClose={() => setIsEditTripOpen(false)}
        trip={editingTrip}
        order={
          orders.find(o => o.id === editingTrip?.orderId || o.code === editingTrip?.orderCode) ||
          currentViewOrder ||
          orders[0]
        }
        onOpenPrintModal={onOpenPrintModal}
      />
    </div>
  );
};
