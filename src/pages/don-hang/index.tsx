import React, { useState, useMemo } from 'react';
import {
  Printer,
  Calendar,
  Search,
  Plus,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Edit2,
  Trash2,
  CheckSquare,
  Square,
  HelpCircle,
  FileSpreadsheet,
  Layers,
  Truck,
  RotateCcw
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder, DispatchTrip, OrderType } from '../../types';
import { CreateOrderModal } from './CreateOrderModal';
import { EditOrderModal } from './EditOrderModal';
import { DispatchAssignModal } from './DispatchAssignModal';
import { EditTripModal } from './EditTripModal';
import * as XLSX from 'xlsx';

interface DonHangPageProps {
  initialView?: 'DON_HANG' | 'CAP_HANG';
  onViewChange?: (view: 'DON_HANG' | 'CAP_HANG') => void;
  onOpenPrintModal?: (order: ConcreteOrder, trip?: any) => void;
}

export const DonHangPage: React.FC<DonHangPageProps> = ({
  initialView,
  onViewChange,
  onOpenPrintModal
}) => {
  const { orders, trips, trucks, deleteTrip } = useSync();

  // Active View: 'DON_HANG' (Screenshot 1) or 'CAP_HANG' (Screenshot 2)
  const [activeView, setActiveView] = useState<'DON_HANG' | 'CAP_HANG'>(initialView || 'DON_HANG');

  React.useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);

  const handleSwitchView = (view: 'DON_HANG' | 'CAP_HANG') => {
    setActiveView(view);
    if (onViewChange) {
      onViewChange(view);
    }
  };

  // Search form states for "Đơn hàng" (Screenshot 1)
  const [filterDate, setFilterDate] = useState<string>('04/10/2026');
  const [filterLenhSX, setFilterLenhSX] = useState<string>(''); // '', 'Đồng ý', 'Chờ duyệt'
  const [isAdvancedSearch, setIsAdvancedSearch] = useState<boolean>(false);
  const [advancedKeyword, setAdvancedKeyword] = useState<string>('');

  // Selected orders checkbox set
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());

  // Filter for "Cấp hàng" (Screenshot 2)
  const [selectedOrderIdForDispatch, setSelectedOrderIdForDispatch] = useState<string>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createOrderType, setCreateOrderType] = useState<OrderType>('CHINH');
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<ConcreteOrder | null>(null);

  // Dispatch Assign Modal (Xuất xe bồn / phiếu mới)
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Edit Trip Modal
  const [editingTrip, setEditingTrip] = useState<DispatchTrip | null>(null);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);

  // Filtered Orders for Screen 1
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Ngày giao filter (DD/MM/YYYY)
      if (filterDate.trim()) {
        const orderDateFormatted = order.deliveryDate
          ? order.deliveryDate.split('-').reverse().join('/')
          : '';
        if (orderDateFormatted && !orderDateFormatted.includes(filterDate.trim())) {
          return false;
        }
      }

      // Lệnh SX filter
      if (filterLenhSX.trim()) {
        const currentLenh = order.productionOrder || (order.status === 'CHO_DUYET' ? 'Chờ duyệt' : 'Đồng ý');
        if (currentLenh !== filterLenhSX) return false;
      }

      // Advanced search keyword
      if (advancedKeyword.trim()) {
        const kw = advancedKeyword.toLowerCase();
        const match =
          order.customerName.toLowerCase().includes(kw) ||
          order.projectTitle.toLowerCase().includes(kw) ||
          order.categoryItem.toLowerCase().includes(kw) ||
          (order.notes && order.notes.toLowerCase().includes(kw));
        if (!match) return false;
      }

      return true;
    });
  }, [orders, filterDate, filterLenhSX, advancedKeyword]);

  // Selected target order for dispatch / editing
  const selectedOrder = useMemo(() => {
    if (selectedOrderIdForDispatch !== 'ALL') {
      const found = orders.find(o => o.id === selectedOrderIdForDispatch);
      if (found) return found;
    }
    const firstSelectedId = Array.from(selectedOrderIds)[0];
    if (firstSelectedId) {
      const found = orders.find(o => o.id === firstSelectedId);
      if (found) return found;
    }
    return orders[0] || null;
  }, [orders, selectedOrderIdForDispatch, selectedOrderIds]);

  // Filtered Trips for Screen 2 ("Cấp hàng / Điều phối")
  const filteredTrips = useMemo(() => {
    if (selectedOrderIdForDispatch === 'ALL') {
      return trips;
    }
    return trips.filter(
      t => t.orderId === selectedOrderIdForDispatch || t.orderCode === selectedOrder?.code
    );
  }, [trips, selectedOrderIdForDispatch, selectedOrder]);

  // Toggle select all orders
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

  // Export Excel
  const handleExportExcel = () => {
    if (activeView === 'DON_HANG') {
      const headers = [
        'STT',
        'Tên KH',
        'Cự ly(km)',
        'Hạng mục',
        'KLĐH (m3)',
        'Loại bơm',
        'Giờ KHSX',
        'Thời gian GH',
        'Lệnh SX',
        'Nhà máy',
        'Ngày tạo',
        'Công trình'
      ];
      const rows = filteredOrders.map((o, idx) => [
        idx + 1,
        o.customerName,
        o.distanceKm || '',
        o.categoryItem,
        o.totalVolume,
        o.pumpType || '',
        o.scheduledProductionTime || '',
        o.deliveryTime,
        o.productionOrder || 'Đồng ý',
        o.plantLocation || 'Tây Ninh',
        o.createdAt || '04/10/2026',
        o.projectTitle
      ]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['DANH SÁCH ĐƠN HÀNG TSG-TNT'], [], headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'DonHang');
      XLSX.writeFile(wb, 'Danh_Sach_Don_Hang.xlsx');
    } else {
      const headers = [
        'STT',
        'Ngày giao bê tông',
        'Tài xế',
        'Số xe',
        'Nhân viên giao nhận',
        'Tên bê tông',
        'Giờ khởi hành',
        'Đơn vị',
        'Lượng xuất',
        'Cộng dồn',
        'Nhà máy',
        'ngay_nhap'
      ];
      const rows = filteredTrips.map((t, idx) => [
        idx + 1,
        t.deliveryDate || '04/10/2026',
        t.driverName,
        t.truckPlate,
        t.technicianName || '',
        t.concreteName || t.grade || 'M350-7N(10+-2)',
        t.departureTime,
        t.unit || 'm3',
        t.volume,
        t.accumulatedVolume || t.volume,
        t.plantLocation || 'Tây Ninh',
        t.entryDate || '04/10/2026'
      ]);
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet([['DANH SÁCH ĐIỀU PHỐI CẤP HÀNG'], [], headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, 'DieuPhoi');
      XLSX.writeFile(wb, 'Danh_Sach_Dieu_Phoi_Cap_Hang.xlsx');
    }
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTripItem = (trip: DispatchTrip) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chuyến xe ${trip.truckPlate} (${trip.driverName}) không?`)) {
      deleteTrip(trip.id);
    }
  };

  return (
    <div className="bg-[#f0f4f7] min-h-screen text-[#222222] font-sans text-xs pb-10">
      {/* 1. TOP BAR: Chuyển đổi rõ ràng giữa Đơn hàng (Ảnh 1) và Cấp hàng (Ảnh 2) */}
      <div className="bg-[#e4ebf0] border-b border-[#c8d4dc] px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: View Tabs */}
        <div className="flex items-center gap-2">
          {/* Tab 1: Đơn hàng (Ảnh 1) */}
          <button
            type="button"
            onClick={() => handleSwitchView('DON_HANG')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold cursor-pointer transition text-xs ${
              activeView === 'DON_HANG'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-blue-700 border border-slate-300'
            }`}
          >
            <span>📋 1. ĐƠN HÀNG (Ảnh 1)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeView === 'DON_HANG' ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {filteredOrders.length}
            </span>
          </button>

          {/* Tab 2: Cấp hàng (Ảnh 2) */}
          <button
            type="button"
            onClick={() => handleSwitchView('CAP_HANG')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-bold cursor-pointer transition text-xs ${
              activeView === 'CAP_HANG'
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white/80 text-slate-700 hover:bg-white hover:text-blue-700 border border-slate-300'
            }`}
          >
            <span>🚚 2. CẤP HÀNG - ĐIỀU PHỐI (Ảnh 2)</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeView === 'CAP_HANG' ? 'bg-blue-900 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {filteredTrips.length}
            </span>
          </button>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          {/* Tạo Đơn hàng */}
          <button
            type="button"
            onClick={() => {
              setCreateOrderType('CHINH');
              setIsCreateOpen(true);
            }}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] hover:from-white hover:to-[#cbd5e1] border border-[#94a3b8] rounded-xs font-semibold text-slate-800 text-xs shadow-2xs cursor-pointer active:translate-y-px"
          >
            <Plus className="w-3.5 h-3.5 text-blue-700" />
            <span>Tạo Đơn hàng</span>
          </button>

          {/* Cấp xe bồn */}
          <button
            type="button"
            onClick={() => setIsAssignOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] hover:from-white hover:to-[#cbd5e1] border border-[#94a3b8] rounded-xs font-semibold text-slate-800 text-xs shadow-2xs cursor-pointer active:translate-y-px"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Cấp xe bồn</span>
          </button>

          {/* Xuất Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1 px-2.5 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] hover:from-white hover:to-[#cbd5e1] border border-[#94a3b8] rounded-xs font-semibold text-slate-800 text-xs shadow-2xs cursor-pointer active:translate-y-px"
            title="Xuất file Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-green-700" />
            <span>Xuất Excel</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="p-2 sm:p-3 space-y-2">
        {/* ============================================================== */}
        {/* VIEW 1: ĐƠN HÀNG (GIỐNG 100% ẢNH 1)                           */}
        {/* ============================================================== */}
        {activeView === 'DON_HANG' && (
          <div className="space-y-2">
            {/* Search Box Card: "» Tìm" with "+ Tạo" on top right */}
            <div className="bg-white border border-[#c4ced6] shadow-2xs rounded-xs">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-[#f7f9fa] to-[#edf2f6] border-b border-[#d8e0e6] px-3 py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
                  {/* Light blue 3D box icon */}
                  <span className="w-4 h-4 bg-gradient-to-b from-[#e0f7fa] to-[#80deea] border border-[#26c6da] rounded-xs shadow-2xs inline-block"></span>
                  <span>» Tìm</span>
                </div>
                <button
                  onClick={() => {
                    setCreateOrderType('CHINH');
                    setIsCreateOpen(true);
                  }}
                  className="text-blue-700 hover:text-blue-900 font-bold text-xs flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tạo</span>
                </button>
              </div>

              {/* Form Search Row */}
              <div className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs bg-white">
                <div className="flex flex-wrap items-center gap-3">
                  {/* Ngày giao */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-700 font-normal">Ngày giao</span>
                    <div className="flex items-center">
                      <input
                        type="text"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        placeholder="04/10/2026"
                        className="w-28 px-2 py-1 bg-white border border-[#9ca3af] rounded-l-xs text-xs focus:outline-none focus:border-blue-600 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setFilterDate('04/10/2026')}
                        className="px-2 py-1 bg-[#e8edf2] hover:bg-[#dbe2e8] border border-l-0 border-[#9ca3af] rounded-r-xs cursor-pointer text-slate-700"
                        title="Chọn ngày hôm nay"
                      >
                        <Calendar className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                    </div>
                  </div>

                  {/* Lệnh SX */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-700 font-normal">Lệnh SX</span>
                    <select
                      value={filterLenhSX}
                      onChange={(e) => setFilterLenhSX(e.target.value)}
                      className="px-2 py-1 bg-white border border-[#9ca3af] rounded-xs text-xs focus:outline-none focus:border-blue-600 min-w-[120px]"
                    >
                      <option value="">-- Tất cả --</option>
                      <option value="Đồng ý">Đồng ý</option>
                      <option value="Chờ duyệt">Chờ duyệt</option>
                    </select>
                  </div>

                  {/* Action Buttons: Tìm, Xóa trắng, Tìm nâng cao */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {}}
                      className="px-3.5 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] hover:from-white hover:to-[#cbd5e1] border border-[#94a3b8] rounded-xs font-semibold text-slate-800 text-xs shadow-2xs cursor-pointer active:translate-y-px"
                    >
                      Tìm
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFilterDate('');
                        setFilterLenhSX('');
                        setAdvancedKeyword('');
                      }}
                      className="px-3.5 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] hover:from-white hover:to-[#cbd5e1] border border-[#94a3b8] rounded-xs font-semibold text-slate-800 text-xs shadow-2xs cursor-pointer active:translate-y-px"
                    >
                      Xóa trắng
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAdvancedSearch(!isAdvancedSearch)}
                      className="text-blue-700 hover:underline font-normal text-xs ml-1 cursor-pointer"
                    >
                      Tìm nâng cao
                    </button>
                  </div>
                </div>

                {/* Right Help ? */}
                <div className="text-slate-700 font-bold text-sm px-1 cursor-pointer" title="Trợ giúp tìm kiếm">
                  ?
                </div>
              </div>

              {/* Tìm nâng cao field (nếu mở) */}
              {isAdvancedSearch && (
                <div className="px-3 pb-2.5 pt-0 border-t border-dashed border-slate-200 flex items-center gap-2 animate-in fade-in">
                  <span className="text-slate-600">Từ khóa:</span>
                  <input
                    type="text"
                    placeholder="Tìm theo tên công trình, địa chỉ, khách hàng..."
                    value={advancedKeyword}
                    onChange={(e) => setAdvancedKeyword(e.target.value)}
                    className="flex-1 max-w-md px-2 py-0.5 border border-slate-300 rounded-xs text-xs"
                  />
                  {advancedKeyword && (
                    <button
                      onClick={() => setAdvancedKeyword('')}
                      className="text-slate-400 hover:text-slate-600 text-[11px]"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Table Actions Toolbar (Above Table) */}
            <div className="flex flex-wrap items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-2.5 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] border border-[#94a3b8] rounded-xs font-semibold text-slate-800 text-xs shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>Thực hiện</span>
                  <span className="text-[10px]">▼</span>
                </button>
                <span className="text-slate-600 font-normal">
                  Đã chọn: <strong className="text-slate-900 font-bold">{selectedOrderIds.size}</strong>
                </span>
              </div>

              {/* Pagination right: (1 - 9 của 9) */}
              <div className="flex items-center gap-1.5 font-normal text-slate-600 text-[11px]">
                <button className="px-1.5 py-0.5 border border-[#cbd5e1] bg-white rounded-xs text-slate-500 cursor-pointer">
                  |&lt;
                </button>
                <button className="px-1.5 py-0.5 border border-[#cbd5e1] bg-white rounded-xs text-slate-500 cursor-pointer">
                  &lt;
                </button>
                <span>(1 - {filteredOrders.length} của {filteredOrders.length})</span>
                <button className="px-1.5 py-0.5 border border-[#cbd5e1] bg-white rounded-xs text-slate-500 cursor-pointer">
                  &gt;
                </button>
                <button className="px-1.5 py-0.5 border border-[#cbd5e1] bg-white rounded-xs text-slate-500 cursor-pointer">
                  &gt;|
                </button>
              </div>
            </div>

            {/* Table: EXACT COLUMN REPLICA OF USER SCREENSHOT 1 */}
            <div className="bg-white border border-[#9ca3af] shadow-xs overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#b0b7bd] text-slate-900 border-b border-[#8b9399] font-bold text-[11px]">
                    <th className="py-1.5 px-2 w-8 text-center border-r border-[#8b9399]">
                      <input
                        type="checkbox"
                        checked={selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0}
                        onChange={handleToggleSelectAllOrders}
                        className="cursor-pointer"
                      />
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span>Tên KH</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] text-center w-20">
                      Cự ly(km)
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] min-w-[130px]">
                      <div className="flex items-center justify-between">
                        <span>Hạng mục</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] text-right w-16">
                      <div className="flex items-center justify-end gap-1">
                        <span>KLĐH</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] min-w-[120px]">
                      <div className="flex items-center justify-between">
                        <span>Loại bơm</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] text-center w-20">
                      <div className="flex items-center justify-center gap-1">
                        <span>Giờ KHSX</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] text-center w-24">
                      <div className="flex items-center justify-center gap-1">
                        <span>Thời gian GH</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] text-center w-20">
                      <div className="flex items-center justify-center gap-1">
                        <span>Lệnh SX</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] text-center w-20">
                      <div className="flex items-center justify-center gap-1">
                        <span>Nhà máy</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 border-r border-[#8b9399] text-center min-w-[110px]">
                      <div className="flex items-center justify-center gap-1">
                        <span>Ngày tạo</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-1.5 px-2 min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <span>Công trình</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-slate-400">
                        Không có đơn hàng nào khớp với điều kiện tìm kiếm.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((ord) => {
                      const isChecked = selectedOrderIds.has(ord.id);
                      const orderTrips = trips.filter(t => t.orderId === ord.id || t.orderCode === ord.code);

                      return (
                        <tr
                          key={ord.id}
                          className={`hover:bg-[#f2f7fb] transition cursor-pointer border-b border-slate-200 ${
                            isChecked ? 'bg-[#e8f3fc]' : ''
                          }`}
                          onClick={() => handleToggleSelectOrder(ord.id)}
                          onDoubleClick={() => {
                            setSelectedOrderIdForDispatch(ord.id);
                            setActiveView('CAP_HANG');
                          }}
                        >
                          {/* Checkbox */}
                          <td className="py-1.5 px-2 text-center border-r border-slate-200">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToggleSelectOrder(ord.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="cursor-pointer"
                            />
                          </td>

                          {/* Tên KH (In đậm) */}
                          <td className="py-1.5 px-2 font-bold text-slate-900 border-r border-slate-200 uppercase leading-snug">
                            {ord.customerName}
                          </td>

                          {/* Cự ly(km) */}
                          <td className="py-1.5 px-2 text-center text-slate-800 border-r border-slate-200 font-mono">
                            {ord.distanceKm || ''}
                          </td>

                          {/* Hạng mục */}
                          <td className="py-1.5 px-2 text-slate-800 border-r border-slate-200">
                            {ord.categoryItem}
                          </td>

                          {/* KLĐH */}
                          <td className="py-1.5 px-2 text-right font-bold text-slate-900 border-r border-slate-200 font-mono">
                            {ord.totalVolume}
                          </td>

                          {/* Loại bơm */}
                          <td className="py-1.5 px-2 text-slate-700 border-r border-slate-200">
                            {ord.pumpType || ''}
                          </td>

                          {/* Giờ KHSX */}
                          <td className="py-1.5 px-2 text-center text-slate-700 border-r border-slate-200 font-mono">
                            {ord.scheduledProductionTime || ''}
                          </td>

                          {/* Thời gian GH */}
                          <td className="py-1.5 px-2 text-center font-bold text-slate-900 border-r border-slate-200 font-mono">
                            {ord.deliveryTime}
                          </td>

                          {/* Lệnh SX ("Đồng ý") */}
                          <td className="py-1.5 px-2 text-center border-r border-slate-200">
                            <span className="text-slate-800 font-medium">
                              {ord.productionOrder || 'Đồng ý'}
                            </span>
                          </td>

                          {/* Nhà máy ("Tây Ninh") */}
                          <td className="py-1.5 px-2 text-center text-slate-800 border-r border-slate-200">
                            {ord.plantLocation || 'Tây Ninh'}
                          </td>

                          {/* Ngày tạo */}
                          <td className="py-1.5 px-2 text-center text-slate-700 border-r border-slate-200 font-mono whitespace-nowrap">
                            {ord.createdAt || '04/10/2026 04:45'}
                          </td>

                          {/* Công trình (kèm nút xem cấp hàng nhanh) */}
                          <td className="py-1.5 px-2 text-slate-900 uppercase font-semibold leading-snug">
                            <div className="flex items-center justify-between gap-1">
                              <span>{ord.projectTitle}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOrderIdForDispatch(ord.id);
                                  setActiveView('CAP_HANG');
                                }}
                                className="px-1.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded text-[10px] font-sans normal-case shrink-0 cursor-pointer"
                                title="Xem các chuyến cấp hàng của đơn này"
                              >
                                Cấp hàng ({orderTrips.length})
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

            {/* Table Actions Toolbar (Below Table) */}
            <div className="flex flex-wrap items-center justify-between text-xs py-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-2.5 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] border border-[#94a3b8] rounded-xs font-semibold text-slate-800 text-xs shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <span>Thực hiện</span>
                  <span className="text-[10px]">▼</span>
                </button>
                <span className="text-slate-600 font-normal">
                  Đã chọn: <strong className="text-slate-900 font-bold">{selectedOrderIds.size}</strong>
                </span>
              </div>

              {/* Pagination right: (1 - 9 của 9) */}
              <div className="flex items-center gap-1.5 font-normal text-slate-600 text-[11px]">
                <button className="px-1.5 py-0.5 border border-[#cbd5e1] bg-white rounded-xs text-slate-500 cursor-pointer">
                  |&lt;
                </button>
                <button className="px-1.5 py-0.5 border border-[#cbd5e1] bg-white rounded-xs text-slate-500 cursor-pointer">
                  &lt;
                </button>
                <span>(1 - {filteredOrders.length} của {filteredOrders.length})</span>
                <button className="px-1.5 py-0.5 border border-[#cbd5e1] bg-white rounded-xs text-slate-500 cursor-pointer">
                  &gt;
                </button>
                <button className="px-1.5 py-0.5 border border-[#cbd5e1] bg-white rounded-xs text-slate-500 cursor-pointer">
                  &gt;|
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* VIEW 2: ĐIỀU PHỐI / CẤP HÀNG (GIỐNG 100% ẢNH 2)                */}
        {/* ============================================================== */}
        {activeView === 'CAP_HANG' && (
          <div className="space-y-2 bg-white border border-[#c4ced6] shadow-2xs rounded-xs overflow-hidden border-t-3 border-t-[#c23b38]">
            {/* Top Red Bar is border-t-3 above */}

            {/* Header: "Điều phối" + Icon cyan */}
            <div className="px-3 pt-2.5 pb-1.5 flex items-center justify-between border-b border-slate-100">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-900 text-sm">Điều phối</h2>
                <span className="w-4 h-4 bg-gradient-to-b from-[#e0f7fa] to-[#80deea] border border-[#26c6da] rounded-xs shadow-2xs inline-block"></span>
              </div>

              {/* Right: Switch view & Order selector filter */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleSwitchView('DON_HANG')}
                  className="px-2.5 py-1 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-blue-700 hover:text-blue-900 border border-slate-300 rounded font-semibold text-xs flex items-center gap-1 cursor-pointer transition"
                  title="Quay lại danh sách Đơn hàng"
                >
                  <span>← Xem Đơn hàng (Ảnh 1)</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-600 font-medium">Lọc theo đơn:</span>
                  <select
                    value={selectedOrderIdForDispatch}
                    onChange={(e) => setSelectedOrderIdForDispatch(e.target.value)}
                    className="px-2 py-0.5 bg-white border border-slate-300 rounded text-xs max-w-xs truncate"
                  >
                    <option value="ALL">-- Tất cả chuyến cấp hàng --</option>
                    {orders.map(o => (
                      <option key={o.id} value={o.id}>
                        {o.customerName} - {o.projectTitle} ({o.totalVolume}m³)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Action Row: [Tạo] [Chọn] and Pagination */}
            <div className="px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0]">
              <div className="flex items-center gap-1.5">
                {/* Nút Tạo (Cấp xe bồn / xuất phiếu mới) */}
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(true)}
                  className="px-3 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] hover:from-white hover:to-[#cbd5e1] border border-[#94a3b8] rounded-xs font-bold text-slate-800 text-xs shadow-2xs cursor-pointer active:translate-y-px"
                >
                  Tạo
                </button>

                {/* Nút Chọn */}
                <button
                  type="button"
                  onClick={() => {}}
                  className="px-3 py-1 bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0] hover:from-white hover:to-[#cbd5e1] border border-[#94a3b8] rounded-xs font-bold text-slate-800 text-xs shadow-2xs cursor-pointer active:translate-y-px"
                >
                  Chọn
                </button>
              </div>

              {/* Pagination right: [box] [box] (1 - 10 của 10) [box] [box] */}
              <div className="flex items-center gap-1.5 font-normal text-slate-600 text-[11px]">
                <button className="w-5 h-5 border border-[#cbd5e1] bg-gradient-to-b from-[#f8fafc] to-[#e8edf2] rounded-xs text-slate-600 flex items-center justify-center cursor-pointer">
                  |&lt;
                </button>
                <button className="w-5 h-5 border border-[#cbd5e1] bg-gradient-to-b from-[#f8fafc] to-[#e8edf2] rounded-xs text-slate-600 flex items-center justify-center cursor-pointer">
                  &lt;
                </button>
                <span>(1 - {filteredTrips.length} của {filteredTrips.length})</span>
                <button className="w-5 h-5 border border-[#cbd5e1] bg-gradient-to-b from-[#f8fafc] to-[#e8edf2] rounded-xs text-slate-600 flex items-center justify-center cursor-pointer">
                  &gt;
                </button>
                <button className="w-5 h-5 border border-[#cbd5e1] bg-gradient-to-b from-[#f8fafc] to-[#e8edf2] rounded-xs text-slate-600 flex items-center justify-center cursor-pointer">
                  &gt;|
                </button>
              </div>
            </div>

            {/* Table: EXACT COLUMN REPLICA OF USER SCREENSHOT 2 */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#b0b7bd] text-slate-900 border-b border-[#8b9399] font-bold text-[11px]">
                    <th className="py-2 px-2.5 border-r border-[#8b9399] min-w-[120px]">
                      <div className="flex items-center justify-between">
                        <span>Ngày giao bê tông</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] min-w-[130px]">
                      <div className="flex items-center justify-between">
                        <span>Tài xế</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] font-mono min-w-[100px]">
                      <div className="flex items-center justify-between">
                        <span>Số xe</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] min-w-[140px]">
                      <div className="flex items-center justify-between">
                        <span>Nhân viên giao nhận</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] font-mono min-w-[130px]">
                      <div className="flex items-center justify-between">
                        <span>Tên bê tông</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] text-center w-24">
                      <div className="flex items-center justify-center gap-1">
                        <span>Giờ khởi hành</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] text-center w-16">
                      <div className="flex items-center justify-center gap-1">
                        <span>Đơn vị</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] text-right w-20">
                      <div className="flex items-center justify-end gap-1">
                        <span>Lượng xuất</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] text-right w-20">
                      <div className="flex items-center justify-end gap-1">
                        <span>Cộng dồn</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 border-r border-[#8b9399] text-center w-20">
                      <div className="flex items-center justify-center gap-1">
                        <span>Nhà máy</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                    <th className="py-2 px-2.5 min-w-[180px]">
                      <div className="flex items-center justify-between">
                        <span>ngay_nhap</span>
                        <span className="text-[10px] text-slate-700">↕</span>
                      </div>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredTrips.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        Chưa có chuyến xe nào được điều phối. Bấm nút [Tạo] ở trên để xuất xe.
                      </td>
                    </tr>
                  ) : (
                    filteredTrips.map((trip) => {
                      const parentOrder = orders.find(
                        o => o.id === trip.orderId || o.code === trip.orderCode
                      ) || selectedOrder;

                      return (
                        <tr
                          key={trip.id}
                          className="hover:bg-[#f2f7fb] transition border-b border-slate-200"
                        >
                          {/* Ngày giao bê tông */}
                          <td className="py-1.5 px-2.5 font-mono text-slate-800 border-r border-slate-200">
                            {trip.deliveryDate || '04/10/2026'}
                          </td>

                          {/* Tài xế */}
                          <td className="py-1.5 px-2.5 font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            {trip.driverName}
                          </td>

                          {/* Số xe */}
                          <td className="py-1.5 px-2.5 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap">
                            {trip.truckPlate}
                          </td>

                          {/* Nhân viên giao nhận */}
                          <td className="py-1.5 px-2.5 text-slate-700 border-r border-slate-200">
                            {trip.technicianName || parentOrder?.technicianName || ''}
                          </td>

                          {/* Tên bê tông */}
                          <td className="py-1.5 px-2.5 font-mono text-slate-800 border-r border-slate-200 whitespace-nowrap">
                            {trip.concreteName || trip.grade || parentOrder?.grade || 'M350-7N(10+-2)'}
                          </td>

                          {/* Giờ khởi hành */}
                          <td className="py-1.5 px-2.5 text-center font-mono font-bold text-slate-900 border-r border-slate-200">
                            {trip.departureTime}
                          </td>

                          {/* Đơn vị */}
                          <td className="py-1.5 px-2.5 text-center text-slate-700 border-r border-slate-200 font-mono">
                            {trip.unit || 'm3'}
                          </td>

                          {/* Lượng xuất */}
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                            {trip.volume}
                          </td>

                          {/* Cộng dồn */}
                          <td className="py-1.5 px-2.5 text-right font-mono font-bold text-slate-900 border-r border-slate-200">
                            {trip.accumulatedVolume || trip.volume}
                          </td>

                          {/* Nhà máy */}
                          <td className="py-1.5 px-2.5 text-center text-slate-800 border-r border-slate-200">
                            {trip.plantLocation || parentOrder?.plantLocation || 'Tây Ninh'}
                          </td>

                          {/* ngay_nhap + [sửa] + [xóa] + [in] EXACT REPLICA OF SCREENSHOT 2 */}
                          <td className="py-1.5 px-2.5 text-slate-700 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px]">
                                {trip.entryDate || '04/10/2026 16:02'}
                              </span>

                              {/* Sửa link/button */}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTrip(trip);
                                  setIsEditTripOpen(true);
                                }}
                                className="flex items-center gap-0.5 text-blue-700 hover:text-blue-900 hover:underline font-semibold cursor-pointer text-[11px]"
                                title="Chỉnh sửa chi tiết chuyến xe"
                              >
                                <span className="w-3.5 h-3.5 bg-gradient-to-b from-[#e0f7fa] to-[#80deea] border border-[#26c6da] rounded-xs shadow-2xs inline-block"></span>
                                <span>sửa</span>
                              </button>

                              {/* Xóa link/button */}
                              <button
                                type="button"
                                onClick={() => handleDeleteTripItem(trip)}
                                className="flex items-center gap-0.5 text-blue-700 hover:text-red-700 hover:underline font-semibold cursor-pointer text-[11px]"
                                title="Xóa chuyến xe này"
                              >
                                <span className="w-3.5 h-3.5 bg-gradient-to-b from-[#e0f7fa] to-[#80deea] border border-[#26c6da] rounded-xs shadow-2xs inline-block"></span>
                                <span>xóa</span>
                              </button>

                              {/* In phiếu giao nhận */}
                              {onOpenPrintModal && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (parentOrder) {
                                      onOpenPrintModal(parentOrder, trip);
                                    }
                                  }}
                                  className="flex items-center gap-0.5 text-orange-700 hover:text-orange-900 hover:underline font-semibold cursor-pointer text-[11px]"
                                  title="In phiếu giao nhận bê tông (chuẩn TSG-TNT)"
                                >
                                  <Printer className="w-3 h-3 text-orange-600" />
                                  <span>in</span>
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
          </div>
        )}

        {/* 3. BOTTOM FOOTER BAR (Ảnh 1 & 2): "🖨 In"  "⬆ Trở lại đầu trang" */}
        <div className="flex items-center justify-end gap-4 pt-3 text-xs text-slate-800">
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 font-bold hover:text-blue-700 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>In</span>
          </button>

          <button
            type="button"
            onClick={handleScrollToTop}
            className="flex items-center gap-1 font-bold text-slate-800 hover:text-blue-700 cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5 text-slate-700" />
            <span>Trở lại đầu trang</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODALS INTEGRATION                                             */}
      {/* ============================================================== */}
      {/* 1. Modal Tạo Đơn hàng */}
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

      {/* 3. Modal Cấp xe bồn / Phiếu giao hàng (Screenshot 2 Tạo) */}
      {selectedOrder && (
        <DispatchAssignModal
          order={selectedOrder}
          isOpen={isAssignOpen}
          onClose={() => setIsAssignOpen(false)}
        />
      )}

      {/* 4. Modal Sửa chuyến xe (Screenshot 2 Sửa) */}
      {selectedOrder && (
        <EditTripModal
          isOpen={isEditTripOpen}
          onClose={() => setIsEditTripOpen(false)}
          trip={editingTrip}
          order={selectedOrder}
          onOpenPrintModal={onOpenPrintModal}
        />
      )}
    </div>
  );
};
