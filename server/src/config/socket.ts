import { Server } from 'socket.io';
import http from 'http';
import dotenv from 'dotenv';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';

dotenv.config();

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';

export const createSocketServer = (server: http.Server) => {
  return new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: {
      origin: CLIENT_ORIGIN,
      methods: ["GET", "POST"]
    }
  });
};
