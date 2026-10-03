import React, { useState } from 'react';
import { Truck, Phone, Navigation, Fuel, Shield, Search, Plus, CheckCircle2 } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { TruckStatus } from '../../types';

export const QuanLyLaiXePage: React.FC = () => {
  const { trucks, updateTruckStatus, trips } = useSync();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredTrucks = trucks.filter(t => {
    const matchSearch =
      t.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverPhone.includes(searchTerm);
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: TruckStatus) => {
    switch (status) {
      case 'SAN_SANG':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Sẵn sàng điều xe</span>;
      case 'DANG_NAP':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Đang nạp trạm</span>;
      case 'DANG_CHAY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Đang di chuyển</span>;
      case 'DANG_XA':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">Đang xả bê tông</span>;
      case 'BAO_DUONG':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Bảo dưỡng</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            ĐỘI XE BỒN & XE BƠM BÊ TÔNG
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Lái Xe & Đội Xe Điều Phối
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi vị trí, trạng thái nạp - chạy - xả bê tông và định mức tài xế theo ca.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TỔNG ĐỘI XE</div>
          <div className="text-2xl font-black text-slate-900 mt-2">{trucks.length} phương tiện</div>
          <div className="text-xs text-slate-400 mt-1">Trạm Tây Ninh & phụ cận</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">ĐANG LĂN BÁNH</div>
          <div className="text-2xl font-black text-blue-600 mt-2">
            {trucks.filter(t => t.status === 'DANG_CHAY' || t.status === 'DANG_XA').length} xe
          </div>
          <div className="text-xs text-blue-600 font-semibold mt-1">Phục vụ công trình</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">XE SẴN SÀNG</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {trucks.filter(t => t.status === 'SAN_SANG').length} xe
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Có thể cấp ngay</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TỔNG CHUYẾN HÔM NAY</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {trucks.reduce((sum, t) => sum + t.tripsToday, 0)} chuyến
          </div>
          <div className="text-xs text-slate-400 mt-1">Năng suất bình quân 3.2 chuyến/xe</div>
        </div>
      </div>

      {/* Fleet Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900">Danh Sách Đội Xe & Lái Xe TSG</h2>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm biển số hoặc lái xe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs border border-slate-300 rounded-xl px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="SAN_SANG">Sẵn sàng</option>
              <option value="DANG_CHAY">Đang di chuyển</option>
              <option value="DANG_XA">Đang xả bê tông</option>
              <option value="BAO_DUONG">Bảo dưỡng</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">BIỂN SỐ XE</th>
                <th className="py-3 px-4">LOẠI PHƯƠNG TIỆN</th>
                <th className="py-3 px-4">LÁI XE PHỤ TRÁCH</th>
                <th className="py-3 px-4">ĐƠN ĐANG CHẠY</th>
                <th className="py-3 px-4">NHIÊN LIỆU & KM</th>
                <th className="py-3 px-4">SỐ CHUYẾN</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">ĐỔI TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrucks.map((truck) => (
                <tr key={truck.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                    {truck.plateNumber}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {truck.truckType}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 text-xs">{truck.driverName}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {truck.driverPhone}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-orange-600">
                    {truck.currentOrderCode || '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    <div>Dầu: <strong>{truck.fuelLevel}%</strong></div>
                    <div className="text-[11px] text-slate-400">{truck.kmToday} km hôm nay</div>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 text-xs">
                    {truck.tripsToday} chuyến
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(truck.status)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <select
                      value={truck.status}
                      onChange={(e) => updateTruckStatus(truck.id, e.target.value as TruckStatus)}
                      className="text-[11px] font-medium border border-slate-300 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
                    >
                      <option value="SAN_SANG">Sẵn sàng</option>
                      <option value="DANG_NAP">Đang nạp</option>
                      <option value="DANG_CHAY">Đang chạy</option>
                      <option value="DANG_XA">Đang xả</option>
                      <option value="BAO_DUONG">Bảo dưỡng</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
