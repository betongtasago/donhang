import React, { useState, useMemo } from 'react';
import {
  FileText,
  Truck,
  Box,
  Zap,
  Search,
  Calendar,
  Filter,
  RefreshCw,
  Plus,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  Building,
  Navigation,
  Shield,
  Layers,
  Sparkles,
  LayoutList,
  Columns,
  X,
  ExternalLink,
  UserCheck,
  Sheet,
  TableProperties,
  ArrowUpDown,
  FileSpreadsheet
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { useAuth } from '../../auth/AuthContext';
import { ConcreteOrder, OrderStatus, OrderType, ProjectType } from '../../types';
import { OrderDetailPanel } from './OrderDetailPanel';
import { DispatchPanel } from './DispatchPanel';
import { CreateOrderModal } from './CreateOrderModal';
import { EditOrderModal } from './EditOrderModal';
import { DispatchAssignModal } from './DispatchAssignModal';
import { ReportExportModal } from './ReportExportModal';
import { ProjectDeliveryView } from './ProjectDeliveryView';
import * as XLSX from 'xlsx';

interface DonHangPageProps {
  onOpenPrintModal?: (order: ConcreteOrder, trip?: any) => void;
}

export type ActiveSheetType = 'SHEET_CHINH' | 'SHEET_PHAT_SINH' | 'SHEET_ALL';

export const DonHangPage: React.FC<DonHangPageProps> = ({ onOpenPrintModal }) => {
  const { orders, trips, trucks, syncNow, syncState } = useSync();
  const { currentUser, isAdmin } = useAuth();

  const isAccountant = currentUser?.role === 'ACCOUNTANT' || isAdmin;

  // 1. SEPARATE SHEET TABS: Đơn hàng chính & phát sinh phân ra làm sheet riêng biệt
  const [activeSheet, setActiveSheet] = useState<ActiveSheetType>('SHEET_CHINH');

  // View modes
  const [viewMode, setViewMode] = useState<'table' | 'project_delivery'>('table');
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // 2. TÌM ĐƠN HÀNG THEO NGÀY THÁNG NĂM (Nâng cao)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterMonth, setFilterMonth] = useState<string>('ALL');
  const [filterDay, setFilterDay] = useState<string>(''); // YYYY-MM-DD
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [quickDatePreset, setQuickDatePreset] = useState<string>('ALL');

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectTypeFilter, setProjectTypeFilter] = useState<'ALL' | 'DA' | 'DD'>('ALL');

  // Selected order
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createOrderType, setCreateOrderType] = useState<OrderType>('CHINH');
  const [copyFromOrder, setCopyFromOrder] = useState<ConcreteOrder | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ConcreteOrder | null>(null);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Available Years and Months from orders
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    orders.forEach(o => {
      if (o.deliveryDate) {
        years.add(o.deliveryDate.split('-')[0]);
      }
    });
    return Array.from(years).sort().reverse();
  }, [orders]);

  const availableMonths = [
    { value: '01', label: 'Tháng 1' },
    { value: '02', label: 'Tháng 2' },
    { value: '03', label: 'Tháng 3' },
    { value: '04', label: 'Tháng 4' },
    { value: '05', label: 'Tháng 5' },
    { value: '06', label: 'Tháng 6' },
    { value: '07', label: 'Tháng 7' },
    { value: '08', label: 'Tháng 8' },
    { value: '09', label: 'Tháng 9' },
    { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' },
    { value: '12', label: 'Tháng 12' },
  ];

  // Quick Date presets
  const handleSelectDatePreset = (preset: string) => {
    setQuickDatePreset(preset);
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

    if (preset === 'TODAY') {
      setFilterDay('2026-10-03'); // Reference day for demo data
      setFilterYear('2026');
      setFilterMonth('10');
      setStartDate('');
      setEndDate('');
    } else if (preset === 'YESTERDAY') {
      setFilterDay('2026-10-02');
      setFilterYear('2026');
      setFilterMonth('10');
      setStartDate('');
      setEndDate('');
    } else if (preset === 'THIS_MONTH') {
      setFilterDay('');
      setFilterYear('2026');
      setFilterMonth('10');
      setStartDate('');
      setEndDate('');
    } else if (preset === 'ALL') {
      setFilterDay('');
      setFilterYear('ALL');
      setFilterMonth('ALL');
      setStartDate('');
      setEndDate('');
    }
  };

  // Filtered orders according to Active Sheet and Date/Search filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // 1. Sheet Separation:
      if (activeSheet === 'SHEET_CHINH' && (order.orderType || 'CHINH') !== 'CHINH') {
        return false;
      }
      if (activeSheet === 'SHEET_PHAT_SINH' && order.orderType !== 'PHAT_SINH') {
        return false;
      }

      // 2. Date Filtering: Ngày / Tháng / Năm
      if (filterDay && order.deliveryDate !== filterDay) {
        return false;
      }

      if (filterYear !== 'ALL') {
        const orderYear = order.deliveryDate ? order.deliveryDate.split('-')[0] : '';
        if (orderYear !== filterYear) return false;
      }

      if (filterMonth !== 'ALL') {
        const orderMonth = order.deliveryDate ? order.deliveryDate.split('-')[1] : '';
        if (orderMonth !== filterMonth) return false;
      }

      if (startDate && order.deliveryDate < startDate) {
        return false;
      }

      if (endDate && order.deliveryDate > endDate) {
        return false;
      }

      // 3. Search Term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const match =
          order.customerName.toLowerCase().includes(term) ||
          order.code.toLowerCase().includes(term) ||
          order.projectTitle.toLowerCase().includes(term) ||
          (order.customerCode && order.customerCode.toLowerCase().includes(term)) ||
          (order.parentOrderCode && order.parentOrderCode.toLowerCase().includes(term)) ||
          (order.technicianName && order.technicianName.toLowerCase().includes(term)) ||
          order.grade.toLowerCase().includes(term) ||
          order.categoryItem.toLowerCase().includes(term);
        if (!match) return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'ALL' && order.status !== statusFilter) {
        return false;
      }

      // 5. Project Type Filter (DA / DD)
      if (projectTypeFilter !== 'ALL' && (order.projectType || 'DA') !== projectTypeFilter) {
        return false;
      }

      return true;
    });
  }, [orders, activeSheet, filterDay, filterYear, filterMonth, startDate, endDate, searchTerm, statusFilter, projectTypeFilter]);

  // Counts for each sheet
  const countChinh = useMemo(() => orders.filter(o => (o.orderType || 'CHINH') === 'CHINH').length, [orders]);
  const countPhatSinh = useMemo(() => orders.filter(o => o.orderType === 'PHAT_SINH').length, [orders]);
  const countAll = orders.length;

  const runningTrucksCount = trucks.filter(t => t.status === 'DANG_CHAY' || t.status === 'DANG_XA').length;
  const selectedOrder = orders.find(o => o.id === selectedOrderId) || filteredOrders[0] || orders[0] || null;

  const handleClearFilter = () => {
    setSearchTerm('');
    setFilterYear('ALL');
    setFilterMonth('ALL');
    setFilterDay('');
    setStartDate('');
    setEndDate('');
    setQuickDatePreset('ALL');
    setStatusFilter('ALL');
    setProjectTypeFilter('ALL');
  };

  const handleOpenCreatePrimary = () => {
    setCreateOrderType('CHINH');
    setCopyFromOrder(null);
    setIsCreateOpen(true);
  };

  const handleOpenCreateIncurred = (parentOrder?: ConcreteOrder) => {
    setCreateOrderType('PHAT_SINH');
    setCopyFromOrder(parentOrder || null);
    setIsCreateOpen(true);
  };

  const handleOpenEditOrder = (order: ConcreteOrder) => {
    setOrderToEdit(order);
    setIsEditOpen(true);
  };

  const handleOpenProjectDelivery = (order: ConcreteOrder) => {
    setSelectedOrderId(order.id);
    setViewMode('project_delivery');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Export to Excel (.xlsx format chuẩn)
  const handleExportCurrentSheet = () => {
    const sheetName =
      activeSheet === 'SHEET_CHINH'
        ? 'Don_Hang_Chinh'
        : activeSheet === 'SHEET_PHAT_SINH'
        ? 'Don_Hang_Phat_Sinh'
        : 'Tat_Ca_Don_Hang';

    const sheetData = [
      [
        'STT',
        'Loại đơn',
        'Mã đơn hàng',
        'Đơn chính gốc',
        'Ngày giao',
        'Giờ giao',
        'Mã khách hàng',
        'Tên khách hàng',
        'Tên công trình',
        'Loại C.Trình (DA/DD)',
        'Cự ly (km)',
        'Hạng mục',
        'Mã mác bê tông',
        'Độ sụt',
        'Phụ gia',
        'Loại bơm',
        'KL Đặt (m3)',
        'Đã cấp (m3)',
        'Kỹ thuật giao nhận',
        'Trạng thái',
        'Ghi chú'
      ],
      ...filteredOrders.map((o, idx) => [
        idx + 1,
        o.orderType === 'PHAT_SINH' ? 'PHÁT SINH' : 'ĐƠN CHÍNH',
        o.code,
        o.parentOrderCode || '',
        o.deliveryDate,
        o.deliveryTime,
        o.customerCode || '',
        o.customerName,
        o.projectTitle,
        o.projectType || 'DA',
        o.distanceKm || 15,
        o.categoryItem,
        o.grade,
        o.slump,
        o.additive || 'Không',
        o.pumpType || 'Bơm cần',
        o.totalVolume,
        o.deliveredVolume,
        o.technicianName || 'Nguyễn Văn Nam',
        o.status,
        o.notes || ''
      ])
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);

    // Căn độ rộng cột tối ưu
    ws['!cols'] = [
      { wch: 6 },
      { wch: 14 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 10 },
      { wch: 14 },
      { wch: 38 },
      { wch: 42 },
      { wch: 10 },
      { wch: 10 },
      { wch: 20 },
      { wch: 14 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 20 },
      { wch: 14 },
      { wch: 30 }
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'DonHang');
    XLSX.writeFile(wb, `TSG_${sheetName}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DA_DUYET':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã duyệt
          </span>
        );
      case 'DANG_CHAY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Đang chạy
          </span>
        );
      case 'CHO_DUYET':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Chờ duyệt
          </span>
        );
      case 'HOAN_THANH':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Hoàn thành
          </span>
        );
      case 'TAM_HOAN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Tạm hoãn
          </span>
        );
    }
  };

  return (
    <div className="p-3 sm:p-5 space-y-3 max-w-[1750px] mx-auto min-h-screen flex flex-col">
      {/* Project Delivery Screen */}
      {viewMode === 'project_delivery' && selectedOrder ? (
        <ProjectDeliveryView
          order={selectedOrder}
          onBack={() => setViewMode('table')}
          onOpenPrintModal={(ord, trp) => onOpenPrintModal && onOpenPrintModal(ord, trp)}
          onOpenAssignModal={() => setIsAssignOpen(true)}
          onOpenEditOrder={handleOpenEditOrder}
          onOpenCopyOrder={handleOpenCreateIncurred}
        />
      ) : (
        <>
          {/* 1. TOP TITLE & ACTIONS BAR */}
          <div className="bg-white rounded-2xl p-3 sm:px-5 sm:py-3 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left: Title & Quick inline status */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse"></span>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Quản Lý Đơn Hàng & Điều Phối Bê Tông
                </h1>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                  {runningTrucksCount} xe đang chạy
                </span>
                <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 font-bold border border-purple-200">
                  {orders.reduce((acc, curr) => acc + curr.deliveredVolume, 0)} / {orders.reduce((acc, curr) => acc + curr.totalVolume, 0)} m³ đã cấp
                </span>
              </div>
            </div>

            {/* Right: Quick Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* + Đơn phát sinh */}
              <button
                onClick={() => handleOpenCreateIncurred()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                title="Tạo đơn hàng phát sinh (Sao chép từ đơn chính)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>+ Đơn phát sinh</span>
              </button>

              {/* + Đơn chính (Kế toán / Admin) */}
              {isAccountant ? (
                <button
                  onClick={handleOpenCreatePrimary}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  title="Tạo đơn hàng chính (Quyền Kế toán / Admin)"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>+ Đơn chính</span>
                </button>
              ) : (
                <span className="text-[10px] text-slate-400 font-semibold px-2 py-1 bg-slate-50 rounded-lg border border-slate-200">
                  Đơn chính: Kế toán
                </span>
              )}

              {/* In phiếu nhanh */}
              {selectedOrder && onOpenPrintModal && (
                <button
                  onClick={() => onOpenPrintModal(selectedOrder)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-600 hover:text-orange-600 border border-slate-200 transition cursor-pointer"
                  title="In phiếu giao nhận bê tông (kết nối máy in thật)"
                >
                  <Printer className="w-4 h-4" />
                </button>
              )}

              {/* Toggle Dispatch Details Drawer */}
              <button
                onClick={() => setIsDetailPanelOpen(!isDetailPanelOpen)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  isDetailPanelOpen
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-200'
                }`}
                title="Bật/Tắt bảng chi tiết điều phối xe bên dưới"
              >
                <Truck className="w-3.5 h-3.5 text-orange-500" />
                <span className="hidden sm:inline">Điều phối xe</span>
                {isDetailPanelOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* 2. EXCEL-LIKE SEPARATE SHEET TABS: PHÂN SHEET ĐƠN CHÍNH & PHÁT SINH */}
          <div className="bg-slate-200/90 p-1.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 border border-slate-300 shadow-inner">
            <div className="flex items-center gap-1.5">
              {/* ĐƠN HÀNG CHÍNH */}
              <button
                onClick={() => setActiveSheet('SHEET_CHINH')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeSheet === 'SHEET_CHINH'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white/80 hover:bg-white text-slate-700 hover:text-blue-700'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>ĐƠN HÀNG CHÍNH (Kế toán)</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                  activeSheet === 'SHEET_CHINH' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {countChinh} đơn
                </span>
              </button>

              {/* ĐƠN HÀNG PHÁT SINH */}
              <button
                onClick={() => setActiveSheet('SHEET_PHAT_SINH')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  activeSheet === 'SHEET_PHAT_SINH'
                    ? 'bg-orange-500 text-white shadow-md'
                    : 'bg-white/80 hover:bg-white text-slate-700 hover:text-orange-600'
                }`}
              >
                <Sheet className="w-4 h-4" />
                <span>ĐƠN HÀNG PHÁT SINH (Điều phối)</span>
                <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                  activeSheet === 'SHEET_PHAT_SINH' ? 'bg-orange-700 text-white' : 'bg-orange-100 text-orange-800'
                }`}>
                  {countPhatSinh} đơn
                </span>
              </button>

              {/* TỔNG HỢP TOÀN BỘ */}
              <button
                onClick={() => setActiveSheet('SHEET_ALL')}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeSheet === 'SHEET_ALL'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'bg-white/80 hover:bg-white text-slate-700'
                }`}
              >
                <TableProperties className="w-4 h-4" />
                <span>TOÀN BỘ ĐƠN HÀNG ({countAll})</span>
              </button>
            </div>

            {/* Export Current Table to Excel (.xlsx) */}
            <button
              onClick={handleExportCurrentSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              title="Xuất bảng số liệu ra file Excel (.xlsx) chuẩn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
          </div>

          {/* 3. TÌM ĐƠN HÀNG THEO NGÀY THÁNG NĂM & CÔNG CỤ LỌC NÂNG CAO */}
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs space-y-2.5 text-xs">
            {/* Row 1: Search Text & Date Filters (Ngày / Tháng / Năm) */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search text */}
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm mã đơn, khách hàng, công trình, kỹ thuật..."
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Lọc theo Năm */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Năm:</span>
                <select
                  value={filterYear}
                  onChange={(e) => {
                    setFilterYear(e.target.value);
                    setQuickDatePreset('CUSTOM');
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Mọi năm</option>
                  {availableYears.map(yr => (
                    <option key={yr} value={yr}>Năm {yr}</option>
                  ))}
                </select>
              </div>

              {/* Lọc theo Tháng */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-bold">Tháng:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => {
                    setFilterMonth(e.target.value);
                    setQuickDatePreset('CUSTOM');
                  }}
                  className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Mọi tháng</option>
                  {availableMonths.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Lọc theo Ngày cụ thể (Date Picker) */}
              <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                <Calendar className="w-3.5 h-3.5 text-orange-600" />
                <span className="text-[11px] text-slate-500 font-bold">Ngày:</span>
                <input
                  type="date"
                  value={filterDay}
                  onChange={(e) => {
                    setFilterDay(e.target.value);
                    setQuickDatePreset('CUSTOM');
                  }}
                  className="bg-transparent text-xs font-mono font-bold text-slate-800 focus:outline-none cursor-pointer"
                />
                {filterDay && (
                  <button onClick={() => setFilterDay('')} className="text-slate-400 hover:text-slate-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Lọc theo Trạng thái */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer font-medium"
              >
                <option value="ALL">Mọi trạng thái</option>
                <option value="DA_DUYET">Đã duyệt</option>
                <option value="DANG_CHAY">Đang chạy</option>
                <option value="CHO_DUYET">Chờ duyệt</option>
                <option value="HOAN_THANH">Hoàn thành</option>
                <option value="TAM_HOAN">Tạm hoãn</option>
              </select>

              {/* Lọc theo Loại C.Trình (DA/DD) */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setProjectTypeFilter(projectTypeFilter === 'DA' ? 'ALL' : 'DA')}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    projectTypeFilter === 'DA'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  Dự án (DA)
                </button>

                <button
                  onClick={() => setProjectTypeFilter(projectTypeFilter === 'DD' ? 'ALL' : 'DD')}
                  className={`px-2 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    projectTypeFilter === 'DD'
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                  }`}
                >
                  Dân dụng (DD)
                </button>
              </div>

              {/* Refresh & Clear */}
              <button
                onClick={handleClearFilter}
                className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition"
                title="Xóa bộ lọc ngày tháng"
              >
                Xóa lọc
              </button>

              <button
                onClick={() => syncNow()}
                title="Đồng bộ ngay"
                className="p-1 text-slate-400 hover:text-orange-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncState.status === 'syncing' ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>

            {/* Row 2: Nút Lọc Thời Gian Nhanh (Hôm nay, Hôm qua, Tháng này, Toàn thời gian) */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Lọc nhanh:
              </span>

              <button
                onClick={() => handleSelectDatePreset('TODAY')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  quickDatePreset === 'TODAY'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hôm nay (03/10/2026)
              </button>

              <button
                onClick={() => handleSelectDatePreset('YESTERDAY')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  quickDatePreset === 'YESTERDAY'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Hôm qua (02/10/2026)
              </button>

              <button
                onClick={() => handleSelectDatePreset('THIS_MONTH')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  quickDatePreset === 'THIS_MONTH'
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tháng này (10/2026)
              </button>

              <button
                onClick={() => handleSelectDatePreset('ALL')}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  quickDatePreset === 'ALL'
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Toàn bộ thời gian
              </button>

              {/* Date Range Inputs */}
              <div className="flex items-center gap-1 ml-auto text-[11px] text-slate-500">
                <span>Từ:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-1.5 py-0.5 border border-slate-200 rounded font-mono text-[10px]"
                />
                <span>Đến:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-1.5 py-0.5 border border-slate-200 rounded font-mono text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* 4. HIGH-DENSITY SHEET TABLE */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex-1 flex flex-col">
            {/* Sheet Banner Indicator */}
            <div className={`px-4 py-1.5 text-xs font-bold flex items-center justify-between border-b ${
              activeSheet === 'SHEET_CHINH'
                ? 'bg-blue-50/70 text-blue-900 border-blue-200'
                : activeSheet === 'SHEET_PHAT_SINH'
                ? 'bg-amber-50/70 text-amber-900 border-amber-200'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                {activeSheet === 'SHEET_CHINH' ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-blue-600" />
                    <span>DANH SÁCH ĐƠN HÀNG CHÍNH (Hợp đồng kế toán khởi tạo)</span>
                  </>
                ) : activeSheet === 'SHEET_PHAT_SINH' ? (
                  <>
                    <Copy className="w-3.5 h-3.5 text-orange-600" />
                    <span>DANH SÁCH ĐƠN HÀNG PHÁT SINH (Đơn đổ bù, vét móng sao chép từ đơn chính)</span>
                  </>
                ) : (
                  <>
                    <TableProperties className="w-3.5 h-3.5 text-slate-600" />
                    <span>BẢNG TỔNG HỢP TOÀN BỘ ĐƠN HÀNG</span>
                  </>
                )}
              </div>

              <div className="text-[11px] font-normal">
                Khối lượng: <strong className="font-bold">{filteredOrders.reduce((s, o) => s + o.totalVolume, 0)} m³</strong>
                <span className="mx-2">•</span>
                Đã cấp: <strong className="text-orange-600 font-bold">{filteredOrders.reduce((s, o) => s + o.deliveredVolume, 0)} m³</strong>
              </div>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200/90 text-slate-600 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-2 px-3 text-center w-10">STT</th>
                    <th className="py-2 px-3 whitespace-nowrap bg-orange-50/60 text-orange-950 border-r border-orange-100">
                      NGÀY & GIỜ GIAO
                    </th>
                    <th className="py-2 px-3 whitespace-nowrap">
                      {activeSheet === 'SHEET_PHAT_SINH' ? 'MÃ ĐƠN & GỐC' : 'MÃ ĐƠN HÀNG'}
                    </th>
                    <th className="py-2 px-3 min-w-[280px] max-w-[420px]">TÊN KHÁCH HÀNG</th>
                    <th className="py-2 px-3">CÔNG TRÌNH & CỰ LY</th>
                    <th className="py-2 px-3">HẠNG MỤC</th>
                    <th className="py-2 px-3">MÁC / SỤT</th>
                    <th className="py-2 px-3 text-right">KLĐH</th>
                    <th className="py-2 px-3 text-right text-orange-600">ĐÃ CẤP</th>
                    <th className="py-2 px-3">GIAO NHẬN (KỸ THUẬT)</th>
                    <th className="py-2 px-3 text-center">TRẠNG THÁI</th>
                    <th className="py-2 px-3 text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        Không có đơn hàng nào trong sheet này phù hợp với bộ lọc ngày tháng.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order, idx) => {
                      const isSelected = order.id === selectedOrderId;
                      const isPhatSinh = order.orderType === 'PHAT_SINH';
                      const percent = order.totalVolume > 0
                        ? Math.min(100, Math.round((order.deliveredVolume / order.totalVolume) * 100))
                        : 0;

                      return (
                        <tr
                          key={order.id}
                          onClick={() => setSelectedOrderId(order.id)}
                          className={`transition-colors cursor-pointer group text-xs ${
                            isSelected
                              ? 'bg-amber-50/50 border-l-4 border-l-[#e25822]'
                              : 'hover:bg-slate-50/90 border-l-4 border-l-transparent'
                          }`}
                        >
                          {/* STT */}
                          <td className="py-2 px-3 text-center font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>

                          {/* 1. NGÀY & GIỜ GIAO */}
                          <td
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProjectDelivery(order);
                            }}
                            className="py-2 px-3 whitespace-nowrap bg-orange-50/30 border-r border-orange-100/60"
                            title="Bấm vào để vào trang điều phối cấp hàng công trình này"
                          >
                            <div className="flex items-center gap-1 font-bold text-orange-700 group-hover:text-orange-600 group-hover:underline">
                              <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span>{order.deliveryDate.split('-').reverse().join('/')}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{order.deliveryTime}</span>
                            </div>
                          </td>

                          {/* 2. MÃ ĐƠN HÀNG */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {order.code}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isPhatSinh ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Copy className="w-2 h-2" />
                                  Phát sinh {order.parentOrderCode ? `(Gốc: ${order.parentOrderCode})` : ''}
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                  <Shield className="w-2 h-2" />
                                  Đơn chính
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. TÊN KHÁCH HÀNG (Mở rộng diện tích hiển thị đầy đủ tên công ty) */}
                          <td className="py-2 px-3 min-w-[280px] max-w-[420px]">
                            <div className="font-bold text-slate-900 text-xs leading-snug break-words uppercase" title={order.customerName}>
                              {order.customerName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Mã: {order.customerCode || '---'}
                            </div>
                          </td>

                          {/* 4. CÔNG TRÌNH & CỰ LY */}
                          <td
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProjectDelivery(order);
                            }}
                            className="py-2 px-3 max-w-[220px]"
                            title="Bấm để mở mục cấp hàng công trình này"
                          >
                            <div className="font-bold text-slate-900 truncate group-hover:text-orange-600 group-hover:underline flex items-center gap-1">
                              <span className="truncate">{order.projectTitle}</span>
                              <ExternalLink className="w-2.5 h-2.5 text-orange-500 opacity-0 group-hover:opacity-100 shrink-0" />
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              <span className={`px-1 rounded text-[9px] font-bold ${
                                order.projectType === 'DD'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {order.projectType === 'DD' ? 'DD' : 'DA'}
                              </span>
                              <span className="font-semibold text-slate-700 flex items-center gap-0.5">
                                <Navigation className="w-2.5 h-2.5 text-orange-600" />
                                {order.distanceKm || 15} km
                              </span>
                            </div>
                          </td>

                          {/* 5. HẠNG MỤC */}
                          <td className="py-2 px-3 text-slate-700 font-medium whitespace-nowrap">
                            {order.categoryItem}
                          </td>

                          {/* 6. MÁC / SỤT */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span className="font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                              {order.grade}
                            </span>
                            <span className="text-[10px] text-slate-400 ml-1">({order.slump})</span>
                          </td>

                          {/* 7. KLĐH */}
                          <td className="py-2 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                            {order.totalVolume} <span className="text-[10px] font-normal text-slate-400">m³</span>
                          </td>

                          {/* 8. ĐÃ CẤP */}
                          <td className="py-2 px-3 text-right whitespace-nowrap">
                            <span className="font-black text-orange-600">{order.deliveredVolume}</span>
                            <span className="text-[10px] font-bold text-slate-400 ml-1">({percent}%)</span>
                            <div className="w-16 bg-slate-200 h-1 rounded-full ml-auto mt-0.5 overflow-hidden">
                              <div
                                className="bg-orange-600 h-full rounded-full"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>

                          {/* 9. GIAO NHẬN (KỸ THUẬT) */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1 text-slate-700 font-semibold text-[11px]">
                              <UserCheck className="w-3 h-3 text-emerald-600" />
                              <span>{order.technicianName || 'Nguyễn Văn Nam'}</span>
                            </div>
                          </td>

                          {/* 10. TRẠNG THÁI */}
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>

                          {/* 11. THAO TÁC NHANH (Thu gọn tinh tế, hiển thị vừa vặn trong 1 trang màn hình) */}
                          <td className="py-1.5 px-2 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {/* Nút Cấp hàng (Action chính) */}
                              <button
                                onClick={() => handleOpenProjectDelivery(order)}
                                className="px-2 py-1 rounded-lg bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-0.5 shadow-xs active:scale-95"
                                title="Chuyển vào trang cấp hàng công trình này"
                              >
                                <span>Cấp hàng</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>

                              {/* Nút Sửa đơn hàng (Icon gọn gàng) */}
                              <button
                                onClick={() => handleOpenEditOrder(order)}
                                className="p-1 rounded-lg border border-blue-200 text-blue-600 bg-blue-50/80 hover:bg-blue-100 transition cursor-pointer"
                                title="Sửa thông tin cấp hàng (Mác, sụt, ngày giờ, KL, kỹ thuật...)"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Nút Tạo bản sao (Icon gọn gàng cho đơn chính) */}
                              {((order.orderType || 'CHINH') === 'CHINH') && (
                                <button
                                  onClick={() => handleOpenCreateIncurred(order)}
                                  className="p-1 rounded-lg border border-amber-200 text-amber-700 bg-amber-50/80 hover:bg-amber-100 transition cursor-pointer"
                                  title="Tạo bản sao từ đơn chính này sang Đơn hàng phát sinh"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Nút In phiếu (Icon gọn gàng) */}
                              {onOpenPrintModal && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderId(order.id);
                                    onOpenPrintModal(order);
                                  }}
                                  className="p-1 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                                  title="In phiếu giao nhận ra máy in (Mẫu chuẩn TSGTNT)"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Sheet Status */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between text-[11px] text-slate-500">
              <div>
                Đang xem <strong>{filteredOrders.length}</strong> đơn trong {
                  activeSheet === 'SHEET_CHINH'
                    ? 'Sheet 1 (Đơn chính)'
                    : activeSheet === 'SHEET_PHAT_SINH'
                    ? 'Sheet 2 (Đơn phát sinh)'
                    : 'Toàn bộ đơn hàng'
                }
              </div>
              <div className="flex items-center gap-3">
                <span>Tổng KL đặt: <strong className="text-slate-800 font-bold">{filteredOrders.reduce((s, o) => s + o.totalVolume, 0)} m³</strong></span>
                <span>•</span>
                <span>Đã cấp: <strong className="text-orange-600 font-bold">{filteredOrders.reduce((s, o) => s + o.deliveredVolume, 0)} m³</strong></span>
              </div>
            </div>
          </div>

          {/* 5. COLLAPSIBLE BOTTOM DRAWER FOR DISPATCH & ORDER DETAILS */}
          {selectedOrder && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200">
              <div
                onClick={() => setIsDetailPanelOpen(!isDetailPanelOpen)}
                className="p-3 bg-slate-900 text-white flex items-center justify-between cursor-pointer hover:bg-slate-800 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-[#e25822] flex items-center justify-center text-xs font-black">
                    <Truck className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="text-xs">
                    <span className="font-bold text-orange-400 font-mono">{selectedOrder.code}</span>
                    <span className="mx-2 text-slate-500">|</span>
                    <span className="font-bold text-slate-100">{selectedOrder.customerName}</span>
                    <span className="text-slate-400"> - {selectedOrder.projectTitle}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                    {trips.filter(t => t.orderId === selectedOrder.id || t.orderCode === selectedOrder.code).length} chuyến xe
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-300 font-bold">
                  <span>{isDetailPanelOpen ? 'Thu gọn bảng điều phối xe' : 'Mở rộng chi tiết & điều phối xe'}</span>
                  {isDetailPanelOpen ? <ChevronDown className="w-4 h-4 text-orange-400" /> : <ChevronUp className="w-4 h-4 text-orange-400" />}
                </div>
              </div>

              {isDetailPanelOpen && (
                <div className="p-4 bg-slate-50/60 border-t border-slate-200 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <OrderDetailPanel
                      order={selectedOrder}
                      onOpenDispatchAssign={() => setIsAssignOpen(true)}
                      onPrintOrder={(ord) => onOpenPrintModal && onOpenPrintModal(ord)}
                      onOpenEditOrder={handleOpenEditOrder}
                      onOpenCopyOrder={handleOpenCreateIncurred}
                    />

                    <DispatchPanel
                      order={selectedOrder}
                      onOpenDispatchAssign={() => setIsAssignOpen(true)}
                      onPrintTrip={(trip) => selectedOrder && onOpenPrintModal && onOpenPrintModal(selectedOrder, trip)}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        defaultOrderType={createOrderType}
        defaultCopyFromOrder={copyFromOrder}
        onCreated={(newOrder) => {
          if (newOrder.orderType === 'PHAT_SINH') {
            setActiveSheet('SHEET_PHAT_SINH');
            setSelectedOrderId(newOrder.id);
          }
        }}
      />

      <EditOrderModal
        isOpen={isEditOpen}
        order={orderToEdit}
        onClose={() => setIsEditOpen(false)}
      />

      {selectedOrder && (
        <DispatchAssignModal
          order={selectedOrder}
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
        />
      )}
      <ReportExportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </div>
  );
};
