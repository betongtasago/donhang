import React from 'react';
import { ConcreteOrder } from '../../types';
import { FileText, CheckCircle2, Clock, Phone, MapPin, Gauge, Droplets, ShieldCheck, ChevronRight } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

interface OrderDetailPanelProps {
  order: ConcreteOrder | null;
  onOpenDispatchAssign: () => void;
}

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({ order, onOpenDispatchAssign }) => {
  const { updateOrder } = useSync();

  if (!order) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex items-center justify-center min-h-[300px] text-slate-400 text-xs">
        Chọn một đơn hàng từ bảng phía trên để xem chi tiết cấp hàng
      </div>
    );
  }

  const percent = Math.min(100, Math.round((order.deliveredVolume / order.totalVolume) * 100));
  const remaining = Math.max(0, order.totalVolume - order.deliveredVolume);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-orange-600" />
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            CHI TIẾT ĐƠN HÀNG
          </span>
          <span className="text-xs font-bold text-slate-900 ml-1">[{order.code}]</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.status}
            onChange={(e) => updateOrder(order.id, { status: e.target.value as any })}
            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500 cursor-pointer"
          >
            <option value="CHO_DUYET">Chờ duyệt</option>
            <option value="DA_DUYET">Đã duyệt</option>
            <option value="DANG_CHAY">Đang chạy</option>
            <option value="HOAN_THANH">Hoàn thành</option>
            <option value="TAM_HOAN">Tạm hoãn</option>
          </select>
        </div>
      </div>

      {/* Progress & Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
        {/* Progress bar / donut */}
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-200"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-orange-600 transition-all duration-500 ease-out"
                strokeDasharray={`${percent}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-xs font-bold text-slate-800">{percent}%</span>
          </div>
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Tiến độ cấp hàng</div>
            <div className="text-sm font-bold text-slate-800">
              {order.deliveredVolume} <span className="text-xs font-normal text-slate-500">/ {order.totalVolume} m³</span>
            </div>
            <div className="text-[11px] text-orange-600 font-semibold">Còn: {remaining} m³</div>
          </div>
        </div>

        {/* Technical specs */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 sm:col-span-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Gauge className="w-3.5 h-3.5 text-orange-600" />
              <span>Mác bê tông: <strong className="text-slate-900">{order.grade}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Độ sụt: <strong className="text-slate-900">{order.slump} cm</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phụ gia: <strong className="text-slate-900">{order.additive}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600 truncate">
              <Clock className="w-3.5 h-3.5 text-purple-600" />
              <span>Bơm: <strong className="text-slate-900 truncate">{order.pumpType}</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Details list */}
      <div className="text-xs space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-start gap-2">
          <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <span className="text-slate-500">Công trình: </span>
            <span className="font-semibold text-slate-800">{order.projectTitle}</span>
            <span className="text-slate-400 mx-1">•</span>
            <span className="text-orange-600 font-semibold">{order.categoryItem}</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-500">Liên hệ:</span>
            <span className="font-semibold text-slate-800">{order.contactPerson} - {order.contactPhone}</span>
          </div>
          <div className="text-slate-400 text-[11px]">
            Trạm cấp: <strong className="text-slate-700">{order.plantLocation}</strong>
          </div>
        </div>

        {order.notes && (
          <div className="p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-[11px] text-amber-900">
            <strong>Ghi chú điều phối:</strong> {order.notes}
          </div>
        )}
      </div>
    </div>
  );
};
