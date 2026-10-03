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
  UserCheck
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

interface DonHangPageProps {
  onOpenPrintModal?: (order: ConcreteOrder, trip?: any) => void;
}

export const DonHangPage: React.FC<DonHangPageProps> = ({ onOpenPrintModal }) => {
  const { orders, trips, trucks, syncNow, syncState } = useSync();
  const { currentUser, isAdmin } = useAuth();

  const isAccountant = currentUser?.role === 'ACCOUNTANT' || isAdmin;

  // View modes
  const [viewMode, setViewMode] = useState<'table' | 'project_delivery'>('table');
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'CHINH' | 'PHAT_SINH'>('ALL');
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

  // Computed metrics
  const runningTrucksCount = trucks.filter(t => t.status === 'DANG_CHAY' || t.status === 'DANG_XA').length;
  const totalVolumeDelivered = orders.reduce((acc, curr) => acc + curr.deliveredVolume, 0);
  const totalVolumeOrdered = orders.reduce((acc, curr) => acc + curr.totalVolume, 0);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch =
        !searchTerm.trim() ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerCode && order.customerCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.technicianName && order.technicianName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        order.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.categoryItem.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDate = !selectedDate || order.deliveryDate === selectedDate;
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;
      const matchOrderType = orderTypeFilter === 'ALL' || (order.orderType || 'CHINH') === orderTypeFilter;
      const matchProjectType = projectTypeFilter === 'ALL' || (order.projectType || 'DA') === projectTypeFilter;

      return matchSearch && matchDate && matchStatus && matchOrderType && matchProjectType;
    });
  }, [orders, searchTerm, selectedDate, statusFilter, orderTypeFilter, projectTypeFilter]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || filteredOrders[0] || orders[0] || null;

  const handleClearFilter = () => {
    setSearchTerm('');
    setSelectedDate('');
    setStatusFilter('ALL');
    setOrderTypeFilter('ALL');
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
    <div className="p-3 sm:p-5 space-y-3.5 max-w-[1700px] mx-auto min-h-screen flex flex-col">
      {/* Project Delivery Screen */}
      {viewMode === 'project_delivery' && selectedOrder ? (
        <ProjectDeliveryView
          order={selectedOrder}
          onBack={() => setViewMode('table')}
          onOpenPrintModal={(ord, trp) => onOpenPrintModal && onOpenPrintModal(ord, trp)}
          onOpenAssignModal={() => setIsAssignOpen(true)}
        />
      ) : (
        <>
          {/* 1. COMPACT TOP HEADER & QUICK METRICS BAR */}
          <div className="bg-white rounded-2xl p-3 sm:px-5 sm:py-3.5 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Left: Title & Inline KPI Chips */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600 animate-pulse"></span>
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Đơn Hàng & Điều Phối Bê Tông
                </h1>
              </div>

              {/* Inline compact KPI tags */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-bold text-slate-700 border border-slate-200">
                  Tổng: <strong>{orders.length}</strong>
                </span>

                <span className="px-2 py-0.5 rounded-lg bg-blue-50 font-bold text-blue-700 border border-blue-200">
                  {orders.filter(o => o.orderType === 'CHINH').length} chính
                </span>

                <span className="px-2 py-0.5 rounded-lg bg-orange-50 font-bold text-orange-700 border border-orange-200">
                  {orders.filter(o => o.orderType === 'PHAT_SINH').length} phát sinh
                </span>

                <span className="px-2 py-0.5 rounded-lg bg-emerald-50 font-bold text-emerald-700 border border-emerald-200 hidden sm:inline-block">
                  {runningTrucksCount} xe đang chạy
                </span>

                <span className="px-2 py-0.5 rounded-lg bg-purple-50 font-bold text-purple-700 border border-purple-200 hidden md:inline-block">
                  {totalVolumeDelivered} / {totalVolumeOrdered} m³ đã cấp
                </span>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Button: + Đơn phát sinh */}
              <button
                onClick={() => handleOpenCreateIncurred()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                title="Tạo đơn hàng phát sinh (Người dùng/Điều phối tạo, sao chép từ đơn chính)"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>+ Đơn phát sinh</span>
              </button>

              {/* Button: + Đơn chính (Kế toán / Admin) */}
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
                  title="In phiếu giao nhận bê tông"
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

          {/* 2. COMPACT SINGLE-ROW FILTER & SEARCH TOOLBAR */}
          <div className="bg-white rounded-2xl px-4 py-2.5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã đơn, khách hàng, công trình, kỹ thuật..."
                className="w-full pl-8 pr-7 py-1.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
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

            {/* Quick Segment Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setOrderTypeFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  orderTypeFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả ({orders.length})
              </button>

              <button
                onClick={() => setOrderTypeFilter('CHINH')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  orderTypeFilter === 'CHINH'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                Đơn chính ({orders.filter(o => o.orderType === 'CHINH').length})
              </button>

              <button
                onClick={() => setOrderTypeFilter('PHAT_SINH')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                  orderTypeFilter === 'PHAT_SINH'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                Phát sinh ({orders.filter(o => o.orderType === 'PHAT_SINH').length})
              </button>

              <div className="h-4 w-[1px] bg-slate-200 mx-0.5 hidden sm:block"></div>

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

            {/* Date filter dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer font-medium"
              >
                <option value="">-- Mọi ngày giao --</option>
                {Array.from(new Set(orders.map(o => o.deliveryDate))).sort().reverse().map(d => (
                  <option key={d} value={d}>
                    Ngày {d.split('-').reverse().join('/')}
                  </option>
                ))}
              </select>

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

              {(searchTerm || selectedDate || statusFilter !== 'ALL' || orderTypeFilter !== 'ALL' || projectTypeFilter !== 'ALL') && (
                <button
                  onClick={handleClearFilter}
                  className="px-2 py-1 text-[11px] font-bold text-slate-500 hover:text-slate-900 transition"
                  title="Xóa toàn bộ bộ lọc"
                >
                  Xóa lọc
                </button>
              )}

              <button
                onClick={() => syncNow()}
                title="Làm mới & Đồng bộ"
                className="p-1 text-slate-400 hover:text-orange-600 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncState.status === 'syncing' ? 'animate-spin text-orange-600' : ''}`} />
              </button>
            </div>
          </div>

          {/* 3. ULTRA-CLEAN, HIGH-DENSITY ORDERS TABLE (SHOWS 15-20+ ORDERS ON 1 SCREEN) */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex-1 flex flex-col">
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100/90 border-b border-slate-200/90 text-slate-600 text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10">
                    <th className="py-2.5 px-3 text-center w-12">STT</th>
                    <th className="py-2.5 px-3 whitespace-nowrap bg-orange-50/60 text-orange-950 border-r border-orange-100">
                      NGÀY GIAO & GIỜ
                    </th>
                    <th className="py-2.5 px-3 whitespace-nowrap">MÃ ĐƠN & LOẠI</th>
                    <th className="py-2.5 px-3">TÊN KHÁCH HÀNG</th>
                    <th className="py-2.5 px-3">CÔNG TRÌNH & CỰ LY</th>
                    <th className="py-2.5 px-3">HẠNG MỤC</th>
                    <th className="py-2.5 px-3">MÁC / SỤT</th>
                    <th className="py-2.5 px-3 text-right">KLĐH</th>
                    <th className="py-2.5 px-3 text-right text-orange-600">ĐÃ CẤP</th>
                    <th className="py-2.5 px-3">GIAO NHẬN (KỸ THUẬT)</th>
                    <th className="py-2.5 px-3 text-center">TRẠNG THÁI</th>
                    <th className="py-2.5 px-3 text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        Không có đơn hàng nào phù hợp với bộ lọc hiện tại. Bấm "Xóa lọc" để xem toàn bộ danh sách.
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

                          {/* 1. NGÀY GIAO & GIỜ (Prominent, click to jump to project delivery) */}
                          <td
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenProjectDelivery(order);
                            }}
                            className="py-2 px-3 whitespace-nowrap bg-orange-50/30 border-r border-orange-100/60"
                            title="Bấm vào ngày để vào mục cấp hàng công trình này"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-orange-700 group-hover:text-orange-600 group-hover:underline">
                              <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span>{order.deliveryDate.split('-').reverse().join('/')}</span>
                            </div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-2.5 h-2.5" />
                              <span>{order.deliveryTime}</span>
                            </div>
                          </td>

                          {/* 2. MÃ ĐƠN & PHÂN LOẠI */}
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {order.code}
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isPhatSinh ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Copy className="w-2 h-2" />
                                  Phát sinh
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                  <Shield className="w-2 h-2" />
                                  Đơn chính
                                </span>
                              )}
                              {order.parentOrderCode && (
                                <span className="text-[9px] font-mono text-slate-400">
                                  ({order.parentOrderCode})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. TÊN KHÁCH HÀNG */}
                          <td className="py-2 px-3 max-w-[200px]">
                            <div className="font-bold text-slate-900 text-xs truncate" title={order.customerName}>
                              {order.customerName}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
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

                          {/* 11. THAO TÁC NHANH */}
                          <td className="py-2 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {/* Cấp hàng */}
                              <button
                                onClick={() => handleOpenProjectDelivery(order)}
                                className="px-2 py-0.5 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] transition cursor-pointer flex items-center gap-0.5"
                                title="Chuyển vào mục cấp hàng công trình này"
                              >
                                <span>Cấp hàng</span>
                                <ChevronRight className="w-3 h-3" />
                              </button>

                              {/* Copy phát sinh */}
                              <button
                                onClick={() => handleOpenCreateIncurred(order)}
                                className="p-1 rounded hover:bg-amber-100 text-amber-700 transition"
                                title="Sao chép từ đơn này để tạo Đơn hàng phát sinh"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* Sửa đơn (Admin/Kế toán) */}
                              {isAccountant && (
                                <button
                                  onClick={() => handleOpenEditOrder(order)}
                                  className="p-1 rounded hover:bg-blue-100 text-blue-700 transition"
                                  title="Chỉnh sửa đơn hàng (Quyền Admin / Kế toán)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* In phiếu */}
                              {onOpenPrintModal && (
                                <button
                                  onClick={() => {
                                    setSelectedOrderId(order.id);
                                    onOpenPrintModal(order);
                                  }}
                                  className="p-1 rounded hover:bg-orange-100 text-orange-600 transition"
                                  title="In phiếu giao nhận"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Cấp xe */}
                              <button
                                onClick={() => {
                                  setSelectedOrderId(order.id);
                                  setIsAssignOpen(true);
                                }}
                                className="p-1 rounded hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
                                title="Cấp xe bồn cho đơn này"
                              >
                                <Plus className="w-3.5 h-3.5" />
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

            {/* Bottom table status counter */}
            <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
              <div>
                Đang hiển thị <strong>{filteredOrders.length}</strong> / {orders.length} đơn hàng bê tông
              </div>
              <div className="flex items-center gap-3">
                <span>Tổng khối lượng đặt: <strong className="text-slate-800 font-bold">{filteredOrders.reduce((s, o) => s + o.totalVolume, 0)} m³</strong></span>
                <span>•</span>
                <span>Đã cấp: <strong className="text-orange-600 font-bold">{filteredOrders.reduce((s, o) => s + o.deliveredVolume, 0)} m³</strong></span>
              </div>
            </div>
          </div>

          {/* 4. COLLAPSIBLE BOTTOM DRAWER FOR DISPATCH & ORDER DETAILS */}
          {selectedOrder && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden transition-all duration-200">
              {/* Collapsible toggle bar */}
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

              {/* Collapsible Content */}
              {isDetailPanelOpen && (
                <div className="p-4 bg-slate-50/60 border-t border-slate-200 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <OrderDetailPanel
                      order={selectedOrder}
                      onOpenDispatchAssign={() => setIsAssignOpen(true)}
                      onPrintOrder={(ord) => onOpenPrintModal && onOpenPrintModal(ord)}
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
