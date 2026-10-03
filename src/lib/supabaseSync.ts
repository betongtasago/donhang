import { getSupabaseClient } from './supabase';
import { ConcreteOrder, DispatchTrip, ConcreteMixerTruck } from '../types';

export const syncOrderToSupabase = async (order: ConcreteOrder): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('orders').upsert({
      id: order.id,
      code: order.code,
      customer_name: order.customerName,
      plant_location: order.plantLocation,
      project_title: order.projectTitle,
      category_item: order.categoryItem,
      total_volume: order.totalVolume,
      delivered_volume: order.deliveredVolume,
      delivery_time: order.deliveryTime,
      delivery_date: order.deliveryDate,
      status: order.status,
      grade: order.grade,
      slump: order.slump,
      additive: order.additive,
      pump_type: order.pumpType,
      contact_person: order.contactPerson,
      contact_phone: order.contactPhone,
      notes: order.notes,
      assigned_trucks_count: order.assignedTrucksCount,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('Supabase upsert order error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync order to Supabase:', err);
    return false;
  }
};

export const syncTripToSupabase = async (trip: DispatchTrip): Promise<boolean> => {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('trips').upsert({
      id: trip.id,
      order_id: trip.orderId,
      order_code: trip.orderCode,
      ticket_number: trip.ticketNumber,
      truck_plate: trip.truckPlate,
      driver_name: trip.driverName,
      driver_phone: trip.driverPhone,
      volume: trip.volume,
      accumulated_volume: trip.accumulatedVolume || 0,
      departure_time: trip.departureTime,
      arrival_estimate: trip.arrivalEstimate,
      status: trip.status,
      slump_tested: trip.slumpTested,
      grade: trip.grade
    });

    if (error) {
      console.warn('Supabase upsert trip error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Failed to sync trip to Supabase:', err);
    return false;
  }
};

export const syncAllToSupabase = async (
  orders: ConcreteOrder[],
  trips: DispatchTrip[],
  trucks: ConcreteMixerTruck[]
): Promise<{ success: boolean; count: number; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, count: 0, error: 'Chưa cấu hình hoặc kết nối Supabase' };
  }

  try {
    let syncedCount = 0;

    // 1. Sync orders
    const mappedOrders = orders.map(o => ({
      id: o.id,
      code: o.code,
      customer_name: o.customerName,
      plant_location: o.plantLocation,
      project_title: o.projectTitle,
      category_item: o.categoryItem,
      total_volume: o.totalVolume,
      delivered_volume: o.deliveredVolume,
      delivery_time: o.deliveryTime,
      delivery_date: o.deliveryDate,
      status: o.status,
      grade: o.grade,
      slump: o.slump,
      additive: o.additive,
      pump_type: o.pumpType,
      contact_person: o.contactPerson,
      contact_phone: o.contactPhone,
      notes: o.notes,
      assigned_trucks_count: o.assignedTrucksCount
    }));

    const { error: ordErr } = await client.from('orders').upsert(mappedOrders);
    if (ordErr) throw ordErr;
    syncedCount += mappedOrders.length;

    // 2. Sync trips
    if (trips.length > 0) {
      const mappedTrips = trips.map(t => ({
        id: t.id,
        order_id: t.orderId,
        order_code: t.orderCode,
        ticket_number: t.ticketNumber,
        truck_plate: t.truckPlate,
        driver_name: t.driverName,
        driver_phone: t.driverPhone,
        volume: t.volume,
        accumulated_volume: t.accumulatedVolume || 0,
        departure_time: t.departureTime,
        arrival_estimate: t.arrivalEstimate,
        status: t.status,
        slump_tested: t.slumpTested,
        grade: t.grade
      }));

      const { error: tripErr } = await client.from('trips').upsert(mappedTrips);
      if (tripErr) console.warn('Supabase trips sync error:', tripErr.message);
      else syncedCount += mappedTrips.length;
    }

    return { success: true, count: syncedCount };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message || 'Lỗi khi đẩy dữ liệu lên Supabase' };
  }
};
