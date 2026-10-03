import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ConcreteOrder, DispatchTrip } from '../../types';
import { ConcreteDeliveryReceipt, PaperSizeType } from './ConcreteDeliveryReceipt';
import {
  Printer,
  X,
  FileText,
  Truck,
  UserCheck,
  Save,
  CheckCircle2,
  PenTool,
  Upload,
  Trash2,
  Sparkles,
  Camera,
  Download,
  Copy,
  Loader2,
  Share2
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { toPng, toBlob } from 'html-to-image';

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

  // Paper Size: Mặc định giấy in liên tục 210x279 mm
  const [paperSize, setPaperSize] = useState<PaperSizeType>('CONTINUOUS_210_279');

  // Editable Driver Name and Truck Plate
  const [driverName, setDriverName] = useState<string>(trip?.driverName || 'Lê Hiền');
  const [truckPlate, setTruckPlate] = useState<string>(trip?.truckPlate || '51M 23071');
  const [sealNumber, setSealNumber] = useState(trip ? `0160${trip.ticketNumber.slice(-3)}` : '0160131');
  const [sampleCode, setSampleCode] = useState(order.grade ? `M35S107` : 'M35S107');
  const [departureTime, setDepartureTime] = useState<string>(trip?.departureTime || '15:20');
  const [isSavedTripSuccess, setIsSavedTripSuccess] = useState(false);

  // CHỮ KÝ NGƯỜI ĐIỀU HÀNH
  const [operatorSignature, setOperatorSignature] = useState<string | null>(() => {
    return localStorage.getItem('tsg_operator_signature') || null;
  });
  const [isDrawSignatureModalOpen, setIsDrawSignatureModalOpen] = useState(false);

  // CHỤP HÌNH PHIẾU NHANH
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureNotice, setCaptureNotice] = useState<string>('');

  // Canvas ref for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
    if (orderTrips.length === 0) return 46;
    let sum = 0;
    for (let i = 0; i < tripIdx; i++) {
      sum += orderTrips[i].volume;
    }
    return sum > 0 ? sum : 46;
  }, [orderTrips, tripIdx]);

  const defaultCurrentVol = trip ? trip.volume : 10;
  const [customCurrentVolume, setCustomCurrentVolume] = useState<number>(defaultCurrentVol);
  const [customPreviousVolume, setCustomPreviousVolume] = useState<number>(autoPreviousVolume);

  // Sync if trip or order changes
  useEffect(() => {
    if (trip) {
      setDriverName(trip.driverName || 'Lê Hiền');
      setTruckPlate(trip.truckPlate || '51M 23071');
      setDepartureTime(trip.departureTime || '15:20');
      setCustomCurrentVolume(trip.volume || 10);
      setCustomPreviousVolume(autoPreviousVolume);
      setSealNumber(`0160${trip.ticketNumber.slice(-3)}`);
    } else {
      setDriverName('Lê Hiền');
      setTruckPlate('51M 23071');
      setDepartureTime('15:20');
      setCustomCurrentVolume(10);
      setCustomPreviousVolume(46);
      setSealNumber('0160131');
    }
  }, [trip, autoPreviousVolume]);

  // Tự động đồng bộ biển số xe khi chọn hoặc sửa tên tài xế theo danh sách mặc định
  const handleDriverChange = (name: string) => {
    setDriverName(name);
    const matched = trucks.find(
      t => t.driverName.toLowerCase().trim() === name.toLowerCase().trim()
    );
    if (matched) {
      setTruckPlate(matched.plateNumber);
    }
  };

  const handleTruckPlateChange = (plate: string) => {
    setTruckPlate(plate);
    const matched = trucks.find(
      t => t.plateNumber.toLowerCase().trim() === plate.toLowerCase().trim()
    );
    if (matched) {
      setDriverName(matched.driverName);
    }
  };

  // Save changes to trip in database/SyncContext
  const handleSaveTripDetails = () => {
    if (trip && updateTripDetails) {
      updateTripDetails(trip.id, {
        driverName,
        truckPlate,
        volume: customCurrentVolume,
        departureTime
      });
      setIsSavedTripSuccess(true);
      setTimeout(() => setIsSavedTripSuccess(false), 2500);
    }
  };

  // Upload signature image handler
  const handleUploadSignature = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setOperatorSignature(dataUrl);
      localStorage.setItem('tsg_operator_signature', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  // Set sample signature
  const handleSetSampleSignature = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="90" viewBox="0 0 220 90">
      <path d="M 20 60 Q 40 20, 60 55 T 90 40 Q 120 15, 140 65 T 180 30 Q 200 45, 170 75" fill="none" stroke="#003366" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M 45 48 C 65 42, 95 44, 150 46" fill="none" stroke="#003366" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M 70 65 Q 110 78, 190 70" fill="none" stroke="#003366" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
    const dataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    setOperatorSignature(dataUrl);
    localStorage.setItem('tsg_operator_signature', dataUrl);
  };

  // Clear signature
  const handleClearSignature = () => {
    setOperatorSignature(null);
    localStorage.removeItem('tsg_operator_signature');
  };

  // Drawing Canvas functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const clientY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#003366';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setOperatorSignature(dataUrl);
    localStorage.setItem('tsg_operator_signature', dataUrl);
    setIsDrawSignatureModalOpen(false);
  };

  // CHỤP HÌNH PHIẾU VÀ LƯU VÀO BỘ NHỚ TẠM (CHỈ SAO CHÉP CLIPBOARD, KHÔNG TỰ ĐỘNG TẢI FILE)
  const handleQuickCapture = async () => {
    const receiptEl = document.getElementById('print-receipt-container');
    if (!receiptEl) {
      alert('Không tìm thấy khung phiếu để chụp');
      return;
    }

    setIsCapturing(true);
    setCaptureNotice('Đang chụp ảnh phiếu giao nhận vào bộ nhớ tạm...');

    try {
      const blob = await toBlob(receiptEl, {
        quality: 1,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff'
      });

      if (!blob) {
        throw new Error('Không thể kết xuất ảnh phiếu');
      }

      if (navigator.clipboard && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob })
        ]);
        setCaptureNotice('✅ ĐÃ SAO CHÉP ẢNH PHIẾU VÀO BỘ NHỚ TẠM! Bạn chỉ cần mở Zalo / Viber và nhấn Ctrl + V để gửi.');
      } else {
        setCaptureNotice('⚠️ Trình duyệt cần cấp quyền sao chép hình ảnh vào bộ nhớ tạm.');
      }
    } catch (err: any) {
      console.error('Lỗi sao chép ảnh phiếu:', err);
      setCaptureNotice('❌ Lỗi khi chụp và sao chép ảnh: ' + (err?.message || err));
    } finally {
      setIsCapturing(false);
      setTimeout(() => {
        setCaptureNotice('');
      }, 7000);
    }
  };

  // Real cumulative computation (Cộng dồn thiệt!)
  const realAccumulated = Number((customPreviousVolume + customCurrentVolume).toFixed(2));

  if (!isOpen) return null;

  const handlePrint = () => {
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

    // Call real physical printer
    window.print();

    setTimeout(() => {
      document.getElementById('dynamic-print-page-style')?.remove();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-100 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-300 overflow-hidden flex flex-col max-h-[96vh]">
        {/* Top Control Bar */}
        <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#e25822]">
              <Printer className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">Phiếu Giao Nhận Bê Tông (Mẫu Chuẩn TSGTNT 100%)</h2>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sẵn sàng in
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Đơn hàng: <strong className="text-white">{order.code}</strong> • Số phiếu: <strong className="text-orange-400">{trip?.ticketNumber || sealNumber}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* NÚT CHỤP MÀN HÌNH PHIẾU (CHỈ LƯU BỘ NHỚ TẠM) */}
            <button
              onClick={handleQuickCapture}
              disabled={isCapturing}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
              title="Chụp màn hình phiếu và lưu vào bộ nhớ tạm (không tải về máy), nhấn Ctrl+V để gửi ngay qua Zalo/Viber"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang sao chép...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-cyan-200" />
                  <span>Chụp lưu bộ nhớ tạm (Ctrl+V)</span>
                </>
              )}
            </button>

            {/* NÚT IN RA MÁY IN THẬT */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition active:scale-95"
            >
              <Printer className="w-4 h-4" />
              <span>In phiếu (Ctrl+P)</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Thông báo chụp hình thành công */}
        {captureNotice && (
          <div className="bg-emerald-600 text-white px-5 py-2 text-xs font-bold flex items-center justify-between shadow-inner print:hidden animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{captureNotice}</span>
            </div>
            <button onClick={() => setCaptureNotice('')} className="text-white/80 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TOOLBAR: Chèn chữ ký Người điều hành & Chỉnh sửa thông tin */}
        <div className="bg-white border-b border-slate-200 px-5 py-2.5 space-y-2 text-xs print:hidden">
          {/* Row 1: Chữ ký Người điều hành & Chụp hình */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50/80 p-2.5 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-blue-700 shrink-0" />
              <span className="font-bold text-blue-950">Chữ ký Người điều hành:</span>
              {operatorSignature ? (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Đã chèn chữ ký
                </span>
              ) : (
                <span className="text-[11px] text-slate-500 italic">(Chưa chèn - Để trống để ký tay)</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {/* Nút Vẽ chữ ký tay */}
              <button
                type="button"
                onClick={() => setIsDrawSignatureModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer transition"
                title="Ký tay trực tiếp trên màn hình cảm ứng hoặc chuột"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Ký tay trực tiếp</span>
              </button>

              {/* Nút Tải ảnh chữ ký */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                title="Tải ảnh chữ ký PNG hoặc JPG từ máy tính"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Tải ảnh chữ ký</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleUploadSignature}
                className="hidden"
              />

              {/* Nút Chữ ký mẫu */}
              <button
                type="button"
                onClick={handleSetSampleSignature}
                className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                title="Chèn chữ ký điện tử mẫu chuẩn"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chữ ký mẫu</span>
              </button>

              {/* Nút Xóa chữ ký */}
              {operatorSignature && (
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="px-2 py-1 rounded-lg hover:bg-red-50 text-red-600 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                  title="Xóa chữ ký để trống ký tay bằng bút mực"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: Chỉnh sửa Tài xế, Biển số xe, Lượng xuất, Cộng dồn */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-3">
              {/* Tên tài xế (Chọn tài xế thì biển số xe tự động đi theo) */}
              <div className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-semibold text-slate-700">Tài Xế:</span>
                <select
                  value={trucks.some(t => t.driverName.toLowerCase() === driverName.toLowerCase()) ? driverName : ''}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  className="px-1.5 py-0.5 bg-white border border-blue-300 rounded font-bold text-xs cursor-pointer max-w-[130px]"
                  title="Chọn tài xế (Biển số xe tự động đi theo danh sách mặc định)"
                >
                  <option value="">-- Chọn TX --</option>
                  {trucks.map(t => (
                    <option key={t.id} value={t.driverName}>
                      {t.driverName}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => handleDriverChange(e.target.value)}
                  className="w-24 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-bold text-xs"
                />
              </div>

              {/* Biển số xe (Tự động cập nhật theo tài xế) */}
              <div className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-orange-600" />
                <span className="font-semibold text-slate-700">Số Xe:</span>
                <input
                  type="text"
                  value={truckPlate}
                  onChange={(e) => handleTruckPlateChange(e.target.value)}
                  className="w-24 px-1.5 py-0.5 bg-white border border-orange-300 rounded font-mono font-bold text-orange-700 text-xs"
                  title="Biển số xe tự động đi theo tài xế mặc định"
                />
              </div>

              {/* Giờ khởi hành */}
              <div className="flex items-center gap-1">
                <span className="font-semibold text-slate-700">Giờ Khởi Hành:</span>
                <input
                  type="text"
                  value={departureTime}
                  onChange={(e) => setDepartureTime(e.target.value)}
                  className="w-16 px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-xs text-center font-bold"
                />
              </div>

              {/* Lượng xuất & Cộng dồn */}
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                <span className="text-[11px] text-amber-900 font-semibold">Lượng xuất:</span>
                <input
                  type="number"
                  step="0.5"
                  value={customCurrentVolume}
                  onChange={(e) => setCustomCurrentVolume(parseFloat(e.target.value) || 0)}
                  className="w-12 px-1 py-0.5 bg-white border border-amber-300 rounded text-center font-bold text-orange-600 text-xs"
                />
                <span className="text-[11px] text-amber-900 font-semibold ml-1">Cộng dồn:</span>
                <span className="font-black text-red-600 text-xs">{realAccumulated}</span>
              </div>

              {/* Lưu vào chuyến */}
              {trip && (
                <button
                  type="button"
                  onClick={handleSaveTripDetails}
                  className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSavedTripSuccess ? 'Đã lưu!' : 'Lưu vào chuyến'}</span>
                </button>
              )}
            </div>

            {/* Chọn khổ giấy */}
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
              <span className="text-slate-500 px-1 font-medium">Khổ giấy:</span>
              <button
                onClick={() => setPaperSize('CONTINUOUS_210_279')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                  paperSize === 'CONTINUOUS_210_279' ? 'bg-orange-500 text-white' : 'text-slate-700'
                }`}
              >
                Liên tục 210x279 mm
              </button>
              <button
                onClick={() => setPaperSize('A4')}
                className={`px-2 py-0.5 rounded font-bold transition cursor-pointer ${
                  paperSize === 'A4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Khổ A4
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body: Document Preview & Real Print Target */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-200/60 print:bg-white print:p-0 print:overflow-visible">
          <div id="print-receipt-container" className="print-area shadow-lg print:shadow-none bg-white">
            <ConcreteDeliveryReceipt
              order={order}
              trip={trip}
              driverName={driverName}
              truckPlate={truckPlate}
              departureTime={departureTime}
              previousVolume={customPreviousVolume}
              currentVolume={customCurrentVolume}
              accumulatedVolume={realAccumulated}
              ticketSerial={sealNumber}
              sealNumber={sealNumber}
              sampleCode={sampleCode}
              operatorSignature={operatorSignature}
              paperSize={paperSize}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">
              Phiếu in chuẩn 100% TSGTNT • Có nút chụp hình nhanh để gửi Zalo cho lái xe và khách hàng
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Nút chụp hình ở footer */}
            <button
              onClick={handleQuickCapture}
              disabled={isCapturing}
              className="px-4 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-300 flex items-center gap-1.5 transition cursor-pointer"
              title="Chụp phiếu và lưu vào bộ nhớ tạm (không tải về máy), nhấn Ctrl+V để dán vào Zalo/Viber"
            >
              <Copy className="w-4 h-4 text-blue-600" />
              <span>Chụp vào bộ nhớ tạm</span>
            </button>

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

      {/* DRAW SIGNATURE MODAL (Canvas ký tay) */}
      {isDrawSignatureModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-300 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <PenTool className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Ký Tên Người Điều Hành</h3>
              </div>
              <button
                onClick={() => setIsDrawSignatureModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Dùng chuột hoặc ngón tay để ký vào khung bên dưới:
            </p>

            {/* Canvas */}
            <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                width={360}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair bg-white w-full"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={clearCanvas}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Xóa làm lại
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawSignatureModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={saveCanvasSignature}
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs"
                >
                  Xác nhận & Dùng chữ ký này
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
