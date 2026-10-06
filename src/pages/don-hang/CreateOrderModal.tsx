import React, { useState, useEffect, useMemo } from 'react';
import { X, Plus, Copy, AlertCircle, Shield, FileText, CheckCircle2, Building, Sparkles, Droplets, ShieldCheck, Search } from 'lucide-react';
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
const SLUMP_LIST = ['10±2', '12±2', '14±2', '16±2', '18±2', '20±2'];

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  defaultOrderType = 'CHINH',
  defaultCopyFromOrder = null,
  onCreated
}) => {
  const { createOrder, orders, selectedPlant, projectDistances } = useSync();
  const { currentUser, isAdmin } = useAuth();

  const isAccountant = currentUser?.role === 'ACCOUNTANT' || isAdmin;

  // Order type
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
  const [deliveryDate, setDeliveryDate] = useState('2026-10-06');
  const [deliveryTime, setDeliveryTime] = useState('08:00');

  // Specs
  const [grade, setGrade] = useState('M300');
  const [slump, setSlump] = useState('14±2');
  const [additiveR, setAdditiveR] = useState('R7'); // Phụ gia đông kết riêng
  const [waterproof, setWaterproof] = useState('Không'); // Phụ gia chống thấm riêng
  const [pumpType, setPumpType] = useState('Bơm cần 43m');

  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [technicianName, setTechnicianName] = useState('Nguyễn Văn Nam');
  const [notes, setNotes] = useState('');
  const [plantLocation, setPlantLocation] = useState(selectedPlant || 'Tây Ninh');

  // Danh sách công ty / khách hàng có sẵn để lọc chọn nhanh
  const uniqueCompanies = useMemo(() => {
    const map = new Map<string, string>(); // name -> code
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

  // Danh sách công trình có sẵn (được lọc theo công ty nếu đã chọn công ty)
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

  // Handle quick select company
  const handleQuickSelectCompany = (compName: string) => {
    if (!compName) return;
    setCustomerName(compName);
    const found = uniqueCompanies.find(c => c.name === compName);
    if (found?.code) setCustomerCode(found.code);

    // Auto-select first associated project if current project doesn't match
    const matchedPrjs = availableProjects.filter(p => p.customerName.toLowerCase() === compName.toLowerCase());
    if (matchedPrjs.length > 0 && !matchedPrjs.some(p => p.title.toLowerCase() === projectTitle.toLowerCase())) {
      setProjectTitle(matchedPrjs[0].title);
      if (matchedPrjs[0].plant) setPlantLocation(matchedPrjs[0].plant);
    }
  };

  // Handle quick select project
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

    // Extract R additive if stored
    if (parent.additive?.includes('R3')) setAdditiveR('R3');
    else if (parent.additive?.includes('R7')) setAdditiveR('R7');
    else if (parent.additive?.includes('R14')) setAdditiveR('R14');
    else if (parent.additive?.includes('R28')) setAdditiveR('R28');
    else setAdditiveR(parent.additive || 'R7');

    setWaterproof(parent.waterproof || 'Không');
    setPumpType(parent.pumpType);
    setContactPerson(parent.contactPerson);
    setContactPhone(parent.contactPhone);
    setTechnicianName(parent.technicianName || 'Nguyễn Văn Nam');
    setPlantLocation(parent.plantLocation);
    setTotalVolume(10);
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !projectTitle || totalVolume <= 0) {
      alert('Vui lòng nhập đầy đủ Tên khách hàng, Tên công trình và Khối lượng hợp lệ.');
      return;
    }

    const parentOrder = selectedParentId ? orders.find(o => o.id === selectedParentId) : undefined;

    // Build comprehensive additive string
    const fullAdditiveText = [
      additiveR && additiveR !== 'Không' ? additiveR : '',
      waterproof && waterproof !== 'Không' ? `Chống thấm ${waterproof}` : ''
    ].filter(Boolean).join(' + ') || 'Không';

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
      additive: fullAdditiveText,
      waterproof: waterproof !== 'Không' ? waterproof : undefined,
      pumpType,
      contactPerson: contactPerson || 'Chỉ huy trưởng',
      contactPhone: contactPhone || '0900 000 000',
      technicianName,
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
                {orderType === 'CHINH' ? 'Tạo Đơn Hàng Chính Mới' : 'Tạo Đơn Hàng Phát Sinh (Điều phối)'}
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
              <span className="font-bold text-slate-900">LOẠI ĐƠN HÀNG:</span>
              {!isAccountant && (
                <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Tài khoản điều phối / người dùng: Tạo đơn hàng phát sinh
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
                  SAO CHÉP BẢN SAO TỪ ĐƠN HÀNG CHÍNH (NẾU CÓ):
                </span>
                <span className="text-[10px] text-orange-700">Tự động điền đầy đủ mác, sụt, công trình</span>
              </div>

              <select
                value={selectedParentId}
                onChange={(e) => handleSelectParentToCopy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-orange-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
              >
                <option value="">-- Tạo đơn phát sinh độc lập (Không sao chép từ đơn nào) --</option>
                {primaryOrders.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.code}] {p.customerName} - {p.projectTitle} ({p.grade} - {p.totalVolume}m³)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* ================================================================= */}
          {/* MỤC LỌC CHỌN CÔNG TY & CÔNG TRÌNH NHANH (Theo yêu cầu)           */}
          {/* ================================================================= */}
          <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-blue-950 text-xs">
                <Search className="w-4 h-4 text-blue-600" />
                <span>LỌC CHỌN NHANH CÔNG TY & CÔNG TRÌNH CÓ SẴN:</span>
              </div>
              <span className="text-[10px] text-blue-600 font-semibold">Tự động điền mã và công trình</span>
            </div>

            {/* Gợi ý công ty thường gặp 1 chạm */}
            {uniqueCompanies.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pb-1">
                <span className="text-[10px] text-blue-900 font-bold">Gợi ý nhanh:</span>
                {uniqueCompanies.slice(0, 6).map((c, idx) => (
                  <button
                    key={`quick-comp-btn-${idx}`}
                    type="button"
                    onClick={() => handleQuickSelectCompany(c.name)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition cursor-pointer border ${
                      customerName === c.name
                        ? 'bg-blue-600 text-white border-blue-700 shadow-2xs'
                        : 'bg-white text-slate-700 border-blue-200 hover:bg-blue-100/70'
                    }`}
                  >
                    {c.name.replace('CÔNG TY CỔ PHẦN ', 'CTCP ').replace('CÔNG TY TNHH ', 'TNHH ')}
                  </button>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Lọc chọn Công ty nhanh */}
              <div className="space-y-1">
                <label className="font-semibold text-blue-900 text-[11px]">
                  1. Chọn nhanh Công ty / Khách hàng:
                </label>
                <select
                  value={customerName}
                  onChange={(e) => handleQuickSelectCompany(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn công ty có sẵn trong hệ thống --</option>
                  {uniqueCompanies.map((c, idx) => (
                    <option key={`comp-${idx}`} value={c.name}>
                      {c.name} {c.code ? `(${c.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lọc chọn Công trình nhanh */}
              <div className="space-y-1">
                <label className="font-semibold text-blue-900 text-[11px]">
                  2. Chọn nhanh Công trình tương ứng:
                </label>
                <select
                  value={projectTitle}
                  onChange={(e) => handleQuickSelectProject(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-bold text-slate-800 cursor-pointer focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn công trình tương ứng --</option>
                  {availableProjects.map((p, idx) => (
                    <option key={`prj-${idx}`} value={p.title}>
                      {p.title} ({p.customerName})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Customer & Project info Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700">Tên khách hàng / Công ty *</label>
              <input
                type="text"
                required
                placeholder="VD: CÔNG TY CỔ PHẦN AZB"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mã khách hàng / C.Trình</label>
              <input
                type="text"
                placeholder="VD: CT-PD01"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none uppercase"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700">Tên công trình *</label>
              <input
                type="text"
                required
                placeholder="VD: DỰ ÁN KCN PHƯỚC ĐÔNG"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Loại công trình *</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer font-bold text-slate-800"
              >
                <option value="DA">Dự án (DA)</option>
                <option value="DD">Dân dụng (DD)</option>
              </select>
            </div>
          </div>

          {/* Volume, Component & Delivery Time (ĐÃ BỎ CỰ LY KM THEO YÊU CẦU) */}
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-black text-blue-700 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1 col-span-1 sm:col-span-3">
              <label className="font-semibold text-slate-700">Hạng mục cấu kiện *</label>
              <input
                type="text"
                required
                placeholder="VD: LÓT, Sàn, Cột, Đài móng..."
                value={categoryItem}
                onChange={(e) => setCategoryItem(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* MÃ MÁC ĐA DẠNG M100 - M600 (KÈM NÚT LỌC CHỌN NHANH)              */}
          {/* ================================================================= */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>MÃ MÁC BÊ TÔNG (M100 - M600):</span>
                <span className="text-blue-600 font-mono text-sm font-black">{grade}</span>
              </label>
              <span className="text-[11px] text-slate-500">Bấm chọn nhanh mác:</span>
            </div>

            {/* Quick Pills M100 to M600 */}
            <div className="flex flex-wrap gap-1.5">
              {GRADE_LIST.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer border ${
                    grade === g
                      ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border-slate-300'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="pt-1 flex items-center gap-2">
              <span className="text-slate-500 text-[11px]">Hoặc nhập mác tùy chỉnh:</span>
              <input
                type="text"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-32 px-2 py-1 bg-white border border-slate-300 rounded font-mono font-bold text-xs"
                placeholder="M300"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* TÁCH RIÊNG PHỤ GIA R VÀ PHỤ GIA CHỐNG THẤM (KÈM CHỌN NHANH)      */}
          {/* ================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Phụ gia đông kết R */}
            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-amber-950 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-amber-600" />
                  <span>PHỤ GIA ĐÔNG KẾT (R):</span>
                </label>
                <span className="font-mono font-bold text-amber-800 text-xs">{additiveR}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {R_ADDITIVES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setAdditiveR(r)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      additiveR === r
                        ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                        : 'bg-white text-amber-900 hover:bg-amber-100/70 border-amber-300'
                    }`}
                  >
                    {r === 'Không' ? 'Không phụ gia R' : `${r} (${r === 'R3' ? '3 ngày' : r === 'R7' ? '7 ngày' : r === 'R14' ? '14 ngày' : '28 ngày'})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Phụ gia chống thấm các loại B */}
            <div className="p-3 bg-cyan-50/70 rounded-xl border border-cyan-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-cyan-950 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                  <span>CHỐNG THẤM CÁC LOẠI (B):</span>
                </label>
                <span className="font-mono font-bold text-cyan-800 text-xs">{waterproof}</span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {WATERPROOF_LIST.map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => setWaterproof(w)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      waterproof === w
                        ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs'
                        : 'bg-white text-cyan-900 hover:bg-cyan-100/70 border-cyan-300'
                    }`}
                  >
                    {w === 'Không' ? 'Không chống thấm' : `C.Thấm ${w}`}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-cyan-900 font-semibold">Hoặc nhập cấp chống thấm khác:</span>
                <input
                  type="text"
                  placeholder="VD: B14, W12, Sika..."
                  value={waterproof === 'Không' ? '' : waterproof}
                  onChange={(e) => setWaterproof(e.target.value || 'Không')}
                  className="px-2 py-0.5 bg-white border border-cyan-300 rounded text-xs font-bold w-28 text-cyan-900 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Slump & Pump */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700">Độ sụt thiết kế *</label>
                <span className="text-[11px] text-slate-500">Bấm chọn:</span>
              </div>
              <div className="flex flex-wrap gap-1 mb-1">
                {SLUMP_LIST.map((sl) => (
                  <button
                    key={sl}
                    type="button"
                    onClick={() => setSlump(sl)}
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      slump === sl ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {sl}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={slump}
                onChange={(e) => setSlump(e.target.value)}
                placeholder="10+-2, 14+-2..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Phương pháp bơm *</label>
              <select
                value={pumpType}
                onChange={(e) => setPumpType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold"
              >
                <option value="Xả máng trực tiếp">Xả máng trực tiếp</option>
                <option value="Bơm cần 37m">Bơm cần 37m</option>
                <option value="Bơm cần 43m">Bơm cần 43m</option>
                <option value="Bơm cần 52m">Bơm cần 52m</option>
                <option value="Bơm tĩnh 100m">Bơm tĩnh 100m</option>
              </select>
            </div>
          </div>

          {/* Date, Time, Plant & Contact */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Ngày giao hàng *</label>
              <input
                type="date"
                required
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Giờ giao hàng *</label>
              <input
                type="time"
                required
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Trạm sản xuất *</label>
              <select
                value={plantLocation}
                onChange={(e) => setPlantLocation(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 cursor-pointer font-semibold"
              >
                <option value="Tây Ninh">Trạm Tây Ninh</option>
                <option value="Bình Dương">Trạm Bình Dương</option>
                <option value="Long An">Trạm Long An</option>
                <option value="TP.HCM">Trạm TP.HCM</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Người phụ trách KCS</label>
              <input
                type="text"
                value={technicianName}
                onChange={(e) => setTechnicianName(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="font-semibold text-slate-700">Ghi chú đơn hàng / Yêu cầu đặc biệt</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Cần 2 xe liên tục, giao sau 14h, thử độ sụt tại công trường..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Actions Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-white font-bold flex items-center gap-2 shadow-sm transition cursor-pointer ${
                orderType === 'CHINH'
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-orange-600 hover:bg-orange-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{orderType === 'CHINH' ? 'Xác Nhận Tạo Đơn Hàng' : 'Xác Nhận Tạo Đơn Phát Sinh'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
