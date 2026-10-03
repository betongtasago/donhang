export type OrderStatus = 'CHO_DUYET' | 'DA_DUYET' | 'DANG_CHAY' | 'HOAN_THANH' | 'TAM_HOAN';
export type OrderType = 'CHINH' | 'PHAT_SINH';
export type ProjectType = 'DA' | 'DD'; // DA = Dự án, DD = Dân dụng

export interface ConcreteOrder {
  id: string;
  code: string; // e.g. DH-260930-001
  orderType: OrderType; // CHINH = Đơn hàng chính (Kế toán/Admin), PHAT_SINH = Đơn phát sinh (User/Điều phối)
  parentOrderId?: string; // ID đơn hàng chính nếu là đơn phát sinh
  parentOrderCode?: string; // Mã đơn chính cha
  projectType: ProjectType; // DA = Dự án, DD = Dân dụng
  customerCode?: string; // Mã công trình / Mã khách hàng (e.g. CT-PD, CT-GDI)
  customerName: string; // e.g. CÔNG TY TNHH XÂY DỰNG TÂN NHẬT NGUYỆT
  plantLocation: string; // Tây Ninh, Bình Dương, Long An, TP.HCM
  projectTitle: string; // NHÀ XƯỞNG SỐ 2 NHÀ MÁY DỆT TÂY NINH
  categoryItem: string; // Sàn, Cột tầng 3,4 zone 2, Lồng cọc block B1
  totalVolume: number; // m³ (e.g. 800)
  deliveredVolume: number; // m³ (e.g. 560)
  deliveryTime: string; // "18:00"
  deliveryDate: string; // "2026-09-30"
  status: OrderStatus;
  grade: string; // M200, M250, M300, M350, M400, M500
  slump: string; // 12±2, 14±2, 16±2
  additive: string; // R3, R7, R14, Chống thấm B6, Chống thấm B8, Không
  pumpType: string; // Bơm cần 37m, Bơm cần 43m, Bơm tĩnh, Xả máng trực tiếp
  contactPerson: string;
  contactPhone: string;
  technicianName?: string; // Giao nhận (Kỹ thuật phụ trách)
  distanceKm?: number; // Cự ly km từ trạm trộn đến công trường
  notes?: string;
  assignedTrucksCount: number;
  createdByRole?: string; // 'ACCOUNTANT' | 'ADMIN' | 'DISPATCHER' | etc.
  createdByName?: string;
  updatedAt: string;
}

export type TripStatus = 'DANG_NAP' | 'DANG_CHAY' | 'DEN_CONG_TRUONG' | 'DANG_XA' | 'HOAN_THANH' | 'QUAY_VE';

export interface DispatchTrip {
  id: string;
  orderId: string;
  orderCode: string;
  ticketNumber: string; // e.g. PKX-260930-081
  truckPlate: string; // e.g. 70C-128.45
  driverName: string;
  driverPhone: string;
  volume: number; // m³ (e.g. 8)
  accumulatedVolume?: number; // m³ cộng dồn lũy kế
  departureTime: string; // e.g. 18:15
  arrivalEstimate: string; // e.g. 18:45
  status: TripStatus;
  slumpTested: string; // e.g. 14.5 cm
  grade: string;
  distanceKm?: number; // Km 1 chiều của chuyến
  isLargeTrip?: boolean; // >= 6m3 hoặc theo ngưỡng xe
  sealNumber?: string; // Số niêm chì
  arrivalTime?: string; // Giờ đến công trường
  notes?: string; // Ghi chú trên phiếu
  technicianName?: string; // Kỹ thuật phụ trách
}

export interface ProjectDistance {
  id: string;
  customerCode: string;
  customerName: string;
  projectTitle: string;
  projectType: ProjectType; // 'DA' | 'DD'
  address: string;
  distanceKm: number; // Km 1 chiều
  roundTripKm: number; // Km khứ hồi (distanceKm * 2)
  technicianDefault: string; // Kỹ thuật phụ trách mặc định
}

export interface DriverTripRuleConfig {
  largeTripThresholdM3: number; // Mặc định 6 m3
  capacity8m3ThresholdM3: number; // Ngưỡng cho xe 8m3 (ví dụ: 5 hay 6 m3)
  capacity10m3ThresholdM3: number; // Ngưỡng cho xe 10m3 (ví dụ: 6 m3)
  capacity12m3ThresholdM3: number; // Ngưỡng cho xe 12m3 (ví dụ: 7 m3)
}

export type TruckStatus = 'SAN_SANG' | 'DANG_NAP' | 'DANG_CHAY' | 'DANG_XA' | 'BAO_DUONG';

export interface FleetTruck {
  id: string;
  code?: string; // Mã xe (18, 19, 27, 30, 35, 45, 63, 64, 264...)
  plateNumber: string; // e.g. 51B-33618, 70C-128.45
  truckType: 'Xe bồn 8m³' | 'Xe bồn 10m³' | 'Xe bồn 12m³' | 'Xe bơm cần 43m' | 'Xe bơm tĩnh' | string;
  capacityM3?: number; // 8 hoặc 10 m3
  driverName: string;
  driverPhone: string;
  status: TruckStatus;
  currentOrderCode?: string;
  plantLocation: string; // Trạm TSG-TNT 1, Trạm TSG-TNT 2...
  fuelLevel: number; // %
  kmToday: number;
  tripsToday: number;
  // Bảng theo dõi sắp tài & xác xe (TSG–TNT)
  tareWeightKg?: number; // Xác xe (Kg) ví dụ 14,210 kg
  weighDate?: string; // Ngày cân xác xe ví dụ 03/10/2026
  shiftDate?: string; // Tài ngày ví dụ 03/10/2026
  shiftTime?: string; // Giờ chạy ví dụ 6h30
  leaveOrRepair?: string; // SỬA CHỮA, PHÉP...
  note?: string; // Lưu ý (ví dụ HẠ TẢI 7m3, HẠ TẢI 9m3...)
  leaveOff1?: boolean; // Lần 1
  leaveOff2?: boolean; // Lần 2
  leaveOff3?: boolean; // Lần 3
  leaveCount?: number; // Tính 1 phép (0 hoặc 1)
  totalLeave?: number; // Tổng phép
}

export interface PlantSilo {
  name: string;
  material: string;
  currentTons: number;
  capacityTons: number;
  unit: string;
}

export interface BatchingPlant {
  id: string;
  name: string;
  capacityM3PerHour: number;
  status: 'DANG_TRON' | 'SAN_SANG' | 'BAO_TRI';
  currentOrderCode?: string;
  currentRecipe?: string;
  batchProgress?: number; // 0 - 100%
  todayOutputM3: number;
  silos: PlantSilo[];
}

export interface CustomerDebt {
  id: string;
  customerName: string;
  phone: string;
  totalOrders: number;
  deliveredVolumeTotal: number; // m³
  creditLimit: number; // VND
  currentDebt: number; // VND
  overdueDebt: number; // VND
  paymentStatus: 'TOT' | 'CANH_BAO' | 'KHOA_DON';
  lastPaymentDate: string;
}

export interface LabTestSample {
  id: string;
  sampleCode: string; // e.g. TN-260930-M300-01
  orderCode: string;
  customerName: string;
  projectTitle: string;
  testDate: string;
  specGrade: string; // M300
  slumpResult: string; // 14.0 cm
  strengthR7: number; // MPa
  strengthR28: number; // MPa
  requiredStrength: number; // MPa
  status: 'DAT' | 'CHO_KET_QUA' | 'KHONG_DAT';
  testerName: string;
}

export interface FuelLog {
  id: string;
  date: string;
  truckPlate: string;
  driverName: string;
  liters: number;
  cost: number;
  odometer: number;
  stationName: string;
  approvedBy: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'network';
}

export interface SyncState {
  status: 'connected' | 'syncing' | 'offline' | 'error';
  lastSyncTime: string;
  activePeers: number;
  packetsSent: number;
  packetsReceived: number;
  unsyncedChanges: number;
  isAutoSync: boolean;
  autoSyncIntervalSec: number;
  logs: SyncLogEntry[];
}
