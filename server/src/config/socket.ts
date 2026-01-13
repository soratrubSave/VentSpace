import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/index.js';

dotenv.config();

// Support multiple origins (comma-separated) or single origin
// Example: CLIENT_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
// Or: CLIENT_ORIGIN=https://yourdomain.com
const getClientOrigins = (): string | string[] => {
  const envOrigin = process.env.CLIENT_ORIGIN;
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!envOrigin) {
    // Development fallback
    if (isProduction) {
      console.warn('⚠️  WARNING: CLIENT_ORIGIN not set in production! Socket.IO connections may be blocked.');
      return []; // Empty array = disallow all origins
    }
    return 'http://localhost:3000';
  }
  
  // Support multiple origins (comma-separated)
  if (envOrigin.includes(',')) {
    const origins = envOrigin.split(',').map(origin => origin.trim()).filter(Boolean);
    if (origins.length === 0) {
      console.warn('⚠️  WARNING: CLIENT_ORIGIN contains only empty values!');
      return isProduction ? [] : 'http://localhost:3000';
    }
    return origins;
  }
  
  return envOrigin.trim();
};

const CLIENT_ORIGINS = getClientOrigins();

export const createSocketServer = (server: http.Server) => {
  const corsOrigin = Array.isArray(CLIENT_ORIGINS) 
    ? (CLIENT_ORIGINS.length > 0 ? CLIENT_ORIGINS : false)
    : CLIENT_ORIGINS;
  
  return new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: corsOrigin,
      credentials: true, // Allow cookies/credentials if needed
      methods: ["GET", "POST"]
    }
  });
};
