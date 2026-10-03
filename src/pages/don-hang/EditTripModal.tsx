import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Truck,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Hash,
  Scale,
  Activity,
  Save,
  Printer
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ConcreteOrder, DispatchTrip, TripStatus } from '../../types';

interface EditTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: DispatchTrip | null;
  order: ConcreteOrder;
  onOpenPrintModal?: (order: ConcreteOrder, trip?: DispatchTrip) => void;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  isOpen,
  onClose,
  trip,
  order,
  onOpenPrintModal
}) => {
  const { trucks, updateTripDetails } = useSync();

  const [ticketNumber, setTicketNumber] = useState('');
  const [sealNumber, setSealNumber] = useState('');
  const [truckPlate, setTruckPlate] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [volume, setVolume] = useState<number>(0);
  const [slumpTested, setSlumpTested] = useState('');
  const [status, setStatus] = useState<TripStatus>('DANG_CHAY');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (trip) {
      setTicketNumber(trip.ticketNumber || '');
      setSealNumber(trip.sealNumber || '');
      setTruckPlate(trip.truckPlate || '');
      setDriverName(trip.driverName || '');
      setDriverPhone(trip.driverPhone || '');
      setDepartureTime(trip.departureTime || '');
      setArrivalTime(trip.arrivalTime || '');
      setVolume(trip.volume || 0);
      setSlumpTested(trip.slumpTested || order.slump || '10+-2');
      setStatus(trip.status || 'DANG_CHAY');
      setNotes(trip.notes || '');
    }
  }, [trip, order]);

  if (!isOpen || !trip) return null;

  const handleTruckChange = (plate: string) => {
    setTruckPlate(plate);
    const selectedTruck = trucks.find(t => t.plateNumber === plate);
    if (selectedTruck) {
      setDriverName(selectedTruck.driverName);
      setDriverPhone(selectedTruck.driverPhone);
    }
  };

  const handleDriverChange = (name: string) => {
    setDriverName(name);
    // Tự động tìm xe bồn mặc định theo tên tài xế
    const matchedTruck = trucks.find(
      t => t.driverName.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (matchedTruck) {
      setTruckPlate(matchedTruck.plateNumber);
      setDriverPhone(matchedTruck.driverPhone);
    }
  };

  const handleSave = (andPrint = false) => {
    const updates: Partial<DispatchTrip> = {
      ticketNumber: ticketNumber.trim() || trip.ticketNumber,
      sealNumber: sealNumber.trim(),
      truckPlate: truckPlate.trim(),
      driverName: driverName.trim(),
      driverPhone: driverPhone.trim(),
      departureTime: departureTime.trim(),
      arrivalTime: arrivalTime.trim(),
      volume: Number(volume) || trip.volume,
      slumpTested: slumpTested.trim(),
      status,
      notes: notes.trim()
    };

    updateTripDetails(trip.id, updates);

    if (andPrint && onOpenPrintModal) {
      onClose();
      onOpenPrintModal(order, { ...trip, ...updates });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#e25822] flex items-center justify-center text-white font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold flex items-center gap-2">
                <span>Chỉnh Sửa Chi Tiết Phiếu Xuất Xe</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                  {trip.ticketNumber}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Đơn hàng: <strong className="text-white">{order.code}</strong> • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Box 1: Mã trên phiếu & Niêm chì (Đồng bộ trực tiếp với Báo cáo sản xuất) */}
          <div className="p-3.5 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-2.5">
            <div className="text-[11px] font-bold text-orange-950 uppercase tracking-wide flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-orange-600" />
              <span>Mã Số Phiếu (Đồng bộ với Báo Cáo Sản Xuất)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Số Phiếu In Trên Phiếu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ticketNumber}
                  onChange={(e) => setTicketNumber(e.target.value)}
                  placeholder="Ví dụ: PKX-261003-107 hoặc 0160190"
                  className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs shadow-xs"
                />
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Mã này sẽ in trên phiếu và hiển thị trong Báo cáo sản xuất
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Số Niêm Chì (Seal)
                </label>
                <input
                  type="text"
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  placeholder="Ví dụ: NC-99812"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Box 2: Chọn tài xế & Xe bồn (Biển số xe tự động đi theo danh sách mặc định) */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-orange-600" />
                <span>Chọn Tài Xế & Xe Bồn Điều Động</span>
              </label>
              <span className="text-[10px] text-orange-600 font-semibold">
                * Biển số xe tự động đi theo tài xế
              </span>
            </div>

            {/* Dropdown chọn nhanh tài xế (biển số xe tự đi theo) */}
            <div className="space-y-1">
              <select
                value={trucks.some(t => t.driverName.toLowerCase() === driverName.toLowerCase()) ? driverName : ''}
                onChange={(e) => handleDriverChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs shadow-xs cursor-pointer"
              >
                <option value="">-- Chọn tài xế từ danh sách mặc định (Xe tự động đổi) --</option>
                {trucks.map(trk => (
                  <option key={trk.id} value={trk.driverName}>
                    {trk.driverName} ➔ Xe: {trk.plateNumber} ({trk.truckType})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Họ Tên Lái Xe <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  placeholder="Ví dụ: Lê Hoàng Long"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Biển Số Xe Bồn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={truckPlate}
                  onChange={(e) => handleTruckChange(e.target.value)}
                  placeholder="Ví dụ: 70C-109.88"
                  className="w-full px-3 py-2 border border-orange-300 rounded-xl font-mono font-black text-orange-700 bg-orange-50/30 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Số Điện Thoại Lái Xe
                </label>
                <input
                  type="text"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  placeholder="Ví dụ: 0922 444 555"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs bg-white"
                />
              </div>
            </div>
          </div>

          {/* Box 3: Khối lượng, Độ sụt & Giờ xuất */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Khối Lượng Xuất (m³) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="20"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-orange-300 rounded-xl font-black text-orange-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-orange-50/20"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Độ Sụt Thực Tế
              </label>
              <input
                type="text"
                value={slumpTested}
                onChange={(e) => setSlumpTested(e.target.value)}
                placeholder="10+-2 hoặc 12+-2"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Giờ Xuất Trạm
              </label>
              <input
                type="text"
                value={departureTime}
                onChange={(e) => setDepartureTime(e.target.value)}
                placeholder="13:40"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Trạng Thái Chuyến
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TripStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs bg-white cursor-pointer"
              >
                <option value="DANG_NAP">Đang nạp mẻ</option>
                <option value="DANG_CHAY">Đang chạy</option>
                <option value="DANG_XA">Đang xả bê tông</option>
                <option value="HOAN_THANH">Đã hoàn thành</option>
                <option value="QUAY_VE">Quay về trạm</option>
              </select>
            </div>
          </div>

          {/* Ghi chú */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Ghi Chú Trên Phiếu (Nếu có)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú thêm về cự ly, bơm, hoặc yêu cầu công trường..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-bold transition cursor-pointer"
          >
            Hủy bỏ
          </button>

          <div className="flex items-center gap-2">
            {onOpenPrintModal && (
              <button
                type="button"
                onClick={() => handleSave(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                title="Lưu lại và mở ngay cửa sổ in phiếu"
              >
                <Printer className="w-3.5 h-3.5 text-orange-400" />
                <span>Lưu & In Phiếu</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSave(false)}
              className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-orange-900/10 active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Lưu Chi Tiết Phiếu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
