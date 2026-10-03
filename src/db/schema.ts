import { pgTable, text, serial, integer, timestamp, boolean, bigint } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull(), // ADMIN, DISPATCHER, STATION_MANAGER, LAB_QC, ACCOUNTANT
  roleTitle: text('role_title').notNull(),
  plantLocation: text('plant_location').notNull(),
  email: text('email'),
  phone: text('phone'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  customerName: text('customer_name').notNull(),
  plantLocation: text('plant_location').notNull(),
  projectTitle: text('project_title').notNull(),
  categoryItem: text('category_item').notNull(),
  totalVolume: integer('total_volume').notNull(),
  deliveredVolume: integer('delivered_volume').notNull().default(0),
  deliveryTime: text('delivery_time').notNull(),
  deliveryDate: text('delivery_date').notNull(),
  status: text('status').notNull(),
  grade: text('grade').notNull(),
  slump: text('slump').notNull(),
  additive: text('additive').notNull(),
  pumpType: text('pump_type').notNull(),
  contactPerson: text('contact_person').notNull(),
  contactPhone: text('contact_phone').notNull(),
  notes: text('notes'),
  assignedTrucksCount: integer('assigned_trucks_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const trips = pgTable('trips', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull(),
  orderCode: text('order_code').notNull(),
  ticketNumber: text('ticket_number').notNull(),
  truckPlate: text('truck_plate').notNull(),
  driverName: text('driver_name').notNull(),
  driverPhone: text('driver_phone').notNull(),
  volume: integer('volume').notNull(),
  accumulatedVolume: integer('accumulated_volume').notNull().default(0),
  departureTime: text('departure_time').notNull(),
  arrivalEstimate: text('arrival_estimate').notNull(),
  status: text('status').notNull(),
  slumpTested: text('slump_tested').notNull(),
  grade: text('grade').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const trucks = pgTable('trucks', {
  id: text('id').primaryKey(),
  plateNumber: text('plate_number').notNull().unique(),
  driverName: text('driver_name').notNull(),
  driverPhone: text('driver_phone').notNull(),
  capacityM3: integer('capacity_m3').notNull(),
  status: text('status').notNull(),
  currentOrderCode: text('current_order_code'),
  fuelLevel: integer('fuel_level').notNull().default(100),
  kmToday: integer('km_today').notNull().default(0),
  tripsToday: integer('trips_today').notNull().default(0),
  truckType: text('truck_type').notNull(),
});

export const debts = pgTable('debts', {
  id: text('id').primaryKey(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  totalOrders: integer('total_orders').notNull().default(0),
  deliveredVolumeTotal: integer('delivered_volume_total').notNull().default(0),
  creditLimit: bigint('credit_limit', { mode: 'number' }).notNull().default(0),
  currentDebt: bigint('current_debt', { mode: 'number' }).notNull().default(0),
  overdueDebt: bigint('overdue_debt', { mode: 'number' }).notNull().default(0),
  lastPaymentDate: text('last_payment_date'),
  paymentStatus: text('payment_status').notNull().default('TOT'),
});

export const fuelLogs = pgTable('fuel_logs', {
  id: text('id').primaryKey(),
  date: text('date').notNull(),
  truckPlate: text('truck_plate').notNull(),
  driverName: text('driver_name').notNull(),
  liters: integer('liters').notNull(),
  cost: bigint('cost', { mode: 'number' }).notNull(),
  odometer: integer('odometer').notNull(),
  stationName: text('station_name').notNull(),
  approvedBy: text('approved_by').notNull(),
});

export const labTests = pgTable('lab_tests', {
  id: text('id').primaryKey(),
  sampleCode: text('sample_code').notNull(),
  orderCode: text('order_code').notNull(),
  customerName: text('customer_name').notNull(),
  projectTitle: text('project_title').notNull(),
  testDate: text('test_date').notNull(),
  specGrade: text('spec_grade').notNull(),
  slumpResult: text('slump_result').notNull(),
  strengthR7: text('strength_r7').notNull(),
  strengthR28: text('strength_r28').notNull(),
  requiredStrength: text('required_strength').notNull(),
  status: text('status').notNull(),
  testerName: text('tester_name').notNull(),
});
