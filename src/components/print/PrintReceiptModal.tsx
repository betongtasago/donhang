import React, { useState, useMemo, useEffect } from 'react';
import { ConcreteOrder, DispatchTrip } from '../../types';
import { ConcreteDeliveryReceipt, PaperSizeType } from './ConcreteDeliveryReceipt';
import { Printer, X, Download, Eye, FileText, CheckCircle2, Sliders, Info, HelpCircle, Truck, UserCheck, Save, Sparkles } from 'lucide-react';
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
  const { trips, trucks, updateTripDetails } = useSync();

  const [activeTab, setActiveTab] = useState<'receipt' | 'details'>('receipt');

  // Paper Size: Mặc định giấy in liên tục 210x279 mm (khổ A4 liên tục đục lỗ viền)
  const [paperSize, setPaperSize] = useState<PaperSizeType>('CONTINUOUS_210_279');

  // Editable Driver Name and Truck Plate
  const [driverName, setDriverName] = useState<string>(trip?.driverName || 'Bùi Thái Sơn');
  const [truckPlate, setTruckPlate] = useState<string>(trip?.truckPlate || '51M 97571');
  const [isSavedTripSuccess, setIsSavedTripSuccess] = useState(false);

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

  // Sync if trip or order changes
  useEffect(() => {
    if (trip) {
      setDriverName(trip.driverName || 'Bùi Thái Sơn');
      setTruckPlate(trip.truckPlate || '51M 97571');
      setCustomCurrentVolume(trip.volume);
      setCustomPreviousVolume(autoPreviousVolume);
      setSealNumber(`NC-${trip.ticketNumber.slice(-5)}`);
    } else {
      setDriverName('Bùi Thái Sơn');
      setTruckPlate('51M 97571');
      setCustomCurrentVolume(defaultCurrentVol);
      setCustomPreviousVolume(autoPreviousVolume);
    }
  }, [trip, autoPreviousVolume, defaultCurrentVol]);

  // Save changes to trip in database/SyncContext
  const handleSaveTripDetails = () => {
    if (trip && updateTripDetails) {
      updateTripDetails(trip.id, {
        driverName,
        truckPlate,
        volume: customCurrentVolume
      });
      setIsSavedTripSuccess(true);
      setTimeout(() => setIsSavedTripSuccess(false), 2500);
    }
  };

  // Quick select existing truck & driver
  const handleSelectTruckOption = (plate: string) => {
    setTruckPlate(plate);
    const found = trucks.find(t => t.plateNumber === plate);
    if (found && found.driverName) {
      setDriverName(found.driverName);
    }
  };

  // Real cumulative computation (Cộng dồn thiệt!)
  const realAccumulated = Number((customPreviousVolume + customCurrentVolume).toFixed(2));
  const realRemaining = Number(Math.max(0, order.totalVolume - realAccumulated).toFixed(2));

  if (!isOpen) return null;

  const handlePrint = () => {
    // Dynamically inject exact @page size for the selected paper type (e.g. 210x279 mm for continuous A4 feed)
    const existingStyle = document.getElementById('dynamic-print-page-style');
    if (existingStyle) existingStyle.remove();

    const styleEl = document.createElement('style');
    styleEl.id = 'dynamic-print-page-style';

    if (paperSize === 'CONTINUOUS_210_279') {
      styleEl.innerHTML = `@media print { @page { size: 210mm 279mm !important; margin: 4mm 6mm !important; } }`;
    } else if (paperSize === 'A5') {
      styleEl.innerHTML = `@media print { @page { size: 210mm 148mm !important; margin: 4mm 6mm !important; } }`;
    } else {
      styleEl.innerHTML = `@media print { @page { size: 210mm 297mm !important; margin: 6mm 10mm !important; } }`;
    }

    document.head.appendChild(styleEl);

    // Call real physical printer dialog
    window.print();

    // Clean up
    setTimeout(() => {
      document.getElementById('dynamic-print-page-style')?.remove();
    }, 1500);
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
                  Sẵn sàng in
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
              title="In ra máy in vật lý (Canon, HP, Epson LQ-310 kim, Brother...)"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu ngay (Ctrl+P)</span>
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

          {/* Paper Size Selector: Option 210x279 mm Continuous A4 */}
          {activeTab === 'receipt' && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-slate-500 font-bold">Khổ giấy in:</span>
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                {/* Giấy in liên tục 210x279 mm */}
                <button
                  onClick={() => setPaperSize('CONTINUOUS_210_279')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black transition cursor-pointer flex items-center gap-1 ${
                    paperSize === 'CONTINUOUS_210_279'
                      ? 'bg-orange-500 text-white shadow-xs'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                  title="Giấy in liên tục đục lỗ 210x279 mm (chuẩn máy in kim Epson LQ-310 / máy in trạm bê tông)"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Giấy liên tục 210x279 mm (A4 liên tục)</span>
                </button>

                {/* Khổ A4 thường */}
                <button
                  onClick={() => setPaperSize('A4')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paperSize === 'A4'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Khổ A4 chuẩn văn phòng (210x297 mm)"
                >
                  Khổ A4 (210x297)
                </button>

                {/* Khổ A5 */}
                <button
                  onClick={() => setPaperSize('A5')}
                  className={`px-2 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    paperSize === 'A5'
                      ? 'bg-white text-slate-900 shadow-xs border border-slate-300'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Khổ A5 (Nửa tờ A4 - 210x148 mm)"
                >
                  Khổ A5 (2 liên)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CHỈNH SỬA TÊN TÀI XẾ & BIỂN SỐ XE TRỰC TIẾP TRÊN PHIẾU IN */}
        {activeTab === 'receipt' && (
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex flex-wrap items-center gap-4">
              {/* Chỉnh sửa Biển số xe */}
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-orange-600 shrink-0" />
                <span className="font-bold text-slate-700">Biển số xe:</span>
                <input
                  type="text"
                  value={truckPlate}
                  onChange={(e) => setTruckPlate(e.target.value)}
                  placeholder="51M 97571"
                  className="w-28 px-2 py-1 bg-white border border-slate-300 focus:border-orange-500 rounded-lg font-mono font-bold text-xs uppercase"
                  title="Nhập trực tiếp hoặc chọn biển số xe bên dưới"
                />
                <select
                  onChange={(e) => {
                    if (e.target.value) handleSelectTruckOption(e.target.value);
                  }}
                  className="px-1.5 py-1 bg-white border border-slate-300 rounded-lg text-[11px] text-slate-600 cursor-pointer font-medium"
                  title="Chọn nhanh xe bồn trong danh sách xe trạm"
                  defaultValue=""
                >
                  <option value="" disabled>Chọn xe...</option>
                  {trucks.map(t => (
                    <option key={t.id} value={t.plateNumber}>
                      {t.plateNumber} ({t.driverName})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chỉnh sửa Tên tài xế */}
              <div className="flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-slate-700">Tên tài xế:</span>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  placeholder="Bùi Thái Sơn"
                  className="w-36 px-2 py-1 bg-white border border-slate-300 focus:border-orange-500 rounded-lg font-bold text-xs"
                />
              </div>

              {/* Niêm chì & Mã mác */}
              <div className="flex items-center gap-1.5 text-slate-500">
                <span>Niêm chì:</span>
                <input
                  type="text"
                  value={sealNumber}
                  onChange={(e) => setSealNumber(e.target.value)}
                  className="w-20 px-1.5 py-1 bg-white border border-slate-300 rounded-lg font-mono text-xs text-center font-semibold"
                />
              </div>

              {/* Button lưu cập nhật vào trip */}
              {trip && (
                <button
                  type="button"
                  onClick={handleSaveTripDetails}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    isSavedTripSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                  title="Lưu lại tên tài xế và biển số xe vào dữ liệu chuyến xe bồn này"
                >
                  {isSavedTripSuccess ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Đã lưu vào chuyến!</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu vào chuyến xe</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Real Cumulative Adjustment Bar (Cộng Dồn Thiệt) */}
        {activeTab === 'receipt' && (
          <div className="bg-amber-50/80 border-b border-amber-200/80 px-5 py-2 flex flex-wrap items-center justify-between gap-3 text-xs print:hidden">
            <div className="flex items-center gap-2 text-amber-950 font-medium">
              <Sliders className="w-4 h-4 text-orange-600 shrink-0" />
              <span>Lũy kế cộng dồn trên phiếu in:</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 text-[11px]">Lũy kế trước (m³):</span>
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
                driverName={driverName}
                truckPlate={truckPlate}
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
                </div>

                <div className="divide-y divide-slate-200">
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Mác bê tông:</span>
                    <strong className="font-mono text-orange-600 font-bold">{order.grade}</strong>
                  </div>
                  <div className="p-2 flex justify-between">
                    <span className="text-slate-500 w-36">Tổng khối lượng đặt:</span>
                    <strong className="text-slate-900 font-bold">{order.totalVolume} m³</strong>
                  </div>
                  <div className="p-2 flex justify-between bg-slate-50/50">
                    <span className="text-slate-500 w-36">Tài xế & Xe:</span>
                    <strong className="text-slate-900 font-bold">{driverName} ({truckPlate})</strong>
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
              <strong>Lưu ý in giấy liên tục 210x279 mm:</strong> Trong hộp thoại in của trình duyệt, tại mục <em>Paper size (Cỡ giấy)</em> chọn <strong>Letter</strong> hoặc <strong>210 x 279 mm</strong>, tỷ lệ (Scale) <strong>100%</strong> hoặc <strong>Fit to paper</strong>.
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
              className="px-5 py-1.5 rounded-xl bg-[#e25822] hover:bg-[#d04d1c] font-black text-white flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
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
