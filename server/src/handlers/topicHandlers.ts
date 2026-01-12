import { Socket } from 'socket.io';
import type { ServerToClientEvents } from '../types/index.js';
import { TopicService } from '../services/topicService.js';

export class TopicHandlers {
  constructor(private io: Socket<ServerToClientEvents>) {}

  async handleLoadTopics(socket: Socket) {
    try {
      const topics = await TopicService.getRecentTopics(20);
      socket.emit('load_topics', topics);
    } catch (err) {
      console.error('Error loading topics:', err);
    }
  }

  async handleCreateTopic(socket: Socket, data: {
    content: string;
    mood: string;
    mode: string;
    userId: string;
  }) {
    try {
      const topic = await TopicService.createTopic({
        content: data.content,
        mood: data.mood as any,
        mode: data.mode as any,
        userId: data.userId
      });
      this.io.emit('new_topic', topic);
    } catch (err: any) {
      console.error('Create topic error:', err);
      socket.emit('error', { message: err.message || 'Failed to create topic' });
    }
  }

  async handleVoteTopic(socket: Socket, data: {
    topicId: string;
    type: 'agree' | 'disagree';
    userId: string;
  }) {
    try {
      const updatedTopic = await TopicService.voteTopic(data.topicId, data.userId, data.type);
      if (updatedTopic) {
        this.io.emit('update_topic', updatedTopic);
      }
    } catch (err) {
      console.error('Vote error:', err);
    }
  }

  async handleCommentTopic(socket: Socket, data: {
    topicId: string;
    text: string;
    userId: string;
  }) {
    try {
      const updatedTopic = await TopicService.addComment(data.topicId, data.text, data.userId);
      if (updatedTopic) {
        this.io.emit('update_topic', updatedTopic);
      } else {
        socket.emit('error', { message: 'Topic not found' });
      }
    } catch (err: any) {
      console.error('Comment error:', err);
      socket.emit('error', { message: err.message || 'Failed to add comment' });
    }
  }

  async handleDeleteTopic(socket: Socket, data: {
    topicId: string;
    userId: string;
  }) {
    try {
      const result = await TopicService.deleteTopic(data.topicId, data.userId);
      if (result.success) {
        // Emit deleted flag to all clients
        this.io.emit('update_topic', { _id: data.topicId, deleted: true } as any);
      } else {
        socket.emit('error', { message: result.error || 'Failed to delete topic' });
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      socket.emit('error', { message: err.message || 'Failed to delete topic' });
    }
  }

  async handleReportTopic(socket: Socket, data: {
    topicId: string;
    userId: string;
  }) {
    try {
      const updatedTopic = await TopicService.reportTopic(data.topicId, data.userId);
      if (updatedTopic) {
        this.io.emit('update_topic', updatedTopic);
      } else {
        socket.emit('error', { message: 'Topic not found' });
      }
    } catch (err: any) {
      console.error('Report error:', err);
      socket.emit('error', { message: err.message || 'Failed to report topic' });
    }
  }
}
