import React from 'react';
import { ConcreteOrder, DispatchTrip } from '../../types';

interface ConcreteDeliveryReceiptProps {
  order: ConcreteOrder;
  trip?: DispatchTrip | null;
  accumulatedVolume?: number;
  ticketSerial?: string;
  sealNumber?: string;
  sampleCode?: string;
}

export const ConcreteDeliveryReceipt: React.FC<ConcreteDeliveryReceiptProps> = ({
  order,
  trip,
  accumulatedVolume = 5,
  ticketSerial = '0160190',
  sealNumber = '0160190',
  sampleCode = 'M15S1028'
}) => {
  const currentVolume = trip ? trip.volume : order.totalVolume;
  const totalVolume = accumulatedVolume || currentVolume;
  const driverName = trip?.driverName || 'Bùi Thái Sơn';
  const truckPlate = trip?.truckPlate || '51M 97571';
  const departureTime = trip?.departureTime || '13:25';
  const slump = trip?.slumpTested || order.slump || '10+-2';
  const grade = trip?.grade || order.grade || 'M150R28';

  // Format date to DD/MM/YYYY
  const formattedDate = order.deliveryDate
    ? order.deliveryDate.split('-').reverse().join('/')
    : '03/10/2026';

  // Address
  const address = order.notes?.includes('Đường')
    ? order.notes
    : 'Đường N8, KCN Phước Đông, Phường Gia Lộc, Tỉnh Tây Ninh';

  return (
    <div className="bg-white text-black p-6 font-serif text-[13px] leading-snug w-full max-w-[800px] mx-auto border border-black shadow-sm print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none">
      {/* 1. Header Box matching Image 2 */}
      <div className="border-2 border-black grid grid-cols-12 divide-x-2 divide-black">
        {/* Left: TSG-TNT logo */}
        <div className="col-span-3 p-3 flex flex-col items-center justify-center text-center">
          {/* Logo SVG matching TSG-TNT swirl icon */}
          <div className="w-16 h-12 flex items-center justify-center mb-1">
            <svg viewBox="0 0 100 80" className="w-16 h-12">
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
          <div className="text-[9px] text-red-500 italic mt-0.5 tracking-tighter">
            Cất cánh vươn cao
          </div>
        </div>

        {/* Center: Company Name & Title */}
        <div className="col-span-6 flex flex-col justify-between text-center divide-y-2 divide-black">
          <div className="py-2 px-2 font-bold text-sm sm:text-base uppercase tracking-tight flex items-center justify-center font-sans text-center leading-snug">
            CÔNG TY CỔ PHẦN SX KD DV BÊ TÔNG TSG TNT
          </div>
          <div className="py-2.5 px-2 font-black text-lg uppercase tracking-wider font-sans">
            PHIẾU GIAO NHẬN BÊ TÔNG
          </div>
        </div>

        {/* Right: Serial, Date, Page, No. */}
        <div className="col-span-3 p-2 text-xs font-sans space-y-1 flex flex-col justify-center">
          <div className="flex">
            <span className="font-semibold w-16">Ký Hiệu:</span>
            <span>TSG/26-TN</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-16">Ngày:</span>
            <span>{formattedDate}</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-16">Trang:</span>
            <span>1/1</span>
          </div>
          <div className="flex">
            <span className="font-semibold w-16">Số:</span>
            <span className="font-mono font-bold">{trip?.ticketNumber || ticketSerial}</span>
          </div>
        </div>
      </div>

      {/* 2. Customer & Site Info Block */}
      <div className="my-3 space-y-1.5 font-sans text-xs">
        <div className="flex items-baseline">
          <span className="font-bold w-36 uppercase shrink-0">Khách Hàng</span>
          <span className="mr-2 font-bold">:</span>
          <span className="font-bold uppercase text-[13px]">{order.customerName}</span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-36 uppercase shrink-0">Công Trình</span>
          <span className="mr-2 font-bold">:</span>
          <span className="font-semibold">{order.projectTitle}</span>
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
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-36 uppercase shrink-0">Ngày Giao Bê Tông</span>
          <span className="mr-2 font-bold">:</span>
          <span className="font-semibold">{formattedDate}</span>
        </div>
      </div>

      {/* 3. Concrete Specifications Table */}
      <div className="my-3 overflow-hidden">
        <table className="w-full border-collapse border-2 border-black text-center font-sans text-xs">
          <thead>
            <tr className="border-b-2 border-black divide-x-2 divide-black bg-slate-50 print:bg-transparent font-bold">
              <th className="py-1.5 px-2 w-[14%]">Mã Mác</th>
              <th className="py-1.5 px-2 w-[18%]">Mác Bê Tông</th>
              <th className="py-1.5 px-2 w-[10%]">Đơn Vị</th>
              <th className="py-1.5 px-2 w-[14%]">Độ Sụt</th>
              <th className="py-1.5 px-2 w-[14%]">Lượng Xuất</th>
              <th className="py-1.5 px-2 w-[14%]">Cộng Dồn</th>
              <th className="py-1.5 px-2 w-[16%]">G.Chú</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black">
            <tr className="divide-x-2 divide-black h-8">
              <td className="py-1 px-2 font-mono font-medium">{sampleCode}</td>
              <td className="py-1 px-2 font-bold">{grade}</td>
              <td className="py-1 px-2">m3</td>
              <td className="py-1 px-2">{slump}</td>
              <td className="py-1 px-2 font-bold text-sm">{currentVolume}</td>
              <td className="py-1 px-2 font-bold text-sm">{totalVolume}</td>
              <td className="py-1 px-2 text-[11px]">{order.additive !== 'Không' ? order.additive : ''}</td>
            </tr>

            {/* Total Row */}
            <tr className="divide-x-2 divide-black border-t-2 border-black font-bold h-8">
              <td colSpan={4} className="py-1 px-3 text-center uppercase tracking-wider">
                TỔNG CỘNG
              </td>
              <td className="py-1 px-2 text-sm">{currentVolume}</td>
              <td className="py-1 px-2 text-sm">{totalVolume}</td>
              <td className="py-1 px-2"></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 4. Vehicle & Trip Details Block */}
      <div className="my-3 border-2 border-black font-sans text-xs divide-y-2 divide-black">
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
            <strong className="font-bold">{departureTime}</strong>
          </div>
          <div className="col-span-4 px-2">
            <span>Giờ Đến: </span>
            <span>{trip?.arrivalEstimate || ''}</span>
          </div>
          <div className="col-span-4 px-2"></div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-12 divide-x-2 divide-black py-1.5">
          <div className="col-span-4 px-2">
            <span>Thời Điểm Xả Bơm: </span>
          </div>
          <div className="col-span-4 px-2">
            <span>Thời Điểm Chấm Dứt: </span>
          </div>
          <div className="col-span-4 px-2"></div>
        </div>
      </div>

      {/* 5. Signatures (3 columns) */}
      <div className="mt-8 mb-14 grid grid-cols-3 text-center font-sans text-xs">
        <div>
          <div className="font-bold uppercase tracking-tight">NGƯỜI ĐIỀU HÀNH</div>
          <div className="text-[11px] italic text-slate-600 mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-16"></div>
          <div className="font-bold text-slate-800">DIEU DO TAY NINH</div>
        </div>

        <div>
          <div className="font-bold uppercase tracking-tight">ĐẠI DIỆN BÊN GIAO</div>
          <div className="text-[11px] italic text-slate-600 mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-16"></div>
          <div className="font-bold text-slate-800">{driverName}</div>
        </div>

        <div>
          <div className="font-bold uppercase tracking-tight">ĐẠI DIỆN BÊN NHẬN</div>
          <div className="text-[11px] italic text-slate-600 mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-16"></div>
          <div className="font-bold text-slate-800"></div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-right text-[10px] text-slate-500 font-sans print:hidden">
        Hệ thống điều độ TSG TNT • Mã tra cứu: {trip?.ticketNumber || ticketSerial}
      </div>
    </div>
  );
};
