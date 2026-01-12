// --- Types Definition ---
export type Mood = 'sad' | 'angry' | 'stressed' | 'happy' | 'confused' | 'neutral';
export type PostMode = 'vent' | 'advice';
export type VoteType = 'agree' | 'disagree';

// Socket Events Types
export interface ServerToClientEvents {
  load_topics: (data: ITopic[]) => void;
  new_topic: (data: ITopic) => void;
  update_topic: (data: ITopic) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  create_topic: (data: { content: string; mood: Mood; mode: PostMode; userId: string }) => void;
  vote_topic: (data: { topicId: string; type: VoteType; userId: string }) => void;
  comment_topic: (data: { topicId: string; text: string; userId: string }) => void;
  delete_topic: (data: { topicId: string; userId: string }) => void;
  report_topic: (data: { topicId: string; userId: string }) => void;
}

// Database Interfaces
export interface IVote {
  userId: string;
  type: VoteType;
}

export interface IComment {
  text: string;
  userId: string;
  timestamp: Date;
}

export interface ITopic {
  _id?: string;
  content: string;
  mood: Mood;
  mode: PostMode;
  userId: string;
  votes: IVote[];
  comments: IComment[];
  createdAt: Date;
  reportCount: number;
  agreeCount?: number;
  disagreeCount?: number;
}
