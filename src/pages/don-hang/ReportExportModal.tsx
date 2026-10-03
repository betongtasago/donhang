import React, { useState } from 'react';
import { X, FileSpreadsheet, Download, Check, Printer } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({ isOpen, onClose }) => {
  const { orders, trips, selectedPlant } = useSync();
  const [reportType, setReportType] = useState('daily_dispatch');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const totalDelivered = orders.reduce((sum, o) => sum + o.deliveredVolume, 0);
  const totalOrdered = orders.reduce((sum, o) => sum + o.totalVolume, 0);

  const handleDownloadCSV = () => {
    let csvContent = 'Mã Đơn,Khách Hàng,Công Trình,Hạng Mục,Mác Bê Tông,Tổng KL (m3),Đã Cấp (m3),Trạng Thái\n';
    orders.forEach(o => {
      csvContent += `"${o.code}","${o.customerName}","${o.projectTitle}","${o.categoryItem}","${o.grade}",${o.totalVolume},${o.deliveredVolume},"${o.status}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Bao_cao_don_hang_be_tong_${selectedPlant}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-orange-500" />
            <h2 className="text-sm font-bold">Xuất Báo Cáo Điều Phối Bê Tông</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="space-y-2">
            <label className="font-semibold text-slate-700">Loại báo cáo</label>
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="rep"
                  checked={reportType === 'daily_dispatch'}
                  onChange={() => setReportType('daily_dispatch')}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Báo cáo sản lượng & điều độ theo ca ngày</div>
                  <div className="text-[11px] text-slate-500">Chi tiết từng đơn hàng, chuyến xe bồn và tỷ lệ hoàn thành</div>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="rep"
                  checked={reportType === 'customer_summary'}
                  onChange={() => setReportType('customer_summary')}
                  className="text-orange-600 focus:ring-orange-500"
                />
                <div>
                  <div className="font-bold text-slate-800">Tổng hợp giao nhận theo khách hàng & công trình</div>
                  <div className="text-[11px] text-slate-500">Đối chiếu khối lượng với ban quản lý dự án</div>
                </div>
              </label>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
            <div className="font-semibold text-slate-700">Tóm tắt dữ liệu hiện tại:</div>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div>Tổng số đơn hàng: <strong>{orders.length} đơn</strong></div>
              <div>Tổng chuyến điều xe: <strong>{trips.length} chuyến</strong></div>
              <div>Khối lượng đặt: <strong>{totalOrdered} m³</strong></div>
              <div className="text-orange-600 font-bold">Đã cấp thực tế: {totalDelivered} m³</div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              In phiếu
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Tải tệp Excel / CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
