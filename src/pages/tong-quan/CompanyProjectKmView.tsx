import React, { useState, useMemo } from 'react';
import {
  Building2,
  MapPin,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileSpreadsheet,
  Truck,
  Eye,
  X,
  Save,
  CheckCircle2,
  Navigation,
  TrendingUp,
  Filter,
  Phone,
  Calendar,
  Layers
} from 'lucide-react';
import { useSync } from '../../sync/SyncContext';
import { DispatchTrip, ConcreteOrder, ProjectDistance, ProjectType } from '../../types';
import * as XLSX from 'xlsx';

interface CompanyProjectKmViewProps {
  selectedMonth: number;
  selectedYear: number;
}

interface ProjectSummaryItem {
  key: string;
  customerName: string;
  customerCode: string;
  projectTitle: string;
  projectType: ProjectType;
  address: string;
  distanceKm: number;
  roundTripKm: number;
  registeredId?: string; // id in projectDistances if exists
  tripsCount: number;
  totalVolume: number;
  totalKmOneWay: number;
  totalKmRoundTrip: number;
  driverMap: Map<string, { count: number; volume: number; phone?: string; plate?: string }>;
  trips: Array<{
    trip: DispatchTrip;
    order?: ConcreteOrder;
    dateDmy: string;
    distanceKm: number;
    roundTripKm: number;
  }>;
}

export const CompanyProjectKmView: React.FC<CompanyProjectKmViewProps> = ({
  selectedMonth,
  selectedYear
}) => {
  const { orders, trips, projectDistances, addProjectDistance, updateProjectDistance, deleteProjectDistance } = useSync();

  // Search, filter & sort
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'DA' | 'DD'>('ALL');
  const [filterActivity, setFilterActivity] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [sortBy, setSortBy] = useState<'trips' | 'km' | 'volume' | 'distance' | 'name'>('trips');

  // Modal xem chi tiết chuyến của công trình
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ProjectSummaryItem | null>(null);

  // Modal thêm/sửa định mức cự ly công trình
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingDistanceId, setEditingDistanceId] = useState<string | null>(null);
  const [formCustomerCode, setFormCustomerCode] = useState('');
  const [formCustomerName, setFormCustomerName] = useState('');
  const [formProjectTitle, setFormProjectTitle] = useState('');
  const [formProjectType, setFormProjectType] = useState<ProjectType>('DA');
  const [formAddress, setFormAddress] = useState('');
  const [formDistanceKm, setFormDistanceKm] = useState<number>(15);
  const [formTechnicianDefault, setFormTechnicianDefault] = useState('Nguyễn Văn Nam');

  // Helper tính khoảng cách Km
  const getDistanceForProject = (projectTitle: string, customerName?: string, fallback = 15): number => {
    if (!projectTitle) return fallback;
    const match = projectDistances.find(
      p =>
        p.projectTitle.toLowerCase().trim() === projectTitle.toLowerCase().trim() ||
        (customerName && p.customerName.toLowerCase().trim() === customerName.toLowerCase().trim())
    );
    return match?.distanceKm || fallback;
  };

  // Helper tính ngày dương lịch
  const getTripGregorianDate = (trip: DispatchTrip, order?: ConcreteOrder): { dmy: string; month: number; year: number } => {
    let raw = trip.deliveryDate || '';
    if (!raw && trip.entryDate) raw = trip.entryDate.split(' ')[0];
    if (!raw && order?.deliveryDate) raw = order.deliveryDate;
    if (!raw) raw = '04/10/2026';

    let d = 4, m = 10, y = 2026;
    if (raw.includes('/')) {
      const parts = raw.split('/');
      if (parts.length === 3) {
        d = parseInt(parts[0], 10) || 4;
        m = parseInt(parts[1], 10) || 10;
        y = parseInt(parts[2], 10) || 2026;
      }
    } else if (raw.includes('-')) {
      const parts = raw.split('-');
      if (parts.length === 3) {
        y = parseInt(parts[0], 10) || 2026;
        m = parseInt(parts[1], 10) || 10;
        d = parseInt(parts[2], 10) || 4;
      }
    }

    const dStr = d < 10 ? `0${d}` : `${d}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    return { dmy: `${dStr}/${mStr}/${y}`, month: m, year: y };
  };

  // Tổng hợp dữ liệu theo Công ty & Công trình trong tháng đã chọn
  const projectSummaries = useMemo(() => {
    const map = new Map<string, ProjectSummaryItem>();

    // 1. Nạp trước các công trình từ danh mục chuẩn projectDistances
    projectDistances.forEach(pd => {
      const key = `${pd.customerName.trim().toLowerCase()}___${pd.projectTitle.trim().toLowerCase()}`;
      map.set(key, {
        key,
        customerName: pd.customerName,
        customerCode: pd.customerCode || 'CT-TSG',
        projectTitle: pd.projectTitle,
        projectType: pd.projectType || 'DA',
        address: pd.address || '',
        distanceKm: pd.distanceKm || 15,
        roundTripKm: pd.roundTripKm || (pd.distanceKm ? pd.distanceKm * 2 : 30),
        registeredId: pd.id,
        tripsCount: 0,
        totalVolume: 0,
        totalKmOneWay: 0,
        totalKmRoundTrip: 0,
        driverMap: new Map(),
        trips: []
      });
    });

    // 2. Quét trips trong tháng dương lịch được chọn
    trips.forEach(trip => {
      const ord = orders.find(o => o.id === trip.orderId || o.code === trip.orderCode);
      const { dmy, month, year } = getTripGregorianDate(trip, ord);

      if (month === selectedMonth && year === selectedYear) {
        const custName = (ord?.customerName || 'CÔNG TY TSG').trim();
        const prjTitle = (ord?.projectTitle || 'CÔNG TRÌNH TÂY NINH').trim();
        const key = `${custName.toLowerCase()}___${prjTitle.toLowerCase()}`;

        let item = map.get(key);
        if (!item) {
          const registered = projectDistances.find(
            p => p.projectTitle.toLowerCase().trim() === prjTitle.toLowerCase()
          );
          const distKm = trip.distanceKm || ord?.distanceKm || registered?.distanceKm || 15;

          item = {
            key,
            customerName: custName,
            customerCode: ord?.customerCode || registered?.customerCode || 'CT-TSG',
            projectTitle: prjTitle,
            projectType: registered?.projectType || ord?.projectType || 'DA',
            address: registered?.address || 'Tây Ninh',
            distanceKm: distKm,
            roundTripKm: distKm * 2,
            registeredId: registered?.id,
            tripsCount: 0,
            totalVolume: 0,
            totalKmOneWay: 0,
            totalKmRoundTrip: 0,
            driverMap: new Map(),
            trips: []
          };
          map.set(key, item);
        }

        const km = item.distanceKm;
        const roundKm = km * 2;
        const vol = trip.volume || 0;
        const driver = trip.driverName?.trim() || 'Tài xế';

        item.tripsCount += 1;
        item.totalVolume += vol;
        item.totalKmOneWay += km;
        item.totalKmRoundTrip += roundKm;

        // Group driver
        const dStat = item.driverMap.get(driver) || { count: 0, volume: 0, phone: trip.driverPhone, plate: trip.truckPlate };
        dStat.count += 1;
        dStat.volume += vol;
        if (trip.driverPhone) dStat.phone = trip.driverPhone;
        if (trip.truckPlate) dStat.plate = trip.truckPlate;
        item.driverMap.set(driver, dStat);

        item.trips.push({
          trip,
          order: ord,
          dateDmy: dmy,
          distanceKm: km,
          roundTripKm: roundKm
        });
      }
    });

    let list = Array.from(map.values());

    // Làm tròn số khối lượng
    list.forEach(i => {
      i.totalVolume = Math.round(i.totalVolume * 10) / 10;
    });

    // Lọc theo từ khóa tìm kiếm
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        i =>
          i.customerName.toLowerCase().includes(q) ||
          i.projectTitle.toLowerCase().includes(q) ||
          i.customerCode.toLowerCase().includes(q) ||
          i.address.toLowerCase().includes(q)
      );
    }

    // Lọc loại công trình
    if (filterType !== 'ALL') {
      list = list.filter(i => i.projectType === filterType);
    }

    // Lọc trạng thái hoạt động trong tháng
    if (filterActivity === 'ACTIVE') {
      list = list.filter(i => i.tripsCount > 0);
    } else if (filterActivity === 'INACTIVE') {
      list = list.filter(i => i.tripsCount === 0);
    }

    // Sắp xếp
    list.sort((a, b) => {
      if (sortBy === 'trips') return b.tripsCount - a.tripsCount;
      if (sortBy === 'km') return b.totalKmOneWay - a.totalKmOneWay;
      if (sortBy === 'volume') return b.totalVolume - a.totalVolume;
      if (sortBy === 'distance') return b.distanceKm - a.distanceKm;
      return a.customerName.localeCompare(b.customerName, 'vi');
    });

    return list;
  }, [trips, orders, projectDistances, selectedMonth, selectedYear, searchTerm, filterType, filterActivity, sortBy]);

  // Metrics tổng quan trong tháng
  const totalMetrics = useMemo(() => {
    let totalProjects = 0;
    let activeProjects = 0;
    let totalTrips = 0;
    let totalVolume = 0;
    let totalKmOneWay = 0;
    let totalKmRoundTrip = 0;

    projectSummaries.forEach(i => {
      totalProjects += 1;
      if (i.tripsCount > 0) activeProjects += 1;
      totalTrips += i.tripsCount;
      totalVolume += i.totalVolume;
      totalKmOneWay += i.totalKmOneWay;
      totalKmRoundTrip += i.totalKmRoundTrip;
    });

    const maxKmProject = [...projectSummaries].sort((a, b) => b.distanceKm - a.distanceKm)[0] || null;

    return {
      totalProjects,
      activeProjects,
      totalTrips,
      totalVolume: Math.round(totalVolume * 10) / 10,
      totalKmOneWay,
      totalKmRoundTrip,
      maxKmProject
    };
  }, [projectSummaries]);

  // Mở modal thêm công trình
  const handleOpenAddModal = () => {
    setEditingDistanceId(null);
    setFormCustomerCode('CT-' + Math.floor(100 + Math.random() * 900));
    setFormCustomerName('');
    setFormProjectTitle('');
    setFormProjectType('DA');
    setFormAddress('');
    setFormDistanceKm(15);
    setFormTechnicianDefault('Nguyễn Văn Nam');
    setIsEditModalOpen(true);
  };

  // Mở modal sửa công trình
  const handleOpenEditModal = (item: ProjectSummaryItem) => {
    setEditingDistanceId(item.registeredId || null);
    setFormCustomerCode(item.customerCode);
    setFormCustomerName(item.customerName);
    setFormProjectTitle(item.projectTitle);
    setFormProjectType(item.projectType);
    setFormAddress(item.address);
    setFormDistanceKm(item.distanceKm);
    setFormTechnicianDefault('Nguyễn Văn Nam');
    setIsEditModalOpen(true);
  };

  // Lưu công trình cự ly Km
  const handleSaveDistance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProjectTitle.trim() || !formCustomerName.trim()) {
      alert('Vui lòng nhập tên công trình và tên khách hàng.');
      return;
    }

    const dist = Number(formDistanceKm) || 15;

    if (editingDistanceId) {
      updateProjectDistance(editingDistanceId, {
        customerCode: formCustomerCode.trim(),
        customerName: formCustomerName.trim(),
        projectTitle: formProjectTitle.trim(),
        projectType: formProjectType,
        address: formAddress.trim(),
        distanceKm: dist,
        roundTripKm: dist * 2,
        technicianDefault: formTechnicianDefault.trim()
      });
    } else {
      addProjectDistance({
        customerCode: formCustomerCode.trim(),
        customerName: formCustomerName.trim(),
        projectTitle: formProjectTitle.trim(),
        projectType: formProjectType,
        address: formAddress.trim(),
        distanceKm: dist,
        technicianDefault: formTechnicianDefault.trim()
      });
    }

    setIsEditModalOpen(false);
  };

  // Xóa công trình khỏi danh mục cự ly
  const handleDeleteDistance = (id: string, name: string) => {
    if (confirm(`Bạn có chắc muốn xóa công trình "${name}" khỏi danh bạ cự ly Km?`)) {
      deleteProjectDistance(id);
    }
  };

  // Xuất file Excel báo cáo Km theo từng công ty công trình
  const handleExportExcel = () => {
    const headers = [
      'STT',
      'Mã Khách Hàng',
      'Tên Công Ty / Khách Hàng',
      'Tên Công Trình',
      'Loại Công Trình',
      'Địa Chỉ Công Trường',
      'Cự Ly 1 Chiều (Km)',
      'Cự Ly Khứ Hồi (Km)',
      'Tổng Chuyến Trong Tháng',
      'Tổng Khối Lượng m³',
      'Tổng Km Chạy 1 Chiều',
      'Tổng Km Khứ Hồi Đã Chạy',
      'Danh Sách Tài Xế Phục Vụ'
    ];

    const rows = projectSummaries.map((p, idx) => {
      const driversStr = Array.from(p.driverMap.entries())
        .map(([name, stat]) => `${name} (${stat.count} chuyến)`)
        .join(', ');

      return [
        idx + 1,
        p.customerCode,
        p.customerName,
        p.projectTitle,
        p.projectType === 'DA' ? 'Dự án (DA)' : 'Dân dụng (DD)',
        p.address,
        p.distanceKm,
        p.roundTripKm,
        p.tripsCount,
        p.totalVolume,
        p.totalKmOneWay,
        p.totalKmRoundTrip,
        driversStr || 'Chưa cấp chuyến'
      ];
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      [`BÁO CÁO TỔNG HỢP CỰ LY KM & CHUYẾN XE THEO TỪNG CÔNG TY CÔNG TRÌNH`],
      [`THÁNG ${selectedMonth}/${selectedYear} (DƯƠNG LỊCH) • BÊ TÔNG TSG - TNT OPERATIONS`],
      [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} | Tổng số công trình: ${projectSummaries.length}`],
      [],
      headers,
      ...rows
    ]);

    XLSX.utils.book_append_sheet(wb, ws, `Km_CongTrinh_T${selectedMonth}_${selectedYear}`);
    XLSX.writeFile(wb, `Bao_Cao_Km_Theo_Cong_Trinh_T${selectedMonth}_${selectedYear}.xlsx`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. Header Toolbar & Action Buttons */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-600 inline-block"></span>
            <span className="text-[11px] font-black uppercase tracking-wider text-orange-700">
              ĐỊNH MỨC CỰ LY & THEO DÕI VẬN CHUYỂN
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Bảng Km & Chuyến Theo Từng Công Ty Công Trình
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tổng hợp cự ly km thực tế xe bồn đã chạy đến từng công trình trong <strong>Tháng {selectedMonth}/{selectedYear} (Dương lịch)</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Nút thêm công trình */}
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm Công Trình & Km</span>
          </button>

          {/* Nút xuất Excel */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Xuất Excel Km Công Trình</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Công trình cấp */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Công Trình Đã Giao
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-blue-900">{totalMetrics.activeProjects}</span>
              <span className="text-xs text-slate-500 font-semibold">/ {totalMetrics.totalProjects} công trình</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {totalMetrics.totalTrips} chuyến xe bồn đã xuất bến
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Tổng Km vận chuyển đến công trình */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng Quãng Đường Chạy (1 chiều)
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-900">{totalMetrics.totalKmOneWay}</span>
              <span className="text-xs text-slate-500 font-semibold">Km</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Khứ hồi: <strong>{totalMetrics.totalKmRoundTrip} Km</strong>
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Navigation className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Tổng m³ bê tông */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Tổng Khối Lượng Đã Cấp
            </p>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-orange-900">{totalMetrics.totalVolume}</span>
              <span className="text-xs text-slate-500 font-semibold">m³</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {totalMetrics.totalTrips > 0
                ? `TB ${(totalMetrics.totalVolume / totalMetrics.totalTrips).toFixed(1)} m³/chuyến`
                : 'Chưa có chuyến'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Công trình cự ly xa nhất */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Cự Ly Xa Nhất
            </p>
            <div className="mt-1 truncate">
              <span className="text-base font-black text-slate-900 truncate block">
                {totalMetrics.maxKmProject ? totalMetrics.maxKmProject.projectTitle : '---'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {totalMetrics.maxKmProject
                ? `${totalMetrics.maxKmProject.distanceKm} Km (Khứ hồi ${totalMetrics.maxKmProject.roundTripKm} Km)`
                : '---'}
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="bg-white rounded-2xl p-3 sm:p-4 border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1">
          {/* Ô tìm kiếm */}
          <div className="relative min-w-[240px] max-w-md flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên công ty, công trình, mã KH, địa chỉ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-orange-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Lọc loại công trình */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Loại:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả loại</option>
              <option value="DA">Dự án (DA)</option>
              <option value="DD">Dân dụng (DD)</option>
            </select>
          </div>

          {/* Lọc có chuyến hay không */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Cấp hàng:</span>
            <select
              value={filterActivity}
              onChange={(e) => setFilterActivity(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả công trình</option>
              <option value="ACTIVE">Có cấp trong tháng</option>
              <option value="INACTIVE">Chưa cấp trong tháng</option>
            </select>
          </div>

          {/* Sắp xếp */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-semibold text-[11px]">Sắp xếp:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="trips">Nhiều chuyến nhất</option>
              <option value="km">Tổng Km nhiều nhất</option>
              <option value="volume">Tổng m³ nhiều nhất</option>
              <option value="distance">Cự ly xa nhất</option>
              <option value="name">Tên công ty (A - Z)</option>
            </select>
          </div>
        </div>

        <div className="text-slate-500 font-semibold text-xs">
          Hiển thị: <strong>{projectSummaries.length}</strong> công trình
        </div>
      </div>

      {/* 4. Main Table: Km & Chuyến Theo Từng Công Ty Công Trình */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span className="font-black text-slate-900 uppercase">
              Bảng Theo Dõi Cự Ly Km Từng Công Ty Công Trình (Tháng {selectedMonth}/{selectedYear})
            </span>
          </div>
          <span className="text-slate-500 text-[11px]">
            * Bấm vào từng dòng để xem chi tiết danh sách chuyến xe bồn đã chạy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-bold text-[11px] uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-12">STT</th>
                <th className="py-3 px-4">Công Ty / Khách Hàng</th>
                <th className="py-3 px-4">Tên Công Trình</th>
                <th className="py-3 px-3 text-center">Loại</th>
                <th className="py-3 px-3">Địa Chỉ Công Trường</th>
                <th className="py-3 px-3 text-right bg-amber-50/60 text-amber-900">Cự Ly 1 Chiều</th>
                <th className="py-3 px-3 text-right">Khứ Hồi</th>
                <th className="py-3 px-3 text-center bg-blue-50/60 text-blue-900">Số Chuyến</th>
                <th className="py-3 px-3 text-right">Tổng m³</th>
                <th className="py-3 px-3 text-right bg-emerald-50/60 text-emerald-900">Total Km (1 chiều)</th>
                <th className="py-3 px-3 text-right">Total Km Khứ Hồi</th>
                <th className="py-3 px-3">Tài Xế Phục Vụ</th>
                <th className="py-3 px-3 text-center w-28">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {projectSummaries.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-500 font-semibold">
                    Không tìm thấy công trình nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                projectSummaries.map((item, idx) => {
                  const driverList = Array.from(item.driverMap.entries());
                  const hasTrips = item.tripsCount > 0;

                  return (
                    <tr
                      key={item.key}
                      onClick={() => hasTrips && setSelectedProjectDetail(item)}
                      className={`hover:bg-orange-50/30 transition ${hasTrips ? 'cursor-pointer' : ''} group`}
                    >
                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* Công ty */}
                      <td className="py-3 px-4">
                        <div className="font-black text-slate-900 text-xs group-hover:text-orange-600 transition">
                          {item.customerName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Mã: {item.customerCode || '---'}
                        </div>
                      </td>

                      {/* Công trình */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">
                          {item.projectTitle}
                        </div>
                      </td>

                      {/* Loại */}
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.projectType === 'DA'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {item.projectType === 'DA' ? 'Dự án' : 'Dân dụng'}
                        </span>
                      </td>

                      {/* Địa chỉ */}
                      <td className="py-3 px-3 max-w-[200px]">
                        <span className="text-[11px] text-slate-600 truncate block" title={item.address}>
                          {item.address || 'Tây Ninh'}
                        </span>
                      </td>

                      {/* Cự ly 1 chiều */}
                      <td className="py-3 px-3 text-right bg-amber-50/30 font-mono font-black text-xs text-amber-800">
                        {item.distanceKm} Km
                      </td>

                      {/* Cự ly khứ hồi */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">
                        {item.roundTripKm} Km
                      </td>

                      {/* Số chuyến */}
                      <td className="py-3 px-3 text-center bg-blue-50/30">
                        {hasTrips ? (
                          <span className="font-mono font-black text-sm text-blue-700 bg-blue-100/70 px-2.5 py-0.5 rounded-lg border border-blue-200 inline-block">
                            {item.tripsCount}
                          </span>
                        ) : (
                          <span className="text-slate-400 font-semibold text-[11px]">-</span>
                        )}
                      </td>

                      {/* Tổng m³ */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                        {hasTrips ? `${item.totalVolume} m³` : '-'}
                      </td>

                      {/* Total Km 1 chiều */}
                      <td className="py-3 px-3 text-right font-mono font-black text-xs text-emerald-800 bg-emerald-50/30">
                        {hasTrips ? `${item.totalKmOneWay} Km` : '-'}
                      </td>

                      {/* Total Km khứ hồi */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-600">
                        {hasTrips ? `${item.totalKmRoundTrip} Km` : '-'}
                      </td>

                      {/* Tài xế phục vụ */}
                      <td className="py-3 px-3 max-w-[180px]">
                        {driverList.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {driverList.slice(0, 2).map(([name, stat]) => (
                              <span
                                key={name}
                                className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-semibold"
                                title={`${name} (${stat.count} chuyến, ${stat.volume} m³)`}
                              >
                                {name.split(' ').slice(-1)[0]} ({stat.count})
                              </span>
                            ))}
                            {driverList.length > 2 && (
                              <span className="text-[10px] text-slate-400 font-bold self-center">
                                +{driverList.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">Chưa giao</span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                          {hasTrips && (
                            <button
                              type="button"
                              onClick={() => setSelectedProjectDetail(item)}
                              className="p-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-blue-700 rounded-lg transition cursor-pointer"
                              title="Xem chi tiết các chuyến"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1.5 bg-slate-100 hover:bg-orange-600 hover:text-white text-orange-700 rounded-lg transition cursor-pointer"
                            title="Sửa cự ly Km"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {item.registeredId && (
                            <button
                              type="button"
                              onClick={() => handleDeleteDistance(item.registeredId!, item.projectTitle)}
                              className="p-1.5 bg-slate-100 hover:bg-rose-600 hover:text-white text-rose-700 rounded-lg transition cursor-pointer"
                              title="Xóa khỏi danh bạ cự ly"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Xem Chi Tiết Chuyến Xe Giao Đến 1 Công Trình */}
      {selectedProjectDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <span>Chi Tiết Chuyến Xe Giao Đến:</span>
                    <span className="text-amber-400 font-black">{selectedProjectDetail.projectTitle}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Khách hàng: {selectedProjectDetail.customerName} • Cự ly: {selectedProjectDetail.distanceKm} Km (Khứ hồi {selectedProjectDetail.roundTripKm} Km) • {selectedProjectDetail.address}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProjectDetail(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Metrics Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shrink-0">
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Tổng Chuyến:</span>
                <span className="font-mono font-black text-blue-700 text-base">{selectedProjectDetail.tripsCount} chuyến</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Tổng Km Xe Chạy:</span>
                <span className="font-mono font-black text-emerald-700 text-base">{selectedProjectDetail.totalKmOneWay} Km (Khứ hồi: {selectedProjectDetail.totalKmRoundTrip} Km)</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Tổng Bê Tông:</span>
                <span className="font-mono font-black text-orange-700 text-base">{selectedProjectDetail.totalVolume} m³</span>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-400 text-[10px] font-bold uppercase block">Đội Tài Xế:</span>
                <span className="text-xs font-bold text-slate-800">
                  {selectedProjectDetail.driverMap.size} tài xế phục vụ
                </span>
              </div>
            </div>

            {/* Danh sách các chuyến */}
            <div className="p-4 overflow-y-auto space-y-3">
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600 font-bold text-[11px] uppercase">
                      <th className="py-2.5 px-3 text-center">STT</th>
                      <th className="py-2.5 px-3">Ngày Xuất</th>
                      <th className="py-2.5 px-3">Giờ Xuất</th>
                      <th className="py-2.5 px-3">Tài Xế</th>
                      <th className="py-2.5 px-3">Biển Số Xe</th>
                      <th className="py-2.5 px-3">Mã Đơn / Phiếu</th>
                      <th className="py-2.5 px-3 text-center">Mác Bê Tông</th>
                      <th className="py-2.5 px-3 text-center">Khối Lượng</th>
                      <th className="py-2.5 px-3 text-right">Cự Ly Km</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedProjectDetail.trips.map((item, idx) => (
                      <tr key={item.trip.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{item.dateDmy}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">{item.trip.departureTime || '---'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{item.trip.driverName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 bg-slate-50 px-2 rounded">
                          {item.trip.truckPlate || '---'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {item.trip.orderCode}
                          </span>
                          {item.trip.ticketNumber && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              Phiếu: {item.trip.ticketNumber}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-blue-800">
                          {item.trip.grade || item.order?.grade || 'M300'}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-orange-600">
                          {item.trip.volume} m³
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-700">
                          {item.distanceKm} Km <span className="text-[10px] text-slate-400 font-normal">({item.roundTripKm} khứ hồi)</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedProjectDetail(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Modal Thêm / Sửa Định Mức Cự Ly Công Trình */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-orange-600 text-white px-5 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5" />
                <h3 className="font-bold text-base">
                  {editingDistanceId ? 'Chỉnh Sửa Định Mức Cự Ly Công Trình' : 'Thêm Công Trình & Định Mức Cự Ly Mới'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-orange-200 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDistance} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Tên công trình *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: DỰ ÁN KCN PHƯỚC ĐÔNG"
                    value={formProjectTitle}
                    onChange={(e) => setFormProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold uppercase focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Khách hàng / Nhà thầu *</label>
                  <input
                    type="text"
                    required
                    placeholder="VD: CÔNG TY CP DEVELOPMENT"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold uppercase focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mã KH / Mã Ctrinh</label>
                  <input
                    type="text"
                    placeholder="VD: CT-PD01"
                    value={formCustomerCode}
                    onChange={(e) => setFormCustomerCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono uppercase"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Loại công trình</label>
                  <select
                    value={formProjectType}
                    onChange={(e) => setFormProjectType(e.target.value as ProjectType)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold bg-white"
                  >
                    <option value="DA">Dự án (DA)</option>
                    <option value="DD">Dân dụng (DD)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Cự ly 1 chiều (Km) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    required
                    value={formDistanceKm}
                    onChange={(e) => setFormDistanceKm(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-black text-orange-600"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Địa chỉ công trường</label>
                <input
                  type="text"
                  placeholder="VD: Đường N8, KCN Phước Đông, Gò Dầu, Tây Ninh"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px]">
                ℹ️ <strong>Cự ly khứ hồi</strong> sẽ tự động tính là{' '}
                <span className="font-mono font-bold text-orange-700">{formDistanceKm * 2} Km</span> (gấp đôi cự ly 1 chiều).
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingDistanceId ? 'Lưu Thay Đổi' : 'Thêm Công Trình'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
