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
  MoreVertical,
  Check,
  Printer,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Copy,
  Edit2,
  Building,
  Navigation,
  Shield,
  Layers,
  Sparkles
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

  // View mode: 'table' or 'project_delivery'
  const [viewMode, setViewMode] = useState<'table' | 'project_delivery'>('table');

  // Search & filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-10-03');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<'ALL' | 'CHINH' | 'PHAT_SINH'>('ALL');
  const [projectTypeFilter, setProjectTypeFilter] = useState<'ALL' | 'DA' | 'DD'>('ALL');

  // Selected order for detailed view
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createOrderType, setCreateOrderType] = useState<OrderType>('CHINH');
  const [copyFromOrder, setCopyFromOrder] = useState<ConcreteOrder | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ConcreteOrder | null>(null);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Active trucks count
  const runningTrucksCount = trucks.filter(t => t.status === 'DANG_CHAY' || t.status === 'DANG_XA').length;
  const totalVolumeDelivered = orders.reduce((acc, curr) => acc + curr.deliveredVolume, 0);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const matchSearch =
        !searchTerm.trim() ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerCode && order.customerCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (order.technicianName && order.technicianName.toLowerCase().includes(searchTerm.toLowerCase()));

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

  // Open Create Modal for Primary Order
  const handleOpenCreatePrimary = () => {
    setCreateOrderType('CHINH');
    setCopyFromOrder(null);
    setIsCreateOpen(true);
  };

  // Open Create Modal for Incurred Order (optionally with copy parent)
  const handleOpenCreateIncurred = (parentOrder?: ConcreteOrder) => {
    setCreateOrderType('PHAT_SINH');
    setCopyFromOrder(parentOrder || null);
    setIsCreateOpen(true);
  };

  // Open Edit Order Modal
  const handleOpenEditOrder = (order: ConcreteOrder) => {
    setOrderToEdit(order);
    setIsEditOpen(true);
  };

  // Click on date or project title jumps to project delivery view
  const handleOpenProjectDelivery = (order: ConcreteOrder) => {
    setSelectedOrderId(order.id);
    setViewMode('project_delivery');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DA_DUYET':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Đã duyệt
          </span>
        );
      case 'DANG_CHAY':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
            Đang chạy
          </span>
        );
      case 'CHO_DUYET':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Chờ duyệt
          </span>
        );
      case 'HOAN_THANH':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Hoàn thành
          </span>
        );
      case 'TAM_HOAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Tạm hoãn
          </span>
        );
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* If in Project Delivery View mode, show dedicated Project Delivery & Dispatch Screen */}
      {viewMode === 'project_delivery' && selectedOrder ? (
        <ProjectDeliveryView
          order={selectedOrder}
          onBack={() => setViewMode('table')}
          onOpenPrintModal={(ord, trp) => onOpenPrintModal && onOpenPrintModal(ord, trp)}
          onOpenAssignModal={() => setIsAssignOpen(true)}
        />
      ) : (
        <>
          {/* Top Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 tracking-wider uppercase mb-1">
                <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
                CONTROL ROOM
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Đơn hàng <span className="text-slate-300 font-light">/</span> Điều phối
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Phân loại đơn chính (Kế toán/Admin) & đơn phát sinh (sao chép nhanh), quản lý cự ly km và điều phối.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {selectedOrder && onOpenPrintModal && (
                <button
                  onClick={() => onOpenPrintModal(selectedOrder)}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-orange-700 shadow-xs transition cursor-pointer"
                  title="In phiếu giao nhận bê tông giống Hình 2"
                >
                  <Printer className="w-4 h-4 text-orange-600" />
                  <span>In phiếu (Hình 2)</span>
                </button>
              )}

              {/* Button: + Tạo đơn phát sinh (Tài khoản người dùng tạo & copy từ đơn chính) */}
              <button
                onClick={() => handleOpenCreateIncurred()}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                title="Tạo đơn hàng phát sinh (Người dùng có thể sao chép nhanh từ đơn chính)"
              >
                <Copy className="w-4 h-4" />
                <span>+ Đơn phát sinh</span>
              </button>

              {/* Button: + Tạo đơn hàng chính (Chỉ Kế toán hoặc Admin tạo) */}
              {isAccountant ? (
                <button
                  onClick={handleOpenCreatePrimary}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-900/20 transition cursor-pointer"
                  title="Tạo đơn hàng chính (Quyền Kế toán / Admin)"
                >
                  <Shield className="w-4 h-4" />
                  <span>+ Tạo đơn chính</span>
                </button>
              ) : (
                <div
                  className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-[11px] text-slate-500 font-semibold"
                  title="Đơn hàng chính do tài khoản Kế toán hoặc Admin tạo"
                >
                  Đơn chính: <em>Kế toán tạo</em>
                </div>
              )}
            </div>
          </div>

          {/* 4 KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ĐƠN HÀNG HÔM NAY
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">{orders.length}</span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {orders.filter(o => o.orderType === 'CHINH').length} chính • {orders.filter(o => o.orderType === 'PHAT_SINH').length} phát sinh
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Truck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  ĐANG ĐIỀU PHỐI
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">{trips.length}</span>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {String(runningTrucksCount).padStart(2, '0')} xe đang chạy
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <Box className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  LƯỢNG XUẤT (CỘNG DỒN)
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-2xl font-black text-slate-900">
                    {totalVolumeDelivered} <span className="text-sm font-semibold text-slate-600">m³</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    76% kế hoạch
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                  <Building className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  CƠ CẤU CÔNG TRÌNH
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-black text-slate-900">
                    {orders.filter(o => (o.projectType || 'DA') === 'DA').length} DA <span className="text-xs font-normal text-slate-400">/</span> {orders.filter(o => o.projectType === 'DD').length} DD
                  </span>
                  <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                    Dự án / Dân dụng
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Filter and Search Section */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                  DANH SÁCH ĐƠN HÀNG
                </div>
                <h2 className="text-base font-bold text-slate-900 mt-0.5">
                  Tra cứu và lọc đơn hàng chính / phát sinh / dự án / dân dụng
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                  {filteredOrders.length} kết quả
                </span>
                <button
                  onClick={() => syncNow()}
                  title="Đồng bộ & Làm mới"
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${syncState.status === 'syncing' ? 'animate-spin text-orange-600' : ''}`} />
                </button>
              </div>
            </div>

            {/* Quick Segment Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              <span className="text-xs font-semibold text-slate-500 mr-1">Bộ lọc nhanh:</span>

              <button
                onClick={() => setOrderTypeFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  orderTypeFilter === 'ALL'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả đơn ({orders.length})
              </button>

              <button
                onClick={() => setOrderTypeFilter('CHINH')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  orderTypeFilter === 'CHINH'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Đơn chính ({orders.filter(o => o.orderType === 'CHINH').length})</span>
              </button>

              <button
                onClick={() => setOrderTypeFilter('PHAT_SINH')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  orderTypeFilter === 'PHAT_SINH'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Đơn phát sinh ({orders.filter(o => o.orderType === 'PHAT_SINH').length})</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 mx-1 hidden sm:block"></div>

              <button
                onClick={() => setProjectTypeFilter(projectTypeFilter === 'DA' ? 'ALL' : 'DA')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  projectTypeFilter === 'DA'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                Dự án (DA)
              </button>

              <button
                onClick={() => setProjectTypeFilter(projectTypeFilter === 'DD' ? 'ALL' : 'DD')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  projectTypeFilter === 'DD'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                Dân dụng (DD)
              </button>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div className="space-y-1.5 lg:col-span-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  TÊN KHÁCH HÀNG / CÔNG TRÌNH / KỸ THUẬT
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm theo tên công ty, công trình, mã..."
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  NGÀY GIAO
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    placeholder="03/10/2026 hoặc để trống"
                    className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  TRẠNG THÁI
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="DA_DUYET">Đã duyệt</option>
                  <option value="DANG_CHAY">Đang chạy</option>
                  <option value="CHO_DUYET">Chờ duyệt</option>
                  <option value="HOAN_THANH">Hoàn thành</option>
                  <option value="TAM_HOAN">Tạm hoãn</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearFilter}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-300 rounded-xl transition"
                >
                  Xóa lọc
                </button>
              </div>
            </div>

            {/* Table of Orders: First column is NGÀY GIAO */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                    {/* First column on the left is NGÀY GIAO */}
                    <th className="py-3 px-4 bg-orange-50/60 text-orange-950 border-r border-orange-100">
                      NGÀY GIAO
                    </th>
                    <th className="py-3 px-4">MÃ ĐƠN & PHÂN LOẠI</th>
                    <th className="py-3 px-4">TÊN KHÁCH HÀNG</th>
                    <th className="py-3 px-4">CÔNG TRÌNH & CỰ LY</th>
                    <th className="py-3 px-4">HẠNG MỤC</th>
                    <th className="py-3 px-4">KLĐH (m³)</th>
                    <th className="py-3 px-4 text-orange-600">ĐÃ CẤP (CỘNG DỒN)</th>
                    <th className="py-3 px-4">TRẠNG THÁI</th>
                    <th className="py-3 px-4 text-center">THAO TÁC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại. Bấm "Xóa lọc" để xem tất cả.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const isSelected = order.id === selectedOrderId;
                      const isPhatSinh = order.orderType === 'PHAT_SINH';
                      const percent = order.totalVolume > 0
                        ? Math.min(100, Math.round((order.deliveredVolume / order.totalVolume) * 100))
                        : 0;

                      return (
                        <tr
                          key={order.id}
                          className={`transition-colors duration-150 ${
                            isSelected
                              ? 'bg-amber-50/40 border-l-4 border-l-[#e25822]'
                              : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                          }`}
                        >
                          {/* 1. First column: NGÀY GIAO */}
                          <td
                            onClick={() => handleOpenProjectDelivery(order)}
                            className="py-3 px-4 whitespace-nowrap bg-orange-50/30 border-r border-orange-100/70 cursor-pointer group"
                            title="Bấm vào ngày để mở mục cấp hàng của công trình này"
                          >
                            <div className="flex items-center gap-1.5 font-bold text-orange-700 group-hover:text-orange-600 group-hover:underline">
                              <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                              <span>{order.deliveryDate.split('-').reverse().join('/')}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              <span>{order.deliveryTime}</span>
                            </div>
                          </td>

                          {/* 2. Mã đơn & Phân loại (Chính vs Phát sinh) */}
                          <td
                            onClick={() => setSelectedOrderId(order.id)}
                            className="py-3 px-4 whitespace-nowrap cursor-pointer"
                          >
                            <div className="font-mono font-bold text-slate-900 text-xs">
                              {order.code}
                            </div>
                            <div className="mt-1 flex items-center gap-1">
                              {isPhatSinh ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                  <Copy className="w-2.5 h-2.5" />
                                  Phát sinh
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                                  <Shield className="w-2.5 h-2.5" />
                                  Đơn chính
                                </span>
                              )}

                              {order.parentOrderCode && (
                                <span className="text-[10px] font-mono text-slate-400" title={`Copy từ đơn chính ${order.parentOrderCode}`}>
                                  ({order.parentOrderCode})
                                </span>
                              )}
                            </div>
                          </td>

                          {/* 3. Tên khách hàng */}
                          <td
                            onClick={() => setSelectedOrderId(order.id)}
                            className="py-3 px-4 cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="w-6 h-6 rounded bg-orange-100 text-[#e25822] text-[10px] font-black flex items-center justify-center shrink-0">
                                CÔ
                              </span>
                              <div>
                                <div className="font-bold text-slate-900 uppercase tracking-tight text-xs">
                                  {order.customerName}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  Mã: {order.customerCode || '---'} • Kỹ thuật: <strong>{order.technicianName || 'Nguyễn Văn Nam'}</strong>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* 4. Công trình & Cự ly */}
                          <td
                            onClick={() => handleOpenProjectDelivery(order)}
                            className="py-3 px-4 cursor-pointer max-w-[220px] group"
                            title="Bấm vào tên công trình để mở mục cấp hàng của công trình này"
                          >
                            <div className="font-bold text-slate-900 group-hover:text-orange-600 group-hover:underline flex items-center gap-1 truncate">
                              <span className="truncate">{order.projectTitle}</span>
                              <ExternalLink className="w-3 h-3 text-orange-500 shrink-0 opacity-0 group-hover:opacity-100 transition" />
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                              {order.projectType === 'DD' ? (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800">
                                  DD
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 text-blue-800">
                                  DA
                                </span>
                              )}
                              <span className="flex items-center gap-0.5 text-slate-600 font-semibold">
                                <Navigation className="w-2.5 h-2.5 text-orange-600" />
                                {order.distanceKm || 15} km
                              </span>
                              <span>• Mác: <strong>{order.grade}</strong></span>
                            </div>
                          </td>

                          {/* 5. Hạng mục */}
                          <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                            {order.categoryItem}
                          </td>

                          {/* 6. KLĐH */}
                          <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                            {order.totalVolume} <span className="text-[11px] font-normal text-slate-500">m³</span>
                          </td>

                          {/* 7. Đã cấp (Cộng dồn) */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-baseline gap-1">
                              <span className="font-black text-orange-600 text-sm">{order.deliveredVolume}</span>
                              <span className="text-[11px] text-slate-400 font-normal">/ {order.totalVolume} m³</span>
                              <span className="text-[10px] font-bold text-slate-600 ml-1">({percent}%)</span>
                            </div>
                            <div className="w-20 bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div
                                className="bg-orange-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </td>

                          {/* 8. Trạng thái */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>

                          {/* 9. Thao tác */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Cấp hàng */}
                              <button
                                onClick={() => handleOpenProjectDelivery(order)}
                                className="px-2.5 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-bold text-[11px] transition cursor-pointer flex items-center gap-1 shadow-xs"
                                title="Chuyển vào mục cấp hàng của công trình này"
                              >
                                <span>Cấp hàng</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              {/* Copy bản sao từ đơn chính (để tạo đơn phát sinh) */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenCreateIncurred(order);
                                }}
                                className="p-1 rounded-lg hover:bg-amber-100 text-amber-700 transition"
                                title="Sao chép từ đơn này để tạo Đơn hàng phát sinh"
                              >
                                <Copy className="w-4 h-4" />
                              </button>

                              {/* Sửa đơn hàng (Admin hoặc Kế toán) */}
                              {isAccountant && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenEditOrder(order);
                                  }}
                                  className="p-1 rounded-lg hover:bg-blue-100 text-blue-700 transition"
                                  title="Chỉnh sửa đơn hàng (Quyền Admin / Kế toán)"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* In phiếu */}
                              {onOpenPrintModal && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedOrderId(order.id);
                                    onOpenPrintModal(order);
                                  }}
                                  className="p-1 rounded-lg hover:bg-orange-100 text-orange-600 transition"
                                  title="In phiếu giao nhận bê tông"
                                >
                                  <Printer className="w-4 h-4" />
                                </button>
                              )}

                              {/* Cấp xe */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderId(order.id);
                                  setIsAssignOpen(true);
                                }}
                                className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                                title="Cấp xe cho đơn này"
                              >
                                <Plus className="w-4 h-4" />
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

          {/* Bottom Split View */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
