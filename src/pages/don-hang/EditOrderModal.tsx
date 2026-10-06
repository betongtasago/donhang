import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Edit3, AlertCircle, FileText, CheckCircle2, UserCheck, Navigation, Truck, Search, Droplets, ShieldCheck } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { useAuth } from '../../auth/AuthContext';
import { ConcreteOrder, OrderStatus, OrderType, ProjectType } from '../../types';

interface EditOrderModalProps {
  order: ConcreteOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

const GRADE_LIST = [
  'M100',
  'M150',
  'M200',
  'M250',
  'M300',
  'M350',
  'M400',
  'M450',
  'M500',
  'M550',
  'M600'
];

const R_ADDITIVES = ['Không', 'R3', 'R7', 'R14', 'R28'];
const WATERPROOF_LIST = ['Không', 'B6', 'B8', 'B10', 'B12', 'B14', 'W6', 'W8', 'W10', 'W12'];

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose }) => {
  const { updateOrder, orders, projectDistances } = useSync();
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
  const [additiveR, setAdditiveR] = useState('R7');
  const [waterproof, setWaterproof] = useState('Không');
  const [pumpType, setPumpType] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [technicianName, setTechnicianName] = useState('');
  const [notes, setNotes] = useState('');
  const [plantLocation, setPlantLocation] = useState('Tây Ninh');

  // Danh sách công ty / khách hàng có sẵn để lọc chọn nhanh
  const uniqueCompanies = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach(o => {
      if (o.customerName?.trim()) {
        map.set(o.customerName.trim(), o.customerCode || '');
      }
    });
    projectDistances.forEach(p => {
      if (p.customerName?.trim()) {
        map.set(p.customerName.trim(), p.customerCode || '');
      }
    });
    return Array.from(map.entries()).map(([name, code]) => ({ name, code })).sort((a, b) => a.name.localeCompare(b.name));
  }, [orders, projectDistances]);

  // Danh sách công trình có sẵn
  const availableProjects = useMemo(() => {
    const list: Array<{ title: string; customerName: string; customerCode?: string; plant?: string }> = [];
    const seen = new Set<string>();
    const filterCust = customerName.trim().toLowerCase();

    orders.forEach(o => {
      if (o.projectTitle?.trim() && !seen.has(o.projectTitle.trim())) {
        if (!filterCust || o.customerName.toLowerCase().includes(filterCust)) {
          seen.add(o.projectTitle.trim());
          list.push({
            title: o.projectTitle.trim(),
            customerName: o.customerName,
            customerCode: o.customerCode,
            plant: o.plantLocation
          });
        }
      }
    });

    projectDistances.forEach(p => {
      if (p.projectTitle?.trim() && !seen.has(p.projectTitle.trim())) {
        if (!filterCust || p.customerName.toLowerCase().includes(filterCust)) {
          seen.add(p.projectTitle.trim());
          list.push({
            title: p.projectTitle.trim(),
            customerName: p.customerName,
            customerCode: p.customerCode
          });
        }
      }
    });

    return list.sort((a, b) => a.title.localeCompare(b.title));
  }, [orders, projectDistances, customerName]);

  const handleQuickSelectCompany = (compName: string) => {
    if (!compName) return;
    setCustomerName(compName);
    const found = uniqueCompanies.find(c => c.name === compName);
    if (found?.code) setCustomerCode(found.code);

    const matchedPrjs = availableProjects.filter(p => p.customerName.toLowerCase() === compName.toLowerCase());
    if (matchedPrjs.length > 0 && !matchedPrjs.some(p => p.title.toLowerCase() === projectTitle.toLowerCase())) {
      setProjectTitle(matchedPrjs[0].title);
      if (matchedPrjs[0].plant) setPlantLocation(matchedPrjs[0].plant);
    }
  };

  const handleQuickSelectProject = (prjTitle: string) => {
    if (!prjTitle) return;
    setProjectTitle(prjTitle);
    const found = availableProjects.find(p => p.title === prjTitle);
    if (found) {
      if (found.customerName) setCustomerName(found.customerName);
      if (found.customerCode) setCustomerCode(found.customerCode);
      if (found.plant) setPlantLocation(found.plant);
    }
  };

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

      if (order.additive?.includes('R3')) setAdditiveR('R3');
      else if (order.additive?.includes('R7')) setAdditiveR('R7');
      else if (order.additive?.includes('R14')) setAdditiveR('R14');
      else if (order.additive?.includes('R28')) setAdditiveR('R28');
      else setAdditiveR(order.additive || 'R7');

      setWaterproof(order.waterproof || 'Không');
      setPumpType(order.pumpType);
      setContactPerson(order.contactPerson);
      setContactPhone(order.contactPhone);
      setTechnicianName(order.technicianName || 'Nguyễn Văn Nam');
      setNotes(order.notes || '');
      setPlantLocation(order.plantLocation || 'Tây Ninh');
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const fullAdditiveText = [
      additiveR && additiveR !== 'Không' ? additiveR : '',
      waterproof && waterproof !== 'Không' ? `Chống thấm ${waterproof}` : ''
    ].filter(Boolean).join(' + ') || 'Không';

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
      additive: fullAdditiveText,
      waterproof: waterproof !== 'Không' ? waterproof : undefined,
      pumpType,
      contactPerson,
      contactPhone,
      technicianName,
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

          {/* Mục lọc chọn nhanh Công ty & Công trình */}
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>LỌC CHỌN NHANH CÔNG TY & CÔNG TRÌNH:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-semibold text-blue-900 text-[10px]">
                  Chọn nhanh Công ty:
                </label>
                <select
                  value={customerName}
                  onChange={(e) => handleQuickSelectCompany(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Chọn công ty trong hệ thống --</option>
                  {uniqueCompanies.map((c, idx) => (
                    <option key={`edit-comp-${idx}`} value={c.name}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-blue-900 text-[10px]">
                  Chọn nhanh Công trình:
                </label>
                <select
                  value={projectTitle}
                  onChange={(e) => handleQuickSelectProject(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer"
                >
                  <option value="">-- Chọn công trình tương ứng --</option>
                  {availableProjects.map((p, idx) => (
                    <option key={`edit-prj-${idx}`} value={p.title}>
                      {p.title} ({p.customerName})
                    </option>
                  ))}
                </select>
              </div>
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

              <div className="space-y-1 col-span-2">
                <label className="text-[11px] font-semibold text-slate-600">Hạng mục đổ *</label>
                <input
                  type="text"
                  required
                  value={categoryItem}
                  onChange={(e) => setCategoryItem(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs text-orange-600"
                />
              </div>
            </div>
          </div>

          {/* Technical Specs & Volume */}
          <div className="space-y-3 p-3.5 bg-amber-50/60 rounded-xl border border-amber-200">
            <div className="font-bold text-amber-900 text-xs border-b border-amber-200 pb-1">
              Thông số Bê Tông & Khối Lượng Cấp
            </div>

            {/* Mác M100 - M600 */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-slate-800">Mác bê tông (M100 - M600) *</label>
                <span className="font-mono font-bold text-orange-600 text-xs">{grade}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {['M100', 'M150', 'M200', 'M250', 'M300', 'M350', 'M400', 'M450', 'M500', 'M550', 'M600'].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGrade(g)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border transition cursor-pointer ${
                      grade === g ? 'bg-orange-600 text-white border-orange-700' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* R Additive & Waterproof */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-800">Phụ gia đông kết (R)</label>
                <div className="flex flex-wrap gap-1">
                  {['Không', 'R3', 'R7', 'R14', 'R28'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setAdditiveR(r)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                        additiveR === r ? 'bg-amber-600 text-white border-amber-700' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800">Phụ gia chống thấm</label>
                  <span className="font-bold text-cyan-700 text-xs">{waterproof}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {WATERPROOF_LIST.map((w) => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setWaterproof(w)}
                      className={`px-2 py-0.5 rounded text-[11px] font-bold border transition cursor-pointer ${
                        waterproof === w ? 'bg-cyan-600 text-white border-cyan-700' : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {w === 'Không' ? 'K.Thấm' : w}
                    </button>
                  ))}
                </div>
                <div className="pt-1 flex items-center gap-1.5">
                  <input
                    type="text"
                    placeholder="Hoặc nhập loại chống thấm khác (VD: B14, Sika...)"
                    value={!WATERPROOF_LIST.includes(waterproof) ? waterproof : ''}
                    onChange={(e) => setWaterproof(e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-cyan-300 rounded-lg bg-white placeholder-slate-400"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
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
              <label className="text-[11px] font-semibold text-slate-600">Giờ giao hàng *</label>
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
