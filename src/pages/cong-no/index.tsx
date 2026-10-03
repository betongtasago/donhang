import React, { useState } from 'react';
import { CreditCard, DollarSign, AlertTriangle, CheckCircle, Search, PlusCircle, ArrowUpRight } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

export const CongNoPage: React.FC = () => {
  const { debts, recordDebtPayment } = useSync();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(100000000);

  const totalCurrentDebt = debts.reduce((sum, d) => sum + d.currentDebt, 0);
  const totalOverdue = debts.reduce((sum, d) => sum + d.overdueDebt, 0);
  const lockedCustomersCount = debts.filter(d => d.paymentStatus === 'KHOA_DON').length;

  const filteredDebts = debts.filter(d =>
    d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.phone.includes(searchTerm)
  );

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCustomerId && paymentAmount > 0) {
      recordDebtPayment(selectedCustomerId, paymentAmount);
      setSelectedCustomerId(null);
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            TÀI CHÍNH & KHÁCH HÀNG
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Công Nợ Bê Tông & Hạn Mức Tín Dụng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Kiểm soát chặt chẽ công nợ theo từng công trình trước khi điều độ cấp xe bồn.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            TỔNG CÔNG NỢ PHẢI THU
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatVND(totalCurrentDebt)}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Theo dõi trên {debts.length} đối tác xây dựng
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            CÔNG NỢ QUÁ HẠN CẦN THU
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {formatVND(totalOverdue)}
          </div>
          <div className="text-xs text-rose-600 font-semibold mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Yêu cầu đối soát trước khi duyệt đơn
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            KHÁCH HÀNG KHOÁ ĐIỀU ĐỘ
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {lockedCustomersCount} đơn vị
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Vượt hạn mức tín dụng hoặc trễ thanh toán &gt; 30 ngày
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Danh Sách Công Nợ Khách Hàng</h2>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm tên khách hàng hoặc SĐT..."
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
                <th className="py-3 px-4">TÊN KHÁCH HÀNG</th>
                <th className="py-3 px-4">SẢN LƯỢNG ĐÃ CẤP</th>
                <th className="py-3 px-4">HẠN MỨC TÍN DỤNG</th>
                <th className="py-3 px-4">CÔNG NỢ HIỆN TẠI</th>
                <th className="py-3 px-4">NỢ QUÁ HẠN</th>
                <th className="py-3 px-4">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDebts.map((item) => {
                const percent = Math.min(100, Math.round((item.currentDebt / item.creditLimit) * 100));
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 uppercase text-xs">{item.customerName}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">SĐT: {item.phone} • {item.totalOrders} đơn hàng</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900">{item.deliveredVolumeTotal}</span> m³
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600">
                      {formatVND(item.creditLimit)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold text-slate-900">
                      {formatVND(item.currentDebt)}
                      <div className="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${percent > 90 ? 'bg-rose-500' : percent > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-bold">
                      {item.overdueDebt > 0 ? (
                        <span className="text-rose-600">{formatVND(item.overdueDebt)}</span>
                      ) : (
                        <span className="text-slate-400 font-normal">0 đ</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {item.paymentStatus === 'TOT' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Tốt
                        </span>
                      )}
                      {item.paymentStatus === 'CANH_BAO' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Cảnh báo nợ
                        </span>
                      )}
                      {item.paymentStatus === 'KHOA_DON' && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Khoá cấp xe
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedCustomerId(item.id)}
                        className="px-3 py-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold text-xs transition"
                      >
                        Thu nợ / Thu tiền
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay modal */}
      {selectedCustomerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4">
            <h3 className="font-bold text-sm text-slate-900">Ghi Nhận Thu Tiền Bê Tông</h3>
            <p className="text-xs text-slate-500">
              Khách hàng: <strong>{debts.find(d => d.id === selectedCustomerId)?.customerName}</strong>
            </p>
            <form onSubmit={handlePay} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Số tiền thanh toán (VNĐ)</label>
                <input
                  type="number"
                  step="1000000"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded-lg font-bold text-orange-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedCustomerId(null)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-semibold"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg"
                >
                  Xác nhận nộp tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
