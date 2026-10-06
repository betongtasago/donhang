import React, { useState, useMemo } from 'react';
import {
  Truck,
  User,
  Phone,
  Plus,
  Edit2,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Shield,
  Layers,
  Save,
  Download,
  Calendar
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { FleetTruck, TruckStatus } from '../../types';
import * as XLSX from 'xlsx';

export const DanhSachTaiXePage: React.FC = () => {
  const { trucks, addTruck, updateTruck, deleteTruck, updateTruckStatus } = useSync();

  const [activeTab, setActiveTab] = useState<'ALL' | '8m3' | '10m3' | 'OTHER'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('ALL');

  // Modal thêm/sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<FleetTruck | null>(null);

  // Form states
  const [formCode, setFormCode] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState<string>('Xe bồn 10m³');
  const [formStatus, setFormStatus] = useState<TruckStatus>('SAN_SANG');
  const [formTareWeight, setFormTareWeight] = useState<number>(14500);
  const [formWeighDate, setFormWeighDate] = useState('03/10/2026');
  const [formPlant, setFormPlant] = useState('Trạm TSG-TNT 1');
  const [formNote, setFormNote] = useState('');

  // Counts
  const count8m3 = trucks.filter(t => t.capacityM3 === 8 || t.truckType.includes('8m³')).length;
  const count10m3 = trucks.filter(t => t.capacityM3 === 10 || t.truckType.includes('10m³')).length;
  const countOther = trucks.filter(t => !t.truckType.includes('8m³') && !t.truckType.includes('10m³')).length;

  const filteredTrucks = useMemo(() => {
    return trucks.filter(t => {
      const matchTab =
        activeTab === 'ALL' ||
        (activeTab === '8m3' && (t.capacityM3 === 8 || t.truckType.includes('8m³'))) ||
        (activeTab === '10m3' && (t.capacityM3 === 10 || t.truckType.includes('10m³'))) ||
        (activeTab === 'OTHER' && !t.truckType.includes('8m³') && !t.truckType.includes('10m³'));

      const matchSearch =
        !searchTerm.trim() ||
        t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.driverPhone.includes(searchTerm) ||
        (t.code && t.code.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchPlant = selectedPlant === 'ALL' || t.plantLocation === selectedPlant;

      return matchTab && matchSearch && matchPlant;
    });
  }, [trucks, activeTab, searchTerm, selectedPlant]);

  const handleOpenModal = (truck?: FleetTruck) => {
    if (truck) {
      setEditingTruck(truck);
      setFormCode(truck.code || '');
      setFormPlate(truck.plateNumber);
      setFormDriver(truck.driverName);
      setFormPhone(truck.driverPhone);
      setFormType(truck.truckType);
      setFormStatus(truck.status);
      setFormTareWeight(truck.tareWeightKg || 14500);
      setFormWeighDate(truck.weighDate || '03/10/2026');
      setFormPlant(truck.plantLocation || 'Trạm TSG-TNT 1');
      setFormNote(truck.note || '');
    } else {
      setEditingTruck(null);
      setFormCode(String(trucks.length + 10));
      setFormPlate('');
      setFormDriver('');
      setFormPhone('');
      setFormType('Xe bồn 10m³');
      setFormStatus('SAN_SANG');
      setFormTareWeight(14500);
      setFormWeighDate('03/10/2026');
      setFormPlant('Trạm TSG-TNT 1');
      setFormNote('');
    }
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlate.trim() || !formDriver.trim()) {
      alert('Vui lòng nhập biển số xe và tên tài xế');
      return;
    }

    const capacityM3 = formType.includes('8m³') ? 8 : (formType.includes('10m³') ? 10 : 12);

    if (editingTruck) {
      updateTruck(editingTruck.id, {
        code: formCode.trim(),
        plateNumber: formPlate.trim(),
        driverName: formDriver.trim(),
        driverPhone: formPhone.trim(),
        truckType: formType,
        capacityM3,
        status: formStatus,
        tareWeightKg: Number(formTareWeight) || 14500,
        weighDate: formWeighDate.trim(),
        plantLocation: formPlant,
        note: formNote.trim()
      });
    } else {
      addTruck({
        code: formCode.trim(),
        plateNumber: formPlate.trim(),
        driverName: formDriver.trim(),
        driverPhone: formPhone.trim() || '0903 000 000',
        truckType: formType,
        capacityM3,
        status: formStatus,
        plantLocation: formPlant,
        fuelLevel: 90,
        kmToday: 0,
        tripsToday: 0,
        tareWeightKg: Number(formTareWeight) || 14500,
        weighDate: formWeighDate.trim(),
        note: formNote.trim()
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (truck: FleetTruck) => {
    if (confirm(`Bạn có chắc muốn xóa xe ${truck.plateNumber} (TX: ${truck.driverName}) khỏi danh sách?`)) {
      deleteTruck(truck.id);
    }
  };

  const getStatusBadge = (status: TruckStatus) => {
    switch (status) {
      case 'SAN_SANG':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Sẵn sàng điều xe</span>;
      case 'DANG_NAP':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Đang nạp trạm</span>;
      case 'DANG_CHAY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Đang di chuyển</span>;
      case 'DANG_XA':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">Đang xả bê tông</span>;
      case 'BAO_DUONG':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Bảo dưỡng / Sửa chữa</span>;
    }
  };

  const handleExportXLSX = () => {
    const headers = [
      'STT',
      'Mã xe',
      'Tên tài xế',
      'Số điện thoại',
      'Biển số xe',
      'Phân loại xe',
      'Dung tích bồn (m3)',
      'Xác xe (Kg)',
      'Ngày cân xác xe',
      'Trạm trực thuộc',
      'Trạng thái',
      'Ghi chú / Lưu ý'
    ];

    const rows = filteredTrucks.map((t, idx) => [
      idx + 1,
      t.code || idx + 1,
      t.driverName,
      t.driverPhone,
      t.plateNumber,
      t.truckType,
      t.capacityM3 || (t.truckType.includes('8m³') ? 8 : 10),
      t.tareWeightKg || 14500,
      t.weighDate || '03/10/2026',
      t.plantLocation || 'Trạm TSG-TNT 1',
      t.status === 'SAN_SANG' ? 'Sẵn sàng' : (t.status === 'BAO_DUONG' ? 'Sửa chữa' : 'Đang hoạt động'),
      t.note || ''
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['DANH SÁCH TÀI XẾ & XE BỒN BÊ TÔNG TSG–TNT'], [], headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachXe');
    XLSX.writeFile(wb, `Danh_Sach_Tai_Xe_Va_Xe_Bon_TSG_TNT.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            QUẢN LÝ ĐỘI XE BỒN & TÀI XẾ TSG–TNT
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Danh Sách Tài Xế - Biển Số Xe - Loại Xe 8m³ & 10m³
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Quản lý chi tiết từng tài xế, biển số xe, phân loại xe bồn 8m³ và 10m³, xác xe cân bì và trạng thái điều phối.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportXLSX}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-300 shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-600" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-orange-900/10 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Xe & Tài Xế Mới</span>
          </button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          onClick={() => setActiveTab('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md'
              : 'bg-white hover:bg-slate-50 border-slate-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Đội Xe</div>
          <div className="text-2xl font-black mt-1">{trucks.length} <span className="text-xs font-normal">xe</span></div>
          <div className="text-[10px] mt-1 text-slate-400">Toàn bộ tài xế trạm</div>
        </div>

        {/* Card 8m3 */}
        <div
          onClick={() => setActiveTab('8m3')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === '8m3'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
              : 'bg-white hover:bg-emerald-50/40 border-slate-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Xe Bồn 8m³ (Xe Nhỏ)</div>
          <div className="text-2xl font-black mt-1 text-slate-900">{count8m3} <span className="text-xs font-normal">xe</span></div>
          <div className="text-[10px] mt-1 text-slate-500">Phù hợp đường nhỏ, hẻm dân dụng</div>
        </div>

        {/* Card 10m3 */}
        <div
          onClick={() => setActiveTab('10m3')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === '10m3'
              ? 'bg-orange-600 text-white border-orange-600 shadow-md'
              : 'bg-white hover:bg-orange-50/40 border-slate-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-orange-600">Xe Bồn 10m³ (Tiêu Chuẩn)</div>
          <div className="text-2xl font-black mt-1 text-slate-900">{count10m3} <span className="text-xs font-normal">xe</span></div>
          <div className="text-[10px] mt-1 text-slate-500">Phục vụ dự án lớn, công trình chính</div>
        </div>

        {/* Card Xe Khác / Bơm */}
        <div
          onClick={() => setActiveTab('OTHER')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            activeTab === 'OTHER'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md'
              : 'bg-white hover:bg-blue-50/40 border-slate-200'
          }`}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Xe Bơm Cần & Xe Khác</div>
          <div className="text-2xl font-black mt-1 text-slate-900">{countOther} <span className="text-xs font-normal">xe</span></div>
          <div className="text-[10px] mt-1 text-slate-500">Bơm cần 43m, bơm tĩnh</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[260px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên tài xế, biển số, mã xe, SĐT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 text-xs"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'ALL' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tất cả ({trucks.length})
            </button>
            <button
              onClick={() => setActiveTab('8m3')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === '8m3' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xe bồn 8m³ ({count8m3})
            </button>
            <button
              onClick={() => setActiveTab('10m3')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === '10m3' ? 'bg-orange-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xe bồn 10m³ ({count10m3})
            </button>
            <button
              onClick={() => setActiveTab('OTHER')}
              className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                activeTab === 'OTHER' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Xe khác ({countOther})
            </button>
          </div>
        </div>

        <div className="text-slate-500 text-xs font-medium">
          Hiển thị: <strong className="text-slate-900">{filteredTrucks.length}</strong> / {trucks.length} xe bồn
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-3 w-16">MÃ XE</th>
                <th className="py-3 px-4 min-w-[180px]">HỌ TÊN TÀI XẾ</th>
                <th className="py-3 px-3 min-w-[130px]">BIỂN SỐ XE</th>
                <th className="py-3 px-3 min-w-[140px]">LOẠI XE BỒN</th>
                <th className="py-3 px-3 text-center">DUNG TÍCH</th>
                <th className="py-3 px-3 text-right">XÁC XE (KG)</th>
                <th className="py-3 px-3">NGÀY CÂN BÌ</th>
                <th className="py-3 px-3">TRẠM TRỰC THUỘC</th>
                <th className="py-3 px-3">TRẠNG THÁI</th>
                <th className="py-3 px-3 text-center w-24">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTrucks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400">
                    Không tìm thấy xe bồn hoặc tài xế phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredTrucks.map((truck, idx) => {
                  const is8m3 = truck.capacityM3 === 8 || truck.truckType.includes('8m³');
                  const is10m3 = truck.capacityM3 === 10 || truck.truckType.includes('10m³');

                  return (
                    <tr key={truck.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Mã xe */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 bg-slate-50/50">
                        {truck.code || idx + 1}
                      </td>

                      {/* Họ tên tài xế */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xs shrink-0">
                            {truck.driverName.slice(0, 1)}
                          </div>
                          <span>{truck.driverName}</span>
                        </div>
                      </td>

                      {/* Biển số xe */}
                      <td className="py-3 px-3 font-mono font-black text-slate-900 text-sm">
                        {truck.plateNumber}
                      </td>

                      {/* Loại xe */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {is8m3 ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-300">
                            Xe bồn 8m³
                          </span>
                        ) : is10m3 ? (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-orange-50 text-orange-700 border border-orange-300">
                            Xe bồn 10m³
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {truck.truckType}
                          </span>
                        )}
                        {truck.note && (
                          <div className="text-[10px] font-bold text-orange-600 mt-0.5">
                            {truck.note}
                          </div>
                        )}
                      </td>

                      {/* Dung tích */}
                      <td className="py-3 px-3 text-center font-bold font-mono text-slate-800">
                        {truck.capacityM3 ? `${truck.capacityM3} m³` : (is8m3 ? '8 m³' : '10 m³')}
                      </td>

                      {/* Xác xe (Kg) */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {truck.tareWeightKg ? truck.tareWeightKg.toLocaleString('vi-VN') : '14,500'} kg
                      </td>

                      {/* Ngày cân */}
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap">
                        {truck.weighDate || '03/10/2026'}
                      </td>

                      {/* Trạm */}
                      <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {truck.plantLocation || 'Trạm TSG-TNT 1'}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {getStatusBadge(truck.status)}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenModal(truck)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-blue-600 transition cursor-pointer"
                            title="Sửa thông tin xe & tài xế"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(truck)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-red-600 transition cursor-pointer"
                            title="Xóa khỏi đội xe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Thêm / Sửa Xe & Tài Xế */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-orange-500" />
                <h3 className="font-bold text-sm">
                  {editingTruck ? `Cập Nhật Tài Xế & Xe ${editingTruck.plateNumber}` : 'Thêm Xe Bồn & Tài Xế Mới'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã xe</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ví dụ: 18, 19, 63, 264..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Biển số xe bồn *</label>
                  <input
                    type="text"
                    required
                    value={formPlate}
                    onChange={(e) => setFormPlate(e.target.value)}
                    placeholder="Ví dụ: 51B-33618 hoặc 51N-04419"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-orange-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Họ tên tài xế phụ trách *</label>
                  <input
                    type="text"
                    required
                    value={formDriver}
                    onChange={(e) => setFormDriver(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Thọ"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ví dụ: 0903 112 018"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Loại xe bồn: 8m3 hoặc 10m3 */}
              <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-200 space-y-2">
                <label className="font-bold text-orange-950 block">Phân loại xe bồn (8m³ & 10m³)</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormType('Xe bồn 8m³')}
                    className={`py-2 px-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                      formType === 'Xe bồn 8m³'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Xe bồn 8m³
                    <span className="block text-[10px] font-normal opacity-80">(Bồn nhỏ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('Xe bồn 10m³')}
                    className={`py-2 px-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                      formType === 'Xe bồn 10m³'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Xe bồn 10m³
                    <span className="block text-[10px] font-normal opacity-80">(Tiêu chuẩn)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormType('Xe bồn 12m³')}
                    className={`py-2 px-2 rounded-xl font-bold border transition cursor-pointer text-center ${
                      formType === 'Xe bồn 12m³'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    Xe bồn 12m³
                    <span className="block text-[10px] font-normal opacity-80">(Bồn lớn)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Xác xe (Kg - Bì xe)</label>
                  <input
                    type="number"
                    value={formTareWeight}
                    onChange={(e) => setFormTareWeight(Number(e.target.value))}
                    placeholder="14210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Ngày cân xác xe</label>
                  <input
                    type="text"
                    value={formWeighDate}
                    onChange={(e) => setFormWeighDate(e.target.value)}
                    placeholder="03/10/2026"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trạng thái xe</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as TruckStatus)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white focus:ring-2 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="SAN_SANG">Sẵn sàng điều xe</option>
                    <option value="DANG_NAP">Đang nạp trạm</option>
                    <option value="DANG_CHAY">Đang di chuyển</option>
                    <option value="DANG_XA">Đang xả bê tông</option>
                    <option value="BAO_DUONG">Bảo dưỡng / Sửa chữa</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Trạm trực thuộc</label>
                  <input
                    type="text"
                    value={formPlant}
                    onChange={(e) => setFormPlant(e.target.value)}
                    placeholder="Trạm TSG-TNT 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú / Lưu ý (Hạ tải...)</label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="Ví dụ: HẠ TẢI 7m3, HẠ TẢI 9m3..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl font-bold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTruck ? 'Lưu Thay Đổi' : 'Thêm Xe Mới'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
