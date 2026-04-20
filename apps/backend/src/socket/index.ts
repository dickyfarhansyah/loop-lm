import { Server as SocketIOServer } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import type { Server } from 'http';

export function setupSocketIO(httpServer: Server) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      credentials: true,
    },
  });

  
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error('Authentication error'));
    }

    const payload = verifyToken(token);
    if (!payload) {
      return next(new Error('Invalid token'));
    }

    socket.data.user = payload;
    next();
  });

  
  io.on('connection', (socket) => {
    const user = socket.data.user;
    console.log(`User connected: ${user.email} (${socket.id})`);

    
    socket.join(`user:${user.id}`);

    
    socket.on('join:chat', (chatId: string) => {
      socket.join(`chat:${chatId}`);
      console.log(`User ${user.email} joined chat ${chatId}`);
    });

    socket.on('leave:chat', (chatId: string) => {
      socket.leave(`chat:${chatId}`);
      console.log(`User ${user.email} left chat ${chatId}`);
    });

    
    socket.on('chat:message', (data: { chatId: string; message: any }) => {
      io.to(`chat:${data.chatId}`).emit('chat:message', {
        ...data.message,
        userId: user.id,
      });
    });

    
    socket.on('chat:typing', (data: { chatId: string; isTyping: boolean }) => {
      socket.to(`chat:${data.chatId}`).emit('chat:typing', {
        userId: user.id,
        isTyping: data.isTyping,
      });
    });

    
    socket.on('chat:updated', (data: { chatId: string }) => {
      io.to(`chat:${data.chatId}`).emit('chat:updated', {
        chatId: data.chatId,
      });
    });

    
    socket.on('user:presence', (status: 'online' | 'offline') => {
      io.emit('user:presence', {
        userId: user.id,
        status,
      });
    });

    
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.email} (${socket.id})`);
      io.emit('user:presence', {
        userId: user.id,
        status: 'offline',
      });
    });
  });

  return io;
}
