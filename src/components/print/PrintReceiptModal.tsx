import React, { useState } from 'react';
import { ConcreteOrder, DispatchTrip } from '../../types';
import { ConcreteDeliveryReceipt } from './ConcreteDeliveryReceipt';
import { Printer, X, Download, Eye, FileText, CheckCircle2 } from 'lucide-react';

interface PrintReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: ConcreteOrder;
  trip?: DispatchTrip | null;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  trip
}) => {
  const [activeTab, setActiveTab] = useState<'receipt' | 'details'>('receipt');
  const [sealNumber, setSealNumber] = useState('0160190');
  const [sampleCode, setSampleCode] = useState('M15S1028');

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-orange-600">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold">In Phiếu Giao Nhận Bê Tông (Mẫu Chuẩn TSG TNT)</h2>
              <p className="text-[11px] text-slate-400">Đơn hàng: {order.code} • Số phiếu: {trip?.ticketNumber || '0160190'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm cursor-pointer transition"
            >
              <Printer className="w-4 h-4" />
              In phiếu ngay (Ctrl + P)
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switchers in modal */}
        <div className="bg-white border-b border-slate-200 px-6 py-2 flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('receipt')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'receipt'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Xem & In Phiếu Giao Nhận (Hình 2)
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === 'details'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Chi Tiết Lệnh Điều Phối (Hình 1)
            </button>
          </div>

          {activeTab === 'receipt' && (
            <div className="flex items-center gap-3">
              <label className="text-[11px] text-slate-500">Mã Mác:</label>
              <input
                type="text"
                value={sampleCode}
                onChange={(e) => setSampleCode(e.target.value)}
                className="w-24 px-2 py-0.5 border border-slate-300 rounded font-mono text-xs"
              />
              <label className="text-[11px] text-slate-500">Niêm chì:</label>
              <input
                type="text"
                value={sealNumber}
                onChange={(e) => setSealNumber(e.target.value)}
                className="w-24 px-2 py-0.5 border border-slate-300 rounded font-mono text-xs"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/60 print:bg-white print:p-0 print:overflow-visible">
          {activeTab === 'receipt' ? (
            <div className="print-area">
              <ConcreteDeliveryReceipt
                order={order}
                trip={trip}
                sealNumber={sealNumber}
                sampleCode={sampleCode}
              />
            </div>
          ) : (
            /* Dispatch View matching Image 1 */
            <div className="bg-white rounded-xl border border-slate-300 p-6 space-y-4 text-xs font-sans">
              {/* Action bar like Image 1 */}
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200">
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-slate-700">
                  Sửa
                </button>
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-slate-700">
                  Bản sao
                </button>
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-rose-600">
                  Xóa
                </button>
                <button
                  onClick={() => setActiveTab('receipt')}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded font-bold text-blue-800 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In điều phối
                </button>
                <button className="px-3 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded font-semibold text-slate-700">
                  Xem quá trình thay đổi
                </button>
              </div>

              {/* Order Info grid */}
              <div className="grid grid-cols-2 divide-x divide-slate-200 border border-slate-300 rounded-lg overflow-hidden">
                <div className="divide-y divide-slate-200">
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Ngày giao bê tông:</span>
                    <span className="font-semibold text-slate-900">{order.deliveryDate.split('-').reverse().join('/')}</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Công trình:</span>
                    <span className="font-semibold text-slate-900">{order.projectTitle}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Lượng xuất:</span>
                    <span className="font-bold text-orange-600 text-sm">{trip?.volume || order.totalVolume}</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Mã mác:</span>
                    <span className="font-mono font-semibold">{sampleCode}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Độ sụt:</span>
                    <span>{trip?.slumpTested || order.slump}</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Ghi chú:</span>
                    <span>{order.notes || '—'}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Thuộc quyền:</span>
                    <span className="font-bold text-slate-800">DIEU DO TAY NINH</span>
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Khách hàng:</span>
                    <span className="font-bold uppercase text-slate-900">{order.customerName}</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Địa điểm công trình:</span>
                    <span className="text-slate-800 text-right">{order.notes || 'Đường N8, KCN Phước Đông, Phường Gia Lộc, Tỉnh Tây Ninh'}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Đơn vị:</span>
                    <span>m3</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Bê tông Mac:</span>
                    <span className="font-bold text-blue-700">{trip?.grade || order.grade}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Đơn hàng:</span>
                    <span className="font-semibold text-blue-600 underline">{order.customerName}</span>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Người giao nhận:</span>
                    <span>{order.contactPerson}</span>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Tình trạng:</span>
                    <span className="font-bold text-emerald-600">Xong</span>
                  </div>
                </div>
              </div>

              {/* Truck Info */}
              <div className="border border-slate-300 rounded-lg overflow-hidden">
                <div className="bg-slate-100 font-bold px-3 py-1.5 border-b border-slate-300 text-slate-800">
                  Thông tin xe
                </div>
                <div className="grid grid-cols-2 divide-x divide-slate-200">
                  <div className="divide-y divide-slate-200">
                    <div className="p-2 flex justify-between">
                      <span className="text-slate-500">Tài xế:</span>
                      <strong className="text-blue-700 underline font-bold">{trip?.driverName || 'Bùi Thái Sơn'}</strong>
                    </div>
                    <div className="p-2 flex justify-between bg-slate-50/50">
                      <span className="text-slate-500">Giờ khởi hành:</span>
                      <strong>{trip?.departureTime || '13:25'}</strong>
                    </div>
                    <div className="p-2 flex justify-between">
                      <span className="text-slate-500">Thời điểm xả bơm:</span>
                      <span>—</span>
                    </div>
                    <div className="p-2 flex justify-between bg-slate-50/50">
                      <span className="text-slate-500">Niêm chì:</span>
                      <span className="font-mono font-bold text-slate-900">{sealNumber}</span>
                    </div>
                    <div className="p-2 flex justify-between">
                      <span className="text-slate-500">Ngày tạo:</span>
                      <span className="text-slate-600">{order.deliveryDate.split('-').reverse().join('/')} 12:40 bởi DIEU DO TAY NINH</span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200">
                    <div className="p-2 flex justify-between">
                      <span className="text-slate-500">Số xe:</span>
                      <strong className="font-mono font-bold text-slate-900">{trip?.truckPlate || '51M 97571'}</strong>
                    </div>
                    <div className="p-2 flex justify-between bg-slate-50/50">
                      <span className="text-slate-500">Giờ đến:</span>
                      <span>{trip?.arrivalEstimate || '—'}</span>
                    </div>
                    <div className="p-2 flex justify-between">
                      <span className="text-slate-500">Thời điểm kết thúc:</span>
                      <span>—</span>
                    </div>
                    <div className="p-2 flex justify-between bg-slate-50/50">
                      <span className="text-slate-500">Nhà máy:</span>
                      <span>Trạm Tây Ninh (Trảng Bàng)</span>
                    </div>
                    <div className="p-2 flex justify-between">
                      <span className="text-slate-500">Ngày sửa:</span>
                      <span className="text-slate-600">{order.deliveryDate.split('-').reverse().join('/')} 12:40 bởi DIEU DO TAY NINH</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Đã định dạng tiêu chuẩn in A4 / A5 (khổ giấy chuẩn kế toán bê tông)</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg"
            >
              Đóng
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-1.5 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg shadow-sm flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              In phiếu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
