import React, { useState, useEffect } from 'react';
import { X, Save, Shield, AlertTriangle } from 'lucide-react';
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

  const isAccountant = currentUser?.role === 'ACCOUNTANT' || isAdmin;

  const [orderType, setOrderType] = useState<OrderType>('CHINH');
  const [projectType, setProjectType] = useState<ProjectType>('DA');
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [categoryItem, setCategoryItem] = useState('');
  const [totalVolume, setTotalVolume] = useState<number>(0);
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

  useEffect(() => {
    if (order) {
      setOrderType(order.orderType || 'CHINH');
      setProjectType(order.projectType || 'DA');
      setCustomerCode(order.customerCode || '');
      setCustomerName(order.customerName);
      setProjectTitle(order.projectTitle);
      setCategoryItem(order.categoryItem);
      setTotalVolume(order.totalVolume);
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
      totalVolume,
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
      notes
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-600">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Chỉnh Sửa Đơn Hàng: <span className="font-mono text-orange-400">{order.code}</span>
              </h2>
              <p className="text-xs text-slate-400">
                {isAdmin ? 'Quyền Quản Trị Viên (Admin) - Toàn quyền chỉnh sửa' : 'Quyền Kế Toán - Chỉnh sửa thông tin đơn hàng'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Order type and status */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="space-y-1">
              <label className="font-bold text-slate-700">Phân loại đơn hàng</label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value as OrderType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="CHINH">Đơn hàng chính</option>
                <option value="PHAT_SINH">Đơn hàng phát sinh</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-bold text-slate-700">Trạng thái đơn hàng</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="CHO_DUYET">Chờ duyệt</option>
                <option value="DA_DUYET">Đã duyệt</option>
                <option value="DANG_CHAY">Đang chạy</option>
                <option value="HOAN_THANH">Hoàn thành</option>
                <option value="TAM_HOAN">Tạm hoãn</option>
              </select>
            </div>
          </div>

          {/* Customer & Project info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700">Tên khách hàng / Nhà thầu</label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mã khách hàng</label>
              <input
                type="text"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg uppercase"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="font-semibold text-slate-700">Tên công trình</label>
              <input
                type="text"
                required
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Loại công trình</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
              >
                <option value="DA">Dự án (DA)</option>
                <option value="DD">Dân dụng (DD)</option>
              </select>
            </div>
          </div>

          {/* Volume, Component, Km & Technician */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">KLĐH (m³)</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={totalVolume}
                onChange={(e) => setTotalVolume(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-orange-600"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Cự ly (km)</label>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="font-semibold text-slate-700">Hạng mục</label>
              <input
                type="text"
                required
                value={categoryItem}
                onChange={(e) => setCategoryItem(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mã mác bê tông</label>
              <input
                type="text"
                required
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Độ sụt</label>
              <input
                type="text"
                required
                value={slump}
                onChange={(e) => setSlump(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Phụ gia</label>
              <input
                type="text"
                value={additive}
                onChange={(e) => setAdditive(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Bơm</label>
              <input
                type="text"
                value={pumpType}
                onChange={(e) => setPumpType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Date, Time & Technician */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Ngày giao</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Giờ giao</label>
              <input
                type="time"
                required
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Kỹ thuật phụ trách (Giao nhận)</label>
              <input
                type="text"
                required
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Ghi chú trên phiếu</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Đã cấp: <strong>{order.deliveredVolume} / {order.totalVolume} m³</strong>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
