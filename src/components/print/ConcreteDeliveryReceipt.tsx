import React from 'react';
import { ConcreteOrder, DispatchTrip } from '../../types';

export type PaperSizeType = 'A4' | 'A5' | 'CONTINUOUS_210_279';

interface ConcreteDeliveryReceiptProps {
  order: ConcreteOrder;
  trip?: DispatchTrip | null;
  driverName?: string;
  truckPlate?: string;
  accumulatedVolume?: number;
  previousVolume?: number;
  currentVolume?: number;
  remainingVolume?: number;
  tripIndex?: number;
  totalTripsCount?: number;
  ticketSerial?: string;
  sealNumber?: string;
  sampleCode?: string;
  departureTime?: string;
  arrivalTime?: string;
  pourStartTime?: string;
  pourEndTime?: string;
  operatorSignature?: string | null; // DataURL hoặc đường dẫn ảnh chữ ký của Người điều hành
  paperSize?: PaperSizeType;
}

export const ConcreteDeliveryReceipt: React.FC<ConcreteDeliveryReceiptProps> = ({
  order,
  trip,
  driverName: customDriverName,
  truckPlate: customTruckPlate,
  accumulatedVolume,
  previousVolume = 0,
  currentVolume,
  ticketSerial = '0160131',
  sealNumber = '0160131',
  sampleCode = 'M35S107',
  departureTime: customDepartureTime,
  arrivalTime = '',
  pourStartTime = '',
  pourEndTime = '',
  operatorSignature = null,
  paperSize = 'CONTINUOUS_210_279'
}) => {
  // Số liệu: Lượng xuất chuyến này và Cộng dồn
  const actualCurrentVol = currentVolume !== undefined ? currentVolume : (trip ? trip.volume : 10);
  const actualAccumulatedVol = accumulatedVolume !== undefined ? accumulatedVolume : (previousVolume + actualCurrentVol);

  const displayDriverName = customDriverName || trip?.driverName || 'Lê Hiền';
  const displayTruckPlate = customTruckPlate || trip?.truckPlate || '51M 23071';
  const displayDepartureTime = customDepartureTime || trip?.departureTime || '15:20';
  const slump = trip?.slumpTested || order.slump || '10+-2';
  const grade = trip?.grade || order.grade || 'M350R7';

  // Format date DD/MM/YYYY
  const formattedDate = order.deliveryDate
    ? order.deliveryDate.split('-').reverse().join('/')
    : '03/10/2026';

  // Address
  const address = order.notes && order.notes.length > 5 && !order.notes.startsWith('Đơn phát sinh')
    ? order.notes.toUpperCase()
    : 'LÔ 16.3, ĐƯỜNG 16, KCN THÀNH THÀNH CÔNG, TRẢNG BÀNG, TÂY NINH';

  return (
    <div
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
      className="bg-white text-black leading-snug w-full mx-auto max-w-[850px] p-6 text-[13px] print:p-0 print:m-0 print:max-w-none print:w-full print:text-[13px]"
    >
      {/* 1. Header Box: 3 Columns matching 100% of image */}
      <table className="w-full border-collapse border border-black mb-3 text-black">
        <tbody>
          <tr>
            {/* Col 1: TSG-TNT logo */}
            <td className="w-[24%] border border-black p-2 text-center align-middle">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-10 flex items-center justify-center mb-0.5">
                  <svg viewBox="0 0 100 75" className="w-14 h-9">
                    {/* Blue dynamic swooshes */}
                    <path
                      d="M 12 38 C 15 18, 48 10, 75 18 C 88 22, 92 34, 82 45 C 72 55, 42 60, 22 52"
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 22 42 C 30 26, 60 20, 78 28 C 88 34, 82 48, 68 52 C 48 56, 30 48, 25 42"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {/* Red flame/crescent dynamic wing */}
                    <path
                      d="M 32 46 C 45 32, 70 28, 86 36 C 94 40, 88 52, 74 55 C 56 60, 38 52, 32 46"
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="4"
                      strokeLinecap="round"
                    />
                    {/* Rocket/plane icon center */}
                    <circle cx="50" cy="38" r="9" fill="#0284c7" />
                    <path d="M 44 38 L 56 38 M 50 32 L 50 44" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
                <div className="text-red-600 font-extrabold text-[15px] tracking-wider leading-none">
                  TSG-TNT
                </div>
                <div className="text-[10px] text-red-500 italic mt-0.5 tracking-tight">
                  Cất cánh vươn cao
                </div>
              </div>
            </td>

            {/* Col 2: Company Name & Title */}
            <td className="w-[52%] border border-black p-0 text-center align-middle">
              <div className="py-2.5 px-2 border-b border-black font-bold text-[15px] uppercase tracking-normal">
                CÔNG TY CỔ PHẦN ĐẦU TƯ TSGTNT
              </div>
              <div className="py-2.5 px-2 font-bold text-[19px] uppercase tracking-wide">
                PHIẾU GIAO NHẬN BÊ TÔNG
              </div>
            </td>

            {/* Col 3: Right meta (Ký Hiệu, Ngày, Trang, Số) */}
            <td className="w-[24%] border border-black p-2 text-[12px] align-middle">
              <div className="space-y-1">
                <div className="flex">
                  <span className="w-16">Ký Hiệu:</span>
                  <span>TSG/26-TN</span>
                </div>
                <div className="flex">
                  <span className="w-16">Ngày:</span>
                  <span>{formattedDate}</span>
                </div>
                <div className="flex">
                  <span className="w-16">Trang:</span>
                  <span>1/1</span>
                </div>
                <div className="flex">
                  <span className="w-16">Số:</span>
                  <span className="font-semibold">{trip?.ticketNumber || ticketSerial}</span>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* 2. Customer & Site Info: Exactly 5 lines matching image 100% */}
      <div className="mb-3 space-y-1 text-[13px] leading-relaxed">
        <div className="flex items-baseline">
          <span className="font-bold w-40 shrink-0">Khách Hàng</span>
          <span className="mr-2">:</span>
          <span className="uppercase">{order.customerName}</span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-40 shrink-0">Công Trình</span>
          <span className="mr-2">:</span>
          <span className="uppercase">{order.projectTitle}</span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-40 shrink-0">Địa Điểm</span>
          <span className="mr-2">:</span>
          <span className="uppercase">{address}</span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-40 shrink-0">Hạng Mục</span>
          <span className="mr-2">:</span>
          <span className="uppercase">{order.categoryItem || 'SÀN TẦNG 4'}</span>
        </div>

        <div className="flex items-baseline">
          <span className="font-bold w-40 shrink-0">Ngày Giao Bê Tông</span>
          <span className="mr-2">:</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      {/* 3. Concrete Specifications Table: Exactly 7 columns matching image 100% */}
      <table className="w-full border-collapse border border-black text-center text-[13px] mb-4">
        <thead>
          <tr className="font-bold">
            <th className="border border-black py-1.5 px-2 w-[14%]">Mã Mác</th>
            <th className="border border-black py-1.5 px-2 w-[18%]">Mác Bê Tông</th>
            <th className="border border-black py-1.5 px-2 w-[10%]">Đơn Vị</th>
            <th className="border border-black py-1.5 px-2 w-[12%]">Độ Sụt</th>
            <th className="border border-black py-1.5 px-2 w-[15%]">Lượng Xuất</th>
            <th className="border border-black py-1.5 px-2 w-[15%]">Cộng Dồn</th>
            <th className="border border-black py-1.5 px-2 w-[16%]">G.Chú</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-black py-1 px-2">{sampleCode}</td>
            <td className="border border-black py-1 px-2">{grade}</td>
            <td className="border border-black py-1 px-2">m3</td>
            <td className="border border-black py-1 px-2">{slump}</td>
            <td className="border border-black py-1 px-2">{actualCurrentVol}</td>
            <td className="border border-black py-1 px-2">{actualAccumulatedVol}</td>
            <td className="border border-black py-1 px-2">
              {order.additive && order.additive !== 'Không' && order.additive !== 'R7' ? order.additive : ''}
            </td>
          </tr>

          {/* Row TỔNG CỘNG */}
          <tr className="font-bold">
            <td colSpan={4} className="border border-black py-1.5 px-2 text-center uppercase">
              TỔNG CỘNG
            </td>
            <td className="border border-black py-1.5 px-2">{actualCurrentVol}</td>
            <td className="border border-black py-1.5 px-2">{actualAccumulatedVol}</td>
            <td className="border border-black py-1.5 px-2"></td>
          </tr>
        </tbody>
      </table>

      {/* 4. Vehicle & Dispatch Info: Exactly 3 rows x 3 columns matching image 100% */}
      <table className="w-full border-collapse border border-black text-[13px] mb-8">
        <tbody>
          <tr>
            <td className="border border-black py-1.5 px-2 w-1/3">
              Tên Tài Xế: {displayDriverName}
            </td>
            <td className="border border-black py-1.5 px-2 w-1/3">
              Số Xe: {displayTruckPlate}
            </td>
            <td className="border border-black py-1.5 px-2 w-1/3">
              Niêm Chì: {sealNumber}
            </td>
          </tr>
          <tr>
            <td className="border border-black py-1.5 px-2">
              Giờ Khởi Hành: {displayDepartureTime}
            </td>
            <td className="border border-black py-1.5 px-2">
              Giờ Đến: {arrivalTime}
            </td>
            <td className="border border-black py-1.5 px-2"></td>
          </tr>
          <tr>
            <td className="border border-black py-1.5 px-2">
              Thời Điểm Xả Bơm: {pourStartTime}
            </td>
            <td className="border border-black py-1.5 px-2">
              Thời Điểm Chấm Dứt: {pourEndTime}
            </td>
            <td className="border border-black py-1.5 px-2"></td>
          </tr>
        </tbody>
      </table>

      {/* 5. Signatures: Exactly 3 columns with Operator Signature feature */}
      <div className="grid grid-cols-3 text-center text-[13px]">
        {/* Col 1: NGƯỜI ĐIỀU HÀNH with inserted signature */}
        <div className="flex flex-col items-center">
          <div className="font-bold uppercase tracking-tight">NGƯỜI ĐIỀU HÀNH</div>
          <div className="italic text-[12px] mt-0.5">(Ký, ghi rõ họ tên)</div>
          
          {/* Vùng chèn chữ ký của Người điều hành */}
          <div className="h-24 w-full flex items-center justify-center relative">
            {operatorSignature ? (
              <img
                src={operatorSignature}
                alt="Chữ ký Người điều hành"
                className="max-h-20 max-w-[170px] object-contain"
              />
            ) : (
              <div className="h-20"></div>
            )}
          </div>
        </div>

        {/* Col 2: ĐẠI DIỆN BÊN GIAO */}
        <div className="flex flex-col items-center">
          <div className="font-bold uppercase tracking-tight">ĐẠI DIỆN BÊN GIAO</div>
          <div className="italic text-[12px] mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-24"></div>
        </div>

        {/* Col 3: ĐẠI DIỆN BÊN NHẬN */}
        <div className="flex flex-col items-center">
          <div className="font-bold uppercase tracking-tight">ĐẠI DIỆN BÊN NHẬN</div>
          <div className="italic text-[12px] mt-0.5">(Ký, ghi rõ họ tên)</div>
          <div className="h-24"></div>
        </div>
      </div>
    </div>
  );
};
