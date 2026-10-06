import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_URL_KEY = 'tsg_supabase_url';
const STORAGE_KEY_KEY = 'tsg_supabase_anon_key';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_URL_KEY) || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_KEY) || '' : '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey
  };
};

export const saveSupabaseConfig = (url: string, anonKey: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_URL_KEY, url.trim());
    localStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
    _cachedClient = null;
  }
};

let _cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (_cachedClient) return _cachedClient;

  const { url, anonKey } = getStoredSupabaseConfig();
  if (url && anonKey && url.startsWith('http')) {
    try {
      _cachedClient = createClient(url, anonKey);
      return _cachedClient;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return null;
};

export const testSupabaseConnection = async (url: string, anonKey: string): Promise<{ success: boolean; message: string }> => {
  if (!url || !anonKey) {
    return { success: false, message: 'Vui lòng nhập đầy đủ Supabase Project URL và Public Anon Key.' };
  }

  if (!url.startsWith('https://')) {
    return { success: false, message: 'URL phải bắt đầu bằng https:// (Ví dụ: https://xyz.supabase.co)' };
  }

  try {
    const testClient = createClient(url, anonKey);
    const { error } = await testClient.from('orders').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "orders" does not exist')) {
      return { success: false, message: `Lỗi kết nối Supabase: ${error.message}` };
    }

    return {
      success: true,
      message: 'Kết nối Supabase thành công! Dữ liệu sẽ được lưu tự động vào các bảng Supabase.'
    };
  } catch (err: any) {
    return { success: false, message: `Không thể kết nối đến Supabase: ${err.message || 'Lỗi mạng'}` };
  }
};

export const SUPABASE_SCHEMA_SQL = `-- Schema Supabase đã được provision tự động cho dự án donhang.
-- Các bảng hiện có: orders, trips, trucks, project_distances, debts, fuel_logs,
-- lab_tests, plants, driver_trip_config và production_reports.
-- Không cần chạy lại SQL này; hãy lưu Project URL và Anon/Public Key trong ứng dụng.
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  order_type TEXT DEFAULT 'CHINH',
  parent_order_id TEXT,
  parent_order_code TEXT,
  project_type TEXT DEFAULT 'DA',
  customer_code TEXT,
  customer_name TEXT NOT NULL,
  plant_location TEXT NOT NULL,
  project_title TEXT NOT NULL,
  category_item TEXT NOT NULL,
  total_volume NUMERIC NOT NULL,
  delivered_volume NUMERIC DEFAULT 0,
  delivery_time TEXT NOT NULL,
  delivery_date TEXT NOT NULL,
  status TEXT NOT NULL,
  grade TEXT NOT NULL,
  slump TEXT NOT NULL,
  additive TEXT,
  pump_type TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  technician_name TEXT,
  distance_km NUMERIC DEFAULT 15,
  notes TEXT,
  assigned_trucks_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  order_code TEXT NOT NULL,
  ticket_number TEXT NOT NULL,
  truck_plate TEXT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  volume NUMERIC NOT NULL,
  accumulated_volume NUMERIC DEFAULT 0,
  departure_time TEXT NOT NULL,
  arrival_estimate TEXT,
  status TEXT NOT NULL,
  slump_tested TEXT,
  grade TEXT,
  distance_km NUMERIC,
  is_large_trip BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trucks (
  id TEXT PRIMARY KEY,
  plate_number TEXT UNIQUE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT,
  capacity_m3 NUMERIC NOT NULL,
  status TEXT NOT NULL,
  current_order_code TEXT,
  fuel_level NUMERIC DEFAULT 100,
  km_today NUMERIC DEFAULT 0,
  trips_today INTEGER DEFAULT 0,
  truck_type TEXT
);

CREATE TABLE IF NOT EXISTS project_distances (
  id TEXT PRIMARY KEY,
  customer_code TEXT,
  customer_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  project_type TEXT DEFAULT 'DA',
  address TEXT,
  distance_km NUMERIC NOT NULL,
  round_trip_km NUMERIC NOT NULL,
  technician_default TEXT
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_distances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for orders" ON orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for trips" ON trips FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for trucks" ON trucks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for project_distances" ON project_distances FOR ALL USING (true) WITH CHECK (true);
`;
