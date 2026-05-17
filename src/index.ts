import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { env } from './config/env';
import authRoutes from './routes/auth';
import stockRoutes from './routes/stocks';
import alertRoutes from './routes/alerts';
import { initFinnhubWebSocket } from './services/finnhub';
import { initAlertChecker } from './services/alertChecker';

const app = express();
const httpServer = createServer(app);

export const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Middlewares
app.use(cors());
app.use(express.json());

// Calling Routes
app.use('/auth', authRoutes);

// Stock routes
app.use('/stocks', stockRoutes);

// Alert routes
app.use('/alerts', alertRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start server
httpServer.listen(env.PORT, "0.0.0.0", () => {
  console.log(` Server running on port ${env.PORT}`);
  initFinnhubWebSocket();
  initAlertChecker();
});