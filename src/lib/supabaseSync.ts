import { getSupabaseClient } from './supabase';
import {
  BatchingPlant,
  ConcreteOrder,
  CustomerDebt,
  DispatchTrip,
  DriverTripRuleConfig,
  FleetTruck,
  FuelLog,
  LabTestSample,
  ProjectDistance
} from '../types';

export interface SupabaseAppState {
  orders: ConcreteOrder[];
  trips: DispatchTrip[];
  trucks: FleetTruck[];
  plants: BatchingPlant[];
  debts: CustomerDebt[];
  labTests: LabTestSample[];
  fuelLogs: FuelLog[];
  projectDistances: ProjectDistance[];
  productionReports: any[];
  driverTripConfig: DriverTripRuleConfig;
}

const nullable = (value: unknown) => value === undefined ? null : value;

const orderToRow = (o: ConcreteOrder) => ({
  id: o.id, code: o.code, order_type: o.orderType || 'CHINH', parent_order_id: nullable(o.parentOrderId),
  parent_order_code: nullable(o.parentOrderCode), project_type: o.projectType || 'DA', customer_code: nullable(o.customerCode),
  customer_name: o.customerName, plant_location: o.plantLocation, project_title: o.projectTitle, category_item: o.categoryItem,
  total_volume: o.totalVolume, delivered_volume: o.deliveredVolume, delivery_time: o.deliveryTime, delivery_date: o.deliveryDate,
  status: o.status, grade: o.grade, slump: o.slump, additive: nullable(o.additive), waterproof: nullable(o.waterproof),
  pump_type: nullable(o.pumpType), contact_person: nullable(o.contactPerson), contact_phone: nullable(o.contactPhone),
  technician_name: nullable(o.technicianName), distance_km: o.distanceKm ?? 15, notes: nullable(o.notes),
  assigned_trucks_count: o.assignedTrucksCount, production_order: nullable(o.productionOrder),
  scheduled_production_time: nullable(o.scheduledProductionTime), created_by_role: nullable(o.createdByRole), created_by_name: nullable(o.createdByName),
  updated_at: o.updatedAt || new Date().toISOString()
});

const rowToOrder = (r: any): ConcreteOrder => ({
  id: r.id, code: r.code, orderType: r.order_type || 'CHINH', parentOrderId: r.parent_order_id || undefined,
  parentOrderCode: r.parent_order_code || undefined, projectType: r.project_type || 'DA', customerCode: r.customer_code || undefined,
  customerName: r.customer_name, plantLocation: r.plant_location, projectTitle: r.project_title, categoryItem: r.category_item,
  totalVolume: Number(r.total_volume || 0), deliveredVolume: Number(r.delivered_volume || 0), deliveryTime: r.delivery_time || '',
  deliveryDate: r.delivery_date || '', status: r.status, grade: r.grade || '', slump: r.slump || '', additive: r.additive || 'Không',
  waterproof: r.waterproof || undefined, pumpType: r.pump_type || '', contactPerson: r.contact_person || '', contactPhone: r.contact_phone || '',
  technicianName: r.technician_name || undefined, distanceKm: Number(r.distance_km || 15), notes: r.notes || '',
  assignedTrucksCount: Number(r.assigned_trucks_count || 0), productionOrder: r.production_order || undefined,
  scheduledProductionTime: r.scheduled_production_time || undefined, createdByRole: r.created_by_role || undefined,
  createdByName: r.created_by_name || undefined, updatedAt: r.updated_at || new Date().toISOString()
});

const tripToRow = (t: DispatchTrip) => ({
  id: t.id, order_id: t.orderId, order_code: t.orderCode, ticket_number: t.ticketNumber, truck_plate: t.truckPlate,
  driver_name: t.driverName, driver_phone: nullable(t.driverPhone), volume: t.volume, accumulated_volume: t.accumulatedVolume || 0,
  departure_time: t.departureTime, arrival_estimate: nullable(t.arrivalEstimate), status: t.status, slump_tested: nullable(t.slumpTested),
  grade: nullable(t.grade), concrete_name: nullable(t.concreteName), unit: nullable(t.unit), plant_location: nullable(t.plantLocation),
  entry_date: nullable(t.entryDate), delivery_date: nullable(t.deliveryDate), distance_km: t.distanceKm ?? 15,
  is_large_trip: t.isLargeTrip ?? true, seal_number: nullable(t.sealNumber), arrival_time: nullable(t.arrivalTime),
  notes: nullable(t.notes), technician_name: nullable(t.technicianName), updated_at: new Date().toISOString()
});

const rowToTrip = (r: any): DispatchTrip => ({
  id: r.id, orderId: r.order_id, orderCode: r.order_code, ticketNumber: r.ticket_number, truckPlate: r.truck_plate,
  driverName: r.driver_name, driverPhone: r.driver_phone || '', volume: Number(r.volume || 0), accumulatedVolume: Number(r.accumulated_volume || 0),
  departureTime: r.departure_time || '', arrivalEstimate: r.arrival_estimate || '', status: r.status, slumpTested: r.slump_tested || '',
  grade: r.grade || '', concreteName: r.concrete_name || undefined, unit: r.unit || undefined, plantLocation: r.plant_location || undefined,
  entryDate: r.entry_date || undefined, deliveryDate: r.delivery_date || undefined, distanceKm: Number(r.distance_km || 15),
  isLargeTrip: r.is_large_trip ?? true, sealNumber: r.seal_number || undefined, arrivalTime: r.arrival_time || undefined,
  notes: r.notes || undefined, technicianName: r.technician_name || undefined
});

const truckToRow = (t: FleetTruck) => ({
  id: t.id, code: nullable(t.code), plate_number: t.plateNumber, driver_name: t.driverName, driver_phone: t.driverPhone,
  capacity_m3: t.capacityM3 || 10, status: t.status, current_order_code: nullable(t.currentOrderCode), fuel_level: t.fuelLevel,
  km_today: t.kmToday, trips_today: t.tripsToday, truck_type: t.truckType, plant_location: t.plantLocation,
  tare_weight_kg: nullable(t.tareWeightKg), weigh_date: nullable(t.weighDate), shift_date: nullable(t.shiftDate), shift_time: nullable(t.shiftTime),
  leave_or_repair: nullable(t.leaveOrRepair), note: nullable(t.note), leave_off_1: !!t.leaveOff1, leave_off_2: !!t.leaveOff2,
  leave_off_3: !!t.leaveOff3, leave_count: t.leaveCount || 0, total_leave: t.totalLeave || 0, updated_at: new Date().toISOString()
});

const rowToTruck = (r: any): FleetTruck => ({
  id: r.id, code: r.code || undefined, plateNumber: r.plate_number, driverName: r.driver_name, driverPhone: r.driver_phone || '',
  capacityM3: Number(r.capacity_m3 || 10), status: r.status, currentOrderCode: r.current_order_code || undefined, fuelLevel: Number(r.fuel_level || 0),
  kmToday: Number(r.km_today || 0), tripsToday: Number(r.trips_today || 0), truckType: r.truck_type || 'Xe bồn 10m³',
  plantLocation: r.plant_location || 'Trạm TSG-TNT 1', tareWeightKg: r.tare_weight_kg ? Number(r.tare_weight_kg) : undefined,
  weighDate: r.weigh_date || undefined, shiftDate: r.shift_date || undefined, shiftTime: r.shift_time || undefined,
  leaveOrRepair: r.leave_or_repair || undefined, note: r.note || undefined, leaveOff1: !!r.leave_off_1, leaveOff2: !!r.leave_off_2,
  leaveOff3: !!r.leave_off_3, leaveCount: Number(r.leave_count || 0), totalLeave: Number(r.total_leave || 0)
});

const projectToRow = (p: ProjectDistance) => ({
  id: p.id, customer_code: nullable(p.customerCode), customer_name: p.customerName, project_title: p.projectTitle,
  project_type: p.projectType, address: nullable(p.address), distance_km: p.distanceKm, round_trip_km: p.roundTripKm,
  technician_default: nullable(p.technicianDefault), updated_at: new Date().toISOString()
});
const rowToProject = (r: any): ProjectDistance => ({
  id: r.id, customerCode: r.customer_code || '', customerName: r.customer_name, projectTitle: r.project_title,
  projectType: r.project_type || 'DA', address: r.address || '', distanceKm: Number(r.distance_km || 0),
  roundTripKm: Number(r.round_trip_km ?? Number(r.distance_km || 0) * 2), technicianDefault: r.technician_default || ''
});

const debtToRow = (d: CustomerDebt) => ({ id: d.id, customer_name: d.customerName, phone: d.phone, total_orders: d.totalOrders,
  delivered_volume_total: d.deliveredVolumeTotal, credit_limit: d.creditLimit, current_debt: d.currentDebt, overdue_debt: d.overdueDebt,
  last_payment_date: d.lastPaymentDate, payment_status: d.paymentStatus, updated_at: new Date().toISOString() });
const rowToDebt = (r: any): CustomerDebt => ({ id: r.id, customerName: r.customer_name, phone: r.phone || '', totalOrders: Number(r.total_orders || 0),
  deliveredVolumeTotal: Number(r.delivered_volume_total || 0), creditLimit: Number(r.credit_limit || 0), currentDebt: Number(r.current_debt || 0),
  overdueDebt: Number(r.overdue_debt || 0), lastPaymentDate: r.last_payment_date || '', paymentStatus: r.payment_status || 'TOT' });

const fuelToRow = (f: FuelLog) => ({ id: f.id, date: f.date, truck_plate: f.truckPlate, driver_name: f.driverName, liters: f.liters,
  cost: f.cost, odometer: f.odometer, station_name: f.stationName, approved_by: f.approvedBy });
const rowToFuel = (r: any): FuelLog => ({ id: r.id, date: r.date, truckPlate: r.truck_plate, driverName: r.driver_name, liters: Number(r.liters || 0),
  cost: Number(r.cost || 0), odometer: Number(r.odometer || 0), stationName: r.station_name, approvedBy: r.approved_by });

const labToRow = (l: LabTestSample) => ({ id: l.id, sample_code: l.sampleCode, order_code: l.orderCode, customer_name: l.customerName,
  project_title: l.projectTitle, test_date: l.testDate, spec_grade: l.specGrade, slump_result: l.slumpResult, strength_r7: l.strengthR7,
  strength_r28: l.strengthR28, required_strength: l.requiredStrength, status: l.status, tester_name: l.testerName });
const rowToLab = (r: any): LabTestSample => ({ id: r.id, sampleCode: r.sample_code, orderCode: r.order_code, customerName: r.customer_name,
  projectTitle: r.project_title, testDate: r.test_date, specGrade: r.spec_grade, slumpResult: r.slump_result, strengthR7: Number(r.strength_r7 || 0),
  strengthR28: Number(r.strength_r28 || 0), requiredStrength: Number(r.required_strength || 0), status: r.status, testerName: r.tester_name });

const plantToRow = (p: BatchingPlant) => ({ id: p.id, name: p.name, capacity_m3_per_hour: p.capacityM3PerHour, status: p.status,
  current_order_code: nullable(p.currentOrderCode), current_recipe: nullable(p.currentRecipe), batch_progress: p.batchProgress || 0,
  today_output_m3: p.todayOutputM3, silos: p.silos || [] });
const rowToPlant = (r: any): BatchingPlant => ({ id: r.id, name: r.name, capacityM3PerHour: Number(r.capacity_m3_per_hour || 0), status: r.status,
  currentOrderCode: r.current_order_code || undefined, currentRecipe: r.current_recipe || undefined, batchProgress: Number(r.batch_progress || 0),
  todayOutputM3: Number(r.today_output_m3 || 0), silos: Array.isArray(r.silos) ? r.silos : [] });

export type SyncTable = 'orders' | 'trips' | 'trucks' | 'plants' | 'debts' | 'fuel_logs' | 'lab_tests' | 'project_distances' | 'driver_trip_config' | 'production_reports';
export interface RecordSyncChange {
  table: SyncTable;
  id: string;
  record?: any;
  deleted?: boolean;
  clientId: string;
  updatedAt: string;
}

const RETRY_QUEUE_KEY = 'tsg_supabase_retry_queue_v1';
let flushingQueue = false;

const primaryKeyForTable = (table: SyncTable) => table === 'production_reports' ? 'report_key' : 'id';

const toRow = (table: SyncTable, record: any, clientId: string, updatedAt: string) => {
  let row: any;
  switch (table) {
    case 'orders': row = orderToRow(record); break;
    case 'trips': row = tripToRow(record); break;
    case 'trucks': row = truckToRow(record); break;
    case 'plants': row = plantToRow(record); break;
    case 'debts': row = debtToRow(record); break;
    case 'fuel_logs': row = fuelToRow(record); break;
    case 'lab_tests': row = labToRow(record); break;
    case 'project_distances': row = projectToRow(record); break;
    case 'driver_trip_config': row = { id: 'default', large_trip_threshold_m3: record.largeTripThresholdM3, capacity8m3_threshold_m3: record.capacity8m3ThresholdM3,
      capacity10m3_threshold_m3: record.capacity10m3ThresholdM3, capacity12m3_threshold_m3: record.capacity12m3ThresholdM3 };
      break;
    case 'production_reports': row = record;
  }
  return { ...row, client_id: clientId, updated_at: updatedAt };
};

export const fromRealtimeRecord = (table: SyncTable, row: any): any => {
  switch (table) {
    case 'orders': return rowToOrder(row);
    case 'trips': return rowToTrip(row);
    case 'trucks': return rowToTruck(row);
    case 'plants': return rowToPlant(row);
    case 'debts': return rowToDebt(row);
    case 'fuel_logs': return rowToFuel(row);
    case 'lab_tests': return rowToLab(row);
    case 'project_distances': return rowToProject(row);
    case 'driver_trip_config': return {
      largeTripThresholdM3: Number(row.large_trip_threshold_m3 ?? 6), capacity8m3ThresholdM3: Number(row.capacity8m3_threshold_m3 ?? 5),
      capacity10m3ThresholdM3: Number(row.capacity10m3_threshold_m3 ?? 6), capacity12m3ThresholdM3: Number(row.capacity12m3_threshold_m3 ?? 7)
    };
    default: return row;
  }
};

const readRetryQueue = (): RecordSyncChange[] => {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem(RETRY_QUEUE_KEY) || '[]'); } catch { return []; }
};
const writeRetryQueue = (queue: RecordSyncChange[]) => {
  if (typeof window !== 'undefined') localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue.slice(-500)));
};

export const getRetryQueueSize = () => readRetryQueue().length;

const syncOneRecord = async (change: RecordSyncChange) => {
  const client = getSupabaseClient();
  if (!client) throw new Error('Chưa cấu hình Supabase');
  if (change.deleted) {
    const { error } = await client.from(change.table).delete().eq(primaryKeyForTable(change.table), change.id);
    if (error) throw error;
    return;
  }
  const { error } = await client.from(change.table).upsert(toRow(change.table, change.record, change.clientId, change.updatedAt));
  if (error) throw error;
};

export const flushSyncRetryQueue = async (): Promise<{ succeeded: number; pending: number }> => {
  if (flushingQueue) return { succeeded: 0, pending: getRetryQueueSize() };
  const queue = readRetryQueue();
  if (!queue.length) return { succeeded: 0, pending: 0 };
  const remaining: RecordSyncChange[] = [];
  let succeeded = 0;
  flushingQueue = true;
  try {
    for (const change of queue) {
      try { await syncOneRecord(change); succeeded++; } catch { remaining.push(change); }
    }
  } finally {
    flushingQueue = false;
    writeRetryQueue(remaining);
  }
  return { succeeded, pending: remaining.length };
};

export const enqueueRecordSync = (change: RecordSyncChange) => {
  const queue = readRetryQueue();
  const index = queue.findIndex(item => item.table === change.table && item.id === change.id);
  if (index >= 0) queue[index] = change; else queue.push(change);
  writeRetryQueue(queue);
  void flushSyncRetryQueue();
};

const getPersistentClientId = () => {
  if (typeof window === 'undefined') return 'server-sync';
  const key = 'tsg_supabase_client_id';
  const existing = localStorage.getItem(key);
  if (existing) return existing;
  const created = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(key, created);
  return created;
};

export async function loadAllFromSupabase(): Promise<SupabaseAppState | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  const names = ['orders', 'trips', 'trucks', 'plants', 'debts', 'fuel_logs', 'lab_tests', 'project_distances', 'driver_trip_config', 'production_reports'] as const;
  const results = await Promise.all(names.map(name => client.from(name).select('*')));
  const failed = results.find(result => result.error);
  if (failed?.error) throw failed.error;
  const [orders, trips, trucks, plants, debts, fuelLogs, labTests, projectDistances, config, productionReports] = results.map(r => r.data || []);
  // Chỉ coi database là rỗng khi tất cả module nghiệp vụ đều rỗng.
  // Trước đây chỉ kiểm tra orders/trips/trucks/project_distances/reports,
  // khiến một database chỉ có công nợ, KCS, nhiên liệu hoặc trạm bị hydrate
  // nhầm từ cache cục bộ của trình duyệt.
  if (![orders, trips, trucks, plants, debts, fuelLogs, labTests, projectDistances, config, productionReports]
    .some(rows => rows.length > 0)) return null;
  const c: any = config[0] || {};
  return {
    orders: orders.map(rowToOrder), trips: trips.map(rowToTrip), trucks: trucks.map(rowToTruck), plants: plants.map(rowToPlant),
    debts: debts.map(rowToDebt), fuelLogs: fuelLogs.map(rowToFuel), labTests: labTests.map(rowToLab), projectDistances: projectDistances.map(rowToProject),
    productionReports,
    driverTripConfig: { largeTripThresholdM3: Number(c.large_trip_threshold_m3 ?? 6), capacity8m3ThresholdM3: Number(c.capacity8m3_threshold_m3 ?? 5),
      capacity10m3ThresholdM3: Number(c.capacity10m3_threshold_m3 ?? 6), capacity12m3ThresholdM3: Number(c.capacity12m3_threshold_m3 ?? 7) }
  };
}

export async function syncAllToSupabase(state: SupabaseAppState): Promise<{ success: boolean; count: number; error?: string }> {
  const client = getSupabaseClient();
  if (!client) return { success: false, count: 0, error: 'Chưa cấu hình Supabase' };
  try {
    const metadata = (row: any) => ({ ...row, client_id: getPersistentClientId(), updated_at: new Date().toISOString() });
    // Full sync chỉ upsert; không được xóa các dòng không có trong cache của
    // trình duyệt hiện tại vì đó có thể là dữ liệu mới do người dùng khác tạo.
    // Các thao tác xóa được truyền riêng qua retry queue với deleted=true.
    const upsertRows = async (table: string, rows: any[]) => {
      if (rows.length) {
        const { error } = await client.from(table).upsert(rows);
        if (error) throw error;
      }
    };
    const batches: Array<[string, any[]]> = [
      ['orders', state.orders.map(orderToRow).map(metadata)], ['trips', state.trips.map(tripToRow).map(metadata)], ['trucks', state.trucks.map(truckToRow).map(metadata)],
      ['plants', state.plants.map(plantToRow).map(metadata)], ['debts', state.debts.map(debtToRow).map(metadata)], ['fuel_logs', state.fuelLogs.map(fuelToRow).map(metadata)],
      ['lab_tests', state.labTests.map(labToRow).map(metadata)], ['project_distances', state.projectDistances.map(projectToRow).map(metadata)]
    ];
    let count = 0;
    for (const [table, rows] of batches) {
      await upsertRows(table, rows);
      count += rows.length;
    }
    const { error: configError } = await client.from('driver_trip_config').upsert({ id: 'default', large_trip_threshold_m3: state.driverTripConfig.largeTripThresholdM3,
      capacity8m3_threshold_m3: state.driverTripConfig.capacity8m3ThresholdM3, capacity10m3_threshold_m3: state.driverTripConfig.capacity10m3ThresholdM3,
      capacity12m3_threshold_m3: state.driverTripConfig.capacity12m3ThresholdM3, client_id: getPersistentClientId(), updated_at: new Date().toISOString() });
    if (configError) throw configError;

    const reportRows = state.orders.map(order => {
      const orderTrips = state.trips.filter(t => t.orderId === order.id || t.orderCode === order.code);
      const totalDistance = orderTrips.reduce((sum, t) => sum + (Number(t.distanceKm || order.distanceKm || 0) * 2), 0);
      return { report_key: `${order.deliveryDate || 'unknown'}:${order.id}`, report_date: order.deliveryDate || '', order_id: order.id,
        order_code: order.code, total_volume: order.totalVolume, delivered_volume: order.deliveredVolume, trip_count: orderTrips.length,
        total_distance_km: totalDistance, payload: { order, trips: orderTrips }, generated_at: new Date().toISOString(), updated_at: new Date().toISOString(), client_id: getPersistentClientId() };
    });
    await upsertRows('production_reports', reportRows);
    count += reportRows.length;
    return { success: true, count };
  } catch (error: any) {
    return { success: false, count: 0, error: error?.message || 'Lỗi đồng bộ Supabase' };
  }
}

export const syncOrderToSupabase = async (order: ConcreteOrder) => {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('orders').upsert(orderToRow(order));
  return !error;
};

export const syncTripToSupabase = async (trip: DispatchTrip) => {
  const client = getSupabaseClient();
  if (!client) return false;
  const { error } = await client.from('trips').upsert(tripToRow(trip));
  return !error;
};
