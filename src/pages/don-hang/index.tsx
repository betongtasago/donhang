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
  Check
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder, OrderStatus } from '../../types';
import { OrderDetailPanel } from './OrderDetailPanel';
import { DispatchPanel } from './DispatchPanel';
import { CreateOrderModal } from './CreateOrderModal';
import { DispatchAssignModal } from './DispatchAssignModal';
import { ReportExportModal } from './ReportExportModal';
import { Printer } from 'lucide-react';

interface DonHangPageProps {
  onOpenPrintModal?: (order: ConcreteOrder, trip?: any) => void;
}

export const DonHangPage: React.FC<DonHangPageProps> = ({ onOpenPrintModal }) => {
  const { orders, trips, trucks, syncNow, syncState } = useSync();

  // Search & filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-30');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected order for detailed view
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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
        order.projectTitle.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDate = !selectedDate || order.deliveryDate === selectedDate;
      const matchStatus = statusFilter === 'ALL' || order.status === statusFilter;

      return matchSearch && matchDate && matchStatus;
    });
  }, [orders, searchTerm, selectedDate, statusFilter]);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || filteredOrders[0] || orders[0] || null;

  const handleClearFilter = () => {
    setSearchTerm('');
    setSelectedDate('');
    setStatusFilter('ALL');
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
      {/* Top Banner matching screenshot */}
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
            Theo dõi đơn bê tông, lịch giao và năng lực đội xe trên một màn hình điều hành.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {selectedOrder && onOpenPrintModal && (
            <button
              onClick={() => onOpenPrintModal(selectedOrder)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-orange-700 shadow-xs transition cursor-pointer"
              title="In phiếu giao nhận bê tông giống Hình 2"
            >
              <Printer className="w-4 h-4 text-orange-600" />
              In phiếu (Hình 2)
            </button>
          )}

          <button
            onClick={() => setIsReportOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-700 shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Báo cáo
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e25822] hover:bg-[#d04d1c] text-white text-xs font-bold shadow-md shadow-orange-900/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Tạo đơn hàng
          </button>
        </div>
      </div>

      {/* 4 KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: ĐƠN HÀNG HÔM NAY */}
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
              <span className="text-2xl font-black text-slate-900">14</span>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                +3 so với hôm qua
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: ĐANG ĐIỀU PHỐI */}
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
              <span className="text-2xl font-black text-slate-900">69</span>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {String(runningTrucksCount).padStart(2, '0')} xe đang chạy
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: LƯỢNG XUẤT */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <Box className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              LƯỢNG XUẤT
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">
                612 <span className="text-sm font-semibold text-slate-600">m³</span>
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                76% kế hoạch
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: TỶ LỆ ĐÚNG GIỜ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TỶ LỆ ĐÚNG GIỜ
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900">96.4%</span>
              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                +2.1% tuần này
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Section */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
              DANH SÁCH ĐƠN HÀNG
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">Tra cứu và chọn đơn hàng</h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
              {filteredOrders.length} kết quả
            </span>
            <button
              onClick={() => syncNow()}
              title="Đồng bộ & Làm mới"
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            >
              <RefreshCw className={`w-4 h-4 ${syncState.status === 'syncing' ? 'animate-spin text-orange-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              TÊN KHÁCH HÀNG
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên công ty..."
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
                placeholder="30/09/2026"
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
              onClick={() => {}}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-[#1e40af] hover:bg-[#1d3999] text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Filter className="w-3.5 h-3.5" />
              Lọc
            </button>
            <button
              onClick={handleClearFilter}
              className="py-2 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
            >
              Xóa lọc
            </button>
          </div>
        </div>

        {/* Table of Orders */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">MÃ ĐƠN</th>
                <th className="py-3 px-4">TÊN KHÁCH HÀNG</th>
                <th className="py-3 px-4">CÔNG TRÌNH</th>
                <th className="py-3 px-4">HẠNG MỤC</th>
                <th className="py-3 px-4">KLĐH</th>
                <th className="py-3 px-4">THỜI GIAN GH</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy đơn hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isSelected = order.id === selectedOrderId;
                  return (
                    <tr
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`cursor-pointer transition-colors duration-150 ${
                        isSelected
                          ? 'bg-amber-50/40 border-l-4 border-l-[#e25822]'
                          : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                      }`}
                    >
                      {/* Code */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {order.code}
                      </td>

                      {/* Customer Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded bg-orange-100 text-[#e25822] text-[10px] font-black flex items-center justify-center shrink-0">
                            CÔ
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 uppercase tracking-tight text-xs">
                              {order.customerName}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Nhà máy: {order.plantLocation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Project Title */}
                      <td className="py-3 px-4 font-medium text-slate-700 max-w-[200px] truncate" title={order.projectTitle}>
                        {order.projectTitle}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        {order.categoryItem}
                      </td>

                      {/* KLĐH */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-900">{order.totalVolume}</span>{' '}
                        <span className="text-[11px] text-slate-500">m³</span>
                      </td>

                      {/* Delivery Time */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {order.deliveryTime}{' '}
                            <span className="text-slate-400 text-[11px]">
                              {order.deliveryDate.split('-').reverse().join('/')}
                            </span>
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getStatusBadge(order.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderId(order.id);
                              setIsAssignOpen(true);
                            }}
                            className="p-1 rounded-lg hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition"
                            title="Cấp xe cho đơn này"
                          >
                            <MoreVertical className="w-4 h-4" />
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

      {/* Bottom Split View (matching the bottom sections in screenshot) */}
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

      {/* Modals */}
      <CreateOrderModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
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
