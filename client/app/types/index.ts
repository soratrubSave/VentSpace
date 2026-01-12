// --- Types ---
export type Mood = 'sad' | 'angry' | 'stressed' | 'happy' | 'confused' | 'neutral';
export type PostMode = 'vent' | 'advice';

export interface Comment {
  text: string;
  userId: string;
  timestamp: string;
}

export interface Vote {
  userId: string;
  type: 'agree' | 'disagree';
}

export interface Topic {
  _id: string;
  content: string;
  mood: Mood;
  mode: PostMode;
  userId: string;
  votes: Vote[];
  agreeCount: number;
  disagreeCount: number;
  comments: Comment[];
  createdAt: string;
  reportCount: number;
  deleted?: boolean;
}
