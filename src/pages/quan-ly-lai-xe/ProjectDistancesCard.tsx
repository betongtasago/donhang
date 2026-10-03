import React, { useState } from 'react';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Building,
  Navigation,
  ExternalLink,
  Search
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { ProjectDistance, ProjectType } from '../../types';

export const ProjectDistancesCard: React.FC = () => {
  const { projectDistances, addProjectDistance, updateProjectDistance, deleteProjectDistance } = useSync();

  const [searchTerm, setSearchTerm] = useState('');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states for Add/Edit
  const [customerCode, setCustomerCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const [projectType, setProjectType] = useState<ProjectType>('DA');
  const [address, setAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState<number>(15);
  const [technicianDefault, setTechnicianDefault] = useState('');

  const filteredDistances = (projectDistances || []).filter(p =>
    p.projectTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.customerCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setCustomerCode('');
    setCustomerName('');
    setProjectTitle('');
    setProjectType('DA');
    setAddress('');
    setDistanceKm(15);
    setTechnicianDefault('Nguyễn Văn Nam');
    setIsAddOpen(true);
  };

  const handleStartEdit = (p: ProjectDistance) => {
    setEditingId(p.id);
    setCustomerCode(p.customerCode);
    setCustomerName(p.customerName);
    setProjectTitle(p.projectTitle);
    setProjectType(p.projectType);
    setAddress(p.address);
    setDistanceKm(p.distanceKm);
    setTechnicianDefault(p.technicianDefault);
  };

  const handleSaveEdit = (id: string) => {
    updateProjectDistance(id, {
      customerCode,
      customerName,
      projectTitle,
      projectType,
      address,
      distanceKm: Number(distanceKm) || 10,
      technicianDefault
    });
    setEditingId(null);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectTitle || !customerName) {
      alert('Vui lòng nhập tên công trình và tên khách hàng.');
      return;
    }
    addProjectDistance({
      customerCode: customerCode || 'CT-NEW',
      customerName,
      projectTitle,
      projectType,
      address: address || 'Tây Ninh',
      distanceKm: Number(distanceKm) || 10,
      technicianDefault: technicianDefault || 'Nguyễn Văn Nam'
    });
    setIsAddOpen(false);
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-100 text-orange-800">
                ĐỊNH MỨC CỰ LY
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Danh Sách Km Từng Công Trình
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cơ sở dữ liệu cự ly vận chuyển (km) từ trạm trộn đến công trường để tính tổng km và định mức lái xe.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm công trình & cự ly km</span>
        </button>
      </div>

      {/* Add Modal */}
      {isAddOpen && (
        <form onSubmit={handleCreate} className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-orange-950 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-orange-600" />
              Thêm công trình mới vào danh bạ cự ly km:
            </span>
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="text-slate-400 hover:text-slate-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tên công trình *</label>
              <input
                type="text"
                required
                placeholder="VD: KHU ĐÔ THỊ TÂY NINH ECO"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Tên khách hàng / Nhà thầu *</label>
              <input
                type="text"
                required
                placeholder="VD: CÔNG TY XD PHÚC HƯNG"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mã Ctrinh / Mã KH</label>
              <input
                type="text"
                placeholder="VD: CT-ECO01"
                value={customerCode}
                onChange={(e) => setCustomerCode(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Loại công trình</label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value as ProjectType)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
              >
                <option value="DA">Dự án (DA)</option>
                <option value="DD">Dân dụng (DD)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Cự ly 1 chiều (km) *</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                required
                value={distanceKm}
                onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-orange-600"
              />
            </div>

            <div className="space-y-1 col-span-2">
              <label className="font-semibold text-slate-700">Địa chỉ công trường</label>
              <input
                type="text"
                placeholder="VD: Xã An Tịnh, Thị xã Trảng Bàng, Tây Ninh"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-lg shadow-xs"
            >
              + Lưu công trình
            </button>
          </div>
        </form>
      )}

      {/* Search */}
      <div className="relative w-full sm:w-72">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Tìm theo tên công trình, khách hàng..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[11px]">
              <th className="py-3 px-3 text-center">STT</th>
              <th className="py-3 px-3">MÃ CTRINH</th>
              <th className="py-3 px-4">TÊN CÔNG TRÌNH</th>
              <th className="py-3 px-3">KHÁCH HÀNG</th>
              <th className="py-3 px-3 text-center">LOẠI CTRINH</th>
              <th className="py-3 px-4">ĐỊA CHỈ</th>
              <th className="py-3 px-3 text-right">CỰ LY 1 CHIỀU</th>
              <th className="py-3 px-3 text-right text-orange-600">KHỨ HỒI (2 CHIỀU)</th>
              <th className="py-3 px-3">KỸ THUẬT MẶC ĐỊNH</th>
              <th className="py-3 px-3 text-center">THAO TÁC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDistances.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-6 text-center text-slate-400">
                  Chưa có công trình nào trong danh mục.
                </td>
              </tr>
            ) : (
              filteredDistances.map((p, idx) => {
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>

                    {/* Mã */}
                    <td className="py-3 px-3 font-mono font-bold text-slate-700">
                      {isEditing ? (
                        <input
                          type="text"
                          value={customerCode}
                          onChange={(e) => setCustomerCode(e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        p.customerCode || '---'
                      )}
                    </td>

                    {/* Tên công trình */}
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {isEditing ? (
                        <input
                          type="text"
                          value={projectTitle}
                          onChange={(e) => setProjectTitle(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        p.projectTitle
                      )}
                    </td>

                    {/* Khách hàng */}
                    <td className="py-3 px-3 text-slate-700 font-semibold truncate max-w-[180px]">
                      {isEditing ? (
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        p.customerName
                      )}
                    </td>

                    {/* Loại ctrinh */}
                    <td className="py-3 px-3 text-center">
                      {isEditing ? (
                        <select
                          value={projectType}
                          onChange={(e) => setProjectType(e.target.value as ProjectType)}
                          className="px-2 py-1 border border-slate-300 rounded text-xs"
                        >
                          <option value="DA">DA</option>
                          <option value="DD">DD</option>
                        </select>
                      ) : p.projectType === 'DD' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          DD (Dân dụng)
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          DA (Dự án)
                        </span>
                      )}
                    </td>

                    {/* Địa chỉ */}
                    <td className="py-3 px-4 text-slate-500 truncate max-w-[200px]" title={p.address}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="w-full px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        p.address
                      )}
                    </td>

                    {/* Cự ly 1 chiều */}
                    <td className="py-3 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="number"
                          step="0.5"
                          value={distanceKm}
                          onChange={(e) => setDistanceKm(parseFloat(e.target.value) || 0)}
                          className="w-20 px-2 py-1 border border-slate-300 rounded text-right font-bold text-xs"
                        />
                      ) : (
                        `${p.distanceKm} km`
                      )}
                    </td>

                    {/* Khứ hồi */}
                    <td className="py-3 px-3 text-right font-black text-orange-600 whitespace-nowrap">
                      {isEditing ? (
                        `${(distanceKm * 2)} km`
                      ) : (
                        `${p.roundTripKm || p.distanceKm * 2} km`
                      )}
                    </td>

                    {/* Kỹ thuật */}
                    <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          type="text"
                          value={technicianDefault}
                          onChange={(e) => setTechnicianDefault(e.target.value)}
                          className="w-28 px-2 py-1 border border-slate-300 rounded text-xs"
                        />
                      ) : (
                        p.technicianDefault || 'Nguyễn Văn Nam'
                      )}
                    </td>

                    {/* Thao tác */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleSaveEdit(p.id)}
                            className="p-1 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            title="Lưu"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="p-1 rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                            title="Hủy"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleStartEdit(p)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                            title="Chỉnh sửa cự ly km"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Xóa công trình ${p.projectTitle} khỏi danh sách km?`)) {
                                deleteProjectDistance(p.id);
                              }
                            }}
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition"
                            title="Xóa công trình"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
