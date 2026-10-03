import React, { useState, useEffect } from 'react';
import { X, Save, Edit3, AlertCircle, FileText, CheckCircle2, UserCheck, Navigation, Truck } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { useAuth } from '../../auth/AuthContext';
import { ConcreteOrder, OrderStatus, OrderType, ProjectType } from '../../types';

interface EditOrderModalProps {
  order: ConcreteOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose }) => {
  const { updateOrder, projectDistances } = useSync();
  const { currentUser, isAdmin } = useAuth();

  const [orderType, setOrderType] = useState<OrderType>('CHINH');
  const [projectType, setProjectType] = useState<ProjectType>('DA');
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [categoryItem, setCategoryItem] = useState('');
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [deliveredVolume, setDeliveredVolume] = useState<number>(0);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [status, setStatus] = useState<OrderStatus>('DA_DUYET');
  const [grade, setGrade] = useState('');
  const [slump, setSlump] = useState('');
  const [additive, setAdditive] = useState('');
  const [pumpType, setPumpType] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(15);
  const [notes, setNotes] = useState('');
  const [plantLocation, setPlantLocation] = useState('Tây Ninh');

  useEffect(() => {
    if (order) {
      setOrderType(order.orderType || 'CHINH');
      setProjectType(order.projectType || 'DA');
      setCustomerCode(order.customerCode || '');
      setCustomerName(order.customerName);
      setProjectTitle(order.projectTitle);
      setCategoryItem(order.categoryItem);
      setTotalVolume(order.totalVolume);
      setDeliveredVolume(order.deliveredVolume || 0);
      setDeliveryDate(order.deliveryDate);
      setDeliveryTime(order.deliveryTime);
      setStatus(order.status);
      setGrade(order.grade);
      setSlump(order.slump);
      setAdditive(order.additive);
      setPumpType(order.pumpType);
      setContactPerson(order.contactPerson);
      setContactPhone(order.contactPhone);
      setTechnicianName(order.technicianName || 'Nguyễn Văn Nam');
      setDistanceKm(order.distanceKm || 15);
      setNotes(order.notes || '');
      setPlantLocation(order.plantLocation || 'Tây Ninh');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    updateOrder(order.id, {
      orderType,
      projectType,
      customerCode: customerCode.trim() || undefined,
      customerName,
      projectTitle,
      categoryItem,
      totalVolume: Number(totalVolume),
      deliveredVolume: Number(deliveredVolume),
      deliveryDate,
      deliveryTime,
      status,
      grade,
      slump,
      additive,
      pumpType,
      contactPerson,
      contactPhone,
      technicianName,
      distanceKm: Number(distanceKm) || 15,
      plantLocation,
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-600">
              <Edit3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold flex items-center gap-2">
                Chỉnh Sửa Thông Tin Cấp Hàng: <span className="font-mono text-orange-400">{order.code}</span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {order.orderType === 'PHAT_SINH'
                  ? `Đơn hàng phát sinh ${order.parentOrderCode ? `(Gốc từ: ${order.parentOrderCode})` : ''}`
                  : 'Đơn hàng chính (Hợp đồng kế toán)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Order type & Status Banner */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Phân loại đơn hàng</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-xs bg-white focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="CHINH">ĐƠN HÀNG CHÍNH</option>
                <option value="PHAT_SINH">ĐƠN HÀNG PHÁT SINH</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Trạng thái cấp hàng</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg font-bold text-xs bg-white text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="CHO_DUYET">Chờ duyệt</option>
                <option value="DA_DUYET">Đã duyệt (Sẵn sàng cấp)</option>
                <option value="DANG_CHAY">Đang chạy cấp hàng</option>
                <option value="HOAN_THANH">Đã hoàn thành</option>
                <option value="TAM_HOAN">Tạm hoãn cấp hàng</option>
              </select>
            </div>
          </div>

          {/* Customer & Project */}
          <div className="space-y-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-800 text-xs border-b border-slate-200 pb-1 flex items-center justify-between">
              <span>Thông tin Khách Hàng & Công Trình</span>
              <span className="text-[10px] font-normal text-slate-500">Mã KH: {customerCode || '---'}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Tên khách hàng *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Tên công trình *</label>
                <input
                  type="text"
                  required
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Loại C.Trình</label>
                <select
                  value={projectType}
                  onChange={(e) => setProjectType(e.target.value as ProjectType)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-semibold text-xs"
                >
                  <option value="DA">Dự án (DA)</option>
                  <option value="DD">Dân dụng (DD)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Hạng mục đổ *</label>
                <input
                  type="text"
                  required
                  value={categoryItem}
                  onChange={(e) => setCategoryItem(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs text-orange-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-600">Cự ly vận chuyển (km)</label>
                <input
                  type="number"
                  step="0.5"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
                />
              </div>
            </div>
          </div>

          {/* Technical Specs & Volume */}
          <div className="space-y-3 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
            <div className="font-bold text-amber-900 text-xs border-b border-amber-200 pb-1">
              Thông số Bê Tông & Khối Lượng Cấp
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Mác bê tông *</label>
                <input
                  type="text"
                  required
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-mono font-black text-xs text-orange-600"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Độ sụt *</label>
                <input
                  type="text"
                  required
                  value={slump}
                  onChange={(e) => setSlump(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg font-bold text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Phụ gia</label>
                <input
                  type="text"
                  value={additive}
                  onChange={(e) => setAdditive(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Loại bơm</label>
                <input
                  type="text"
                  value={pumpType}
                  onChange={(e) => setPumpType(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-800">Tổng khối lượng đặt hàng (m³) *</label>
                <input
                  type="number"
                  step="0.5"
                  required
                  min="0.5"
                  value={totalVolume}
                  onChange={(e) => setTotalVolume(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-400 rounded-lg font-black text-xs text-orange-600 text-center"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-800">Khối lượng đã cấp (m³)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={deliveredVolume}
                  onChange={(e) => setDeliveredVolume(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 bg-white border border-amber-400 rounded-lg font-black text-xs text-blue-700 text-center"
                />
              </div>
            </div>
          </div>

          {/* Delivery Schedule & Personnel */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Ngày giao bê tông *</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Giờ giao dự kiến *</label>
              <input
                type="time"
                required
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-600">Kỹ thuật giao nhận</label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                placeholder="Nguyễn Văn Nam"
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-slate-700">Ghi chú điều phối cấp hàng</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú vị trí đổ, đường vào công trình, sụt mác đặc thù..."
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Thông Tin Cấp Hàng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
