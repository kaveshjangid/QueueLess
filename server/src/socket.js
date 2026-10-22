import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io;

export function configureSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      next(new Error('Invalid socket token'));
    }
  });

  io.on('connection', socket => {
    socket.on('queue:subscribe', ({ serviceId } = {}) => {
      if (typeof serviceId === 'string' && /^[a-f\d]{24}$/i.test(serviceId)) {
        socket.join(`service:${serviceId}`);
      }
    });
    socket.on('queue:unsubscribe', ({ serviceId } = {}) => {
      if (typeof serviceId === 'string') socket.leave(`service:${serviceId}`);
    });
  });

  return io;
}

export function emitQueueUpdate(serviceId, payload = {}) {
  if (io) io.to(`service:${serviceId}`).emit('queue:updated', payload);
}
