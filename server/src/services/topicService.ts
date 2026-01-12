import { Topic } from '../models/Topic';
import type { ITopic, Mood, PostMode } from '../types';
import { validateContent, validateComment, validateUserId, sanitizeMood, sanitizeMode } from '../utils/validation';

export class TopicService {
  static async getRecentTopics(limit: number = 20): Promise<ITopic[]> {
    try {
      const topics = await Topic.find().sort({ createdAt: -1 }).limit(limit);
      return topics;
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
    return newTopic.toObject();
  }

  static async voteTopic(topicId: string, userId: string, type: 'agree' | 'disagree'): Promise<ITopic | null> {
    const topic = await Topic.findById(topicId);
    if (!topic) return null;

    const existingVoteIndex = topic.votes.findIndex(v => v.userId === userId);

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
      topic.votes.push({ userId, type });
    }

    await topic.save();
    return topic.toObject();
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

    return updatedTopic ? updatedTopic.toObject() : null;
  }

  static async deleteTopic(topicId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const userIdValidation = validateUserId(userId);
    if (!userIdValidation.valid) {
      return { success: false, error: userIdValidation.error };
    }

    const topic = await Topic.findById(topicId);
    if (!topic) {
      return { success: false, error: 'Topic not found' };
    }

    if (topic.userId !== userId) {
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

    return topic ? topic.toObject() : null;
  }
}
