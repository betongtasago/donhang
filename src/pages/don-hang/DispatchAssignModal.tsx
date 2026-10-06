import React, { useState, useEffect } from 'react';
import {
  X,
  Truck,
  Check,
  AlertCircle,
  FileText,
  UserCheck,
  Edit3,
  Clock,
  Calendar,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder } from '../../types';

interface DispatchAssignModalProps {
  order: ConcreteOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const DispatchAssignModal: React.FC<DispatchAssignModalProps> = ({ order, isOpen, onClose }) => {
  const { trucks, createTrip, trips } = useSync();

  const availableTrucks = trucks.filter(t => t.status === 'SAN_SANG' || t.status === 'DANG_CHAY');
  const [selectedTruckId, setSelectedTruckId] = useState<string>(availableTrucks[0]?.id || trucks[0]?.id || '');
  const [truckPlate, setTruckPlate] = useState<string>(availableTrucks[0]?.plateNumber || '51B-33618');
  const [driverName, setDriverName] = useState<string>(availableTrucks[0]?.driverName || 'Nguyễn Văn Thọ');
  const [driverPhone, setDriverPhone] = useState<string>(availableTrucks[0]?.driverPhone || '0903 112 018');
  const [volume, setVolume] = useState<number>(10);

  // Quản lý thời gian xuất phiếu & giao hàng (User yêu cầu: Khi tạo phiếu phải cho chỉnh thời gian)
  const getInitialTimes = () => {
    const now = new Date();
    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(now.getMinutes()).padStart(2, '0');
    const curY = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const curD = String(now.getDate()).padStart(2, '0');
    let initDate = `${curY}-${curMonth}-${curD}`;

    if (order.deliveryDate) {
      if (order.deliveryDate.includes('/')) {
        const parts = order.deliveryDate.split('/');
        if (parts.length === 3) {
          initDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      } else if (order.deliveryDate.includes('-')) {
        initDate = order.deliveryDate;
      }
    }

    return {
      dep: `${curH}:${curM}`,
      date: initDate
    };
  };

  const [departureTime, setDepartureTime] = useState<string>(() => getInitialTimes().dep);
  const [deliveryDate, setDeliveryDate] = useState<string>(() => getInitialTimes().date);

  // Số phiếu và số niêm chì tùy chỉnh
  const generateTicketSeq = () => {
    const seq = String(trips.length + 190).padStart(3, '0');
    return `0160${seq}`;
  };

  const generateSealCode = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
  };

  const [ticketNumber, setTicketNumber] = useState<string>(generateTicketSeq);
  const [sealNumber, setSealNumber] = useState<string>(generateSealCode);

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

  // Helper chỉnh nhanh thời gian (+15p, +30p, -15p, Bây giờ)
  const handleShiftDepartureMinutes = (minutesOffset: number) => {
    try {
      const parts = departureTime.split(':');
      let h = parseInt(parts[0], 10) || 0;
      let m = parseInt(parts[1], 10) || 0;
      let totalM = h * 60 + m + minutesOffset;
      if (totalM < 0) totalM += 24 * 60;
      totalM = totalM % (24 * 60);

      const newH = String(Math.floor(totalM / 60)).padStart(2, '0');
      const newM = String(totalM % 60).padStart(2, '0');
      setDepartureTime(`${newH}:${newM}`);
    } catch {
      // Ignore
    }
  };

  const handleResetToNow = () => {
    const now = new Date();
    const curH = String(now.getHours()).padStart(2, '0');
    const curM = String(now.getMinutes()).padStart(2, '0');
    setDepartureTime(`${curH}:${curM}`);

    const curY = now.getFullYear();
    const curMonth = String(now.getMonth() + 1).padStart(2, '0');
    const curD = String(now.getDate()).padStart(2, '0');
    setDeliveryDate(`${curY}-${curMonth}-${curD}`);
  };

  if (!isOpen) return null;

  const currentTruck = trucks.find(t => t.id === selectedTruckId) || availableTrucks[0];

  const handleDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!truckPlate.trim()) {
      alert('Vui lòng nhập biển số xe điều phối');
      return;
    }

    // Định dạng ngày dạng DD/MM/YYYY
    let formattedDeliveryDate = order.deliveryDate || '06/10/2026';
    if (deliveryDate) {
      if (deliveryDate.includes('-')) {
        const [y, m, d] = deliveryDate.split('-');
        formattedDeliveryDate = `${d}/${m}/${y}`;
      } else {
        formattedDeliveryDate = deliveryDate;
      }
    }

    createTrip({
      orderId: order.id,
      orderCode: order.code,
      truckPlate: truckPlate.trim(),
      driverName: driverName.trim() || 'Tài xế giao nhận',
      driverPhone: driverPhone.trim() || '0903 555 777',
      volume,
      departureTime: departureTime.trim(),
      arrivalEstimate: '',
      deliveryDate: formattedDeliveryDate,
      entryDate: `${formattedDeliveryDate} ${departureTime.trim()}`,
      ticketNumber: ticketNumber.trim() || undefined,
      sealNumber: sealNumber.trim() || undefined,
      status: 'DANG_NAP',
      slumpTested: order.slump || '10+-2',
      grade: order.grade
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-600">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Cấp Xe Bồn & Xuất Phiếu Giao Hàng</span>
                <span className="text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded border border-orange-500/30">
                  {ticketNumber}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">Đơn hàng: {order.code} - {order.grade}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleDispatch} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
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

          {/* ========================================================================= */}
          {/* USER REQUIREMENT: KHI TẠO PHIẾU PHẢI CHO CHỈNH THỜI GIAN                 */}
          {/* ========================================================================= */}
          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-blue-900 font-bold text-xs flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                <span>Thời Gian Cấp Bê Tông & Xuất Phiếu (Tùy Chỉnh)</span>
              </label>
              <button
                type="button"
                onClick={handleResetToNow}
                className="text-[10px] text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100 px-2 py-1 rounded-md border border-blue-300 font-bold flex items-center gap-1 cursor-pointer transition"
                title="Lấy giờ hiện tại trên đồng hồ máy tính"
              >
                <span>Bây giờ</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ngày cấp */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Ngày xuất phiếu *</span>
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Giờ xuất trạm */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-600" />
                  <span>Giờ trạm xuất *</span>
                </label>
                <input
                  type="time"
                  required
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-orange-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Phím tắt chỉnh nhanh giờ */}
            <div className="flex items-center gap-1.5 pt-1 flex-wrap">
              <span className="text-[10px] text-slate-500 font-medium">Chỉnh nhanh giờ xuất:</span>
              <button
                type="button"
                onClick={() => handleShiftDepartureMinutes(-15)}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold cursor-pointer transition"
              >
                -15p
              </button>
              <button
                type="button"
                onClick={() => handleShiftDepartureMinutes(15)}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold cursor-pointer transition"
              >
                +15p
              </button>
              <button
                type="button"
                onClick={() => handleShiftDepartureMinutes(30)}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold cursor-pointer transition"
              >
                +30p
              </button>
              <button
                type="button"
                onClick={() => handleShiftDepartureMinutes(45)}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold cursor-pointer transition"
              >
                +45p
              </button>
              <button
                type="button"
                onClick={() => handleShiftDepartureMinutes(60)}
                className="px-2 py-0.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded text-[10px] font-bold cursor-pointer transition"
              >
                +1 giờ
              </button>
            </div>
          </div>

          {/* SỐ PHIẾU VÀ SỐ CHÌ (CHỈNH SỬA / TỰ SINH) */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Số phiếu xuất</label>
                <button
                  type="button"
                  onClick={() => setTicketNumber(generateTicketSeq())}
                  className="text-[10px] text-orange-600 hover:underline cursor-pointer"
                >
                  Đổi số
                </button>
              </div>
              <input
                type="text"
                value={ticketNumber}
                onChange={(e) => setTicketNumber(e.target.value)}
                placeholder="0160195"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-700">Số niêm chì</label>
                <button
                  type="button"
                  onClick={() => setSealNumber(generateSealCode())}
                  className="text-[10px] text-orange-600 hover:underline cursor-pointer"
                >
                  Tạo mới
                </button>
              </div>
              <input
                type="text"
                value={sealNumber}
                onChange={(e) => setSealNumber(e.target.value)}
                placeholder="849201"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
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

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs">Khối lượng chuyến xe cấp (m³) *</label>
              <div className="flex items-center gap-1">
                {[6, 8, 9, 10, 12].map(v => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVolume(v)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                      volume === v
                        ? 'bg-orange-600 text-white border-orange-600 shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {v}m³
                  </button>
                ))}
              </div>
            </div>
            <input
              type="number"
              min="0.5"
              max="16"
              step="0.5"
              required
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-orange-600 text-sm focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
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
              className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer hover-lift-sm"
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
