import React, { useState } from 'react';
import { X, Plus, AlertCircle } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { OrderStatus } from '../../types';

interface CreateOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ isOpen, onClose }) => {
  const { createOrder, selectedPlant } = useSync();

  const [customerName, setCustomerName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [categoryItem, setCategoryItem] = useState('Sàn');
  const [totalVolume, setTotalVolume] = useState<number>(50);
  const [deliveryDate, setDeliveryDate] = useState('2026-09-30');
  const [deliveryTime, setDeliveryTime] = useState('08:00');
  const [grade, setGrade] = useState('M300');
  const [slump, setSlump] = useState('14±2');
  const [additive, setAdditive] = useState('R7');
  const [pumpType, setPumpType] = useState('Bơm cần 43m');
  const [contactPerson, setContactPerson] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [plantLocation, setPlantLocation] = useState(selectedPlant || 'Tây Ninh');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !projectTitle || totalVolume <= 0) {
      alert('Vui lòng nhập đầy đủ Tên khách hàng, Tên công trình và Khối lượng hợp lệ.');
      return;
    }

    createOrder({
      customerName,
      projectTitle,
      categoryItem,
      totalVolume,
      deliveryDate,
      deliveryTime,
      grade,
      slump,
      additive,
      pumpType,
      contactPerson: contactPerson || 'Chỉ huy trưởng',
      contactPhone: contactPhone || '0900 000 000',
      notes,
      plantLocation,
      status: 'DA_DUYET' as OrderStatus
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Tạo Đơn Hàng Cấp Bê Tông Mới
            </h2>
            <p className="text-xs text-slate-400">Điều độ trạm trộn và kế hoạch xe bồn</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700">Tên khách hàng / Nhà thầu *</label>
              <input
                type="text"
                required
                placeholder="VD: CÔNG TY TNHH XÂY DỰNG TÂN NHẬT NGUYỆT"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700">Tên công trình / Địa điểm cấp *</label>
              <input
                type="text"
                required
                placeholder="VD: NHÀ XƯỞNG SỐ 2 NHÀ MÁY DỆT TÂY NINH"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Hạng mục cấu kiện *</label>
              <input
                type="text"
                value={categoryItem}
                onChange={(e) => setCategoryItem(e.target.value)}
                placeholder="VD: Sàn, Cột, Móng, Dầm..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Khối lượng đặt hàng (m³) *</label>
              <input
                type="number"
                min="1"
                step="0.5"
                required
                value={totalVolume}
                onChange={(e) => setTotalVolume(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-orange-600 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Ngày giao hàng</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Giờ bắt đầu đổ</label>
              <input
                type="time"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mác bê tông</label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="M200">M200</option>
                <option value="M250">M250</option>
                <option value="M300">M300</option>
                <option value="M350">M350</option>
                <option value="M400">M400</option>
                <option value="M500">M500</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Độ sụt</label>
              <select
                value={slump}
                onChange={(e) => setSlump(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="10±2">10±2 cm</option>
                <option value="12±2">12±2 cm</option>
                <option value="14±2">14±2 cm</option>
                <option value="16±2">16±2 cm</option>
                <option value="18±2">18±2 cm</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Phụ gia kỹ thuật</label>
              <select
                value={additive}
                onChange={(e) => setAdditive(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Không">Không</option>
                <option value="R3">Đông kết nhanh R3</option>
                <option value="R7">Đông kết nhanh R7</option>
                <option value="R14">Đông kết nhanh R14</option>
                <option value="Chống thấm B6">Chống thấm B6</option>
                <option value="Chống thấm B8">Chống thấm B8</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Phương thức bơm bê tông</label>
              <select
                value={pumpType}
                onChange={(e) => setPumpType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Bơm cần 37m">Bơm cần 37m</option>
                <option value="Bơm cần 43m">Bơm cần 43m</option>
                <option value="Bơm cần 52m">Bơm cần 52m</option>
                <option value="Bơm tĩnh">Bơm tĩnh</option>
                <option value="Xả máng trực tiếp">Xả máng trực tiếp</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Người liên hệ công trường</label>
              <input
                type="text"
                placeholder="VD: Kỹ sư Tuấn"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Số điện thoại liên hệ</label>
              <input
                type="text"
                placeholder="VD: 0908 123 456"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700">Trạm cấp hàng</label>
              <select
                value={plantLocation}
                onChange={(e) => setPlantLocation(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              >
                <option value="Tây Ninh">Nhà máy / Trạm Tây Ninh (Trảng Bàng & Gò Dầu)</option>
                <option value="Bình Dương">Nhà máy / Trạm Bến Cát Bình Dương</option>
                <option value="Long An">Nhà máy / Trạm Đức Hoà Long An</option>
                <option value="TP.HCM">Nhà máy / Trạm Củ Chi TP.HCM</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="font-semibold text-slate-700">Ghi chú điều độ</label>
              <textarea
                rows={2}
                placeholder="Yêu cầu kiểm tra độ sụt tại bãi, đường xe vào công trường..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#e25822] hover:bg-[#d04d1c] text-white font-bold rounded-lg shadow-sm transition"
            >
              Tạo đơn & Đưa vào điều độ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
