import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index';
import { orders, trips, trucks, users, debts, fuelLogs, labTests } from './src/db/schema';
import { INITIAL_TRUCKS } from './src/sync/initialData';
import { eq, desc } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET. Add it to your environment before starting the app.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

type AuthUser = {
  id: number | string;
  username: string;
  role: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

const sanitizeText = (value: unknown, maxLength = 200) => {
  if (typeof value !== 'string') return '';
  return value.replace(/[<>]/g, '').trim().slice(0, maxLength);
};

const isValidUsername = (value: string) => /^[a-z0-9._-]{3,64}$/i.test(value);
const isValidPassword = (value: string) => typeof value === 'string' && value.length >= 6 && value.length <= 128;
const isValidEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const isPositiveInteger = (value: unknown) => Number.isInteger(value) && Number(value) > 0 && Number(value) <= 1000000;

const signToken = (user: AuthUser) => jwt.sign({
  id: user.id,
  username: user.username,
  role: user.role
}, JWT_SECRET, { expiresIn: '8h' });

const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    req.user = decoded;
    return next();
  } catch (err) {
    console.warn('JWT verification failed:', err);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

const requireRole = (roles: string[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Forbidden: insufficient permissions.' });
  }
  return next();
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(','))
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json({ limit: '1mb' }));

  // Lightweight SSE relay keeps browser sessions in sync without requiring a
  // third-party integration. Each connected browser receives state updates
  // published by any other browser session.
  const syncClients = new Set<import('express').Response>();
  let latestSyncMessage: Record<string, unknown> | null = null;

  app.get('/api/sync/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);
    if (latestSyncMessage) {
      res.write(`data: ${JSON.stringify(latestSyncMessage)}\n\n`);
    }
    syncClients.add(res);

    const heartbeat = setInterval(() => {
      if (!res.writableEnded) res.write(': heartbeat\n\n');
    }, 15000);
    req.on('close', () => {
      clearInterval(heartbeat);
      syncClients.delete(res);
    });
  });

  app.post('/api/sync/events', requireAuth, (req, res) => {
    const message = req.body && typeof req.body === 'object' ? req.body : {};
    latestSyncMessage = message;
    const serialized = JSON.stringify(message);
    for (const client of syncClients) {
      if (!client.writableEnded) client.write(`data: ${serialized}\n\n`);
    }
    res.status(202).json({ deliveredTo: syncClients.size });
  });

  // API Routes for Concrete Operations Database
  app.get('/api/health', async (req, res) => {
    try {
      const result = await db.select().from(orders).limit(1);
      res.json({ status: 'ok', database: 'connected', sampleOrdersCount: result.length });
    } catch (err: any) {
      console.error('Database connection error in health check:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body ?? {};
      const cleanUser = sanitizeText(username, 64).toLowerCase();

      if (!cleanUser || !isValidUsername(cleanUser)) {
        return res.status(400).json({ success: false, error: 'Tên đăng nhập không hợp lệ.' });
      }
      if (!isValidPassword(String(password ?? ''))) {
        return res.status(400).json({ success: false, error: 'Mật khẩu tối thiểu 6 ký tự.' });
      }

      const userList = await db.select().from(users).where(eq(users.username, cleanUser));
      const user = userList[0];

      const legacyMatch = !!user && user.passwordHash === String(password);
      const validPassword = !!user && (user.passwordHash.startsWith('$2')
        ? await bcrypt.compare(String(password), user.passwordHash)
        : legacyMatch);

      if (!user || !validPassword) {
        return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, error: 'Tài khoản này đã bị tạm khoá.' });
      }

      if (!user.passwordHash.startsWith('$2')) {
        const hashed = await bcrypt.hash(String(password), 12);
        await db.update(users).set({ passwordHash: hashed }).where(eq(users.id, user.id));
      }

      const token = signToken({ id: user.id, username: user.username, role: user.role });

      res.json({
        success: true,
        token,
        user: {
          id: String(user.id),
          username: user.username,
          fullName: user.fullName,
          role: user.role,
          roleTitle: user.roleTitle,
          plantLocation: user.plantLocation,
          email: user.email,
          phone: user.phone,
          isActive: user.isActive,
          createdAt: user.createdAt
        }
      });
    } catch (err: any) {
      console.error('Error during login:', err);
      res.status(500).json({ success: false, error: 'Lỗi kiểm tra bảo mật máy chủ.' });
    }
  });

  // 1. Orders API
  app.get('/api/orders', requireAuth, async (req, res) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      const formatted = allOrders.map(o => ({
        id: o.id,
        code: o.code,
        customerName: o.customerName,
        plantLocation: o.plantLocation,
        projectTitle: o.projectTitle,
        categoryItem: o.categoryItem,
        totalVolume: o.totalVolume,
        deliveredVolume: o.deliveredVolume,
        deliveryTime: o.deliveryTime,
        deliveryDate: o.deliveryDate,
        status: o.status,
        grade: o.grade,
        slump: o.slump,
        additive: o.additive,
        pumpType: o.pumpType,
        contactPerson: o.contactPerson,
        contactPhone: o.contactPhone,
        notes: o.notes || '',
        assignedTrucksCount: o.assignedTrucksCount,
        updatedAt: o.updatedAt ? o.updatedAt.toISOString() : new Date().toISOString()
      }));
      res.json(formatted);
    } catch (err: any) {
      console.error('Error fetching orders:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  app.post('/api/orders', requireAuth, async (req, res) => {
    try {
      const body = req.body ?? {};
      const customerName = sanitizeText(body.customerName, 120);
      const plantLocation = sanitizeText(body.plantLocation || 'Tây Ninh', 80);
      const projectTitle = sanitizeText(body.projectTitle, 180);
      const categoryItem = sanitizeText(body.categoryItem, 120);
      const totalVolume = Number(body.totalVolume);
      const deliveryTime = sanitizeText(body.deliveryTime, 50);
      const deliveryDate = sanitizeText(body.deliveryDate, 30);
      const status = sanitizeText(body.status || 'CHO_DUYET', 40);
      const grade = sanitizeText(body.grade, 40);
      const slump = sanitizeText(body.slump, 40);
      const additive = sanitizeText(body.additive || 'Không', 80);
      const pumpType = sanitizeText(body.pumpType || 'Bơm cần', 80);
      const contactPerson = sanitizeText(body.contactPerson, 100);
      const contactPhone = sanitizeText(body.contactPhone, 30);
      const notes = sanitizeText(body.notes || '', 500);

      if (!customerName || !projectTitle || !categoryItem || !deliveryTime || !deliveryDate || !grade || !slump || !contactPerson || !contactPhone) {
        return res.status(400).json({ error: 'Thiếu thông tin đơn hàng bắt buộc.' });
      }
      if (!isPositiveInteger(totalVolume)) {
        return res.status(400).json({ error: 'Tổng khối lượng không hợp lệ.' });
      }

      const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const existing = await db.select().from(orders);
      const code = `DH-${dateCode}-${String(existing.length + 1).padStart(3, '0')}`;
      const id = `ord-${Date.now()}`;

      const newOrder = {
        id,
        code,
        customerName,
        plantLocation,
        projectTitle,
        categoryItem,
        totalVolume,
        deliveredVolume: 0,
        deliveryTime,
        deliveryDate,
        status,
        grade,
        slump,
        additive,
        pumpType,
        contactPerson,
        contactPhone,
        notes,
        assignedTrucksCount: 0
      };

      await db.insert(orders).values(newOrder);
      res.json(newOrder);
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: err.message || 'Failed to create order' });
    }
  });

  app.put('/api/orders/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body ?? {};
      const safeUpdates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'totalVolume' && isPositiveInteger(value)) safeUpdates.totalVolume = Number(value);
        else if (typeof value === 'string') safeUpdates[key] = sanitizeText(value, 200);
        else if (typeof value === 'number' || typeof value === 'boolean') safeUpdates[key] = value;
      }

      await db.update(orders).set({
        ...safeUpdates,
        updatedAt: new Date()
      }).where(eq(orders.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating order:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/orders/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      await db.delete(orders).where(eq(orders.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error deleting order:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Trips API
  app.get('/api/trips', requireAuth, async (req, res) => {
    try {
      const allTrips = await db.select().from(trips).orderBy(desc(trips.createdAt));
      const formatted = allTrips.map(t => ({
        id: t.id,
        orderId: t.orderId,
        orderCode: t.orderCode,
        ticketNumber: t.ticketNumber,
        truckPlate: t.truckPlate,
        driverName: t.driverName,
        driverPhone: t.driverPhone,
        volume: t.volume,
        accumulatedVolume: t.accumulatedVolume,
        departureTime: t.departureTime,
        arrivalEstimate: t.arrivalEstimate,
        status: t.status,
        slumpTested: t.slumpTested,
        grade: t.grade
      }));
      res.json(formatted);
    } catch (err: any) {
      console.error('Error fetching trips:', err);
      res.status(500).json({ error: 'Failed to fetch trips' });
    }
  });

  app.post('/api/trips', requireAuth, async (req, res) => {
    try {
      const tripInput = req.body ?? {};
      const orderId = sanitizeText(tripInput.orderId, 80);
      const orderCode = sanitizeText(tripInput.orderCode, 80);
      const truckPlate = sanitizeText(tripInput.truckPlate, 30);
      const driverName = sanitizeText(tripInput.driverName, 80);
      const driverPhone = sanitizeText(tripInput.driverPhone, 30);
      const departureTime = sanitizeText(tripInput.departureTime, 50);
      const arrivalEstimate = sanitizeText(tripInput.arrivalEstimate, 50);
      const status = sanitizeText(tripInput.status || 'DANG_NAP', 40);
      const slumpTested = sanitizeText(tripInput.slumpTested, 40);
      const grade = sanitizeText(tripInput.grade, 40);
      const volume = Number(tripInput.volume);

      if (!orderId || !orderCode || !truckPlate || !driverName || !driverPhone || !departureTime || !arrivalEstimate || !slumpTested || !grade || !isPositiveInteger(volume)) {
        return res.status(400).json({ error: 'Thông tin chuyến xe không hợp lệ.' });
      }

      const existingTrips = await db.select().from(trips);
      const ticketSeq = String(existingTrips.length + 101);
      const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const newTicket = `PKX-${dateCode}-${ticketSeq}`;

      const orderList = await db.select().from(orders).where(eq(orders.id, orderId));
      const targetOrder = orderList[0];
      const prevDelivered = targetOrder ? targetOrder.deliveredVolume : 0;
      const newAccumulated = prevDelivered + volume;

      const newTrip = {
        id: `trip-${Date.now()}`,
        orderId,
        orderCode,
        ticketNumber: newTicket,
        truckPlate,
        driverName,
        driverPhone,
        volume,
        accumulatedVolume: newAccumulated,
        departureTime,
        arrivalEstimate,
        status,
        slumpTested,
        grade
      };

      await db.insert(trips).values(newTrip);

      if (targetOrder) {
        const totalDelivered = targetOrder.deliveredVolume + volume;
        await db.update(orders).set({
          deliveredVolume: totalDelivered,
          assignedTrucksCount: targetOrder.assignedTrucksCount + 1,
          status: totalDelivered >= targetOrder.totalVolume ? 'HOAN_THANH' : 'DANG_CHAY',
          updatedAt: new Date()
        }).where(eq(orders.id, targetOrder.id));
      }

      await db.update(trucks).set({
        status: 'DANG_CHAY',
        currentOrderCode: orderCode
      }).where(eq(trucks.plateNumber, truckPlate));

      res.json(newTrip);
    } catch (err: any) {
      console.error('Error creating trip:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/trips/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body ?? {};
      const safeUpdates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (key === 'volume' && isPositiveInteger(value)) safeUpdates.volume = Number(value);
        else if (typeof value === 'string') safeUpdates[key] = sanitizeText(value, 200);
        else if (typeof value === 'number' || typeof value === 'boolean') safeUpdates[key] = value;
      }

      await db.update(trips).set(safeUpdates).where(eq(trips.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating trip:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Trucks API
  app.get('/api/trucks', requireAuth, async (req, res) => {
    try {
      const allTrucks = await db.select().from(trucks);
      if (allTrucks.length < 21 || !allTrucks.some(t => t.plateNumber === '51B-33618')) {
        await db.delete(trucks);
        for (const trk of INITIAL_TRUCKS) {
          await db.insert(trucks).values({
            id: trk.id,
            plateNumber: trk.plateNumber,
            driverName: trk.driverName,
            driverPhone: trk.driverPhone,
            capacityM3: trk.capacityM3,
            status: trk.status,
            currentOrderCode: trk.currentOrderCode || null,
            fuelLevel: trk.fuelLevel || 100,
            kmToday: trk.kmToday || 0,
            tripsToday: trk.tripsToday || 0,
            truckType: trk.truckType
          });
        }
      }
      res.json(INITIAL_TRUCKS);
    } catch (err: any) {
      console.error('Error fetching trucks:', err);
      res.json(INITIAL_TRUCKS);
    }
  });

  app.put('/api/trucks/:id', requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body ?? {};
      const safeUpdates: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(updates)) {
        if (typeof value === 'string') safeUpdates[key] = sanitizeText(value, 200);
        else if (typeof value === 'number' || typeof value === 'boolean') safeUpdates[key] = value;
      }

      await db.update(trucks).set(safeUpdates).where(eq(trucks.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating truck:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Users / Auth API
  app.get('/api/users', requireAuth, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      const safe = allUsers.map(u => ({
        id: String(u.id),
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        roleTitle: u.roleTitle,
        plantLocation: u.plantLocation,
        email: u.email || undefined,
        phone: u.phone || undefined,
        isActive: u.isActive,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString()
      }));
      res.json(safe);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', requireAuth, requireRole(['ADMIN']), async (req, res) => {
    try {
      const { username, password, fullName, role, roleTitle, plantLocation, email, phone } = req.body ?? {};
      const cleanUser = sanitizeText(username, 64).toLowerCase();
      const cleanFullName = sanitizeText(fullName, 120);
      const cleanRole = sanitizeText(role || 'DISPATCHER', 40);
      const cleanRoleTitle = sanitizeText(roleTitle || 'Điều phối viên', 80);
      const cleanPlantLocation = sanitizeText(plantLocation || 'Tây Ninh', 80);
      const cleanEmail = sanitizeText(email || '', 120);
      const cleanPhone = sanitizeText(phone || '', 30);

      if (!cleanUser || !isValidUsername(cleanUser)) {
        return res.status(400).json({ error: 'Tên đăng nhập không hợp lệ.' });
      }
      if (!isValidPassword(String(password ?? ''))) {
        return res.status(400).json({ error: 'Mật khẩu phải có ít nhất 6 ký tự.' });
      }
      if (!cleanFullName || cleanFullName.length < 2) {
        return res.status(400).json({ error: 'Tên đầy đủ không hợp lệ.' });
      }
      if (!['ADMIN', 'DISPATCHER', 'STATION_MANAGER', 'LAB_QC', 'ACCOUNTANT'].includes(cleanRole)) {
        return res.status(400).json({ error: 'Vai trò không hợp lệ.' });
      }
      if (!isValidEmail(cleanEmail)) {
        return res.status(400).json({ error: 'Email không hợp lệ.' });
      }

      const existing = await db.select().from(users).where(eq(users.username, cleanUser));
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại.' });
      }

      const passwordHash = await bcrypt.hash(String(password), 12);
      const inserted = await db.insert(users).values({
        username: cleanUser,
        passwordHash,
        fullName: cleanFullName,
        role: cleanRole,
        roleTitle: cleanRoleTitle,
        plantLocation: cleanPlantLocation,
        email: cleanEmail || `${cleanUser}@tasago.vn`,
        phone: cleanPhone,
        isActive: true
      }).returning();

      const u = inserted[0];
      res.json({
        id: String(u.id),
        username: u.username,
        fullName: u.fullName,
        role: u.role,
        roleTitle: u.roleTitle,
        plantLocation: u.plantLocation,
        email: u.email,
        phone: u.phone,
        isActive: u.isActive,
        createdAt: u.createdAt
      });
    } catch (err: any) {
      console.error('Error creating user:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Mount Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT, hmr: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TSG TNT Concrete Operations server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});


