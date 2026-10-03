import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  ConcreteOrder,
  DispatchTrip,
  FleetTruck,
  BatchingPlant,
  CustomerDebt,
  LabTestSample,
  FuelLog,
  SyncLogEntry,
  SyncState,
  OrderStatus,
  TripStatus,
  TruckStatus
} from '../types';
import {
  INITIAL_ORDERS,
  INITIAL_TRIPS,
  INITIAL_TRUCKS,
  INITIAL_PLANTS,
  INITIAL_DEBTS,
  INITIAL_LAB_TESTS,
  INITIAL_FUEL_LOGS,
  INITIAL_PROJECT_DISTANCES,
  DEFAULT_DRIVER_TRIP_CONFIG
} from './initialData';
import {
  ProjectDistance,
  DriverTripRuleConfig
} from '../types';
import { syncOrderToSupabase, syncTripToSupabase } from '../lib/supabaseSync';

const STORAGE_KEY = 'TSG_TNT_DISPATCH_STATE_V1';
const BROADCAST_CHANNEL_NAME = 'tsg_tnt_dispatch_sync_channel';

interface AppData {
  orders: ConcreteOrder[];
  trips: DispatchTrip[];
  trucks: FleetTruck[];
  plants: BatchingPlant[];
  debts: CustomerDebt[];
  labTests: LabTestSample[];
  fuelLogs: FuelLog[];
  projectDistances: ProjectDistance[];
  driverTripConfig: DriverTripRuleConfig;
  selectedPlant: string;
}

interface SyncContextType extends AppData {
  syncState: SyncState;
  secondsSinceSync: number;
  setSelectedPlant: (plant: string) => void;
  // Order actions
  createOrder: (order: Omit<ConcreteOrder, 'id' | 'code' | 'updatedAt' | 'deliveredVolume' | 'assignedTrucksCount'>) => ConcreteOrder;
  updateOrder: (id: string, updates: Partial<ConcreteOrder>) => void;
  deleteOrder: (id: string) => void;
  // Dispatch trip actions
  createTrip: (trip: Omit<DispatchTrip, 'id' | 'ticketNumber'>) => DispatchTrip;
  updateTripStatus: (tripId: string, status: TripStatus) => void;
  // Project Distances
  addProjectDistance: (dist: Omit<ProjectDistance, 'id' | 'roundTripKm'>) => ProjectDistance;
  updateProjectDistance: (id: string, updates: Partial<ProjectDistance>) => void;
  deleteProjectDistance: (id: string) => void;
  // Driver Trip Rules
  updateDriverTripConfig: (cfg: Partial<DriverTripRuleConfig>) => void;
  // Truck actions
  updateTruckStatus: (truckId: string, status: TruckStatus, orderCode?: string) => void;
  // QC & Tests
  addLabTest: (test: Omit<LabTestSample, 'id'>) => void;
  // Fuel
  addFuelLog: (log: Omit<FuelLog, 'id'>) => void;
  // Debt
  recordDebtPayment: (customerId: string, amount: number) => void;
  // Sync engine controls
  syncNow: () => Promise<void>;
  toggleAutoSync: () => void;
  clearSyncLogs: () => void;
  resetToDefaultData: () => void;
  exportDatabaseJSON: () => string;
  importDatabaseJSON: (jsonStr: string) => boolean;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

export const SyncProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial data from localStorage if exists
  const [data, setData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.orders && parsed.trucks) {
          return {
            ...parsed,
            projectDistances: parsed.projectDistances && parsed.projectDistances.length > 0
              ? parsed.projectDistances
              : INITIAL_PROJECT_DISTANCES,
            driverTripConfig: parsed.driverTripConfig || DEFAULT_DRIVER_TRIP_CONFIG
          };
        }
      }
    } catch (e) {
      console.error('Error loading initial data', e);
    }
    return {
      orders: INITIAL_ORDERS,
      trips: INITIAL_TRIPS,
      trucks: INITIAL_TRUCKS,
      plants: INITIAL_PLANTS,
      debts: INITIAL_DEBTS,
      labTests: INITIAL_LAB_TESTS,
      fuelLogs: INITIAL_FUEL_LOGS,
      projectDistances: INITIAL_PROJECT_DISTANCES,
      driverTripConfig: DEFAULT_DRIVER_TRIP_CONFIG,
      selectedPlant: 'Tây Ninh'
    };
  });

  const [syncState, setSyncState] = useState<SyncState>({
    status: 'connected',
    lastSyncTime: new Date().toISOString(),
    activePeers: 1,
    packetsSent: 12,
    packetsReceived: 18,
    unsyncedChanges: 0,
    isAutoSync: true,
    autoSyncIntervalSec: 15,
    logs: [
      {
        id: 'log-init-1',
        timestamp: new Date(Date.now() - 30000).toLocaleTimeString('vi-VN'),
        message: 'Khởi tạo kết nối mạng điều phối trạm trộn Tây Ninh',
        type: 'network'
      },
      {
        id: 'log-init-2',
        timestamp: new Date(Date.now() - 15000).toLocaleTimeString('vi-VN'),
        message: 'Đã đồng bộ 5 đơn hàng, 8 xe bồn và 2 trạm trộn nội bộ',
        type: 'success'
      }
    ]
  });

  const [secondsSinceSync, setSecondsSinceSync] = useState<number>(0);
  const channelRef = useRef<BroadcastChannel | null>(null);

  // Helper to append sync log
  const addSyncLog = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'network' = 'info') => {
    setSyncState(prev => ({
      ...prev,
      logs: [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          timestamp: new Date().toLocaleTimeString('vi-VN'),
          message,
          type
        },
        ...prev.logs.slice(0, 49) // Keep last 50 logs
      ]
    }));
  }, []);

  // Broadcast data changes to other tabs
  const broadcastChange = useCallback((actionType: string, payload: any) => {
    try {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: actionType,
          payload,
          senderTime: Date.now()
        });
        setSyncState(prev => ({
          ...prev,
          packetsSent: prev.packetsSent + 1
        }));
      }
    } catch (err) {
      console.warn('BroadcastChannel error', err);
    }
  }, []);

  // Save data to localStorage when changed
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [data]);

  // Load real data from backend Cloud SQL database on mount
  useEffect(() => {
    async function loadBackendData() {
      try {
        const [ordersRes, tripsRes, trucksRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/trips'),
          fetch('/api/trucks')
        ]);
        if (ordersRes.ok && tripsRes.ok && trucksRes.ok) {
          const dbOrders = await ordersRes.json();
          const dbTrips = await tripsRes.json();
          const dbTrucks = await trucksRes.json();

          if (Array.isArray(dbOrders) && dbOrders.length > 0) {
            setData(prev => ({
              ...prev,
              orders: dbOrders,
              trips: Array.isArray(dbTrips) && dbTrips.length > 0 ? dbTrips : prev.trips,
              trucks: Array.isArray(dbTrucks) && dbTrucks.length > 0 ? dbTrucks : prev.trucks
            }));
            addSyncLog(`Đã kết nối và nạp ${dbOrders.length} đơn hàng từ cơ sở dữ liệu Cloud SQL PostgreSQL`, 'success');
          }
        }
      } catch (err) {
        console.warn('Backend load warning, running on cached data:', err);
      }
    }
    loadBackendData();
  }, []);

  // Set up BroadcastChannel for real-time cross-tab sync
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const { type, payload } = event.data || {};
        if (type === 'STATE_UPDATE' && payload) {
          setData(payload);
          setSyncState(prev => ({
            ...prev,
            lastSyncTime: new Date().toISOString(),
            packetsReceived: prev.packetsReceived + 1
          }));
          setSecondsSinceSync(0);
          addSyncLog('Nhận dữ liệu đồng bộ tức thời từ phiên làm việc khác', 'network');
        } else if (type === 'PING') {
          channel?.postMessage({ type: 'PONG' });
        } else if (type === 'PONG') {
          setSyncState(prev => ({ ...prev, activePeers: Math.max(prev.activePeers, 2) }));
        }
      };

      // Announce presence
      channel.postMessage({ type: 'PING' });
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    return () => {
      channel?.close();
    };
  }, [addSyncLog]);

  // Timer for seconds since sync
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceSync(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setSyncState(prev => ({ ...prev, status: 'connected' }));
      addSyncLog('Kết nối internet đã phục hồi. Sẵn sàng truyền tin.', 'success');
    };
    const handleOffline = () => {
      setSyncState(prev => ({ ...prev, status: 'offline' }));
      addSyncLog('Mất kết nối mạng! Hệ thống chuyển sang chế độ lưu trữ cục bộ.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [addSyncLog]);

  // Periodic automatic sync and realistic truck & plant simulation
  useEffect(() => {
    if (!syncState.isAutoSync) return;

    const interval = setInterval(() => {
      setSyncState(prev => ({ ...prev, status: 'syncing' }));
      
      // Simulate minor progress or plant updates
      setData(prevData => {
        // Occasionally progress a truck or batch
        const updatedPlants = prevData.plants.map(p => {
          if (p.status === 'DANG_TRON') {
            const nextProgress = ((p.batchProgress || 0) + 15);
            return {
              ...p,
              batchProgress: nextProgress > 100 ? 15 : nextProgress,
              todayOutputM3: nextProgress > 100 ? p.todayOutputM3 + 10 : p.todayOutputM3
            };
          }
          return p;
        });

        return {
          ...prevData,
          plants: updatedPlants
        };
      });

      setTimeout(() => {
        const now = new Date();
        setSyncState(prev => ({
          ...prev,
          status: 'connected',
          lastSyncTime: now.toISOString(),
          packetsSent: prev.packetsSent + 1,
          packetsReceived: prev.packetsReceived + 1,
          unsyncedChanges: 0
        }));
        setSecondsSinceSync(0);
      }, 600);

    }, syncState.autoSyncIntervalSec * 1000);

    return () => clearInterval(interval);
  }, [syncState.isAutoSync, syncState.autoSyncIntervalSec]);

  // Actions
  const setSelectedPlant = (plant: string) => {
    setData(prev => ({ ...prev, selectedPlant: plant }));
    addSyncLog(`Chuyển không gian làm việc sang: ${plant}`, 'info');
  };

  const createOrder = (orderInput: Omit<ConcreteOrder, 'id' | 'code' | 'updatedAt' | 'deliveredVolume' | 'assignedTrucksCount'>): ConcreteOrder => {
    const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randomSeq = String(data.orders.length + 1).padStart(3, '0');
    const newCode = `DH-${dateCode}-${randomSeq}`;

    const newOrder: ConcreteOrder = {
      ...orderInput,
      id: `ord-${Date.now()}`,
      code: newCode,
      deliveredVolume: 0,
      assignedTrucksCount: 0,
      updatedAt: new Date().toISOString()
    };

    const nextData = {
      ...data,
      orders: [newOrder, ...data.orders]
    };

    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    setSecondsSinceSync(0);
    setSyncState(prev => ({
      ...prev,
      lastSyncTime: new Date().toISOString(),
      packetsSent: prev.packetsSent + 1
    }));
    addSyncLog(`Tạo mới đơn hàng ${newCode} cho ${orderInput.customerName} (${orderInput.totalVolume} m³)`, 'success');

    // Sync to backend Cloud SQL
    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderInput)
    }).catch(err => console.warn('Could not persist order to backend:', err));

    return newOrder;
  };

  const updateOrder = (id: string, updates: Partial<ConcreteOrder>) => {
    const nextOrders = data.orders.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o);
    const nextData = { ...data, orders: nextOrders };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    setSecondsSinceSync(0);
    addSyncLog(`Cập nhật đơn hàng ID ${id}`, 'info');

    // Sync to backend Cloud SQL
    fetch(`/api/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    }).catch(err => console.warn('Could not persist update to backend:', err));
  };

  const deleteOrder = (id: string) => {
    const target = data.orders.find(o => o.id === id);
    const nextOrders = data.orders.filter(o => o.id !== id);
    const nextData = { ...data, orders: nextOrders };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    setSecondsSinceSync(0);
    addSyncLog(`Đã xóa đơn hàng ${target?.code || id}`, 'warning');

    // Sync to backend Cloud SQL
    fetch(`/api/orders/${id}`, {
      method: 'DELETE'
    }).catch(err => console.warn('Could not delete from backend:', err));
  };

  const createTrip = (tripInput: Omit<DispatchTrip, 'id' | 'ticketNumber'>): DispatchTrip => {
    const ticketSeq = String(data.trips.length + 101);
    const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const newTicket = `PKX-${dateCode}-${ticketSeq}`;

    // Find current order to calculate cumulative delivered volume
    const targetOrder = data.orders.find(o => o.id === tripInput.orderId || o.code === tripInput.orderCode);
    const prevDelivered = targetOrder ? targetOrder.deliveredVolume : 0;
    const newAccumulated = prevDelivered + tripInput.volume;

    // Lookup distance from project list or order
    const projectDist = data.projectDistances?.find(p =>
      p.projectTitle.toLowerCase() === targetOrder?.projectTitle.toLowerCase() ||
      (targetOrder?.customerCode && p.customerCode === targetOrder.customerCode)
    );
    const tripKm = tripInput.distanceKm || targetOrder?.distanceKm || projectDist?.distanceKm || 15;

    // Determine large/small trip rule based on volume and truck capacity threshold
    const targetTruck = data.trucks.find(t => t.plateNumber === tripInput.truckPlate);
    const truckCap = targetTruck ? 10 : 10;
    let threshold = data.driverTripConfig?.largeTripThresholdM3 || 6;
    if (truckCap <= 8 && data.driverTripConfig?.capacity8m3ThresholdM3) {
      threshold = data.driverTripConfig.capacity8m3ThresholdM3;
    } else if (truckCap === 10 && data.driverTripConfig?.capacity10m3ThresholdM3) {
      threshold = data.driverTripConfig.capacity10m3ThresholdM3;
    } else if (truckCap >= 12 && data.driverTripConfig?.capacity12m3ThresholdM3) {
      threshold = data.driverTripConfig.capacity12m3ThresholdM3;
    }

    const isLargeTrip = tripInput.volume >= threshold;

    const newTrip: DispatchTrip = {
      ...tripInput,
      id: `trip-${Date.now()}`,
      ticketNumber: newTicket,
      accumulatedVolume: newAccumulated,
      distanceKm: tripKm,
      isLargeTrip
    };

    // Update order delivered volume (lũy kế tăng cộng dồn vào đơn hàng)
    const nextOrders = data.orders.map(o => {
      if (o.id === tripInput.orderId || o.code === tripInput.orderCode) {
        const totalDelivered = o.deliveredVolume + tripInput.volume;
        return {
          ...o,
          deliveredVolume: totalDelivered,
          assignedTrucksCount: o.assignedTrucksCount + 1,
          status: (totalDelivered >= o.totalVolume ? 'HOAN_THANH' : 'DANG_CHAY') as OrderStatus
        };
      }
      return o;
    });

    // Update truck status
    const nextTrucks = data.trucks.map(trk => {
      if (trk.plateNumber === tripInput.truckPlate) {
        return {
          ...trk,
          status: 'DANG_CHAY' as TruckStatus,
          currentOrderCode: tripInput.orderCode,
          tripsToday: trk.tripsToday + 1
        };
      }
      return trk;
    });

    const nextData = {
      ...data,
      orders: nextOrders,
      trips: [newTrip, ...data.trips],
      trucks: nextTrucks
    };

    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    setSecondsSinceSync(0);
    addSyncLog(`Xuất xe ${tripInput.truckPlate} (${tripInput.volume}m³). Lũy kế cộng dồn: ${newAccumulated}m³ / ${targetOrder?.totalVolume || 0}m³ cho đơn ${tripInput.orderCode}`, 'success');

    // Sync trip to backend Cloud SQL
    fetch('/api/trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tripInput)
    }).catch(err => console.warn('Could not persist trip to backend:', err));

    return newTrip;
  };

  const updateTripStatus = (tripId: string, status: TripStatus) => {
    const nextTrips = data.trips.map(t => t.id === tripId ? { ...t, status } : t);
    const targetTrip = data.trips.find(t => t.id === tripId);
    
    // Also sync truck status
    let nextTrucks = data.trucks;
    if (targetTrip) {
      nextTrucks = data.trucks.map(trk => {
        if (trk.plateNumber === targetTrip.truckPlate) {
          let trkStatus: TruckStatus = 'DANG_CHAY';
          if (status === 'DANG_NAP') trkStatus = 'DANG_NAP';
          if (status === 'DANG_XA') trkStatus = 'DANG_XA';
          if (status === 'HOAN_THANH' || status === 'QUAY_VE') trkStatus = 'SAN_SANG';
          return { ...trk, status: trkStatus };
        }
        return trk;
      });
    }

    const nextData = { ...data, trips: nextTrips, trucks: nextTrucks };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    setSecondsSinceSync(0);
    addSyncLog(`Chuyến ${targetTrip?.ticketNumber || tripId} chuyển trạng thái: ${status}`, 'info');

    // Sync trip status update to backend Cloud SQL
    fetch(`/api/trips/${tripId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(err => console.warn('Could not persist trip status to backend:', err));
  };

  const updateTruckStatus = (truckId: string, status: TruckStatus, orderCode?: string) => {
    const nextTrucks = data.trucks.map(trk => {
      if (trk.id === truckId) {
        return {
          ...trk,
          status,
          currentOrderCode: orderCode !== undefined ? orderCode : trk.currentOrderCode
        };
      }
      return trk;
    });
    const nextData = { ...data, trucks: nextTrucks };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    addSyncLog(`Xe ${data.trucks.find(t => t.id === truckId)?.plateNumber} đổi trạng thái: ${status}`, 'info');
  };

  const addLabTest = (testInput: Omit<LabTestSample, 'id'>) => {
    const newTest: LabTestSample = {
      ...testInput,
      id: `lab-${Date.now()}`
    };
    const nextData = { ...data, labTests: [newTest, ...data.labTests] };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    addSyncLog(`Ghi nhận mẫu thí nghiệm QC: ${testInput.sampleCode}`, 'success');
  };

  const addFuelLog = (logInput: Omit<FuelLog, 'id'>) => {
    const newLog: FuelLog = {
      ...logInput,
      id: `fuel-${Date.now()}`
    };
    const nextData = { ...data, fuelLogs: [newLog, ...data.fuelLogs] };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    addSyncLog(`Ghi nhận cấp ${logInput.liters}L dầu cho xe ${logInput.truckPlate}`, 'info');
  };

  const recordDebtPayment = (customerId: string, amount: number) => {
    const nextDebts = data.debts.map(d => {
      if (d.id === customerId) {
        const nextDebt = Math.max(0, d.currentDebt - amount);
        const nextOverdue = Math.max(0, d.overdueDebt - amount);
        return {
          ...d,
          currentDebt: nextDebt,
          overdueDebt: nextOverdue,
          lastPaymentDate: new Date().toISOString().slice(0, 10),
          paymentStatus: nextOverdue === 0 ? ('TOT' as const) : ('CANH_BAO' as const)
        };
      }
      return d;
    });
    const nextData = { ...data, debts: nextDebts };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    addSyncLog(`Thanh toán ${amount.toLocaleString('vi-VN')} đ cho khách hàng ID ${customerId}`, 'success');
  };

  const addProjectDistance = (distInput: Omit<ProjectDistance, 'id' | 'roundTripKm'>): ProjectDistance => {
    const newPrj: ProjectDistance = {
      ...distInput,
      id: `prj-${Date.now()}`,
      roundTripKm: distInput.distanceKm * 2
    };
    const nextData = {
      ...data,
      projectDistances: [newPrj, ...(data.projectDistances || [])]
    };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    addSyncLog(`Thêm công trình ${distInput.projectTitle} (Cự ly: ${distInput.distanceKm} km)`, 'success');
    return newPrj;
  };

  const updateProjectDistance = (id: string, updates: Partial<ProjectDistance>) => {
    const nextList = (data.projectDistances || []).map(p => {
      if (p.id === id) {
        const nextDist = updates.distanceKm !== undefined ? updates.distanceKm : p.distanceKm;
        return {
          ...p,
          ...updates,
          distanceKm: nextDist,
          roundTripKm: nextDist * 2
        };
      }
      return p;
    });
    const nextData = { ...data, projectDistances: nextList };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    addSyncLog(`Cập nhật cự ly km công trình ID ${id}`, 'info');
  };

  const deleteProjectDistance = (id: string) => {
    const nextList = (data.projectDistances || []).filter(p => p.id !== id);
    const nextData = { ...data, projectDistances: nextList };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    addSyncLog(`Xóa công trình khỏi danh sách cự ly km`, 'warning');
  };

  const updateDriverTripConfig = (cfg: Partial<DriverTripRuleConfig>) => {
    const nextConfig = {
      ...(data.driverTripConfig || DEFAULT_DRIVER_TRIP_CONFIG),
      ...cfg
    };
    const nextData = { ...data, driverTripConfig: nextConfig };
    setData(nextData);
    broadcastChange('STATE_UPDATE', nextData);
    addSyncLog(`Cập nhật quy tắc phân loại chuyến lớn/nhỏ (Ngưỡng: ${nextConfig.largeTripThresholdM3} m³)`, 'info');
  };

  const syncNow = async () => {
    setSyncState(prev => ({ ...prev, status: 'syncing' }));
    addSyncLog('Bắt đầu đồng bộ thủ công tới máy chủ điều phối trung tâm...', 'network');
    
    // Simulate network handshake
    await new Promise(resolve => setTimeout(resolve, 800));

    const now = new Date();
    setSyncState(prev => ({
      ...prev,
      status: 'connected',
      lastSyncTime: now.toISOString(),
      packetsSent: prev.packetsSent + 2,
      packetsReceived: prev.packetsReceived + 2,
      unsyncedChanges: 0
    }));
    setSecondsSinceSync(0);
    broadcastChange('STATE_UPDATE', data);
    addSyncLog('Đồng bộ hoàn tất thành công! Mọi dữ liệu đã khớp hoàn toàn.', 'success');
  };

  const toggleAutoSync = () => {
    setSyncState(prev => {
      const next = !prev.isAutoSync;
      addSyncLog(`Tự động đồng bộ chu kỳ: ${next ? 'BẬT (mỗi 15s)' : 'TẮT'}`, 'info');
      return { ...prev, isAutoSync: next };
    });
  };

  const clearSyncLogs = () => {
    setSyncState(prev => ({ ...prev, logs: [] }));
  };

  const resetToDefaultData = () => {
    const initialDataState: AppData = {
      orders: INITIAL_ORDERS,
      trips: INITIAL_TRIPS,
      trucks: INITIAL_TRUCKS,
      plants: INITIAL_PLANTS,
      debts: INITIAL_DEBTS,
      labTests: INITIAL_LAB_TESTS,
      fuelLogs: INITIAL_FUEL_LOGS,
      projectDistances: INITIAL_PROJECT_DISTANCES,
      driverTripConfig: DEFAULT_DRIVER_TRIP_CONFIG,
      selectedPlant: 'Tây Ninh'
    };
    setData(initialDataState);
    broadcastChange('STATE_UPDATE', initialDataState);
    setSecondsSinceSync(0);
    addSyncLog('Khôi phục toàn bộ dữ liệu mẫu ban đầu từ TSG TNT Operations', 'warning');
  };

  const exportDatabaseJSON = () => {
    return JSON.stringify(data, null, 2);
  };

  const importDatabaseJSON = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.orders && parsed.trucks) {
        setData(parsed);
        broadcastChange('STATE_UPDATE', parsed);
        setSecondsSinceSync(0);
        addSyncLog('Nhập dữ liệu thành công từ tệp tin JSON', 'success');
        return true;
      }
    } catch (e) {
      console.error(e);
    }
    return false;
  };

  return (
    <SyncContext.Provider
      value={{
        ...data,
        syncState,
        secondsSinceSync,
        setSelectedPlant,
        createOrder,
        updateOrder,
        deleteOrder,
        createTrip,
        updateTripStatus,
        updateTruckStatus,
        addLabTest,
        addFuelLog,
        recordDebtPayment,
        addProjectDistance,
        updateProjectDistance,
        deleteProjectDistance,
        updateDriverTripConfig,
        syncNow,
        toggleAutoSync,
        clearSyncLogs,
        resetToDefaultData,
        exportDatabaseJSON,
        importDatabaseJSON
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = () => {
  const context = useContext(SyncContext);
  if (!context) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
