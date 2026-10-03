import React, { useState } from 'react';
import { X, Truck, Check, AlertCircle, FileText } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder } from '../../types';

interface DispatchAssignModalProps {
  order: ConcreteOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchAssignModal: React.FC<DispatchAssignModalProps> = ({ order, isOpen, onClose }) => {
  const { trucks, createTrip } = useSync();

  const availableTrucks = trucks.filter(t => t.status === 'SAN_SANG' || t.status === 'DANG_CHAY');
  const [selectedTruckPlate, setSelectedTruckPlate] = useState(availableTrucks[0]?.plateNumber || '70C-128.45');
  const [volume, setVolume] = useState<number>(10);
  const [slumpTested, setSlumpTested] = useState('14.0 cm');

  if (!isOpen) return null;

  const currentTruck = trucks.find(t => t.plateNumber === selectedTruckPlate) || availableTrucks[0];

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTruck) {
      alert('Không tìm thấy xe được chọn');
      return;
    }

    const now = new Date();
    const departureTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const arrivalTime = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    createTrip({
      orderId: order.id,
      orderCode: order.code,
      truckPlate: currentTruck.plateNumber,
      driverName: currentTruck.driverName,
      driverPhone: currentTruck.driverPhone,
      volume,
      departureTime,
      arrivalEstimate: arrivalTime,
      status: 'DANG_NAP',
      slumpTested,
      grade: order.grade
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-600">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold">Cấp Xe Bồn & Xuất Phiếu Giao Hàng</h2>
              <p className="text-[11px] text-slate-400">Đơn hàng: {order.code} - {order.grade}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleDispatch} className="p-6 space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-semibold text-slate-800 text-xs truncate">{order.customerName}</div>
            <div className="text-[11px] text-slate-500 mt-0.5 truncate">{order.projectTitle} - {order.categoryItem}</div>
            <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-slate-200">
              <span>Đã cấp hiện tại: <strong>{order.deliveredVolume} / {order.totalVolume} m³</strong></span>
              <span className="text-orange-600 font-bold">
                Sau khi cấp xe: {order.deliveredVolume + volume} m³ (Lũy kế cộng dồn)
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Chọn xe bồn bê tông điều động *</label>
            <select
              value={selectedTruckPlate}
              onChange={(e) => setSelectedTruckPlate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none"
            >
              {trucks.map(trk => (
                <option key={trk.id} value={trk.plateNumber}>
                  {trk.plateNumber} ({trk.truckType}) - TX: {trk.driverName} - [{trk.status === 'SAN_SANG' ? 'Sẵn sàng' : 'Đang hoạt động'}]
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Khối lượng chuyến (m³) *</label>
              <input
                type="number"
                min="1"
                max="14"
                step="0.5"
                required
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Độ sụt kiểm tra tại trạm</label>
              <input
                type="text"
                value={slumpTested}
                onChange={(e) => setSlumpTested(e.target.value)}
                placeholder="14.0 cm"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          {currentTruck && (
            <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-amber-900 space-y-1 text-[11px]">
              <div><strong>Tài xế phụ trách:</strong> {currentTruck.driverName} ({currentTruck.driverPhone})</div>
              <div><strong>Nhiên liệu còn:</strong> {currentTruck.fuelLevel}% | Số chuyến hôm nay: {currentTruck.tripsToday} chuyến</div>
              <div><strong>Trạm trộn:</strong> Trạm Tây Ninh 1 (Cân nạp tự động Silo)</div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4" />
              Xuất phiếu & Điều xe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
