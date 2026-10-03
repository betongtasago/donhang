import React, { useState } from 'react';
import { ConcreteOrder, DispatchTrip, TripStatus } from '../../types';
import { useSync } from '../../sync/SyncContext';
import { EditTripModal } from './EditTripModal';
import {
  ArrowLeft,
  Truck,
  Plus,
  Printer,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  Layers,
  Gauge,
  Droplets,
  ShieldCheck,
  TrendingUp,
  FileText,
  AlertCircle,
  Edit2,
  Edit3,
  Copy
} from 'lucide-react';

interface ProjectDeliveryViewProps {
  order: ConcreteOrder;
  onBack: () => void;
  onOpenPrintModal: (order: ConcreteOrder, trip?: DispatchTrip) => void;
  onOpenAssignModal: () => void;
  onOpenEditOrder?: (order: ConcreteOrder) => void;
  onOpenCopyOrder?: (order: ConcreteOrder) => void;
}

export const ProjectDeliveryView: React.FC<ProjectDeliveryViewProps> = ({
  order,
  onBack,
  onOpenPrintModal,
  onOpenAssignModal,
  onOpenEditOrder,
  onOpenCopyOrder
}) => {
  const { trips, trucks, createTrip, updateTripStatus, updateOrder } = useSync();

  // Trips belonging to this project / order
  const orderTrips = trips.filter(t => t.orderId === order.id || t.orderCode === order.code);

  // Quick dispatch state inside the view
  const availableTrucks = trucks.filter(t => t.status === 'SAN_SANG' || t.status === 'DANG_CHAY');
  const [selectedTruckPlate, setSelectedTruckPlate] = useState(availableTrucks[0]?.plateNumber || '51M-97571');
  const [quickVolume, setQuickVolume] = useState<number>(5);
  const [quickSlump, setQuickSlump] = useState<string>(order.slump || '10+-2');
  const [quickNotes, setQuickNotes] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // State chỉnh sửa chi tiết phiếu giao nhận
  const [editingTrip, setEditingTrip] = useState<DispatchTrip | null>(null);
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);

  const percentCompleted = order.totalVolume > 0
    ? Math.min(100, Math.round((order.deliveredVolume / order.totalVolume) * 100))
    : 0;
  const remainingVolume = Math.max(0, order.totalVolume - order.deliveredVolume);

  const handleQuickAddTruck = (e: React.FormEvent) => {
    e.preventDefault();
    const truck = trucks.find(t => t.plateNumber === selectedTruckPlate) || availableTrucks[0];
    if (!truck) {
      alert('Vui lòng chọn xe bồn.');
      return;
    }

    const now = new Date();
    const departureTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const arrivalTime = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newTrip = createTrip({
      orderId: order.id,
      orderCode: order.code,
      truckPlate: truck.plateNumber,
      driverName: truck.driverName,
      driverPhone: truck.driverPhone,
      volume: quickVolume,
      departureTime,
      arrivalEstimate: arrivalTime,
      status: 'DANG_NAP',
      slumpTested: quickSlump,
      grade: order.grade
    });

    const newAccumulated = order.deliveredVolume + quickVolume;
    setSuccessNotice(`Đã cấp xe ${truck.plateNumber} (${quickVolume} m³). Lũy kế cộng dồn tăng lên: ${newAccumulated} m³.`);
    setTimeout(() => setSuccessNotice(''), 5000);
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'DANG_NAP':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Đang nạp</span>;
      case 'DANG_CHAY':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Đang chạy</span>;
      case 'DEN_CONG_TRUONG':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Đã đến CT</span>;
      case 'DANG_XA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 animate-pulse">Đang xả bê tông</span>;
      case 'HOAN_THANH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Đã hoàn thành</span>;
      case 'QUAY_VE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">Đang về trạm</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Quay lại danh sách đơn hàng"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Quay lại danh sách</span>
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                MỤC CẤP HÀNG CÔNG TRÌNH
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-mono">
                {order.code}
              </span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {order.deliveryDate.split('-').reverse().join('/')}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1 truncate">
              {order.projectTitle}
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Khách hàng: <strong className="text-slate-800 uppercase">{order.customerName}</strong> • Hạng mục: <strong className="text-orange-600">{order.categoryItem}</strong>
            </p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onOpenCopyOrder && (order.orderType || 'CHINH') === 'CHINH' && (
            <button
              onClick={() => onOpenCopyOrder(order)}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Tạo Bản sao sang Đơn hàng phát sinh (chỉnh sửa trực tiếp)"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Bản sao phát sinh</span>
            </button>
          )}

          {onOpenEditOrder && (
            <button
              onClick={() => onOpenEditOrder(order)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              title="Chỉnh sửa thông tin cấp hàng, mác, sụt, ngày giờ..."
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Sửa thông tin cấp hàng</span>
            </button>
          )}

          <button
            onClick={() => onOpenPrintModal(order, orderTrips[0] || undefined)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-orange-700 rounded-xl transition cursor-pointer shadow-xs"
            title="In phiếu giao nhận bê tông giống Hình 2"
          >
            <Printer className="w-4 h-4 text-orange-600" />
            In phiếu (Hình 2)
          </button>

          <button
            onClick={onOpenAssignModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white text-xs font-bold rounded-xl shadow-md shadow-orange-900/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            + Cấp xe bồn / Xuất phiếu
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Cumulative Delivered Volume KPI & Project Specs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Volume Card (Lũy kế cộng dồn) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-bold text-orange-600 uppercase tracking-wider flex items-center justify-between">
              <span>LŨY KẾ CỘNG DỒN ĐÃ CẤP</span>
              <span className="font-bold text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                {percentCompleted}%
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900">
                {order.deliveredVolume}{' '}
                <span className="text-base font-semibold text-slate-500">
                  / {order.totalVolume} m³
                </span>
              </span>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md">
                {orderTrips.length} chuyến xe
              </span>
            </div>

            <div className="w-full bg-slate-100 h-3 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-[#e25822] h-full rounded-full transition-all duration-500"
                style={{ width: `${percentCompleted}%` }}
              />
            </div>
          </div>

          <div className="text-xs pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-slate-500">
              Khối lượng còn lại: <strong className="text-slate-900">{remainingVolume} m³</strong>
            </span>
            <span className={`font-bold ${remainingVolume === 0 ? 'text-emerald-600' : 'text-blue-600'}`}>
              {remainingVolume === 0 ? 'Đã hoàn tất 100%' : 'Đang cấp dồn'}
            </span>
          </div>
        </div>

        {/* Technical Concrete Specs */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3 lg:col-span-2">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2">
            THÔNG SỐ KỸ THUẬT & CẤP HÀNG CÔNG TRÌNH
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-400">Mác Bê Tông:</div>
              <div className="font-bold text-slate-900 text-sm mt-0.5">{order.grade}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-400">Độ sụt:</div>
              <div className="font-bold text-blue-700 text-sm mt-0.5">{order.slump} cm</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-[11px] text-slate-400">Phụ gia:</div>
              <div className="font-bold text-emerald-700 text-sm mt-0.5">{order.additive}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 truncate">
              <div className="text-[11px] text-slate-400">Bơm bê tông:</div>
              <div className="font-bold text-purple-700 text-sm mt-0.5 truncate">{order.pumpType}</div>
            </div>
          </div>

          <div className="text-xs text-slate-600 space-y-1 pt-1">
            <div className="flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>
                <strong>Địa điểm công trình:</strong>{' '}
                {order.notes || 'Đường N8, KCN Phước Đông, Phường Gia Lộc, Tỉnh Tây Ninh'}
              </span>
            </div>
            <div className="flex items-center gap-4 text-[11px] text-slate-500">
              <span>Người giao nhận: <strong>{order.contactPerson}</strong> ({order.contactPhone})</span>
              <span>•</span>
              <span>Trạm cấp: <strong>Trạm Tây Ninh</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Truck Bar right inside this project view */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-orange-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              CẤP THÊM XE BỒN & TĂNG LŨY KẾ CỘNG DỒN
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Thêm chuyến xe sẽ tự động tăng số lượng cộng dồn vào đơn</span>
        </div>

        <form onSubmit={handleQuickAddTruck} className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end text-xs">
          <div className="space-y-1 sm:col-span-2">
            <label className="font-semibold text-slate-700 flex items-center justify-between">
              <span>Chọn Tài Xế (Biển số xe đi theo) *</span>
              <span className="text-[10px] text-orange-600 font-bold">* Tự động đồng bộ</span>
            </label>
            <select
              value={selectedTruckPlate}
              onChange={(e) => setSelectedTruckPlate(e.target.value)}
              className="w-full p-2 border border-orange-300 rounded-xl bg-orange-50/40 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer text-xs shadow-xs"
            >
              {trucks.map(trk => (
                <option key={trk.id} value={trk.plateNumber}>
                  TX: {trk.driverName} ➔ Xe: {trk.plateNumber} ({trk.truckType})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Khối lượng chuyến (m³) *</label>
            <input
              type="number"
              min="1"
              max="15"
              step="0.5"
              required
              value={quickVolume}
              onChange={(e) => setQuickVolume(Number(e.target.value))}
              className="w-full p-2 border border-slate-300 rounded-xl font-black text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Độ sụt thực đo</label>
            <input
              type="text"
              value={quickSlump}
              onChange={(e) => setQuickSlump(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full p-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              + Cấp xe & Tăng lũy kế
            </button>
          </div>
        </form>
      </div>

      {/* Trips / Dispatches Table for this Project with Running Accumulation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <span>NHẬT KÝ CẤP XE BỒN & LŨY KẾ CỘNG DỒN TỪNG CHUYẾN</span>
              <span className="text-[11px] font-normal text-slate-500 normal-case">
                (Bấm vào dòng để sửa chi tiết phiếu)
              </span>
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {orderTrips.length} chuyến
            </span>
          </div>

          <button
            onClick={() => onOpenPrintModal(order, orderTrips[orderTrips.length - 1] || undefined)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-orange-600" />
            In phiếu chuyến mới nhất
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3 px-3">CHUYẾN SỐ</th>
                <th className="py-3 px-3">SỐ PHIẾU / NIÊM CHÌ</th>
                <th className="py-3 px-3">SỐ XE BỒN</th>
                <th className="py-3 px-3">LÁI XE PHỤ TRÁCH</th>
                <th className="py-3 px-3">GIỜ XUẤT</th>
                <th className="py-3 px-3 text-right">LƯỢNG XUẤT (m³)</th>
                <th className="py-3 px-3 text-right">LŨY KẾ CỘNG DỒN (m³)</th>
                <th className="py-3 px-3">ĐỘ SỤT</th>
                <th className="py-3 px-3">TRẠNG THÁI</th>
                <th className="py-3 px-3 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orderTrips.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Chưa có chuyến xe nào được điều phối cho công trình này. Nhập biểu mẫu bên trên để cấp xe bồn đầu tiên.
                  </td>
                </tr>
              ) : (
                orderTrips.map((trip, index) => {
                  const accumulated = trip.accumulatedVolume || (order.deliveredVolume);
                  return (
                    <tr
                      key={trip.id}
                      onClick={() => {
                        setEditingTrip(trip);
                        setIsEditTripOpen(true);
                      }}
                      className="hover:bg-orange-50/70 transition cursor-pointer group"
                      title="Bấm vào dòng này để chỉnh sửa chi tiết của phiếu (Số phiếu, số xe, tài xế, khối lượng...)"
                    >
                      <td className="py-3 px-3 font-bold text-slate-900">
                        Chuyến #{index + 1}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-orange-700 bg-orange-50/40">
                        <div className="flex items-center gap-1">
                          <span>{trip.ticketNumber}</span>
                          <Edit2 className="w-2.5 h-2.5 text-orange-400 opacity-0 group-hover:opacity-100 transition" />
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 text-xs">
                        {trip.truckPlate}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {trip.driverName}
                        <div className="text-[10px] text-slate-400">{trip.driverPhone}</div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{trip.departureTime}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-orange-600 text-sm">
                        {trip.volume} m³
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm bg-orange-50/40">
                        {accumulated} m³
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        {trip.slumpTested}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(trip.status)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Nút Sửa phiếu */}
                          <button
                            onClick={() => {
                              setEditingTrip(trip);
                              setIsEditTripOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] border border-blue-200 flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                            title="Chỉnh sửa chi tiết phiếu giao nhận này"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>Sửa phiếu</span>
                          </button>

                          {/* Nút In phiếu */}
                          <button
                            onClick={() => onOpenPrintModal(order, trip)}
                            className="px-2.5 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-[11px] border border-orange-200 flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
                            title="In phiếu giao nhận bê tông cho chuyến này (Hình 2)"
                          >
                            <Printer className="w-3.5 h-3.5 text-orange-600" />
                            <span>In phiếu (Hình 2)</span>
                          </button>

                          <select
                            value={trip.status}
                            onChange={(e) => updateTripStatus(trip.id, e.target.value as TripStatus)}
                            className="text-[10px] font-medium border border-slate-300 rounded px-1.5 py-1 bg-white cursor-pointer"
                          >
                            <option value="DANG_NAP">Đang nạp</option>
                            <option value="DANG_CHAY">Đang chạy</option>
                            <option value="DEN_CONG_TRUONG">Đến CT</option>
                            <option value="DANG_XA">Đang xả</option>
                            <option value="HOAN_THANH">Xong</option>
                            <option value="QUAY_VE">Quay về</option>
                          </select>
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

      {/* Modal Chỉnh Sửa Chi Tiết Phiếu Xuất Xe */}
      <EditTripModal
        isOpen={isEditTripOpen}
        onClose={() => setIsEditTripOpen(false)}
        trip={editingTrip}
        order={order}
        onOpenPrintModal={onOpenPrintModal}
      />
    </div>
  );
};
