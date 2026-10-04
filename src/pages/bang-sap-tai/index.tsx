import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Filter,
  Download,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Truck,
  User,
  Scale,
  Save,
  Printer,
  ChevronDown
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { FleetTruck } from '../../types';
import * as XLSX from 'xlsx';

export const BangSapTaiPage: React.FC = () => {
  const { trucks, updateTruck, addTruck } = useSync();

  const [selectedMonth, setSelectedMonth] = useState('10/2026');
  const [selectedDate, setSelectedDate] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL'); // ALL, 8m3, 10m3
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, SUA_CHUA, SAN_SANG

  // Modal thêm/sửa tài xế vào bảng tài
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<FleetTruck | null>(null);

  // Form states for modal
  const [formCode, setFormCode] = useState('');
  const [formPlate, setFormPlate] = useState('');
  const [formDriver, setFormDriver] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formType, setFormType] = useState<'Xe bồn 8m³' | 'Xe bồn 10m³' | 'Xe bồn 12m³' | string>('Xe bồn 10m³');
  const [formShiftDate, setFormShiftDate] = useState('03/10/2026');
  const [formShiftTime, setFormShiftTime] = useState('');
  const [formLeaveOrRepair, setFormLeaveOrRepair] = useState('');
  const [formNote, setFormNote] = useState('');
  const [formTareWeight, setFormTareWeight] = useState<number>(14500);
  const [formWeighDate, setFormWeighDate] = useState('03/10/2026');

  // Filtered trucks list (Bỏ tìm kiếm, hiển thị trực quan gọn gàng)
  const filteredList = useMemo(() => {
    return trucks.filter(t => {
      const matchType =
        filterType === 'ALL' ||
        (filterType === '8m3' && (t.capacityM3 === 8 || t.truckType.includes('8m³'))) ||
        (filterType === '10m3' && (t.capacityM3 === 10 || t.truckType.includes('10m³')));

      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'SUA_CHUA' && (t.leaveOrRepair?.includes('SỬA CHỮA') || t.status === 'BAO_DUONG')) ||
        (filterStatus === 'PHEP' && (t.leaveOrRepair?.includes('PHÉP') || (t.totalLeave && t.totalLeave > 0))) ||
        (filterStatus === 'SAN_SANG' && (!t.leaveOrRepair || t.leaveOrRepair === ''));

      return matchType && matchStatus;
    });
  }, [trucks, filterType, filterStatus]);

  // Handler for toggle Lần 1, 2, 3
  const handleToggleLeave = (truck: FleetTruck, field: 'leaveOff1' | 'leaveOff2' | 'leaveOff3') => {
    const nextVal = !truck[field];
    const off1 = field === 'leaveOff1' ? nextVal : !!truck.leaveOff1;
    const off2 = field === 'leaveOff2' ? nextVal : !!truck.leaveOff2;
    const off3 = field === 'leaveOff3' ? nextVal : !!truck.leaveOff3;

    // 3 buổi tính 1 phép
    const count = (off1 && off2 && off3) ? 1 : 0;

    updateTruck(truck.id, {
      [field]: nextVal,
      leaveCount: count,
      totalLeave: count
    });
  };

  // Quick Inline update for note/repair
  const handleQuickUpdate = (truckId: string, updates: Partial<FleetTruck>) => {
    updateTruck(truckId, updates);
  };

  const handleOpenModal = (truck?: FleetTruck) => {
    if (truck) {
      setEditingTruck(truck);
      setFormCode(truck.code || '');
      setFormPlate(truck.plateNumber);
      setFormDriver(truck.driverName);
      setFormPhone(truck.driverPhone);
      setFormType(truck.truckType);
      setFormShiftDate(truck.shiftDate || '03/10/2026');
      setFormShiftTime(truck.shiftTime || '');
      setFormLeaveOrRepair(truck.leaveOrRepair || '');
      setFormNote(truck.note || '');
      setFormTareWeight(truck.tareWeightKg || 14500);
      setFormWeighDate(truck.weighDate || '03/10/2026');
    } else {
      setEditingTruck(null);
      setFormCode(String(trucks.length + 10));
      setFormPlate('');
      setFormDriver('');
      setFormPhone('');
      setFormType('Xe bồn 10m³');
      setFormShiftDate('03/10/2026');
      setFormShiftTime('');
      setFormLeaveOrRepair('');
      setFormNote('');
      setFormTareWeight(14500);
      setFormWeighDate('03/10/2026');
    }
    setIsModalOpen(true);
  };

  // Đồng bộ biển số xe khi chọn tên tài xế theo danh sách mặc định
  const handleDriverSelect = (driverName: string) => {
    setFormDriver(driverName);
    const matched = trucks.find(t => t.driverName.toLowerCase().trim() === driverName.toLowerCase().trim());
    if (matched) {
      if (matched.code) setFormCode(matched.code);
      setFormPlate(matched.plateNumber);
      setFormPhone(matched.driverPhone || '');
      setFormType(matched.truckType);
      if (matched.tareWeightKg) setFormTareWeight(matched.tareWeightKg);
      if (matched.weighDate) setFormWeighDate(matched.weighDate);
    }
  };

  const handlePlateSelect = (plate: string) => {
    setFormPlate(plate);
    const matched = trucks.find(t => t.plateNumber.toLowerCase().trim() === plate.toLowerCase().trim());
    if (matched) {
      if (matched.code) setFormCode(matched.code);
      setFormDriver(matched.driverName);
      setFormPhone(matched.driverPhone || '');
      setFormType(matched.truckType);
      if (matched.tareWeightKg) setFormTareWeight(matched.tareWeightKg);
      if (matched.weighDate) setFormWeighDate(matched.weighDate);
    }
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlate.trim() || !formDriver.trim()) {
      alert('Vui lòng nhập biển số xe và tên tài xế');
      return;
    }

    const capacityM3 = formType.includes('8m³') ? 8 : (formType.includes('10m³') ? 10 : 10);

    if (editingTruck) {
      updateTruck(editingTruck.id, {
        code: formCode.trim(),
        plateNumber: formPlate.trim(),
        driverName: formDriver.trim(),
        driverPhone: formPhone.trim(),
        truckType: formType,
        capacityM3,
        shiftDate: formShiftDate.trim(),
        shiftTime: formShiftTime.trim(),
        leaveOrRepair: formLeaveOrRepair.trim(),
        note: formNote.trim(),
        tareWeightKg: Number(formTareWeight) || 14500,
        weighDate: formWeighDate.trim()
      });
    } else {
      addTruck({
        code: formCode.trim(),
        plateNumber: formPlate.trim(),
        driverName: formDriver.trim(),
        driverPhone: formPhone.trim() || '0903 000 000',
        truckType: formType,
        capacityM3,
        status: formLeaveOrRepair.includes('SỬA CHỮA') ? 'BAO_DUONG' : 'SAN_SANG',
        plantLocation: 'Trạm TSG-TNT 1',
        fuelLevel: 85,
        kmToday: 0,
        tripsToday: 0,
        shiftDate: formShiftDate.trim(),
        shiftTime: formShiftTime.trim(),
        leaveOrRepair: formLeaveOrRepair.trim(),
        note: formNote.trim(),
        tareWeightKg: Number(formTareWeight) || 14500,
        weighDate: formWeighDate.trim(),
        leaveCount: 0,
        totalLeave: 0
      });
    }
    setIsModalOpen(false);
  };

  // Export Excel giống bảng mẫu công ty
  const handleExportXLSX = () => {
    const headers = [
      'STT',
      'TRẠM',
      'MÃ XE',
      'TÊN TÀI XẾ',
      'SỐ XE',
      'LOẠI XE',
      'TÀI NGÀY',
      'TIME',
      'PHÉP / SỬA CHỮA',
      'LƯU Ý',
      'LẦN 1',
      'LẦN 2',
      'LẦN 3',
      'TÍNH 1 PHÉP',
      'TỔNG',
      'XÁC XE (KG)',
      'NGÀY CÂN'
    ];

    const rows = filteredList.map((t, idx) => [
      idx + 1,
      t.plantLocation || 'TRẠM TSG-TNT 1',
      t.code || idx + 1,
      t.driverName,
      t.plateNumber,
      t.capacityM3 ? `${t.capacityM3}m³` : t.truckType,
      t.shiftDate || '',
      t.shiftTime || '',
      t.leaveOrRepair || '',
      t.note || '',
      t.leaveOff1 ? 'X' : '',
      t.leaveOff2 ? 'X' : '',
      t.leaveOff3 ? 'X' : '',
      t.leaveCount || 0,
      t.totalLeave || 0,
      t.tareWeightKg ? t.tareWeightKg.toLocaleString('vi-VN') : '---',
      t.weighDate || ''
    ]);

    const sheetData = [
      ['BẢNG THEO DÕI SẮP TÀI XẾ BỒN TSG–TNT'],
      [`THÁNG 10 / 2026 • QUẢN LÝ LỊCH TÀI XẾ – PHÉP – SỬA CHỮA – XÁC XE`],
      [`Ngày kết xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')} | Tổng số xe: ${filteredList.length} xe`],
      [],
      headers,
      ...rows
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    ws['!cols'] = [
      { wch: 6 },
      { wch: 16 },
      { wch: 10 },
      { wch: 24 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 10 },
      { wch: 18 },
      { wch: 16 },
      { wch: 8 },
      { wch: 8 },
      { wch: 8 },
      { wch: 14 },
      { wch: 8 },
      { wch: 14 },
      { wch: 14 }
    ];
    XLSX.utils.book_append_sheet(wb, ws, 'BangSapTai');
    XLSX.writeFile(wb, `Bang_Theo_Doi_Sap_Tai_Xe_Bon_TSG_TNT.xlsx`);
  };

  return (
    <div className="p-2 sm:p-3 space-y-2 max-w-[1700px] mx-auto">
      {/* Top Banner (Gọn gàng chuẩn bảng TSG–TNT) */}
      <div className="bg-[#0f5c53] rounded-xl px-4 py-2 text-white shadow-xs border border-emerald-900 flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <div>
            <h1 className="text-sm sm:text-base font-black tracking-tight text-white uppercase">
              BẢNG THEO DÕI SẮP TÀI XẾ BỒN TSG–TNT
            </h1>
            <p className="text-[11px] text-emerald-100 font-medium">
              THÁNG 10 / 2026 • LỊCH TÀI XẾ – PHÉP – SỬA CHỮA – XÁC XE
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => handleOpenModal()}
            className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1 transition cursor-pointer shadow-xs active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 text-slate-950" />
            <span>Thêm Xe & Tài Xế</span>
          </button>

          <button
            onClick={handleExportXLSX}
            className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer border border-emerald-600/50 shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-2.5 py-1 bg-slate-900/60 hover:bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center gap-1 transition cursor-pointer border border-slate-700 shadow-xs"
          >
            <Printer className="w-3.5 h-3.5 text-slate-300" />
            <span>In Bảng</span>
          </button>
        </div>
      </div>

      {/* Main Table: COMPACT REPLICA TO FIT IN 1 SCREEN (Đã bỏ lọc nhanh theo yêu cầu) */}
      <div className="bg-white rounded-lg border border-slate-300 shadow-xs overflow-x-auto">
        <table className="w-full text-center border-collapse text-[11px] select-none">
          <thead>
            {/* Row 1: Main Header Categories */}
            <tr>
              <th
                colSpan={5}
                className="bg-[#0b534b] text-white py-1 px-2 font-black text-[11px] uppercase tracking-wider border-r border-[#083c36]"
              >
                THÔNG TIN TÀI XẾ
              </th>
              <th
                colSpan={4}
                className="bg-[#0f6b61] text-white py-1 px-2 font-black text-[11px] uppercase tracking-wider border-r border-[#0a4841]"
              >
                LỊCH THÁNG 10
              </th>
              <th
                colSpan={5}
                className="bg-[#b45309] text-white py-1 px-2 font-black text-[11px] uppercase tracking-wider border-r border-[#92400e]"
              >
                THEO DÕI NGHỈ 1 BUỔI (3 BUỔI TÍNH 1 PHÉP)
              </th>
              <th
                colSpan={2}
                className="bg-[#047857] text-white py-1 px-2 font-black text-[11px] uppercase tracking-wider border-r border-[#065f46]"
              >
                THEO DÕI XÁC XE
              </th>
              <th className="bg-slate-800 text-white py-1 px-2 font-bold text-[11px] uppercase">
                SỬA
              </th>
            </tr>

            {/* Row 2: Sub-headers */}
            <tr className="bg-[#127267] text-white font-bold text-[10px] uppercase tracking-wide border-b border-slate-300">
              {/* THÔNG TIN TÀI XẾ */}
              <th className="py-1 px-1.5 border-r border-emerald-800 w-8">STT</th>
              <th className="py-1 px-1.5 border-r border-emerald-800 w-16">TRẠM</th>
              <th className="py-1 px-1.5 border-r border-emerald-800 w-12">MÃ XE</th>
              <th className="py-1 px-2.5 border-r border-emerald-800 text-left min-w-[130px]">TÊN TÀI XẾ</th>
              <th className="py-1 px-1.5 border-r border-emerald-800 font-mono min-w-[100px]">SỐ XE</th>

              {/* LỊCH THÁNG 10 */}
              <th className="py-1 px-1.5 border-r border-emerald-800 min-w-[85px]">TÀI NGÀY</th>
              <th className="py-1 px-1.5 border-r border-emerald-800 min-w-[60px]">TIME</th>
              <th className="py-1 px-1.5 border-r border-emerald-800 min-w-[100px]">PHÉP / SỬA CHỮA</th>
              <th className="py-1 px-1.5 border-r border-emerald-800 min-w-[90px]">LƯU Ý</th>

              {/* THEO DÕI NGHỈ 1 BUỔI */}
              <th className="bg-[#c25e0a] py-1 px-1 border-r border-amber-900 w-10">LẦN 1</th>
              <th className="bg-[#c25e0a] py-1 px-1 border-r border-amber-900 w-10">LẦN 2</th>
              <th className="bg-[#c25e0a] py-1 px-1 border-r border-amber-900 w-10">LẦN 3</th>
              <th className="bg-[#c25e0a] py-1 px-1.5 border-r border-amber-900 min-w-[75px]">1 PHÉP</th>
              <th className="bg-[#c25e0a] py-1 px-1 border-r border-amber-900 w-10">TỔNG</th>

              {/* THEO DÕI XÁC XE */}
              <th className="bg-[#059669] py-1 px-1.5 border-r border-emerald-900 min-w-[85px]">XÁC XE (KG)</th>
              <th className="bg-[#059669] py-1 px-1.5 border-r border-emerald-900 min-w-[85px]">NGÀY CÂN</th>

              <th className="bg-slate-700 py-1 px-1 w-12">SỬA</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200">
            {filteredList.map((truck, idx) => {
              const isRepair = truck.leaveOrRepair?.includes('SỬA CHỮA');
              const isLeave = truck.leaveOrRepair?.includes('PHÉP');

              return (
                <tr
                  key={truck.id}
                  className="hover:bg-emerald-50/50 transition border-b border-slate-200 h-7"
                >
                  {/* STT */}
                  <td className="py-0.5 px-1 font-mono text-slate-500 border-r border-slate-200 text-[10px]">
                    {idx + 1}
                  </td>

                  {/* TRẠM */}
                  <td className="py-0.5 px-1 text-[9px] font-bold text-emerald-800 border-r border-slate-200 whitespace-nowrap bg-slate-50">
                    {truck.plantLocation || 'TRẠM TSG-TNT 1'}
                  </td>

                  {/* MÃ XE */}
                  <td className="py-0.5 px-1 font-bold text-slate-900 border-r border-slate-200 font-mono bg-slate-50/50 text-[10px]">
                    {truck.code || idx + 1}
                  </td>

                  {/* TÊN TÀI XẾ */}
                  <td className="py-0.5 px-2 text-left font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap leading-tight">
                    <span>{truck.driverName}</span>
                    <span className="text-[9px] font-normal text-slate-400 ml-1.5">({truck.driverPhone})</span>
                  </td>

                  {/* SỐ XE (Biển số) */}
                  <td className="py-0.5 px-1.5 font-mono font-bold text-slate-900 border-r border-slate-200 whitespace-nowrap leading-tight">
                    <span>{truck.plateNumber}</span>
                    <span className="text-[9px] text-slate-500 ml-1 font-sans">
                      {truck.capacityM3 ? `(${truck.capacityM3}m³)` : (truck.truckType.includes('8m³') ? '(8m³)' : '(10m³)')}
                    </span>
                  </td>

                  {/* TÀI NGÀY */}
                  <td className="py-0.5 px-1 border-r border-slate-200 font-mono text-slate-800 text-[10px]">
                    {truck.shiftDate || ''}
                  </td>

                  {/* TIME */}
                  <td className="py-0.5 px-1 border-r border-slate-200 font-mono text-slate-800 font-semibold text-[10px]">
                    {truck.shiftTime || ''}
                  </td>

                  {/* PHÉP / SỬA CHỮA */}
                  <td className="py-0.5 px-1 border-r border-slate-200">
                    {isRepair ? (
                      <span className="px-1.5 py-0.2 rounded font-black text-amber-700 bg-amber-100 border border-amber-300 text-[9px]">
                        SỬA CHỮA
                      </span>
                    ) : isLeave ? (
                      <span className="px-1.5 py-0.2 rounded font-black text-red-700 bg-red-100 border border-red-300 text-[9px]">
                        NGHỈ PHÉP
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium text-[10px]">{truck.leaveOrRepair || ''}</span>
                    )}
                  </td>

                  {/* LƯU Ý (Hạ tải 7m3, 9m3...) */}
                  <td className="py-0.5 px-1 border-r border-slate-200 font-bold text-orange-700 whitespace-nowrap text-[10px]">
                    {truck.note || ''}
                  </td>

                  {/* THEO DÕI NGHỈ 1 BUỔI: LẦN 1 */}
                  <td
                    onClick={() => handleToggleLeave(truck, 'leaveOff1')}
                    className={`py-0.5 px-1 border-r border-slate-200 cursor-pointer transition select-none text-[10px] ${
                      truck.leaveOff1 ? 'bg-amber-100 text-amber-900 font-black' : 'hover:bg-amber-50 text-slate-300'
                    }`}
                    title="Bấm để đánh dấu nghỉ buổi 1"
                  >
                    {truck.leaveOff1 ? '✓' : '—'}
                  </td>

                  {/* LẦN 2 */}
                  <td
                    onClick={() => handleToggleLeave(truck, 'leaveOff2')}
                    className={`py-0.5 px-1 border-r border-slate-200 cursor-pointer transition select-none text-[10px] ${
                      truck.leaveOff2 ? 'bg-amber-100 text-amber-900 font-black' : 'hover:bg-amber-50 text-slate-300'
                    }`}
                    title="Bấm để đánh dấu nghỉ buổi 2"
                  >
                    {truck.leaveOff2 ? '✓' : '—'}
                  </td>

                  {/* LẦN 3 */}
                  <td
                    onClick={() => handleToggleLeave(truck, 'leaveOff3')}
                    className={`py-0.5 px-1 border-r border-slate-200 cursor-pointer transition select-none text-[10px] ${
                      truck.leaveOff3 ? 'bg-amber-100 text-amber-900 font-black' : 'hover:bg-amber-50 text-slate-300'
                    }`}
                    title="Bấm để đánh dấu nghỉ buổi 3"
                  >
                    {truck.leaveOff3 ? '✓' : '—'}
                  </td>

                  {/* TÍNH 1 PHÉP */}
                  <td className="py-0.5 px-1 border-r border-slate-200 font-bold font-mono text-slate-800 bg-amber-50/20 text-[10px]">
                    {truck.leaveCount || 0}
                  </td>

                  {/* TỔNG */}
                  <td className="py-0.5 px-1 border-r border-slate-200 font-black font-mono text-slate-900 bg-amber-50/40 text-[10px]">
                    {truck.totalLeave || 0}
                  </td>

                  {/* XÁC XE (KG) */}
                  <td className="py-0.5 px-1 border-r border-slate-200 font-mono font-black text-slate-900 text-[10px] bg-emerald-50/20">
                    {truck.tareWeightKg ? truck.tareWeightKg.toLocaleString('vi-VN') : '---'}
                  </td>

                  {/* NGÀY CÂN */}
                  <td className="py-0.5 px-1 border-r border-slate-200 font-mono text-slate-700 whitespace-nowrap bg-emerald-50/20 text-[10px]">
                    {truck.weighDate || '03/10/2026'}
                  </td>

                  {/* THAO TÁC */}
                  <td className="py-0.5 px-1">
                    <button
                      onClick={() => handleOpenModal(truck)}
                      className="p-1 rounded hover:bg-slate-100 text-blue-600 transition cursor-pointer"
                      title="Chỉnh sửa dòng này"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm / Chỉnh Sửa Dòng Bảng Tài */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="bg-[#0f5c53] text-white px-5 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-300" />
                <h3 className="font-bold text-sm">
                  {editingTruck ? `Cập Nhật Bảng Tài Xe ${editingTruck.plateNumber}` : 'Thêm Xe & Tài Xế Vào Bảng Tài'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-200 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 overflow-y-auto space-y-3.5 text-xs">
              {/* Chọn nhanh tài xế (biển số xe tự đi theo) */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-1.5">
                <label className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>Chọn tài xế từ danh sách (Biển số xe tự đi theo):</span>
                  <span className="text-[10px] text-emerald-700 font-bold">* Tự động đồng bộ</span>
                </label>
                <select
                  value={trucks.some(t => t.driverName.toLowerCase() === formDriver.toLowerCase()) ? formDriver : ''}
                  onChange={(e) => handleDriverSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-emerald-400 rounded-lg text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer"
                >
                  <option value="">-- Chọn tài xế (Xe bồn & thông tin tự đổi) --</option>
                  {trucks.map(trk => (
                    <option key={trk.id} value={trk.driverName}>
                      TX: {trk.driverName} ➔ Xe: {trk.plateNumber} ({trk.truckType}) - Mã: #{trk.code}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mã số xe</label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Ví dụ: 18, 19, 264..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Biển số xe bồn *</label>
                  <input
                    type="text"
                    required
                    value={formPlate}
                    onChange={(e) => handlePlateSelect(e.target.value)}
                    placeholder="Ví dụ: 51B-33618"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-emerald-500 uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tên tài xế phụ trách *</label>
                  <input
                    type="text"
                    required
                    value={formDriver}
                    onChange={(e) => handleDriverSelect(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn Thọ"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="Ví dụ: 0903 112 018"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Loại xe bồn (8m³ / 10m³)</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold bg-white focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Xe bồn 10m³">Xe bồn 10m³ (Tiêu chuẩn)</option>
                    <option value="Xe bồn 8m³">Xe bồn 8m³ (Xe nhỏ)</option>
                    <option value="Xe bồn 12m³">Xe bồn 12m³ (Xe lớn)</option>
                    <option value="Xe bơm cần 43m">Xe bơm cần 43m</option>
                    <option value="Xe bơm tĩnh">Xe bơm tĩnh</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Xác xe (Kg - Bì xe)</label>
                  <input
                    type="number"
                    value={formTareWeight}
                    onChange={(e) => setFormTareWeight(Number(e.target.value))}
                    placeholder="Ví dụ: 14210"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tài ngày</label>
                  <input
                    type="text"
                    value={formShiftDate}
                    onChange={(e) => setFormShiftDate(e.target.value)}
                    placeholder="03/10/2026"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Giờ tài (Time)</label>
                  <input
                    type="text"
                    value={formShiftTime}
                    onChange={(e) => setFormShiftTime(e.target.value)}
                    placeholder="Ví dụ: 6h30"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Phép / Sửa chữa</label>
                  <input
                    type="text"
                    value={formLeaveOrRepair}
                    onChange={(e) => setFormLeaveOrRepair(e.target.value)}
                    placeholder="SỬA CHỮA, PHÉP..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-amber-700 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lưu ý (Hạ tải...)</label>
                  <input
                    type="text"
                    value={formNote}
                    onChange={(e) => setFormNote(e.target.value)}
                    placeholder="Ví dụ: HẠ TẢI 7m3, HẠ TẢI 9m3"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-bold text-orange-600 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày cân xác xe</label>
                <input
                  type="text"
                  value={formWeighDate}
                  onChange={(e) => setFormWeighDate(e.target.value)}
                  placeholder="03/10/2026"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-emerald-500"
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
                  className="px-4 py-2 bg-[#0f5c53] hover:bg-[#0b4841] text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingTruck ? 'Lưu Thay Đổi' : 'Thêm Vào Bảng'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
