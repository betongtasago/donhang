import React, { useState } from 'react';
import { Fuel, DollarSign, Plus, Gauge, CheckCircle2, Search } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

export const XangDauPage: React.FC = () => {
  const { fuelLogs, addFuelLog, trucks } = useSync();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form
  const [truckPlate, setTruckPlate] = useState(trucks[0]?.plateNumber || '70C-128.45');
  const [liters, setLiters] = useState<number>(100);
  const [odometer, setOdometer] = useState<number>(150000);
  const fuelPricePerLiter = 22000;

  const totalLiters = fuelLogs.reduce((sum, f) => sum + f.liters, 0);
  const totalCost = fuelLogs.reduce((sum, f) => sum + f.cost, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const truck = trucks.find(t => t.plateNumber === truckPlate);
    const now = new Date();
    const dateStr = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    addFuelLog({
      date: dateStr,
      truckPlate,
      driverName: truck?.driverName || 'Lái xe TSG',
      liters,
      cost: liters * fuelPricePerLiter,
      odometer,
      stationName: 'Cây xăng nội bộ Trạm Tây Ninh 1',
      approvedBy: 'Trần Văn Quản'
    });

    setIsModalOpen(false);
  };

  const filteredLogs = fuelLogs.filter(f =>
    f.truckPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.driverName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            QUẢN LÝ NHIÊN LIỆU & ĐỊNH MỨC XE BỒN
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Cấp Dầu Diesel & Chi Phí Vận Hành
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi lượng dầu bơm cho từng đầu xe bồn bê tông, đối soát chỉ số km và định mức tiêu hao.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#e25822] hover:bg-[#d04d1c] text-white text-xs font-bold shadow-md shadow-orange-900/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Phiếu cấp dầu mới
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            TỔNG DẦU ĐÃ CẤP HÔM NAY
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{totalLiters} Lít</div>
          <div className="text-xs text-slate-500 mt-1">Bồn chứa nội bộ Trảng Bàng còn 18,400 Lít</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            TỔNG CHI PHÍ NHIÊN LIỆU
          </div>
          <div className="text-2xl font-black text-orange-600 mt-2">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(totalCost)}
          </div>
          <div className="text-xs text-slate-500 mt-1">Đơn giá dầu DO 0.05S: 22,000 đ/lít</div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            ĐỊNH MỨC BÌNH QUÂN
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">38.5 L / 100km</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1">Nằm trong hạn mức tiêu chuẩn đội xe bồn</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-slate-900">Nhật Ký Tiếp Dầu Đội Xe Bồn & Xe Bơm</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm biển số hoặc lái xe..."
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
                <th className="py-3 px-4">NGÀY GIỜ TIẾP DẦU</th>
                <th className="py-3 px-4">BIỂN SỐ XE</th>
                <th className="py-3 px-4">LÁI XE</th>
                <th className="py-3 px-4">LƯỢNG DẦU (LÍT)</th>
                <th className="py-3 px-4">CHỈ SỐ CÔNG TƠ MÉT</th>
                <th className="py-3 px-4">THÀNH TIỀN</th>
                <th className="py-3 px-4">ĐIỂM CẤP DẦU</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                    {log.date}
                  </td>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                    {log.truckPlate}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-800">
                    {log.driverName}
                  </td>
                  <td className="py-3 px-4 font-bold text-orange-600 whitespace-nowrap">
                    {log.liters} Lít
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                    {log.odometer.toLocaleString('vi-VN')} km
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(log.cost)}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {log.stationName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Lập Phiếu Cấp Dầu Xe Bồn Bê Tông</h3>
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>Chọn tài xế (Biển số xe đi theo)</span>
                  <span className="text-[10px] text-orange-600 font-bold">* Tự động đồng bộ</span>
                </label>
                <select
                  value={truckPlate}
                  onChange={(e) => setTruckPlate(e.target.value)}
                  className="w-full p-2 border border-orange-300 rounded-lg font-bold text-slate-900 bg-orange-50/30 cursor-pointer"
                >
                  {trucks.map(t => (
                    <option key={t.id} value={t.plateNumber}>
                      TX: {t.driverName} ➔ Xe: {t.plateNumber} ({t.truckType})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Lượng dầu bơm (Lít)</label>
                  <input
                    type="number"
                    min="10"
                    max="400"
                    required
                    value={liters}
                    onChange={(e) => setLiters(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-bold text-orange-600"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Số ODO (Km)</label>
                  <input
                    type="number"
                    required
                    value={odometer}
                    onChange={(e) => setOdometer(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600">
                <div>Ước tính chi phí: <strong className="text-orange-600 font-bold">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(liters * fuelPricePerLiter)}</strong></div>
                <div className="text-[11px] text-slate-400 mt-1">Cấp tại: Cây xăng nội bộ Trạm Tây Ninh 1</div>
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
                  Xác nhận cấp dầu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
