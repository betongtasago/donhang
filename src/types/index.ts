export type OrderStatus = 'CHO_DUYET' | 'DA_DUYET' | 'DANG_CHAY' | 'HOAN_THANH' | 'TAM_HOAN';

export interface ConcreteOrder {
  id: string;
  code: string; // e.g. DH-260930-001
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
  notes?: string;
  assignedTrucksCount: number;
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
  departureTime: string; // e.g. 18:15
  arrivalEstimate: string; // e.g. 18:45
  status: TripStatus;
  slumpTested: string; // e.g. 14.5 cm
  grade: string;
}

export type TruckStatus = 'SAN_SANG' | 'DANG_NAP' | 'DANG_CHAY' | 'DANG_XA' | 'BAO_DUONG';

export interface FleetTruck {
  id: string;
  plateNumber: string; // e.g. 70C-128.45
  truckType: 'Xe bồn 10m³' | 'Xe bồn 12m³' | 'Xe bơm cần 43m' | 'Xe bơm tĩnh';
  driverName: string;
  driverPhone: string;
  status: TruckStatus;
  currentOrderCode?: string;
  plantLocation: string;
  fuelLevel: number; // %
  kmToday: number;
  tripsToday: number;
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
