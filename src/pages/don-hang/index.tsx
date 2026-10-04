import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar,
  Search,
  Plus,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
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
  Filter,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Droplets,
  Building2,
  X
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder, DispatchTrip, OrderType, OrderStatus } from '../../types';
import { CreateOrderModal } from './CreateOrderModal';
import { EditOrderModal } from './EditOrderModal';
import { DispatchAssignModal } from './DispatchAssignModal';
import { EditTripModal } from './EditTripModal';
import * as XLSX from 'xlsx';

interface DonHangPageProps {
  initialView?: 'DON_HANG' | 'CAP_HANG' | 'SPLIT';
  onViewChange?: (view: 'DON_HANG' | 'CAP_HANG') => void;
  onOpenPrintModal?: (order: ConcreteOrder, trip?: any) => void;
}

export const DonHangPage: React.FC<DonHangPageProps> = ({
  initialView,
  onViewChange,
  onOpenPrintModal
}) => {
  const { orders, trips, trucks, deleteTrip, deleteOrder, updateOrder } = useSync();

  // View modes: 'DON_HANG' (Orders focus), 'CAP_HANG' (Dispatches focus), 'SPLIT' (Interactive Split View)
  const [activeView, setActiveView] = useState<'DON_HANG' | 'CAP_HANG' | 'SPLIT'>(
    initialView || 'DON_HANG'
  );

  React.useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  const handleSwitchView = (view: 'DON_HANG' | 'CAP_HANG' | 'SPLIT') => {
    setActiveView(view);
    if (onViewChange && (view === 'DON_HANG' || view === 'CAP_HANG')) {
      onViewChange(view);
    }
  };

  // Search & Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('04/10/2026');
  const [dateQuickFilter, setDateQuickFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_3_DAYS' | 'CUSTOM'>('TODAY');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPlant, setFilterPlant] = useState<string>('ALL');

  const handleSelectQuickDate = (mode: 'ALL' | 'TODAY' | 'YESTERDAY' | 'LAST_3_DAYS') => {
    setDateQuickFilter(mode);
    if (mode === 'ALL') {
      setFilterDate('');
    } else if (mode === 'TODAY') {
      setFilterDate('04/10/2026');
    } else if (mode === 'YESTERDAY') {
      setFilterDate('03/10/2026');
    } else if (mode === 'LAST_3_DAYS') {
      setFilterDate('');
    }
  };

  // Selected orders checkbox set for bulk actions
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Selected order for Split View & Dispatch filtering
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');

  // Expanded order rows (to view inline linked dispatches)
  const [expandedOrderIds, setExpandedOrderIds] = useState<Set<string>>(new Set());

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createOrderType, setCreateOrderType] = useState<OrderType>('CHINH');
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ConcreteOrder | null>(null);

  // Dispatch Assign Modal (Xuất xe bồn / phiếu mới)
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [orderForDispatch, setOrderForDispatch] = useState<ConcreteOrder | null>(null);

  // Edit Trip Modal
  const [editingTrip, setEditingTrip] = useState<DispatchTrip | null>(null);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);

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

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Date filter
      if (dateQuickFilter === 'LAST_3_DAYS') {
        const orderDate = order.deliveryDate
          ? order.deliveryDate.split('-').reverse().join('/')
          : '';
        const match3 = ['04/10/2026', '03/10/2026', '02/10/2026', '2026-10-04', '2026-10-03', '2026-10-02'].some(d => (order.deliveryDate && order.deliveryDate.includes(d)) || (orderDate && orderDate.includes(d)));
        if (!match3) return false;
      } else if (filterDate.trim()) {
        const orderDate = order.deliveryDate
          ? order.deliveryDate.split('-').reverse().join('/')
          : '';
        if (orderDate && !orderDate.includes(filterDate.trim()) && (!order.deliveryDate || !order.deliveryDate.includes(filterDate.trim()))) {
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
  }, [orders, filterDate, dateQuickFilter, filterStatus, filterPlant, searchTerm]);

  // Selected order object
  const currentSelectedOrder = useMemo(() => {
    return orders.find(o => o.id === selectedOrderId) || filteredOrders[0] || orders[0] || null;
  }, [orders, selectedOrderId, filteredOrders]);

  // Filtered Trips (Dispatches)
  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      // Date filter
      if (dateQuickFilter === 'LAST_3_DAYS') {
        const tDate = trip.deliveryDate || '';
        const match3 = ['04/10/2026', '03/10/2026', '02/10/2026', '2026-10-04', '2026-10-03', '2026-10-02'].some(d => tDate.includes(d));
        if (!match3) return false;
      } else if (filterDate.trim()) {
        const tDate = trip.deliveryDate || '';
        const norm = tDate.includes('-') ? tDate.split('-').reverse().join('/') : tDate;
        if (norm && !norm.includes(filterDate.trim()) && !tDate.includes(filterDate.trim())) {
          return false;
        }
      }

      // If user selected an order specifically in CAP_HANG view
      if (activeView === 'CAP_HANG' && selectedOrderId && selectedOrderId !== 'ALL') {
        const matched = trip.orderId === selectedOrderId || trip.orderCode === currentSelectedOrder?.code;
        if (!matched) return false;
      }

      // Keyword search
      if (searchTerm.trim()) {
        const kw = searchTerm.toLowerCase();
        const parentOrder = orders.find(o => o.id === trip.orderId || o.code === trip.orderCode);
        const match =
          trip.truckPlate.toLowerCase().includes(kw) ||
          trip.driverName.toLowerCase().includes(kw) ||
          (trip.ticketNumber && trip.ticketNumber.toLowerCase().includes(kw)) ||
          (trip.sealNumber && trip.sealNumber.toLowerCase().includes(kw)) ||
          (trip.concreteName && trip.concreteName.toLowerCase().includes(kw)) ||
          (parentOrder && parentOrder.customerName.toLowerCase().includes(kw)) ||
          (parentOrder && parentOrder.projectTitle.toLowerCase().includes(kw));
        if (!match) return false;
      }

      return true;
    });
  }, [trips, filterDate, dateQuickFilter, activeView, selectedOrderId, currentSelectedOrder, searchTerm, orders]);

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

  // Toggle expand order row
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
    setSelectedOrderId(order.id);
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
    }
  };

  // Export Excel
  const handleExportExcel = () => {
    if (activeView === 'DON_HANG') {
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
        o.plantLocation || 'Tây Ninh'
      ]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['BÁO CÁO ĐƠN HÀNG TSG-TNT'], [], headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'DonHang');
      XLSX.writeFile(wb, 'Bao_Cao_Don_Hang.xlsx');
    } else {
      const headers = [
        'STT',
        'Ngày Giao',
        'Số Xe',
        'Tài Xế',
        'Mã Đơn',
        'Khách Hàng',
        'Công Trình',
        'Mác Bê Tông',
        'Khối Lượng (m³)',
        'Cộng Dồn (m³)',
        'Giờ Xuất',
        'Số Phiếu',
        'Số Niêm Chì',
        'Nhà Máy'
      ];
      const rows = filteredTrips.map((t, idx) => {
        const parentOrder = orders.find(o => o.id === t.orderId || o.code === t.orderCode);
        return [
          idx + 1,
          t.deliveryDate || '04/10/2026',
          t.truckPlate,
          t.driverName,
          t.orderCode || parentOrder?.code || '',
          parentOrder?.customerName || '',
          parentOrder?.projectTitle || '',
          t.concreteName || t.grade || parentOrder?.grade || 'M350',
          t.volume,
          t.accumulatedVolume || t.volume,
          t.departureTime,
          t.ticketNumber || '',
          t.sealNumber || '',
          t.plantLocation || 'Tây Ninh'
        ];
      });
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['BÁO CÁO ĐIỀU PHỐI CẤP HÀNG'], [], headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'DieuPhoi');
      XLSX.writeFile(wb, 'Bao_Cao_Dieu_Phoi_Cap_Hang.xlsx');
    }
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

      {/* 2. MAIN TOOLBAR & VIEW SWITCHER (Thao tác nhanh, chuyển đổi liền mạch) */}
      <div className="px-4 sm:px-6 py-4 max-w-[1700px] mx-auto space-y-3">
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
          {/* Left: View Mode Segmented Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => handleSwitchView('DON_HANG')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeView === 'DON_HANG'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Đơn Hàng & Tiến Độ Cấp</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-bold">
                {filteredOrders.length}
              </span>
            </button>

            <button
              onClick={() => handleSwitchView('CAP_HANG')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeView === 'CAP_HANG'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Điều Phối Cấp Hàng (Xe & Phiếu)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/70 text-slate-700 font-bold">
                {filteredTrips.length}
              </span>
            </button>

            <button
              onClick={() => handleSwitchView('SPLIT')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeView === 'SPLIT'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Xem 2 cột: Bảng đơn hàng bên trái & Chi tiết các chuyến cấp bên phải"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Chế Độ Kết Hợp 2 Cột</span>
            </button>
          </div>

          {/* Right: Primary CTAs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCreateOrderType('CHINH');
                setIsCreateOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo Đơn Hàng Mới</span>
            </button>

            <button
              onClick={() => {
                setOrderForDispatch(currentSelectedOrder);
                setIsAssignOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Cấp Xe Bồn Mới</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg font-semibold text-xs transition cursor-pointer"
              title="Xuất file Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Quick Date Shortcuts (Tìm ngày nhanh) */}
        <div className="bg-white rounded-xl px-3.5 py-2 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-700 flex items-center gap-1 text-[11px] uppercase mr-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Tìm ngày nhanh:
            </span>
            <button
              type="button"
              onClick={() => handleSelectQuickDate('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                dateQuickFilter === 'ALL' && !filterDate
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Tất cả ngày ({orders.length} đơn)
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickDate('TODAY')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                dateQuickFilter === 'TODAY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hôm nay (04/10)
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickDate('YESTERDAY')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                dateQuickFilter === 'YESTERDAY'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Hôm qua (03/10)
            </button>
            <button
              type="button"
              onClick={() => handleSelectQuickDate('LAST_3_DAYS')}
              className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                dateQuickFilter === 'LAST_3_DAYS'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              3 ngày gần đây
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px] font-medium">Nhập ngày (DD/MM/YYYY):</span>
            <input
              type="text"
              value={filterDate}
              onChange={(e) => {
                setFilterDate(e.target.value);
                setDateQuickFilter('CUSTOM');
              }}
              placeholder="04/10/2026"
              className="w-28 px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
            />
            {filterDate && (
              <button
                type="button"
                onClick={() => handleSelectQuickDate('ALL')}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Xóa
              </button>
            )}
          </div>
        </div>

        {/* 3. SEARCH & SMART FILTERS BAR */}
        <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative min-w-[240px] max-w-md flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm khách hàng, công trình, mã đơn, số xe, tài xế, số phiếu..."
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

            {/* Date filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Ngày giao:</span>
              <div className="flex items-center">
                <input
                  type="text"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  placeholder="04/10/2026"
                  className="w-24 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-l-lg text-xs focus:bg-white focus:outline-none font-mono"
                />
                <button
                  type="button"
                  onClick={() => setFilterDate(filterDate ? '' : '04/10/2026')}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 border border-l-0 border-slate-200 rounded-r-lg text-slate-600"
                  title={filterDate ? 'Bỏ lọc ngày' : 'Chọn ngày hôm nay'}
                >
                  <Calendar className="w-3.5 h-3.5" />
                </button>
              </div>
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
            {(searchTerm || filterDate !== '04/10/2026' || filterStatus !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setFilterDate('04/10/2026');
                  setFilterStatus('ALL');
                }}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          {/* Right Status */}
          <div className="text-slate-500 text-xs">
            Hiển thị <strong>{activeView === 'CAP_HANG' ? filteredTrips.length : filteredOrders.length}</strong> kết quả
          </div>
        </div>

        {/* ================================================================= */}
        {/* VIEW 1: BẢNG ĐƠN HÀNG KÈM TIẾN ĐỘ & CHUYẾN CẤP LIÊN KẾT TRỰC TIẾP */}
        {/* ================================================================= */}
        {activeView === 'DON_HANG' && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            {/* Table Header toolbar */}
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
                * Nhấp vào biểu tượng <strong>[▾]</strong> để mở xem các chuyến xe đã cấp của đơn hàng đó
              </div>
            </div>

            {/* Modern Data Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3 w-10 text-center"></th>
                    <th className="py-2.5 px-3 min-w-[200px]">Khách Hàng & Công Trình</th>
                    <th className="py-2.5 px-3 min-w-[140px]">Hạng Mục & Bơm</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Mác & Sụt</th>
                    <th className="py-2.5 px-3 min-w-[170px]">Tiến Độ Cấp Hàng</th>
                    <th className="py-2.5 px-3 min-w-[180px]">Xe Bồn Đang Cấp</th>
                    <th className="py-2.5 px-3 text-center min-w-[90px]">Giờ Giao</th>
                    <th className="py-2.5 px-3 text-center min-w-[110px]">Trạng Thái</th>
                    <th className="py-2.5 px-3 text-right min-w-[150px]">Thao Tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        Không có đơn hàng nào khớp với điều kiện tìm kiếm.
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
                          <tr
                            onClick={() => setSelectedOrderId(order.id)}
                            className={`hover:bg-blue-50/40 transition cursor-pointer ${
                              isSelected ? 'bg-blue-50/70' : ''
                            } ${currentSelectedOrder?.id === order.id ? 'ring-1 ring-blue-500/30' : ''}`}
                          >
                            {/* Checkbox & Expand Trigger */}
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleExpandOrder(order.id, e)}
                                  className="p-1 rounded hover:bg-slate-200 text-slate-500 transition"
                                  title="Mở xem danh sách các chuyến cấp hàng của đơn này"
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
                                  onClick={(e) => e.stopPropagation()}
                                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              </div>
                            </td>

                            {/* Customer & Project */}
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900 leading-snug">
                                {order.customerName}
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-medium text-slate-700 truncate max-w-[220px]">
                                  {order.projectTitle}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                Mã: {order.code} · {order.plantLocation || 'Tây Ninh'}
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
                              {/* Progress bar */}
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
                                <span className="text-[11px] text-slate-400 italic">Chưa cấp xe</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {orderTrips.slice(0, 3).map(tr => (
                                    <button
                                      key={tr.id}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTrip(tr);
                                        setIsEditTripOpen(true);
                                      }}
                                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-100 hover:text-blue-700 text-slate-700 font-mono text-[10px] border border-slate-200 transition"
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

                            {/* Delivery Time */}
                            <td className="py-3 px-3 text-center">
                              <div className="font-mono font-bold text-slate-900">
                                {order.deliveryTime}
                              </div>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {order.scheduledProductionTime ? `KHSX: ${order.scheduledProductionTime}` : ''}
                              </div>
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
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded font-semibold text-[11px] flex items-center gap-1 transition"
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
                                    className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
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
                                  className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-blue-600 transition"
                                  title="Chỉnh sửa đơn hàng"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                {/* Xóa */}
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteOrderItem(order, e)}
                                  className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
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
                                        DANH SÁCH CÁC CHUYẾN XE ĐÃ CẤP CHO ĐƠN [{order.code}]
                                      </span>
                                      <span className="text-[11px] text-slate-500 font-medium">
                                        (Tổng cộng {orderTrips.length} chuyến · {order.deliveredVolume} m³)
                                      </span>
                                    </div>

                                    <button
                                      type="button"
                                      onClick={(e) => handleOpenAssignForOrder(order, e)}
                                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-semibold text-xs flex items-center gap-1 shadow-xs transition"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Cấp thêm chuyến xe</span>
                                    </button>
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
                                                      className="p-1 rounded bg-orange-50 hover:bg-orange-100 text-orange-700 transition"
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
                                                    className="p-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                                                    title="Chỉnh sửa chuyến xe"
                                                  >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button
                                                    type="button"
                                                    onClick={(e) => handleDeleteTripItem(tr, e)}
                                                    className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
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
        )}

        {/* ================================================================= */}
        {/* VIEW 2: BẢNG ĐIỀU PHỐI CẤP HÀNG (CHUYÊN SÂU CHUYẾN XE & PHIẾU IN)  */}
        {/* ================================================================= */}
        {activeView === 'CAP_HANG' && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden border-t-4 border-t-red-600">
            {/* Top Header of Dispatch View */}
            <div className="p-3.5 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-900 text-sm">Điều Phối & Danh Sách Cấp Hàng</h2>
                  <p className="text-[11px] text-slate-500">
                    Theo dõi thời gian thực từng chuyến xe bồn xuất trạm, khối lượng, số phiếu và số chì
                  </p>
                </div>
              </div>

              {/* Order selector filter */}
              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium text-xs">Lọc theo đơn hàng:</span>
                <select
                  value={selectedOrderId}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold max-w-xs focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">-- Tất cả chuyến xe --</option>
                  {orders.map(o => (
                    <option key={o.id} value={o.id}>
                      [{o.code}] {o.customerName} - {o.projectTitle} ({o.totalVolume}m³)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => setIsAssignOpen(true)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 shadow-xs transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Xuất Xe Bồn Mới</span>
                </button>
              </div>
            </div>

            {/* Table Trips */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                    <th className="py-2.5 px-3">Ngày Giao</th>
                    <th className="py-2.5 px-3">Số Xe</th>
                    <th className="py-2.5 px-3">Tài Xế</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Đơn Hàng & Khách Hàng Liên Kết</th>
                    <th className="py-2.5 px-3 min-w-[130px]">Mác Bê Tông</th>
                    <th className="py-2.5 px-3 text-center">Giờ Khởi Hành</th>
                    <th className="py-2.5 px-3 text-right">Lượng Xuất</th>
                    <th className="py-2.5 px-3 text-right">Cộng Dồn</th>
                    <th className="py-2.5 px-3">Số Phiếu Xuất</th>
                    <th className="py-2.5 px-3">Số Niêm Chì</th>
                    <th className="py-2.5 px-3 text-right">Thao Tác</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-slate-400">
                        Chưa có chuyến xe nào được điều phối. Bấm nút "Xuất Xe Bồn Mới" ở trên để tạo phiếu.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map(trip => {
                      const parentOrder = orders.find(
                        o => o.id === trip.orderId || o.code === trip.orderCode
                      );

                      return (
                        <tr key={trip.id} className="hover:bg-slate-50 transition">
                          {/* Ngày giao */}
                          <td className="py-3 px-3 font-mono text-slate-700 whitespace-nowrap">
                            {trip.deliveryDate || '04/10/2026'}
                          </td>

                          {/* Số xe */}
                          <td className="py-3 px-3 font-mono font-bold text-slate-900 text-[13px] whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                              <span>{trip.truckPlate}</span>
                            </div>
                          </td>

                          {/* Tài xế */}
                          <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            {trip.driverName}
                          </td>

                          {/* Linked Order & Customer */}
                          <td className="py-3 px-3">
                            {parentOrder ? (
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderId(parentOrder.id);
                                    handleSwitchView('SPLIT');
                                  }}
                                  className="font-bold text-blue-700 hover:underline flex items-center gap-1 text-left"
                                  title="Xem toàn bộ đơn hàng này ở chế độ 2 cột"
                                >
                                  <span>{parentOrder.customerName}</span>
                                  <ExternalLink className="w-3 h-3 text-blue-500 shrink-0" />
                                </button>
                                <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                                  {parentOrder.projectTitle} · <span className="font-mono">[{parentOrder.code}]</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 font-mono">[{trip.orderCode || 'N/A'}]</span>
                            )}
                          </td>

                          {/* Mác bê tông */}
                          <td className="py-3 px-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                            {trip.concreteName || trip.grade || parentOrder?.grade || 'M350-7N(10+-2)'}
                          </td>

                          {/* Giờ khởi hành */}
                          <td className="py-3 px-3 text-center font-mono font-bold text-slate-900">
                            {trip.departureTime}
                          </td>

                          {/* Lượng xuất */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-blue-700 text-sm">
                            {trip.volume} <span className="text-[11px] font-normal text-slate-500">m³</span>
                          </td>

                          {/* Cộng dồn */}
                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            {trip.accumulatedVolume || trip.volume} <span className="text-[11px] font-normal text-slate-500">m³</span>
                          </td>

                          {/* Số phiếu xuất */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                              {trip.ticketNumber || '0160190'}
                            </span>
                          </td>

                          {/* Số chì */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-mono text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-300">
                              {trip.sealNumber || '849201'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* In phiếu */}
                              {onOpenPrintModal && parentOrder && (
                                <button
                                  type="button"
                                  onClick={() => onOpenPrintModal(parentOrder, trip)}
                                  className="flex items-center gap-1 px-2 py-1 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded font-semibold text-[11px] transition"
                                  title="In phiếu giao nhận bê tông chuẩn TSG-TNT"
                                >
                                  <Printer className="w-3 h-3" />
                                  <span>In</span>
                                </button>
                              )}

                              {/* Sửa */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTrip(trip);
                                  setIsEditTripOpen(true);
                                }}
                                className="flex items-center gap-1 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded font-semibold text-[11px] transition"
                                title="Chỉnh sửa chi tiết chuyến xe"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Sửa</span>
                              </button>

                              {/* Xóa */}
                              <button
                                type="button"
                                onClick={(e) => handleDeleteTripItem(trip, e)}
                                className="p-1 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600 transition"
                                title="Xóa chuyến xe"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* VIEW 3: CHẾ ĐỘ KẾT HỢP 2 CỘT (SPLIT-VIEW: CHỌN ĐƠN XEM NGAY CHUYẾN)*/}
        {/* ================================================================= */}
        {activeView === 'SPLIT' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Column (5 Cols): Orders List */}
            <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">DANH SÁCH ĐƠN HÀNG</span>
                <span className="text-[11px] text-slate-500 font-medium">
                  {filteredOrders.length} đơn
                </span>
              </div>

              <div className="divide-y divide-slate-100 max-h-[700px] overflow-y-auto">
                {filteredOrders.map(order => {
                  const isCurrent = currentSelectedOrder?.id === order.id;
                  const orderTrips = trips.filter(
                    t => t.orderId === order.id || t.orderCode === order.code
                  );
                  const percent = Math.min(
                    100,
                    Math.round((order.deliveredVolume / order.totalVolume) * 100)
                  );

                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`p-3.5 hover:bg-slate-50 transition cursor-pointer border-l-4 ${
                        isCurrent
                          ? 'border-l-blue-600 bg-blue-50/30'
                          : 'border-l-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-xs">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[260px]">
                            {order.projectTitle}
                          </div>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                          {order.code}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="mt-2.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-600 font-medium">
                            {order.deliveredVolume} / {order.totalVolume} m³
                          </span>
                          <span className="font-bold text-blue-700">{percent}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              percent >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                        <span>Giờ GH: <strong className="text-slate-700">{order.deliveryTime}</strong></span>
                        <span>{orderTrips.length} chuyến xe</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (7 Cols): Linked Dispatches & Actions for Selected Order */}
            <div className="lg:col-span-7 space-y-4">
              {currentSelectedOrder ? (
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-5">
                  {/* Header of selected order */}
                  <div className="flex flex-wrap items-center justify-between border-b border-slate-100 pb-3 gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {currentSelectedOrder.code}
                        </span>
                        <h2 className="text-base font-bold text-slate-900">
                          {currentSelectedOrder.customerName}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{currentSelectedOrder.projectTitle}</span>
                        <span className="text-slate-300">·</span>
                        <span>{currentSelectedOrder.plantLocation || 'Tây Ninh'}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenAssignForOrder(currentSelectedOrder)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs flex items-center gap-1 shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Cấp Xe Bồn</span>
                      </button>

                      {onOpenPrintModal && (
                        <button
                          type="button"
                          onClick={() => handleOpenPrintForOrder(currentSelectedOrder)}
                          className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg font-semibold text-xs flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>In Phiếu</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Specs & Volume Card */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">Mác Bê Tông</span>
                      <p className="font-mono font-bold text-slate-900 text-sm mt-0.5">
                        {currentSelectedOrder.grade}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">Độ Sụt</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {currentSelectedOrder.slump} cm
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">Loại Bơm</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5 truncate">
                        {currentSelectedOrder.pumpType || 'Xả trực tiếp'}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-400 font-medium">Khối Lượng Đặt</span>
                      <p className="font-mono font-bold text-blue-700 text-sm mt-0.5">
                        {currentSelectedOrder.deliveredVolume} / {currentSelectedOrder.totalVolume} m³
                      </p>
                    </div>
                  </div>

                  {/* Dispatched Trips for this Order */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-bold text-slate-900 text-xs">
                          CÁC CHUYẾN XE BỒN ĐANG THỰC HIỆN
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-500">
                        Đã giao: <strong>{currentSelectedOrder.deliveredVolume} m³</strong> · Còn lại:{' '}
                        <strong>
                          {Math.max(
                            0,
                            currentSelectedOrder.totalVolume - currentSelectedOrder.deliveredVolume
                          )}{' '}
                          m³
                        </strong>
                      </span>
                    </div>

                    {trips.filter(
                      t =>
                        t.orderId === currentSelectedOrder.id ||
                        t.orderCode === currentSelectedOrder.code
                    ).length === 0 ? (
                      <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                        <Truck className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs text-slate-500">
                          Chưa có chuyến xe nào xuất phát cho đơn này.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenAssignForOrder(currentSelectedOrder)}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                        >
                          Cấp xe bồn ngay
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {trips
                          .filter(
                            t =>
                              t.orderId === currentSelectedOrder.id ||
                              t.orderCode === currentSelectedOrder.code
                          )
                          .map((tr, trIdx) => (
                            <div
                              key={tr.id}
                              className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-slate-400 text-[11px] w-5">
                                  #{trIdx + 1}
                                </span>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-slate-900 text-sm">
                                      {tr.truckPlate}
                                    </span>
                                    <span className="font-medium text-slate-700">
                                      {tr.driverName}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                                    <span>Xuất: <strong className="text-slate-700">{tr.departureTime}</strong></span>
                                    <span>·</span>
                                    <span>Phiếu: <strong className="text-slate-700 font-mono">{tr.ticketNumber || '0160190'}</strong></span>
                                    <span>·</span>
                                    <span>Chì: <strong className="text-amber-700 font-mono">{tr.sealNumber || '849201'}</strong></span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="font-mono font-bold text-blue-700 text-sm">
                                    {tr.volume} m³
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    Cộng dồn: {tr.accumulatedVolume || tr.volume} m³
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  {onOpenPrintModal && (
                                    <button
                                      type="button"
                                      onClick={() => onOpenPrintModal(currentSelectedOrder, tr)}
                                      className="p-1.5 rounded bg-orange-50 hover:bg-orange-100 text-orange-700"
                                      title="In phiếu giao nhận"
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
                                    className="p-1.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700"
                                    title="Sửa chi tiết chuyến"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteTripItem(tr, e)}
                                    className="p-1.5 rounded bg-slate-100 hover:bg-red-50 text-slate-400 hover:text-red-600"
                                    title="Xóa chuyến"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-slate-200/80 p-12 text-center text-slate-400 text-xs">
                  Chọn một đơn hàng từ danh sách bên trái để xem liên kết chi tiết và các chuyến xe bồn.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODALS INTEGRATION (Hoàn toàn đồng bộ dữ liệu)                  */}
      {/* ============================================================== */}
      {/* 1. Modal Tạo Đơn hàng mới */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultOrderType={createOrderType}
        onCreated={() => {
          setActiveView('DON_HANG');
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
          currentSelectedOrder
        }
        onOpenPrintModal={onOpenPrintModal}
      />
    </div>
  );
};
