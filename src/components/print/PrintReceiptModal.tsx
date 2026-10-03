import React, { useState, useMemo } from 'react';
import { ConcreteOrder, DispatchTrip } from '../../types';
import { ConcreteDeliveryReceipt } from './ConcreteDeliveryReceipt';
import { Printer, X, Download, Eye, FileText, CheckCircle2, Sliders, Info, HelpCircle } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';

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
  const { trips } = useSync();

  const [activeTab, setActiveTab] = useState<'receipt' | 'details'>('receipt');
  const [paperSize, setPaperSize] = useState<'A4' | 'A5'>('A4');
  const [sealNumber, setSealNumber] = useState(trip ? `NC-${trip.ticketNumber.slice(-5)}` : '0160190');
  const [sampleCode, setSampleCode] = useState(order.grade ? `M${order.grade.replace(/\D/g, '') || '15'}S1028` : 'M15S1028');

  // Compute all trips for this order to calculate REAL cumulative volume
  const orderTrips = useMemo(() => {
    return trips
      .filter(t => t.orderId === order.id || t.orderCode === order.code)
      .sort((a, b) => (a.departureTime || '').localeCompare(b.departureTime || ''));
  }, [trips, order.id, order.code]);

  // Find index of current trip
  const tripIdx = useMemo(() => {
    if (!trip) return orderTrips.length > 0 ? 0 : 0;
    const found = orderTrips.findIndex(t => t.id === trip.id || t.ticketNumber === trip.ticketNumber);
    return found >= 0 ? found : 0;
  }, [orderTrips, trip]);

  // Real cumulative previous volume (sum of all trips before this one)
  const autoPreviousVolume = useMemo(() => {
    if (orderTrips.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < tripIdx; i++) {
      sum += orderTrips[i].volume;
    }
    return sum;
  }, [orderTrips, tripIdx]);

  // Initial volume for this trip
  const defaultCurrentVol = trip ? trip.volume : (order.deliveredVolume > 0 ? order.deliveredVolume : Math.min(5, order.totalVolume));

  const [customCurrentVolume, setCustomCurrentVolume] = useState<number>(defaultCurrentVol);
  const [customPreviousVolume, setCustomPreviousVolume] = useState<number>(autoPreviousVolume);

  // Sync if trip changes
  React.useEffect(() => {
    if (trip) {
      setCustomCurrentVolume(trip.volume);
      setCustomPreviousVolume(autoPreviousVolume);
      setSealNumber(`NC-${trip.ticketNumber.slice(-5)}`);
    } else {
      setCustomCurrentVolume(defaultCurrentVol);
      setCustomPreviousVolume(autoPreviousVolume);
    }
  }, [trip, autoPreviousVolume, defaultCurrentVol]);

  // Real cumulative computation (Cộng dồn thiệt!)
  const realAccumulated = Number((customPreviousVolume + customCurrentVolume).toFixed(2));
  const realRemaining = Number(Math.max(0, order.totalVolume - realAccumulated).toFixed(2));

  if (!isOpen) return null;

  const handlePrint = () => {
    // Triggers real native printer dialog connected to physical printers (Canon, HP, Epson LQ, Brother)
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Modal Top Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#e25822]">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">In Phiếu Giao Nhận Bê Tông (Mẫu Chuẩn TSG TNT)</h2>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sẵn sàng kết nối máy in
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Đơn hàng: <strong className="text-white">{order.code}</strong> • Số phiếu: <strong className="text-orange-400">{trip?.ticketNumber || '0160190'}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
              title="Mở hộp thoại in của hệ thống để in ra máy in thực sự (Canon, HP, Epson kim, Brother...)"
            >
              <Printer className="w-4 h-4" />
              <span>In ra máy in vật lý (Ctrl+P)</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switchers & Real Printer Controls */}
        <div className="bg-white border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('receipt')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'receipt'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Phiếu giao nhận (Hình 2)</span>
            </button>

            <button
              onClick={() => setActiveTab('details')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Lệnh điều phối (Hình 1)</span>
            </button>
          </div>

          {/* Paper Size & Printer Settings */}
          {activeTab === 'receipt' && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Paper Size selector */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <span className="text-[11px] text-slate-500 font-medium px-1">Khổ giấy in:</span>
                <button
                  onClick={() => setPaperSize('A4')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paperSize === 'A4'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Khổ A4
                </button>
                <button
                  onClick={() => setPaperSize('A5')}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paperSize === 'A5'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Khổ A5 (Nửa tờ A4 - phiếu 2 liên cho trạm bê tông)"
                >
                  Khổ A5 (2 liên)
                </button>
              </div>

              {/* Sample & Seal inputs */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Mã Mác:</span>
                <input
                  type="text"
                  value={sampleCode}
                  onChange={(e) => setSampleCode(e.target.value)}
                  className="w-20 px-2 py-0.5 border border-slate-300 rounded-lg font-mono text-xs text-center"
                />

                <span className="text-[11px] text-slate-500">Niêm chì:</span>
                <input
                  type="text"
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  className="w-20 px-2 py-0.5 border border-slate-300 rounded-lg font-mono text-xs text-center"
                />
              </div>
            </div>
          )}
        </div>

        {/* Real Cumulative Adjustment Bar (Cộng Dồn Thiệt) */}
        {activeTab === 'receipt' && (
          <div className="bg-amber-50/80 border-b border-amber-200/80 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 text-amber-950 font-medium">
              <Sliders className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Cấu hình Lũy kế cộng dồn thực tế:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 text-[11px]">Lũy kế trước đó (m³):</span>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={customPreviousVolume}
                  onChange={(e) => setCustomPreviousVolume(parseFloat(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-xs text-center"
                />
              </div>

              <span className="text-slate-400 font-bold">+</span>

              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 text-[11px]">Chuyến này (m³):</span>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={customCurrentVolume}
                  onChange={(e) => setCustomCurrentVolume(parseFloat(e.target.value) || 0)}
                  className="w-16 px-1.5 py-0.5 bg-white border border-amber-300 rounded-lg font-mono font-bold text-xs text-center text-orange-600"
                />
              </div>

              <span className="text-slate-400 font-bold">=</span>

              <div className="flex items-center gap-1 bg-red-100 text-red-900 px-2.5 py-0.5 rounded-lg border border-red-300 font-mono font-black text-xs">
                <span>CỘNG DỒN THIỆT:</span>
                <span className="text-sm">{realAccumulated} m³</span>
              </div>

              <div className="text-[11px] text-slate-500">
                (Còn lại: <strong className="text-slate-800">{realRemaining} m³</strong> / Đặt: <strong>{order.totalVolume} m³</strong>)
              </div>
            </div>
          </div>
        )}

        {/* Modal Body: Document Preview & Real Print Target */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/60 print:bg-white print:p-0 print:overflow-visible">
          {activeTab === 'receipt' ? (
            <div id="print-receipt-container" className="print-area">
              <ConcreteDeliveryReceipt
                order={order}
                trip={trip}
                previousVolume={customPreviousVolume}
                currentVolume={customCurrentVolume}
                accumulatedVolume={realAccumulated}
                remainingVolume={realRemaining}
                tripIndex={tripIdx + 1}
                totalTripsCount={Math.max(1, orderTrips.length || 1)}
                sealNumber={sealNumber}
                sampleCode={sampleCode}
                paperSize={paperSize}
              />
            </div>
          ) : (
            /* Dispatch View matching Image 1 */
            <div className="bg-white rounded-xl border border-slate-300 p-6 space-y-4 text-xs font-sans">
              <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-200">
                <button
                  onClick={() => setActiveTab('receipt')}
                  className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-300 rounded-lg font-bold text-blue-800 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  In điều phối
                </button>
              </div>

              {/* Order Info grid */}
              <div className="grid grid-cols-2 divide-x divide-slate-200 border border-slate-300 rounded-lg overflow-hidden">
                <div className="divide-y divide-slate-200">
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Ngày giao bê tông:</span>
                    <strong className="font-semibold text-slate-900">{order.deliveryDate}</strong>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Mã đơn hàng:</span>
                    <strong className="font-mono text-slate-900">{order.code}</strong>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Khách hàng:</span>
                    <strong className="text-slate-900">{order.customerName}</strong>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Công trình:</span>
                    <strong className="text-slate-900">{order.projectTitle}</strong>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Hạng mục:</span>
                    <strong className="text-slate-900">{order.categoryItem}</strong>
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Mác bê tông:</span>
                    <strong className="font-mono text-orange-600 font-bold">{order.grade}</strong>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Độ sụt:</span>
                    <strong className="text-slate-900">{order.slump}</strong>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Tổng khối lượng đặt:</span>
                    <strong className="text-slate-900 font-bold">{order.totalVolume} m³</strong>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Đã cấp (cộng dồn):</span>
                    <strong className="text-orange-600 font-bold">{order.deliveredVolume} m³</strong>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Kỹ thuật phụ trách:</span>
                    <strong className="text-slate-900">{order.technicianName || 'Nguyễn Văn Nam'}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Printer Connection Guide */}
        <div className="bg-white border-t border-slate-200 px-5 py-3 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Info className="w-4 h-4 text-blue-500 shrink-0" />
            <span>
              <strong>Hướng dẫn in máy vật lý:</strong> Bấm nút in, trình duyệt sẽ mở hộp thoại máy in hệ điều hành. Chọn máy in thật (Canon, HP, Epson kim, Brother...) và chọn cỡ giấy tương ứng (A4 hoặc A5).
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              Đóng
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-1.5 rounded-xl bg-[#e25822] hover:bg-[#d04d1c] font-black text-white flex items-center gap-1.5 shadow-md cursor-pointer transition"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu (Ctrl+P)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
