import React, { useState } from 'react';
import { FlaskConical, Plus, CheckCircle2, Clock, AlertCircle, FileCheck, Search } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

export const ThiNghiemPage: React.FC = () => {
  const { labTests, addLabTest, orders } = useSync();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [orderCode, setOrderCode] = useState(orders[0]?.code || 'DH-260930-001');
  const [specGrade, setSpecGrade] = useState('M300');
  const [slumpResult, setSlumpResult] = useState('14.5 cm');
  const [strengthR7, setStrengthR7] = useState<number>(27.5);
  const [strengthR28, setStrengthR28] = useState<number>(35.0);
  const [requiredStrength, setRequiredStrength] = useState<number>(30.0);
  const [testerName, setTesterName] = useState('Lê Hoàng Anh (QC Lab)');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetOrder = orders.find(o => o.code === orderCode);
    const sampleSeq = String(labTests.length + 1).padStart(2, '0');
    const sampleCode = `TN-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${specGrade}-${sampleSeq}`;

    addLabTest({
      sampleCode,
      orderCode,
      customerName: targetOrder?.customerName || 'KHÁCH HÀNG TÂY NINH',
      projectTitle: targetOrder?.projectTitle || 'CÔNG TRÌNH TÂY NINH',
      testDate: new Date().toISOString().slice(0, 10),
      specGrade,
      slumpResult,
      strengthR7,
      strengthR28,
      requiredStrength,
      status: strengthR7 >= (requiredStrength * 0.7) ? 'DAT' : 'CHO_KET_QUA',
      testerName
    });

    setIsModalOpen(false);
  };

  const filteredTests = labTests.filter(t =>
    t.sampleCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.orderCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            PHÒNG THÍ NGHIỆM & QUẢN LÝ CHẤT LƯỢNG (QC/QA)
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Thí Nghiệm Độ Sụt & Cường Độ Nén Mẫu Bê Tông
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi tuổi nén R7, R28 theo TCVN 3105 & 3118 đảm bảo tiêu chuẩn bàn giao công trình.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e25822] hover:bg-[#d04d1c] text-white text-xs font-bold shadow-md shadow-orange-900/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nhập mẫu thí nghiệm mới
        </button>
      </div>

      {/* QC Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            TỔNG SỐ TỔ MẪU ĐÃ ĐÚC
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{labTests.length} tổ mẫu</div>
          <div className="text-xs text-slate-500 mt-1">Lưu trữ phòng dưỡng hộ 27±2°C</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            TỔ MẪU ĐẠT TIÊU CHUẨN
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            {labTests.filter(t => t.status === 'DAT').length} tổ
          </div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Tỷ lệ đạt 100% mác thiết kế</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            MẪU CHỜ NÉN R28 NGÀY
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {labTests.filter(t => t.status === 'CHO_KET_QUA').length} tổ
          </div>
          <div className="text-xs text-slate-500 mt-1">Đang bảo dưỡng trong bể nước vôi</div>
        </div>
      </div>

      {/* Test Results Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900">Sổ Nhật Ký Thí Nghiệm & Kiểm Định</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm mã mẫu, đơn hàng, khách..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
                <th className="py-3 px-4">MÃ TỔ MẪU</th>
                <th className="py-3 px-4">ĐƠN HÀNG & KHÁCH HÀNG</th>
                <th className="py-3 px-4">MÁC TK</th>
                <th className="py-3 px-4">ĐỘ SỤT ĐO</th>
                <th className="py-3 px-4">CƯỜNG ĐỘ R7 (MPa)</th>
                <th className="py-3 px-4">CƯỜNG ĐỘ R28 (MPa)</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-4">KỸ THUẬT VIÊN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {test.sampleCode}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900 uppercase text-xs">{test.customerName}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Đơn: <strong>{test.orderCode}</strong> • {test.projectTitle}
                    </div>
                  </td>
                  <td className="py-3 px-4 font-bold text-orange-600 whitespace-nowrap">
                    {test.specGrade}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                    {test.slumpResult}
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {test.strengthR7} MPa
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-800 whitespace-nowrap">
                    {test.strengthR28 > 0 ? `${test.strengthR28} MPa` : <span className="text-slate-400 font-normal italic">Chờ 28 ngày</span>}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    {test.status === 'DAT' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Đạt chuẩn
                      </span>
                    )}
                    {test.status === 'CHO_KET_QUA' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Chờ kết quả
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                    {test.testerName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Ghi Nhận Mẫu Thí Nghiệm QC</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Đơn hàng cấp bê tông</label>
                <select
                  value={orderCode}
                  onChange={(e) => setOrderCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                >
                  {orders.map(o => (
                    <option key={o.id} value={o.code}>
                      {o.code} - {o.customerName} ({o.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Mác bê tông</label>
                  <select
                    value={specGrade}
                    onChange={(e) => setSpecGrade(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  >
                    <option value="M200">M200</option>
                    <option value="M250">M250</option>
                    <option value="M300">M300</option>
                    <option value="M350">M350</option>
                    <option value="M400">M400</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Độ sụt thực đo</label>
                  <input
                    type="text"
                    value={slumpResult}
                    onChange={(e) => setSlumpResult(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Cường độ R7 (MPa)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strengthR7}
                    onChange={(e) => setStrengthR7(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-orange-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Cường độ R28 (MPa)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={strengthR28}
                    onChange={(e) => setStrengthR28(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Kỹ thuật viên QC phụ trách</label>
                <input
                  type="text"
                  value={testerName}
                  onChange={(e) => setTesterName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg"
                >
                  Lưu kết quả QC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
