import express from 'express';
import http from 'http';
import { Socket } from 'socket.io';
import { connectDatabase } from './config/database.js';
import { createSocketServer } from './config/socket.js';
import { TopicHandlers } from './handlers/topicHandlers.js';
import type { ClientToServerEvents } from './types/index.js';

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = createSocketServer(server);

// Initialize handlers
const topicHandlers = new TopicHandlers(io as any);

// Socket connection handler
io.on('connection', async (socket: Socket<ClientToServerEvents>) => {
  console.log(`User Connected: ${socket.id}`);

  // Load initial topics
  await topicHandlers.handleLoadTopics(socket);

  // Register event handlers (typed data params)
  socket.on('create_topic', (data: Parameters<ClientToServerEvents['create_topic']>[0]) =>
    topicHandlers.handleCreateTopic(socket, data)
  );

  socket.on('vote_topic', (data: Parameters<ClientToServerEvents['vote_topic']>[0]) =>
    topicHandlers.handleVoteTopic(socket, data)
  );

  socket.on('comment_topic', (data: Parameters<ClientToServerEvents['comment_topic']>[0]) =>
    topicHandlers.handleCommentTopic(socket, data)
  );

  socket.on('delete_topic', (data: Parameters<ClientToServerEvents['delete_topic']>[0]) =>
    topicHandlers.handleDeleteTopic(socket, data)
  );

  socket.on('report_topic', (data: Parameters<ClientToServerEvents['report_topic']>[0]) =>
    topicHandlers.handleReportTopic(socket, data)
  );
});

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDatabase();
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();
