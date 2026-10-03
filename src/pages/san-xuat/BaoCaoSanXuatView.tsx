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
  Sparkles
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder } from '../../types';

export const BaoCaoSanXuatView: React.FC = () => {
  const { orders, trips } = useSync();

  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [filterProjectType, setFilterProjectType] = useState<string>('ALL'); // ALL, DA, DD
  const [filterOrderType, setFilterOrderType] = useState<string>('ALL'); // ALL, CHINH, PHAT_SINH
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Extract available dates from orders
  const availableDates = useMemo(() => {
    const set = new Set(orders.map(o => o.deliveryDate));
    return Array.from(set).sort().reverse();
  }, [orders]);

  // Filtered orders for production report
  const filteredOrders = useMemo(() => {
    return orders.filter(ord => {
      const matchDate = !selectedDate || ord.deliveryDate === selectedDate;
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

      return matchDate && matchProjectType && matchOrderType && matchSearch;
    });
  }, [orders, selectedDate, filterProjectType, filterOrderType, searchTerm]);

  // Totals
  const totalVolume = filteredOrders.reduce((sum, o) => sum + o.totalVolume, 0);
  const totalDelivered = filteredOrders.reduce((sum, o) => sum + o.deliveredVolume, 0);
  const totalProjectDA = filteredOrders.filter(o => (o.projectType || 'DA') === 'DA').reduce((sum, o) => sum + o.totalVolume, 0);
  const totalProjectDD = filteredOrders.filter(o => o.projectType === 'DD').reduce((sum, o) => sum + o.totalVolume, 0);

  // Export to Excel CSV (with UTF-8 BOM so Vietnamese opens flawlessly in Excel)
  const handleExportCSV = () => {
    const headers = [
      'STT',
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
      const escape = (str?: string) => `"${(str || '').replace(/"/g, '""')}"`;
      return [
        idx + 1,
        ord.deliveryDate,
        escape(ord.customerCode || '---'),
        escape(ord.customerName),
        escape(ord.projectTitle),
        escape(ord.categoryItem),
        escape(ord.grade),
        ord.totalVolume,
        ord.deliveredVolume,
        ord.projectType === 'DD' ? 'Dân dụng (DD)' : 'Dự án (DA)',
        escape(ord.deliveryTime),
        escape(ord.technicianName || 'Nguyễn Văn Nam'),
        ord.orderType === 'PHAT_SINH' ? 'Phát sinh' : 'Đơn chính',
        escape(ord.parentOrderCode || '---'),
        escape(ord.notes || '')
      ].join(',');
    });

    const csvContent = '\uFEFF' + [
      `"BÁO CÁO SẢN XUẤT BÊ TÔNG TSG TNT THEO NGÀY"`,
      `"Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}"`,
      `"Bộ lọc: ${selectedDate ? 'Ngày ' + selectedDate : 'Tất cả các ngày'} | Tổng sản lượng: ${totalVolume} m3"`,
      '',
      headers.join(','),
      ...rows,
      '',
      `"TỔNG CỘNG","","","","","","",${totalVolume},${totalDelivered},"${totalProjectDA} m3 (DA) / ${totalProjectDD} m3 (DD)"`
    ].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const dateStr = selectedDate ? selectedDate.replace(/-/g, '') : 'all';
    link.setAttribute('download', `Bao_Cao_San_Xuat_TSG_TNT_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Xuất bảng tính chuẩn Excel (.csv) hỗ trợ tiếng Việt không lỗi font"
            >
              <Download className="w-4 h-4" />
              <span>Xuất ra file Excel (.csv)</span>
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

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Date filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-orange-600" />
              Ngày sản xuất
            </label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="">-- Tất cả các ngày --</option>
              {availableDates.map(d => (
                <option key={d} value={d}>
                  {d.split('-').reverse().join('/')} ({orders.filter(o => o.deliveryDate === d).length} đơn)
                </option>
              ))}
            </select>
          </div>

          {/* Project Type filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-blue-600" />
              Loại công trình (DA / DD)
            </label>
            <select
              value={filterProjectType}
              onChange={(e) => setFilterProjectType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">Tất cả (Dự án & Dân dụng)</option>
              <option value="DA">Dự án (DA)</option>
              <option value="DD">Dân dụng (DD)</option>
            </select>
          </div>

          {/* Order Type filter */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-orange-600" />
              Phân loại đơn hàng
            </label>
            <select
              value={filterOrderType}
              onChange={(e) => setFilterOrderType(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
            >
              <option value="ALL">Tất cả (Đơn chính & Phát sinh)</option>
              <option value="CHINH">Đơn hàng chính (Kế toán)</option>
              <option value="PHAT_SINH">Đơn hàng phát sinh</option>
            </select>
          </div>

          {/* Search keyword */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Tìm kiếm nhanh
            </label>
            <input
              type="text"
              placeholder="Khách hàng, công trình, kỹ thuật..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-orange-500"
            />
          </div>
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
                  <td colSpan={12} className="py-8 text-center text-slate-400">
                    Không có dữ liệu sản xuất phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord, idx) => {
                  const isPhatSinh = ord.orderType === 'PHAT_SINH';
                  return (
                    <tr key={ord.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>

                      {/* Ngày sản xuất */}
                      <td className="py-3 px-3 whitespace-nowrap font-bold text-slate-900">
                        {ord.deliveryDate.split('-').reverse().join('/')}
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
