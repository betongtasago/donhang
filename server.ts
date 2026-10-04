import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { db } from './src/db/index';
import { orders, trips, trucks, users, debts, fuelLogs, labTests } from './src/db/schema';
import { INITIAL_TRUCKS } from './src/sync/initialData';
import { eq, desc } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const requiredDbEnv = ['SQL_HOST', 'SQL_USER', 'SQL_PASSWORD', 'SQL_DB_NAME'];
const missingDbEnv = requiredDbEnv.filter((key) => !process.env[key]);

if (missingDbEnv.length > 0) {
  console.warn(
    `Missing database environment variables: ${missingDbEnv.join(', ')}. ` +
      'Set them in a .env file before using DB-backed endpoints.'
  );
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

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

  app.post('/api/sync/events', (req, res) => {
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
    if (missingDbEnv.length > 0) {
      return res.status(503).json({
        status: 'error',
        message: 'Database is not configured. Set SQL_HOST, SQL_USER, SQL_PASSWORD, and SQL_DB_NAME in .env.'
      });
    }

    try {
      const result = await db.select().from(orders).limit(1);
      res.json({ status: 'ok', database: 'connected', sampleOrdersCount: result.length });
    } catch (err: any) {
      console.error('Database connection error in health check:', err);
      res.status(500).json({ status: 'error', message: err.message });
    }
  });

  // 1. Orders API
  app.get('/api/orders', async (req, res) => {
    try {
      const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));
      // Map to frontend interface
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

  app.post('/api/orders', async (req, res) => {
    try {
      const body = req.body;
      const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const existing = await db.select().from(orders);
      const code = `DH-${dateCode}-${String(existing.length + 1).padStart(3, '0')}`;
      const id = `ord-${Date.now()}`;

      const newOrder = {
        id,
        code,
        customerName: body.customerName,
        plantLocation: body.plantLocation || 'Tây Ninh',
        projectTitle: body.projectTitle,
        categoryItem: body.categoryItem,
        totalVolume: body.totalVolume,
        deliveredVolume: 0,
        deliveryTime: body.deliveryTime,
        deliveryDate: body.deliveryDate,
        status: body.status || 'CHO_DUYET',
        grade: body.grade,
        slump: body.slump,
        additive: body.additive || 'Không',
        pumpType: body.pumpType || 'Bơm cần',
        contactPerson: body.contactPerson,
        contactPhone: body.contactPhone,
        notes: body.notes || '',
        assignedTrucksCount: 0
      };

      await db.insert(orders).values(newOrder);
      res.json(newOrder);
    } catch (err: any) {
      console.error('Error creating order:', err);
      res.status(500).json({ error: err.message || 'Failed to create order' });
    }
  });

  app.put('/api/orders/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await db.update(orders).set({
        ...updates,
        updatedAt: new Date()
      }).where(eq(orders.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating order:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/orders/:id', async (req, res) => {
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
  app.get('/api/trips', async (req, res) => {
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

  app.post('/api/trips', async (req, res) => {
    try {
      const tripInput = req.body;
      const existingTrips = await db.select().from(trips);
      const ticketSeq = String(existingTrips.length + 101);
      const dateCode = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const newTicket = `PKX-${dateCode}-${ticketSeq}`;

      // Find current order to get cumulative total
      const orderList = await db.select().from(orders).where(eq(orders.id, tripInput.orderId));
      const targetOrder = orderList[0];
      const prevDelivered = targetOrder ? targetOrder.deliveredVolume : 0;
      const newAccumulated = prevDelivered + tripInput.volume;

      const newTrip = {
        id: `trip-${Date.now()}`,
        orderId: tripInput.orderId,
        orderCode: tripInput.orderCode,
        ticketNumber: newTicket,
        truckPlate: tripInput.truckPlate,
        driverName: tripInput.driverName,
        driverPhone: tripInput.driverPhone,
        volume: tripInput.volume,
        accumulatedVolume: newAccumulated,
        departureTime: tripInput.departureTime,
        arrivalEstimate: tripInput.arrivalEstimate,
        status: tripInput.status || 'DANG_NAP',
        slumpTested: tripInput.slumpTested,
        grade: tripInput.grade
      };

      await db.insert(trips).values(newTrip);

      // Increment order's delivered volume and truck count
      if (targetOrder) {
        const totalDelivered = targetOrder.deliveredVolume + tripInput.volume;
        await db.update(orders).set({
          deliveredVolume: totalDelivered,
          assignedTrucksCount: targetOrder.assignedTrucksCount + 1,
          status: totalDelivered >= targetOrder.totalVolume ? 'HOAN_THANH' : 'DANG_CHAY',
          updatedAt: new Date()
        }).where(eq(orders.id, targetOrder.id));
      }

      // Update truck status
      await db.update(trucks).set({
        status: 'DANG_CHAY',
        currentOrderCode: tripInput.orderCode
      }).where(eq(trucks.plateNumber, tripInput.truckPlate));

      res.json(newTrip);
    } catch (err: any) {
      console.error('Error creating trip:', err);
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/trips/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await db.update(trips).set(updates).where(eq(trips.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating trip:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Trucks API
  app.get('/api/trucks', async (req, res) => {
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

  app.put('/api/trucks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      await db.update(trucks).set(updates).where(eq(trucks.id, id));
      res.json({ success: true });
    } catch (err: any) {
      console.error('Error updating truck:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // 4. Users / Auth API
  app.get('/api/users', async (req, res) => {
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

  app.post('/api/users', async (req, res) => {
    try {
      const { username, password, fullName, role, roleTitle, plantLocation, email, phone } = req.body;
      const cleanUser = username.trim().toLowerCase();

      const existing = await db.select().from(users).where(eq(users.username, cleanUser));
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Tên đăng nhập này đã tồn tại.' });
      }

      const inserted = await db.insert(users).values({
        username: cleanUser,
        passwordHash: password,
        fullName: fullName.trim(),
        role: role || 'DISPATCHER',
        roleTitle: roleTitle || 'Điều phối viên',
        plantLocation: plantLocation || 'Tây Ninh',
        email: email || `${cleanUser}@tasago.vn`,
        phone: phone || '',
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

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const cleanUser = (username || '').trim().toLowerCase();

      const userList = await db.select().from(users).where(eq(users.username, cleanUser));
      const user = userList[0];

      if (!user || user.passwordHash !== password) {
        return res.status(401).json({ success: false, error: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, error: 'Tài khoản này đã bị tạm khoá.' });
      }

      res.json({
        success: true,
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

  // Mount Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      // The custom Express server does not expose Vite's WebSocket endpoint in the preview.
      // Disable HMR here so the injected Vite client cannot retry a socket that can never open.
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
});
