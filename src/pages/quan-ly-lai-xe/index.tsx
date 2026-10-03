import React, { useState } from 'react';
import { Truck, Phone, Navigation, Fuel, Shield, Search, Plus, CheckCircle2, Sliders, MapPin, CalendarRange, Users } from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { TruckStatus } from '../../types';
import { DriverTripSummaryView } from './DriverTripSummaryView';
import { ProjectDistancesCard } from './ProjectDistancesCard';
import { BangSapTaiPage } from '../bang-sap-tai';
import { DanhSachTaiXePage } from '../danh-sach-tai-xe';

export const QuanLyLaiXePage: React.FC = () => {
  const { trucks, updateTruckStatus, trips } = useSync();
  const [activeTab, setActiveTab] = useState<'chuyen_km' | 'bang_sap_tai' | 'danh_sach_xe' | 'cong_trinh_km'>(() => {
    try {
      const saved = localStorage.getItem('tsg_lai_xe_tab');
      if (saved === 'chuyen_km' || saved === 'bang_sap_tai' || saved === 'danh_sach_xe' || saved === 'cong_trinh_km') return saved;
    } catch {}
    return 'chuyen_km';
  });

  React.useEffect(() => {
    try {
      localStorage.setItem('tsg_lai_xe_tab', activeTab);
    } catch {}
  }, [activeTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredTrucks = trucks.filter(t => {
    const matchSearch =
      t.plateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.driverPhone.includes(searchTerm);
    const matchStatus = filterStatus === 'ALL' || t.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const getStatusBadge = (status: TruckStatus) => {
    switch (status) {
      case 'SAN_SANG':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Sẵn sàng điều xe</span>;
      case 'DANG_NAP':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">Đang nạp trạm</span>;
      case 'DANG_CHAY':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">Đang di chuyển</span>;
      case 'DANG_XA':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 animate-pulse">Đang xả bê tông</span>;
      case 'BAO_DUONG':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">Bảo dưỡng</span>;
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-600 inline-block"></span>
            ĐỘI XE BỒN & LÁI XE BÊ TÔNG TSG
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Quản Lý Lái Xe, Tính Chuyến & Km Công Trình
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Tính chuyến lớn (≥6m³), chuyến nhỏ (&lt;6m³), quản lý danh sách km từng công trình và điều phối đội xe.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center p-1 bg-slate-200/80 rounded-2xl border border-slate-300/80 shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('bang_sap_tai')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'bang_sap_tai'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            <span>Bảng Sắp Tài TSG-TNT</span>
          </button>

          <button
            onClick={() => setActiveTab('danh_sach_xe')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'danh_sach_xe'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Đội Xe 8m³ & 10m³</span>
          </button>

          <button
            onClick={() => setActiveTab('chuyen_km')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'chuyen_km'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Tính Chuyến & Km Lái Xe</span>
          </button>

          <button
            onClick={() => setActiveTab('cong_trinh_km')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'cong_trinh_km'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Cự Ly Km Công Trình</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Bảng Sắp Tài Hằng Ngày TSG-TNT */}
      {activeTab === 'bang_sap_tai' && <BangSapTaiPage />}

      {/* Tab 2: Danh Sách Tài Xế & Xe Bồn 8m3 / 10m3 */}
      {activeTab === 'danh_sach_xe' && <DanhSachTaiXePage />}

      {/* Tab 3: Driver Trip Summary & Km calculation */}
      {activeTab === 'chuyen_km' && <DriverTripSummaryView />}

      {/* Tab 4: Project Distances Catalog */}
      {activeTab === 'cong_trinh_km' && <ProjectDistancesCard />}
    </div>
  );
};
