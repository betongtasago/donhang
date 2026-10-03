import React from 'react';
import { DispatchTrip, ConcreteOrder, TripStatus } from '../../types';
import { Truck, Plus, CheckCircle2, Clock, Navigation, AlertCircle, FileText, Edit2 } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

interface DispatchPanelProps {
  order: ConcreteOrder | null;
  onOpenDispatchAssign: () => void;
  onPrintTrip?: (trip: DispatchTrip) => void;
  onEditTrip?: (trip: DispatchTrip) => void;
}

export const DispatchPanel: React.FC<DispatchPanelProps> = ({ order, onOpenDispatchAssign, onPrintTrip, onEditTrip }) => {
  const { trips, updateTripStatus } = useSync();

  const orderTrips = order ? trips.filter(t => t.orderId === order.id || t.orderCode === order.code) : [];

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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">Đã giao xong</span>;
      case 'QUAY_VE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800">Đang về trạm</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Title & Action */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            ĐIỀU PHỐI ĐỘI XE BỒN
          </span>
          <span className="text-xs font-bold text-slate-500">({orderTrips.length} chuyến)</span>
        </div>

        <button
          onClick={onOpenDispatchAssign}
          disabled={!order}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#e25822] hover:bg-[#d04d1c] text-white rounded-lg text-xs font-bold transition shadow-xs disabled:opacity-50"
        >
          <Plus className="w-3.5 h-3.5" />
          Cấp xe bồn / Phiếu mới
        </button>
      </div>

      {/* Trips list */}
      <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
        {orderTrips.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
            {order ? 'Chưa có chuyến xe nào được điều phối cho đơn này. Bấm "+ Cấp xe bồn / Phiếu mới" để xuất xe.' : 'Vui lòng chọn đơn hàng.'}
          </div>
        ) : (
          orderTrips.map((trip, idx) => (
            <div
              key={trip.id}
              className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                  #{idx + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs">{trip.truckPlate}</span>
                    <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                      {trip.volume} m³
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">[{trip.ticketNumber}]</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>TX: <strong>{trip.driverName}</strong></span>
                    <span>•</span>
                    <span>Độ sụt: {trip.slumpTested}</span>
                    <span>•</span>
                    <span>Xuất: {trip.departureTime}</span>
                  </div>
                </div>
              </div>

              {/* Status & Change status & Print & Edit */}
              <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                {getStatusBadge(trip.status)}

                {onEditTrip && (
                  <button
                    onClick={() => onEditTrip(trip)}
                    className="p-1.5 rounded-lg bg-white hover:bg-blue-50 border border-slate-300 text-blue-600 transition cursor-pointer"
                    title="Chỉnh sửa chi tiết phiếu (Mã phiếu, số xe, tài xế...)"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {onPrintTrip && (
                  <button
                    onClick={() => onPrintTrip(trip)}
                    className="p-1.5 rounded-lg bg-white hover:bg-slate-200 border border-slate-300 text-slate-700 transition cursor-pointer"
                    title="In phiếu giao nhận bê tông (Hình 2)"
                  >
                    <FileText className="w-3.5 h-3.5 text-orange-600" />
                  </button>
                )}

                <select
                  value={trip.status}
                  onChange={(e) => updateTripStatus(trip.id, e.target.value as TripStatus)}
                  className="text-[11px] font-medium border border-slate-300 rounded px-1.5 py-1 bg-white text-slate-700 cursor-pointer focus:outline-none"
                >
                  <option value="DANG_NAP">Đang nạp</option>
                  <option value="DANG_CHAY">Đang chạy</option>
                  <option value="DEN_CONG_TRUONG">Đã đến CT</option>
                  <option value="DANG_XA">Đang xả</option>
                  <option value="QUAY_VE">Quay về</option>
                  <option value="HOAN_THANH">Hoàn thành</option>
                </select>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
