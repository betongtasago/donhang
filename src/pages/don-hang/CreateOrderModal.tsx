import React, { useState, useEffect } from 'react';
import { X, Plus, Copy, AlertCircle, Shield, FileText, CheckCircle2, Building, Sparkles } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { useAuth } from '../../auth/AuthContext';
import { ConcreteOrder, OrderStatus, OrderType, ProjectType } from '../../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultOrderType?: OrderType;
  defaultCopyFromOrder?: ConcreteOrder | null;
  onCreated?: (newOrder: ConcreteOrder) => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  defaultOrderType = 'CHINH',
  defaultCopyFromOrder = null,
  onCreated
}) => {
  const { createOrder, orders, selectedPlant, projectDistances } = useSync();
  const { currentUser, isAdmin } = useAuth();

  // Role permissions:
  // "đơn hàng chính do tài khoản kế toán tạo admin vẫn có quyền chỉnh sửa, đơn hàng phát sinh do tài khoản người dùng tạo có thể copy bản sao từ đơn hàng chính"
  const isAccountant = currentUser?.role === 'ACCOUNTANT' || isAdmin;

  // Order type: forced to PHAT_SINH if user is not accountant/admin
  const [orderType, setOrderType] = useState<OrderType>(
    !isAccountant ? 'PHAT_SINH' : (defaultOrderType || 'CHINH')
  );

  // Selected parent order for copying
  const [selectedParentId, setSelectedParentId] = useState<string>(
    defaultCopyFromOrder?.id || ''
  );

  // Form inputs
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('DA');
  const [categoryItem, setCategoryItem] = useState('Sàn');
  const [totalVolume, setTotalVolume] = useState<number>(50);
  const [deliveryDate, setDeliveryDate] = useState('2026-10-03');
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [grade, setGrade] = useState('M300');
  const [slump, setSlump] = useState('14±2');
  const [additive, setAdditive] = useState('R7');
  const [pumpType, setPumpType] = useState('Bơm cần 43m');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [technicianName, setTechnicianName] = useState('Nguyễn Văn Nam');
  const [distanceKm, setDistanceKm] = useState<number>(15);
  const [notes, setNotes] = useState('');
  const [plantLocation, setPlantLocation] = useState(selectedPlant || 'Tây Ninh');

  // List of primary orders that can be copied
  const primaryOrders = orders.filter(o => o.orderType === 'CHINH');

  // Handle auto-population when copying from a primary order
  const handleSelectParentToCopy = (parentId: string) => {
    setSelectedParentId(parentId);
    const parent = orders.find(o => o.id === parentId);
    if (!parent) return;

    setCustomerCode(parent.customerCode || '');
    setCustomerName(parent.customerName);
    setProjectTitle(parent.projectTitle);
    setProjectType(parent.projectType || 'DA');
    setCategoryItem(`${parent.categoryItem} (Phát sinh)`);
    setGrade(parent.grade);
    setSlump(parent.slump);
    setAdditive(parent.additive);
    setPumpType(parent.pumpType);
    setContactPerson(parent.contactPerson);
    setContactPhone(parent.contactPhone);
    setTechnicianName(parent.technicianName || 'Nguyễn Văn Nam');
    setDistanceKm(parent.distanceKm || 15);
    setPlantLocation(parent.plantLocation);
    setTotalVolume(10); // default smaller additional batch
    setNotes(`Đơn phát sinh thêm khối lượng cho đơn chính ${parent.code}`);
  };

  // Sync initial state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!isAccountant) {
        setOrderType('PHAT_SINH');
      } else {
        setOrderType(defaultOrderType);
      }

      if (defaultCopyFromOrder) {
        setOrderType('PHAT_SINH');
        handleSelectParentToCopy(defaultCopyFromOrder.id);
      } else {
        setSelectedParentId('');
      }
    }
  }, [isOpen, defaultCopyFromOrder, defaultOrderType, isAccountant]);

  // When project title changes, check if we have pre-configured km
  const handleProjectTitleChange = (title: string) => {
    setProjectTitle(title);
    const matchedPrj = projectDistances.find(p => p.projectTitle.toLowerCase() === title.toLowerCase());
    if (matchedPrj) {
      setCustomerName(matchedPrj.customerName);
      setCustomerCode(matchedPrj.customerCode);
      setProjectType(matchedPrj.projectType);
      setDistanceKm(matchedPrj.distanceKm);
      if (matchedPrj.technicianDefault) {
        setTechnicianName(matchedPrj.technicianDefault);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !projectTitle || totalVolume <= 0) {
      alert('Vui lòng nhập đầy đủ Tên khách hàng, Tên công trình và Khối lượng hợp lệ.');
      return;
    }

    const parentOrder = selectedParentId ? orders.find(o => o.id === selectedParentId) : undefined;

    const newOrder = createOrder({
      orderType,
      parentOrderId: orderType === 'PHAT_SINH' ? selectedParentId || undefined : undefined,
      parentOrderCode: orderType === 'PHAT_SINH' ? parentOrder?.code || undefined : undefined,
      projectType,
      customerCode: customerCode.trim() || undefined,
      customerName,
      projectTitle,
      categoryItem,
      totalVolume,
      deliveryDate,
      deliveryTime,
      grade,
      slump,
      additive,
      pumpType,
      contactPerson: contactPerson || 'Chỉ huy trưởng',
      contactPhone: contactPhone || '0900 000 000',
      technicianName,
      distanceKm: Number(distanceKm) || 15,
      notes,
      plantLocation,
      status: 'DA_DUYET' as OrderStatus,
      createdByRole: currentUser?.role || 'DISPATCHER',
      createdByName: currentUser?.fullName || 'Người dùng hệ thống'
    });

    if (onCreated) {
      onCreated(newOrder);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                orderType === 'CHINH' ? 'bg-blue-500 text-white' : 'bg-orange-500 text-white'
              }`}>
                {orderType === 'CHINH' ? 'ĐƠN HÀNG CHÍNH' : 'ĐƠN HÀNG PHÁT SINH'}
              </span>
              <h2 className="text-base font-bold flex items-center gap-2">
                {orderType === 'CHINH' ? 'Tạo Đơn Hàng Chính Mới' : 'Tạo Đơn Hàng Phát Sinh (Sao chép)'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {orderType === 'CHINH'
                ? 'Đơn hàng chính do Kế toán tạo (Admin có toàn quyền chỉnh sửa/duyệt)'
                : 'Đơn phát sinh do tài khoản người dùng/điều phối tạo, có thể sao chép nhanh từ đơn chính'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Order Type Selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-orange-600" />
                PHÂN LOẠI ĐƠN HÀNG *
              </label>

              {!isAccountant && (
                <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Tài khoản người dùng: Tạo đơn hàng phát sinh
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!isAccountant}
                onClick={() => setOrderType('CHINH')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                  orderType === 'CHINH'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Đơn hàng chính (Kế toán / Admin)</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('PHAT_SINH')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 border transition ${
                  orderType === 'PHAT_SINH'
                    ? 'bg-orange-600 text-white border-orange-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Đơn hàng phát sinh (Người dùng / Điều phối)</span>
              </button>
            </div>
          </div>

          {/* If Incurred Order: Option to copy from a Primary Order */}
          {orderType === 'PHAT_SINH' && (
            <div className="bg-orange-50/80 p-3.5 rounded-xl border border-orange-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-orange-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-600" />
                  SAO CHÉP BẢN SAO TỪ ĐƠN HÀNG CHÍNH:
                </span>
                <span className="text-[10px] text-orange-700">Tự động điền đầy đủ mác, sụt, công trình</span>
              </div>

              <select
                value={selectedParentId}
                onChange={(e) => handleSelectParentToCopy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="">-- Chọn một đơn hàng chính để nhân bản --</option>
                {primaryOrders.map((ord) => (
                  <option key={ord.id} value={ord.id}>
                    [{ord.code}] {ord.customerName} - {ord.projectTitle} ({ord.categoryItem} - {ord.grade})
                  </option>
                ))}
              </select>

              {selectedParentId && (
                <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-amber-950 flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>
                    <strong>Bản sao đang liên kết đơn gốc:</strong> Đã sao chép khách hàng, công trình, mác bê tông. <strong>Bạn có thể chỉnh sửa trực tiếp khối lượng, ngày giờ giao và hạng mục phát sinh ở các ô bên dưới.</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Quick select from pre-configured project distance catalog */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-600">Chọn nhanh từ danh mục công trình đã có cự ly km:</label>
            </div>
            <select
              onChange={(e) => {
                const prj = projectDistances.find(p => p.id === e.target.value);
                if (prj) {
                  setCustomerName(prj.customerName);
                  setCustomerCode(prj.customerCode);
                  setProjectTitle(prj.projectTitle);
                  setProjectType(prj.projectType);
                  setDistanceKm(prj.distanceKm);
                  if (prj.technicianDefault) setTechnicianName(prj.technicianDefault);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs cursor-pointer"
            >
              <option value="">-- Chọn công trình từ danh mục cự ly km --</option>
              {projectDistances.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.projectType}] {p.projectTitle} - {p.customerName} ({p.distanceKm} km)
                </option>
              ))}
            </select>
          </div>

          {/* Customer & Project info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700">Tên khách hàng / Công ty *</label>
              <input
                type="text"
                required
                placeholder="VD: CÔNG TY CỔ PHẦN DEVELOPMENT"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mã khách hàng / C.Trình</label>
              <input
                type="text"
                placeholder="VD: CT-PD01"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none uppercase"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700">Tên công trình *</label>
              <input
                type="text"
                required
                placeholder="VD: DỰ ÁN KCN PHƯỚC ĐÔNG"
                value={projectTitle}
                onChange={(e) => handleProjectTitleChange(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Loại công trình *</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 cursor-pointer font-bold text-slate-800"
              >
                <option value="DA">Dự án (DA)</option>
                <option value="DD">Dân dụng (DD)</option>
              </select>
            </div>
          </div>

          {/* Volume, Component, Distance & Tech */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Khối lượng đặt (m³) *</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={totalVolume}
                onChange={(e) => setTotalVolume(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-orange-600 focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Cự ly trạm (km) *</label>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-orange-500"
                title="Cự ly 1 chiều dùng tính chuyến và tính km cho tài xế"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="font-semibold text-slate-700">Hạng mục cấu kiện *</label>
              <input
                type="text"
                required
                placeholder="VD: LÓT, Sàn, Cột, Đài móng..."
                value={categoryItem}
                onChange={(e) => setCategoryItem(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Technical Specs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mã mác bê tông *</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="M150R28">M150R28</option>
                <option value="M200R28">M200R28</option>
                <option value="M250R28">M250R28</option>
                <option value="M300R28">M300R28</option>
                <option value="M350R28">M350R28</option>
                <option value="M350R7">M350R7</option>
                <option value="M400R28">M400R28</option>
                <option value="M400R7">M400R7</option>
                <option value="M500R28">M500R28</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Độ sụt thiết kế *</label>
              <input
                type="text"
                value={slump}
                onChange={(e) => setSlump(e.target.value)}
                placeholder="10+-2, 14+-2..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Phụ gia kỹ thuật</label>
              <input
                type="text"
                value={additive}
                onChange={(e) => setAdditive(e.target.value)}
                placeholder="R7, R28, Sika..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Phương pháp bơm</label>
              <select
                value={pumpType}
                onChange={(e) => setPumpType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="Xả máng trực tiếp">Xả máng trực tiếp</option>
                <option value="Bơm cần 37m">Bơm cần 37m</option>
                <option value="Bơm cần 43m">Bơm cần 43m</option>
                <option value="Bơm cần 52m">Bơm cần 52m</option>
                <option value="Bơm tĩnh 100m">Bơm tĩnh 100m</option>
              </select>
            </div>
          </div>

          {/* Delivery Schedule & Technician */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Ngày sản xuất / giao hàng *</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Thời gian cấp *</label>
              <input
                type="time"
                required
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Giao nhận (Kỹ thuật phụ trách) *</label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn Nam"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Contact Person & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Người liên hệ công trường</label>
              <input
                type="text"
                placeholder="VD: Anh Tuấn (Chỉ huy phó)"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Số điện thoại liên hệ</label>
              <input
                type="text"
                placeholder="VD: 0908 123 456"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Ghi chú trên phiếu</label>
            <textarea
              rows={2}
              placeholder="Yêu cầu kiểm tra độ sụt, đường xe vào, thời gian giữa các chuyến..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              Người tạo: <strong>{currentUser?.fullName}</strong> ({currentUser?.roleTitle})
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
              >
                Hủy bỏ
              </button>

              <button
                type="submit"
                className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs transition"
              >
                {orderType === 'CHINH' ? '+ Tạo đơn hàng chính' : '+ Tạo đơn hàng phát sinh'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
