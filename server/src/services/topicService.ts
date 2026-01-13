import { Topic } from '../models/Topic.js';
import type { ITopic, Mood, PostMode } from '../types/index.js';
import type { ITopicDocument } from '../models/Topic.js';
import { validateContent, validateComment, validateUserId, sanitizeMood, sanitizeMode } from '../utils/validation.js';

export class TopicService {
  private static toTopic(doc: ITopicDocument): ITopic {
    const obj = doc.toObject();
    const topic = {
      ...obj,
      _id: doc._id?.toString() || '',
    } as any;
    
    // Convert dates to ISO strings for client
    if (topic.createdAt instanceof Date) {
      topic.createdAt = topic.createdAt.toISOString();
    }
    if (topic.comments && Array.isArray(topic.comments)) {
      topic.comments = topic.comments.map((c: any) => ({
        ...c,
        timestamp: c.timestamp instanceof Date ? c.timestamp.toISOString() : c.timestamp
      }));
    }
    
    return topic as ITopic;
  }

  static async getRecentTopics(limit: number = 20): Promise<ITopic[]> {
    try {
      const topics = await Topic.find().sort({ createdAt: -1 }).limit(limit);
      return topics.map(TopicService.toTopic);
    } catch (err) {
      console.error('Error fetching topics:', err);
      throw err;
    }
  }

  static async createTopic(data: {
    content: string;
    mood: Mood;
    mode: PostMode;
    userId: string;
  }): Promise<ITopic> {
    const contentValidation = validateContent(data.content);
    if (!contentValidation.valid) {
      throw new Error(contentValidation.error);
    }

    const userIdValidation = validateUserId(data.userId);
    if (!userIdValidation.valid) {
      throw new Error(userIdValidation.error);
    }

    const safeMood = sanitizeMood(data.mood);
    const safeMode = sanitizeMode(data.mode);
    const trimmedContent = data.content.trim();

    const newTopic = new Topic({
      content: trimmedContent,
      mood: safeMood,
      mode: safeMode,
      userId: data.userId,
      votes: []
    });

    await newTopic.save();
    return TopicService.toTopic(newTopic);
  }

  static async voteTopic(topicId: string, userId: string, type: 'agree' | 'disagree'): Promise<ITopic | null> {
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.valid) {
      throw new Error(userIdValidation.error);
    }

    const topic = await Topic.findById(topicId);
    if (!topic) return null;

    // Normalize userId for comparison
    const normalizedUserId = String(userId).trim();
    const existingVoteIndex = topic.votes.findIndex(v => String(v.userId).trim() === normalizedUserId);

    if (existingVoteIndex !== -1) {
      const existingVote = topic.votes[existingVoteIndex];
      
      if (existingVote.type === type) {
        // Toggle off
        topic.votes.splice(existingVoteIndex, 1);
      } else {
        // Switch vote
        existingVote.type = type;
      }
    } else {
      // Add new vote
      topic.votes.push({ userId: normalizedUserId, type });
    }

    await topic.save();
    return TopicService.toTopic(topic);
  }

  static async addComment(topicId: string, text: string, userId: string): Promise<ITopic | null> {
    const commentValidation = validateComment(text);
    if (!commentValidation.valid) {
      throw new Error(commentValidation.error);
    }

    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.valid) {
      throw new Error(userIdValidation.error);
    }

    const updatedTopic = await Topic.findByIdAndUpdate(
      topicId,
      { $push: { comments: { text: text.trim(), userId, timestamp: new Date() } } },
      { new: true }
    );

    return updatedTopic ? TopicService.toTopic(updatedTopic) : null;
  }

  static async deleteTopic(topicId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.valid) {
      return { success: false, error: userIdValidation.error };
    }

    if (!topicId || topicId.trim().length === 0) {
      return { success: false, error: 'Topic ID is required' };
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return { success: false, error: 'Topic not found' };
    }

    // Strict ownership check: Normalize strings and compare
    const topicOwnerId = String(topic.userId || '').trim();
    const requestUserId = String(userId || '').trim();
    
    if (topicOwnerId !== requestUserId) {
      return { success: false, error: 'You can only delete your own posts' };
    }

    await Topic.findByIdAndDelete(topicId);
    return { success: true };
  }

  static async reportTopic(topicId: string, userId: string): Promise<ITopic | null> {
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.valid) {
      throw new Error(userIdValidation.error);
    }

    const topic = await Topic.findByIdAndUpdate(
      topicId,
      { $inc: { reportCount: 1 } },
      { new: true }
    );

    return topic ? TopicService.toTopic(topic) : null;
  }
}
