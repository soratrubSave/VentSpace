import { describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { TopicService } from '../topicService.js';
import { Topic } from '../../models/Topic.js';
import type { Mood, PostMode } from '../../types/index.js';

describe('TopicService', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Topic.deleteMany({});
  });

  describe('createTopic', () => {
    it('should create a topic successfully', async () => {
      const topicData = {
        content: 'This is a test topic',
        mood: 'neutral' as Mood,
        mode: 'vent' as PostMode,
        userId: 'user-123',
      };

      const topic = await TopicService.createTopic(topicData);

      expect(topic).toBeDefined();
      expect(topic.content).toBe('This is a test topic');
      expect(topic.mood).toBe('neutral');
      expect(topic.mode).toBe('vent');
      expect(topic.userId).toBe('user-123');
      expect(topic._id).toBeDefined();
    });

    it('should reject empty content', async () => {
      const topicData = {
        content: '',
        mood: 'neutral' as Mood,
        mode: 'vent' as PostMode,
        userId: 'user-123',
      };

      await expect(TopicService.createTopic(topicData)).rejects.toThrow();
    });

    it('should reject content over 500 characters', async () => {
      const topicData = {
        content: 'a'.repeat(501),
        mood: 'neutral' as Mood,
        mode: 'vent' as PostMode,
        userId: 'user-123',
      };

      await expect(TopicService.createTopic(topicData)).rejects.toThrow();
    });

    it('should sanitize invalid mood to neutral', async () => {
      const topicData = {
        content: 'Test content',
        mood: 'invalid' as Mood,
        mode: 'vent' as PostMode,
        userId: 'user-123',
      };

      const topic = await TopicService.createTopic(topicData);
      expect(topic.mood).toBe('neutral');
    });

    it('should sanitize invalid mode to vent', async () => {
      const topicData = {
        content: 'Test content',
        mood: 'neutral' as Mood,
        mode: 'invalid' as PostMode,
        userId: 'user-123',
      };

      const topic = await TopicService.createTopic(topicData);
      expect(topic.mode).toBe('vent');
    });
  });

  describe('voteTopic', () => {
    it('should add a vote to a topic', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
        votes: [],
      });
      await topic.save();

      const updatedTopic = await TopicService.voteTopic(topic._id.toString(), 'user-456', 'agree');

      expect(updatedTopic).toBeDefined();
      expect(updatedTopic!.votes.length).toBe(1);
      expect(updatedTopic!.votes[0].userId).toBe('user-456');
      expect(updatedTopic!.votes[0].type).toBe('agree');
    });

    it('should toggle off vote if same vote exists', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
        votes: [{ userId: 'user-456', type: 'agree' }],
      });
      await topic.save();

      const updatedTopic = await TopicService.voteTopic(topic._id.toString(), 'user-456', 'agree');

      expect(updatedTopic).toBeDefined();
      expect(updatedTopic!.votes.length).toBe(0);
    });

    it('should switch vote type if different vote exists', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
        votes: [{ userId: 'user-456', type: 'agree' }],
      });
      await topic.save();

      const updatedTopic = await TopicService.voteTopic(topic._id.toString(), 'user-456', 'disagree');

      expect(updatedTopic).toBeDefined();
      expect(updatedTopic!.votes.length).toBe(1);
      expect(updatedTopic!.votes[0].type).toBe('disagree');
    });

    it('should return null for non-existent topic', async () => {
      const result = await TopicService.voteTopic('507f1f77bcf86cd799439011', 'user-123', 'agree');
      expect(result).toBeNull();
    });
  });

  describe('addComment', () => {
    it('should add a comment to a topic', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
        comments: [],
      });
      await topic.save();

      const updatedTopic = await TopicService.addComment(topic._id.toString(), 'Great post!', 'user-456');

      expect(updatedTopic).toBeDefined();
      expect(updatedTopic!.comments.length).toBe(1);
      expect(updatedTopic!.comments[0].text).toBe('Great post!');
      expect(updatedTopic!.comments[0].userId).toBe('user-456');
    });

    it('should reject empty comment', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
        comments: [],
      });
      await topic.save();

      await expect(
        TopicService.addComment(topic._id.toString(), '', 'user-456')
      ).rejects.toThrow();
    });

    it('should return null for non-existent topic', async () => {
      const result = await TopicService.addComment('507f1f77bcf86cd799439011', 'Test comment', 'user-123');
      expect(result).toBeNull();
    });
  });

  describe('deleteTopic', () => {
    it('should delete topic if user is owner', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
      });
      await topic.save();

      const result = await TopicService.deleteTopic(topic._id.toString(), 'user-123');

      expect(result.success).toBe(true);
      const deletedTopic = await Topic.findById(topic._id);
      expect(deletedTopic).toBeNull();
    });

    it('should reject deletion if user is not owner', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
      });
      await topic.save();

      const result = await TopicService.deleteTopic(topic._id.toString(), 'user-456');

      expect(result.success).toBe(false);
      expect(result.error).toBe('You can only delete your own posts');
      
      const existingTopic = await Topic.findById(topic._id);
      expect(existingTopic).toBeDefined();
    });

    it('should return error for non-existent topic', async () => {
      const result = await TopicService.deleteTopic('507f1f77bcf86cd799439011', 'user-123');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Topic not found');
    });
  });

  describe('reportTopic', () => {
    it('should increment report count', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
        reportCount: 0,
      });
      await topic.save();

      const updatedTopic = await TopicService.reportTopic(topic._id.toString(), 'user-456');

      expect(updatedTopic).toBeDefined();
      expect(updatedTopic!.reportCount).toBe(1);
    });

    it('should increment report count multiple times', async () => {
      const topic = new Topic({
        content: 'Test topic',
        mood: 'neutral',
        mode: 'vent',
        userId: 'user-123',
        reportCount: 0,
      });
      await topic.save();

      await TopicService.reportTopic(topic._id.toString(), 'user-456');
      const updatedTopic = await TopicService.reportTopic(topic._id.toString(), 'user-789');

      expect(updatedTopic).toBeDefined();
      expect(updatedTopic!.reportCount).toBe(2);
    });

    it('should return null for non-existent topic', async () => {
      const result = await TopicService.reportTopic('507f1f77bcf86cd799439011', 'user-123');
      expect(result).toBeNull();
    });
  });
});
