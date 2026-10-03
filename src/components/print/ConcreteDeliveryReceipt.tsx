import React from 'react';
import { ConcreteOrder, DispatchTrip } from '../../types';

interface ConcreteDeliveryReceiptProps {
  order: ConcreteOrder;
  trip?: DispatchTrip | null;
  accumulatedVolume?: number;
  previousVolume?: number;
  currentVolume?: number;
  remainingVolume?: number;
  tripIndex?: number;
  totalTripsCount?: number;
  ticketSerial?: string;
  sealNumber?: string;
  sampleCode?: string;
  paperSize?: 'A4' | 'A5';
}

export const ConcreteDeliveryReceipt: React.FC<ConcreteDeliveryReceiptProps> = ({
  order,
  trip,
  accumulatedVolume,
  previousVolume = 0,
  currentVolume,
  remainingVolume,
  tripIndex = 1,
  totalTripsCount = 1,
  ticketSerial = '0160190',
  sealNumber = '0160190',
  sampleCode = 'M15S1028',
  paperSize = 'A4'
}) => {
  // Volume computations: Lũy kế trên phiếu in cộng dồn thiệt
  const actualCurrentVol = currentVolume !== undefined ? currentVolume : (trip ? trip.volume : order.totalVolume);
  const actualAccumulatedVol = accumulatedVolume !== undefined ? accumulatedVolume : (previousVolume + actualCurrentVol);
  const actualRemainingVol = remainingVolume !== undefined ? remainingVolume : Math.max(0, order.totalVolume - actualAccumulatedVol);

  const driverName = trip?.driverName || 'Bùi Thái Sơn';
  const truckPlate = trip?.truckPlate || '51M 97571';
  const departureTime = trip?.departureTime || '13:25';
  const slump = trip?.slumpTested || order.slump || '10±2';
  const grade = trip?.grade || order.grade || 'M150R28';

  // Format date to DD/MM/YYYY
  const formattedDate = order.deliveryDate
    ? order.deliveryDate.split('-').reverse().join('/')
    : '03/10/2026';

  // Address
  const address = order.notes?.includes('Đường')
    ? order.notes
    : 'Đường N8, KCN Phước Đông, Phường Gia Lộc, Thị xã Trảng Bàng, Tỉnh Tây Ninh';

  return (
    <div
      className={`bg-white text-black font-sans leading-snug w-full mx-auto border border-black shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none ${
        paperSize === 'A5'
          ? 'max-w-[700px] p-4 text-[11px]'
          : 'max-w-[850px] p-6 text-[12px]'
      }`}
    >
      {/* 1. Header Box matching Image 2 */}
      <div className="border-2 border-black grid grid-cols-12 divide-x-2 divide-black">
        {/* Left: TSG-TNT logo */}
        <div className="col-span-3 p-2 sm:p-3 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-11 flex items-center justify-center mb-1">
            <svg viewBox="0 0 100 80" className="w-14 h-11">
              <path
                d="M15,40 C15,20 40,10 65,15 C85,20 90,35 80,50 C70,65 40,70 20,60"
                fill="none"
                stroke="#0284c7"
                strokeWidth="7"
                strokeLinecap="round"
              />
              <path
                d="M25,45 C35,28 65,22 82,32 C95,40 88,58 72,62 C50,68 30,55 25,45"
                fill="none"
                stroke="#dc2626"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <circle cx="50" cy="40" r="12" fill="#0284c7" />
              <path d="M42,40 L58,40 M50,32 L50,48" stroke="#ffffff" strokeWidth="3" />
            </svg>
          </div>
          <div className="text-red-600 font-extrabold text-sm tracking-wider leading-none">
            TSG-TNT
          </div>
          <div className="text-[9px] text-red-500 italic mt-0.5 tracking-tight font-serif">
            Cất cánh vươn cao
          </div>
        </div>

        {/* Center: Company Name & Title */}
        <div className="col-span-6 flex flex-col justify-between text-center divide-y-2 divide-black">
          <div className="py-1.5 px-2 font-black text-xs sm:text-sm uppercase tracking-tight flex items-center justify-center leading-snug">
            CÔNG TY CỔ PHẦN SX KD DV BÊ TÔNG TSG TNT
          </div>
          <div className="py-2 px-2 font-black text-base sm:text-lg uppercase tracking-wider text-slate-950">
            PHIẾU GIAO NHẬN BÊ TÔNG
          </div>
        </div>

        {/* Right: Serial, Date, Page, No. */}
        <div className="col-span-3 p-2 text-[11px] space-y-1 flex flex-col justify-center">
          <div className="flex">
            <span className="font-bold w-16">Ký Hiệu:</span>
            <span>TSG/26-TN</span>
          </div>
          <div className="flex">
            <span className="font-bold w-16">Ngày:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex">
            <span className="font-bold w-16">Trang:</span>
            <span>1/1</span>
          </div>
          <div className="flex">
            <span className="font-bold w-16">Số phiếu:</span>
            <span className="font-mono font-black text-red-600">{trip?.ticketNumber || ticketSerial}</span>
          </div>
        </div>
      </div>

      {/* 2. Customer & Site Info Block */}
      <div className="my-2.5 space-y-1 font-sans text-xs">
        <div className="flex items-baseline">
          <span className="font-bold w-36 uppercase shrink-0">Khách Hàng</span>
          <span className="mr-2 font-bold">:</span>
          <span className="font-bold uppercase text-[13px]">{order.customerName}</span>
          {order.customerCode && <span className="ml-2 text-slate-500 font-mono text-[11px]">({order.customerCode})</span>}
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-36 uppercase shrink-0">Công Trình</span>
          <span className="mr-2 font-bold">:</span>
          <span className="font-bold text-[12px]">{order.projectTitle}</span>
          <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-bold border border-slate-400">
            {order.projectType === 'DD' ? 'Dân dụng (DD)' : 'Dự án (DA)'}
          </span>
          {order.orderType === 'PHAT_SINH' && (
            <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 border border-amber-400 text-amber-900">
              ĐƠN PHÁT SINH {order.parentOrderCode ? `(Gốc: ${order.parentOrderCode})` : ''}
            </span>
          )}
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-36 uppercase shrink-0">Địa Điểm</span>
          <span className="mr-2 font-bold">:</span>
          <span>{address}</span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-36 uppercase shrink-0">Hạng Mục</span>
          <span className="mr-2 font-bold">:</span>
          <span className="font-bold uppercase">{order.categoryItem || 'LÓT'}</span>
          <span className="ml-6 font-bold w-24 uppercase shrink-0">Loại Bơm:</span>
          <span>{order.pumpType || 'Bơm cần'}</span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-36 uppercase shrink-0">Ngày Giao Bê Tông</span>
          <span className="mr-2 font-bold">:</span>
          <span className="font-semibold">{formattedDate}</span>
          <span className="ml-6 font-bold w-24 uppercase shrink-0">Giờ Giao:</span>
          <span className="font-mono font-semibold">{order.deliveryTime}</span>
        </div>
      </div>

      {/* 3. Concrete Specifications Table With REAL Cumulative Volume */}
      <div className="my-2.5 overflow-hidden">
        <table className="w-full border-collapse border-2 border-black text-center font-sans text-xs">
          <thead>
            <tr className="border-b-2 border-black divide-x-2 divide-black bg-slate-100/80 print:bg-transparent font-bold">
              <th className="py-1.5 px-2 w-[14%]">Mã Mác</th>
              <th className="py-1.5 px-2 w-[18%]">Mác Bê Tông</th>
              <th className="py-1.5 px-2 w-[10%]">Đơn Vị</th>
              <th className="py-1.5 px-2 w-[14%]">Độ Sụt</th>
              <th className="py-1.5 px-2 w-[14%] bg-amber-50/60 print:bg-transparent">Lượng Xuất</th>
              <th className="py-1.5 px-2 w-[14%] bg-red-50/60 print:bg-transparent text-red-700">Cộng Dồn (Thiệt)</th>
              <th className="py-1.5 px-2 w-[16%]">G.Chú</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            <tr className="divide-x-2 divide-black h-8">
              <td className="py-1 px-2 font-mono font-medium">{sampleCode}</td>
              <td className="py-1 px-2 font-bold">{grade}</td>
              <td className="py-1 px-2">m³</td>
              <td className="py-1 px-2">{slump}</td>
              <td className="py-1 px-2 font-bold text-sm bg-amber-50/30 print:bg-transparent">
                {actualCurrentVol.toFixed(1)}
              </td>
              <td className="py-1 px-2 font-black text-sm text-red-700 bg-red-50/30 print:bg-transparent">
                {actualAccumulatedVol.toFixed(1)}
              </td>
              <td className="py-1 px-2 text-[11px]">
                {order.additive && order.additive !== 'Không' ? order.additive : ''}
              </td>
            </tr>

            {/* Total Row */}
            <tr className="divide-x-2 divide-black border-t-2 border-black font-bold h-8 bg-slate-50/50 print:bg-transparent">
              <td colSpan={4} className="py-1 px-3 text-center uppercase tracking-wider">
                TỔNG CỘNG LƯỢNG XUẤT & LŨY KẾ
              </td>
              <td className="py-1 px-2 text-sm font-black">{actualCurrentVol.toFixed(1)}</td>
              <td className="py-1 px-2 text-sm font-black text-red-700">{actualAccumulatedVol.toFixed(1)}</td>
              <td className="py-1 px-2 text-[10px] text-slate-600">
                {actualRemainingVol === 0 ? 'Hết đơn' : `Còn: ${actualRemainingVol.toFixed(1)} m³`}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Real cumulative summary strip */}
        <div className="mt-1 px-2 py-1 bg-slate-50 border border-slate-400 text-[11px] flex flex-wrap items-center justify-between font-mono">
          <div>
            <span>KL Hợp đồng (Đặt): </span>
            <strong className="font-bold">{order.totalVolume} m³</strong>
            <span className="mx-2">|</span>
            <span>Chuyến số: </span>
            <strong className="font-bold text-blue-700">{String(tripIndex).padStart(2, '0')} / {String(totalTripsCount).padStart(2, '0')} chuyến</strong>
          </div>
          <div>
            <span>Lũy kế trước: <strong>{previousVolume.toFixed(1)} m³</strong></span>
            <span className="mx-1.5">+</span>
            <span>Chuyến này: <strong>{actualCurrentVol.toFixed(1)} m³</strong></span>
            <span className="mx-1.5">=</span>
            <span className="text-red-700 font-bold">LŨY KẾ CỘNG DỒN: <strong>{actualAccumulatedVol.toFixed(1)} m³</strong></span>
            <span className="mx-2">|</span>
            <span>Còn lại: <strong className="text-amber-800">{actualRemainingVol.toFixed(1)} m³</strong></span>
          </div>
        </div>
      </div>

      {/* 4. Vehicle & Trip Details Block */}
      <div className="my-2.5 border-2 border-black font-sans text-xs divide-y-2 divide-black">
        {/* Row 1 */}
        <div className="grid grid-cols-12 divide-x-2 divide-black py-1.5">
          <div className="col-span-4 px-2">
            <span>Tên Tài Xế: </span>
            <strong className="font-bold">{driverName}</strong>
          </div>
          <div className="col-span-4 px-2">
            <span>Số Xe: </span>
            <strong className="font-bold font-mono">{truckPlate}</strong>
          </div>
          <div className="col-span-4 px-2">
            <span>Niêm Chì: </span>
            <strong className="font-bold font-mono">{sealNumber}</strong>
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-12 divide-x-2 divide-black py-1.5">
          <div className="col-span-4 px-2">
            <span>Giờ Khởi Hành: </span>
            <strong className="font-bold font-mono">{departureTime}</strong>
          </div>
          <div className="col-span-4 px-2">
            <span>Giờ Đến Dự Kiến: </span>
            <span className="font-mono">{trip?.arrivalEstimate || '14:00'}</span>
          </div>
          <div className="col-span-4 px-2">
            <span>Cự ly công trình: </span>
            <strong className="font-mono">{order.distanceKm || 15} km</strong>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-12 divide-x-2 divide-black py-1.5">
          <div className="col-span-4 px-2">
            <span>Thời Điểm Xả Bơm: </span>
            <span className="font-mono">..... : .....</span>
          </div>
          <div className="col-span-4 px-2">
            <span>Thời Điểm Kết Thúc: </span>
            <span className="font-mono">..... : .....</span>
          </div>
          <div className="col-span-4 px-2">
            <span>Kỹ thuật giao nhận: </span>
            <strong>{order.technicianName || 'Nguyễn Văn Nam'}</strong>
          </div>
        </div>
      </div>

      {/* 5. Signatures (3 columns) */}
      <div className="mt-6 mb-10 grid grid-cols-3 text-center font-sans text-xs">
        <div>
          <div className="font-bold uppercase tracking-tight">NGƯỜI ĐIỀU HÀNH</div>
          <div className="text-[10px] italic text-slate-600 mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-14"></div>
          <div className="font-bold text-slate-900 uppercase">ĐIỀU ĐỘ TÂY NINH</div>
        </div>

        <div>
          <div className="font-bold uppercase tracking-tight">ĐẠI DIỆN BÊN GIAO (LÁI XE)</div>
          <div className="text-[10px] italic text-slate-600 mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-14"></div>
          <div className="font-bold text-slate-900">{driverName}</div>
        </div>

        <div>
          <div className="font-bold uppercase tracking-tight">ĐẠI DIỆN BÊN NHẬN (CÔNG TRÌNH)</div>
          <div className="text-[10px] italic text-slate-600 mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-14"></div>
          <div className="font-bold text-slate-900">............................................</div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-right text-[10px] text-slate-500 font-sans print:hidden">
        Hệ thống điều độ bê tông TSG TNT • Mã tra cứu số: {trip?.ticketNumber || ticketSerial}
      </div>
    </div>
  );
};
