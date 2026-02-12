import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { prisma, connectDb } from './config/prisma.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import contactRoutes from './routes/contact.routes.js';
import conversationRoutes from './routes/conversation.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import formRoutes from './routes/form.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import alertRoutes from './routes/alert.routes.js';
import integrationRoutes from './routes/integration.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import automationRoutes from './routes/automation.routes.js';
import staffRoutes from './routes/staff.routes.js'

const app = express();
const httpServer = createServer(app);

// ==============================
// SOCKET.IO
// ==============================

export const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('join-workspace', (workspaceId) => {
    socket.join(`workspace:${workspaceId}`);
  });

  socket.on('leave-workspace', (workspaceId) => {
    socket.leave(`workspace:${workspaceId}`);
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Emit helper
export const emitToWorkspace = (workspaceId, event, data) => {
  io.to(`workspace:${workspaceId}`).emit(event, data);
};

// ==============================
// MIDDLEWARE
// ==============================

app.use(cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(morgan('dev'));

// ==============================
// HEALTH CHECK
// ==============================

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'healthy',
      database: 'connected',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/staff', staffRoutes);

app.use(notFound);
app.use(errorHandler);

// ==============================
// START SERVER
// ==============================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDb();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start ❌', error);
    process.exit(1);
  }
}

startServer();

export default app;
