import mongoose, { Document, Schema } from 'mongoose';
import type { ITopic, Mood, PostMode, VoteType } from '../types/index.js';

export interface ITopicDocument extends Document, Omit<ITopic, '_id'> {}

const voteSchema = new Schema({
  userId: { type: String, required: true },
  type: { type: String, enum: ['agree', 'disagree'], required: true }
}, { _id: false });

const commentSchema = new Schema({
  text: String,
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const topicSchema = new Schema<ITopicDocument>({
  content: { type: String, required: true },
  mood: {
    type: String,
    enum: ['sad', 'angry', 'stressed', 'happy', 'confused', 'neutral'] as Mood[],
    default: 'neutral'
  },
  mode: {
    type: String,
    enum: ['vent', 'advice'] as PostMode[],
    default: 'vent'
  },
  userId: { type: String, required: true },
  votes: [voteSchema],
  comments: [commentSchema],
  createdAt: { type: Date, default: Date.now },
  reportCount: { type: Number, default: 0 }
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual fields for vote counts
topicSchema.virtual('agreeCount').get(function() {
  return this.votes ? this.votes.filter(v => v.type === 'agree').length : 0;
});

topicSchema.virtual('disagreeCount').get(function() {
  return this.votes ? this.votes.filter(v => v.type === 'disagree').length : 0;
});

export const Topic = mongoose.model<ITopicDocument>('Topic', topicSchema);
