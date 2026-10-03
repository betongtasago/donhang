import React, { useState, useEffect } from 'react';
import { X, Truck, Check, AlertCircle, FileText, UserCheck, Edit3 } from 'lucide-react';
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
  const [selectedTruckId, setSelectedTruckId] = useState<string>(availableTrucks[0]?.id || trucks[0]?.id || '');
  const [truckPlate, setTruckPlate] = useState<string>(availableTrucks[0]?.plateNumber || '51B-33618');
  const [driverName, setDriverName] = useState<string>(availableTrucks[0]?.driverName || 'Nguyễn Văn Thọ');
  const [driverPhone, setDriverPhone] = useState<string>(availableTrucks[0]?.driverPhone || '0903 112 018');
  const [volume, setVolume] = useState<number>(10);
  const [slumpTested, setSlumpTested] = useState('14.0 cm');

  useEffect(() => {
    const selected = trucks.find(t => t.id === selectedTruckId);
    if (selected) {
      setTruckPlate(selected.plateNumber);
      setDriverName(selected.driverName);
      setDriverPhone(selected.driverPhone);
    }
  }, [selectedTruckId, trucks]);

  const handleDriverChange = (name: string) => {
    setDriverName(name);
    const matched = trucks.find(t => t.driverName.toLowerCase().trim() === name.toLowerCase().trim());
    if (matched) {
      setSelectedTruckId(matched.id);
      setTruckPlate(matched.plateNumber);
      setDriverPhone(matched.driverPhone);
    }
  };

  const handleTruckPlateChange = (plate: string) => {
    setTruckPlate(plate);
    const matched = trucks.find(t => t.plateNumber.toLowerCase().trim() === plate.toLowerCase().trim());
    if (matched) {
      setSelectedTruckId(matched.id);
      setDriverName(matched.driverName);
      setDriverPhone(matched.driverPhone);
    }
  };

  if (!isOpen) return null;

  const currentTruck = trucks.find(t => t.id === selectedTruckId) || availableTrucks[0];

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckPlate.trim()) {
      alert('Vui lòng nhập biển số xe điều phối');
      return;
    }

    const now = new Date();
    const departureTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const arrivalTime = `${String((now.getHours() + 1) % 24).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    createTrip({
      orderId: order.id,
      orderCode: order.code,
      truckPlate: truckPlate.trim(),
      driverName: driverName.trim() || 'Tài xế giao nhận',
      driverPhone: driverPhone.trim() || '0903 555 777',
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
            <div className="p-2 rounded-xl bg-orange-600">
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

          {/* Quick select fleet truck or driver */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Chọn theo tên tài xế (Biển số xe tự động đi theo):</span>
                <span className="text-[10px] text-orange-600 font-bold">* Tự động đồng bộ</span>
              </label>
              <select
                value={trucks.some(t => t.driverName.toLowerCase() === driverName.toLowerCase()) ? driverName : ''}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="w-full px-3 py-2 bg-orange-50/50 border border-orange-300 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
              >
                <option value="">-- Chọn tên tài xế --</option>
                {trucks.map(trk => (
                  <option key={trk.id} value={trk.driverName}>
                    {trk.driverName} ➔ Xe: {trk.plateNumber} ({trk.truckType})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Hoặc chọn theo biển số xe bồn:</label>
              <select
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-orange-500 focus:outline-none cursor-pointer"
              >
                {trucks.map(trk => (
                  <option key={trk.id} value={trk.id}>
                    {trk.plateNumber} ({trk.truckType}) - TX: {trk.driverName} - [{trk.status === 'SAN_SANG' ? 'Sẵn sàng' : 'Đang hoạt động'}]
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* EDITABLE DRIVER NAME AND TRUCK PLATE */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <Edit3 className="w-3.5 h-3.5 text-orange-600" />
              <span>Chỉnh sửa thông tin xe và tài xế chuyến này:</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Tên tài xế phụ trách *</label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  placeholder="Nguyễn Văn Hùng"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 focus:border-orange-500 rounded-lg font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Biển số xe bồn *</label>
                <input
                  type="text"
                  required
                  value={truckPlate}
                  onChange={(e) => handleTruckPlateChange(e.target.value)}
                  placeholder="51B-33618"
                  className="w-full px-3 py-1.5 bg-white border border-amber-300 focus:border-orange-500 rounded-lg font-mono font-bold text-xs uppercase"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Khối lượng chuyến (m³) *</label>
              <input
                type="number"
                min="0.5"
                max="16"
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

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer"
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
