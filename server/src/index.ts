import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import mongoose, { Document, Schema } from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());

const server = http.createServer(app);

// --- 1. Types Definition ---
type Mood = 'sad' | 'angry' | 'stressed' | 'happy' | 'confused' | 'neutral';
type PostMode = 'vent' | 'advice';

interface ServerToClientEvents {
  load_topics: (data: ITopic[]) => void;
  new_topic: (data: ITopic) => void;
  update_topic: (data: ITopic) => void;
  error: (data: { message: string }) => void;
}

interface ClientToServerEvents {
  create_topic: (data: { content: string; mood: Mood; mode: PostMode; userId: string }) => void;
  vote_topic: (data: { topicId: string; type: 'agree' | 'disagree'; userId: string }) => void;
  comment_topic: (data: { topicId: string; text: string; userId: string }) => void;
  delete_topic: (data: { topicId: string; userId: string }) => void;
  report_topic: (data: { topicId: string; userId: string }) => void;
}

// Setup Socket
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"]
  }
});

// --- 2. Database Connection ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://root:password123@localhost:27017/ventspace_db?authSource=admin';

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --- 3. Schema Design (Smart Voting + TTL + Reports) ---

interface IVote {
  userId: string;
  type: 'agree' | 'disagree';
}

interface IComment {
  text: string;
  userId: string;
  timestamp: Date;
}

// Topic Interface
interface ITopic extends Document {
  content: string;
  mood: Mood;
  mode: PostMode;
  userId: string; // เก็บ userId ของคนที่โพสต์
  votes: IVote[]; // เก็บเป็น Array เพื่อเช็คว่าใครโหวตอะไร
  comments: IComment[];
  createdAt: Date;
  reportCount: number;
  // Virtual fields (ค่าที่คำนวณเอา ไม่ได้เก็บใน DB ตรงๆ)
  agreeCount?: number;
  disagreeCount?: number;
}

const topicSchema = new Schema<ITopic>({
  content: { type: String, required: true },
  mood: {
    type: String,
    enum: ['sad', 'angry', 'stressed', 'happy', 'confused', 'neutral'],
    default: 'neutral'
  },
  mode: {
    type: String,
    enum: ['vent', 'advice'],
    default: 'vent'
  },
  userId: { type: String, required: true }, // เก็บ userId ของคนที่โพสต์
  votes: [{
    userId: { type: String, required: true },
    type: { type: String, enum: ['agree', 'disagree'], required: true }
  }],
  comments: [{
    text: String,
    userId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  reportCount: { type: Number, default: 0 }
}, {
  toJSON: { virtuals: true }, // สำคัญ: บอกให้ส่งค่า Virtual ไปกับ JSON ด้วย
  toObject: { virtuals: true }
});

// คำนวณจำนวนโหวตอัตโนมัติ
topicSchema.virtual('agreeCount').get(function() {
  return this.votes ? this.votes.filter(v => v.type === 'agree').length : 0;
});

topicSchema.virtual('disagreeCount').get(function() {
  return this.votes ? this.votes.filter(v => v.type === 'disagree').length : 0;
});

const Topic = mongoose.model<ITopic>('Topic', topicSchema);

// --- 4. Socket Logic ---
io.on('connection', async (socket: Socket) => {
  console.log(`User Connected: ${socket.id}`);

  // 4.1 Load Data
  try {
    const topics = await Topic.find().sort({ createdAt: -1 }).limit(20);
    socket.emit('load_topics', topics);
  } catch (err) {
    console.error(err);
  }

  // 4.2 New Post
  socket.on('create_topic', async ({ content, mood, mode, userId }) => {
    try {
      // Validation: trim และเช็คความยาว
      const trimmedContent = content?.trim() || '';
      if (trimmedContent.length < 1) {
        socket.emit('error', { message: 'Content cannot be empty' });
        return;
      }
      if (trimmedContent.length > 500) {
        socket.emit('error', { message: 'Content must be 500 characters or less' });
        return;
      }
      if (!userId || userId.trim().length === 0) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }

      const allowedMoods: Mood[] = ['sad', 'angry', 'stressed', 'happy', 'confused', 'neutral'];
      const safeMood: Mood = allowedMoods.includes(mood) ? mood : 'neutral';

      const allowedModes: PostMode[] = ['vent', 'advice'];
      const safeMode: PostMode = allowedModes.includes(mode) ? mode : 'vent';

      const newTopic = new Topic({ content: trimmedContent, mood: safeMood, mode: safeMode, userId, votes: [] });
      await newTopic.save();
      io.emit('new_topic', newTopic);
    } catch (err) {
      console.error(err);
      socket.emit('error', { message: 'Failed to create topic' });
    }
  });

  // 4.3 Smart Vote Logic (Highlight)
  socket.on('vote_topic', async ({ topicId, type, userId }) => {
    try {
      const topic = await Topic.findById(topicId);
      if (!topic) return;

      // เช็คว่า User นี้เคยโหวตหรือยัง
      const existingVoteIndex = topic.votes.findIndex(v => v.userId === userId);

      if (existingVoteIndex !== -1) {
        // เคยโหวตแล้ว
        const existingVote = topic.votes[existingVoteIndex];
        
        if (existingVote.type === type) {
          // ถ้ากดซ้ำแบบเดิม = เอาออก (Toggle Off)
          topic.votes.splice(existingVoteIndex, 1);
        } else {
          // ถ้ากดคนละแบบ = เปลี่ยนใจ (Switch)
          existingVote.type = type; 
        }
      } else {
        // ยังไม่เคยโหวต = เพิ่มใหม่
        topic.votes.push({ userId, type });
      }

      await topic.save();
      io.emit('update_topic', topic); // ส่งข้อมูลล่าสุดกลับไปหาทุกคน

    } catch (err) {
      console.error("Vote Error:", err);
    }
  });

  // 4.4 Comment
  socket.on('comment_topic', async ({ topicId, text, userId }) => {
    try {
      // Validation: trim และเช็คความยาว
      const trimmedText = text?.trim() || '';
      if (trimmedText.length < 1) {
        socket.emit('error', { message: 'Comment cannot be empty' });
        return;
      }
      if (trimmedText.length > 300) {
        socket.emit('error', { message: 'Comment must be 300 characters or less' });
        return;
      }

      if (!userId || userId.trim().length === 0) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }

      const updatedTopic = await Topic.findByIdAndUpdate(
        topicId,
        { $push: { comments: { text: trimmedText, userId, timestamp: new Date() } } },
        { new: true }
      );
      if (updatedTopic) {
        io.emit('update_topic', updatedTopic);
      } else {
        socket.emit('error', { message: 'Topic not found' });
      }
    } catch (err) {
      console.error(err);
      socket.emit('error', { message: 'Failed to add comment' });
    }
  });

  // 4.5 Delete Topic (only owner can delete)
  socket.on('delete_topic', async ({ topicId, userId }) => {
    try {
      if (!userId || userId.trim().length === 0) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }

      const topic = await Topic.findById(topicId);
      if (!topic) {
        socket.emit('error', { message: 'Topic not found' });
        return;
      }

      if (topic.userId !== userId) {
        socket.emit('error', { message: 'You can only delete your own posts' });
        return;
      }

      await Topic.findByIdAndDelete(topicId);

      // ส่ง event ให้ client เอา topic นี้ออกจาก state
      io.emit('update_topic', { ...topic.toObject(), _id: topicId, deleted: true } as any);
    } catch (err) {
      console.error('Delete Error:', err);
      socket.emit('error', { message: 'Failed to delete topic' });
    }
  });

  // 4.6 Report Topic
  socket.on('report_topic', async ({ topicId, userId }) => {
    try {
      if (!userId || userId.trim().length === 0) {
        socket.emit('error', { message: 'User ID is required' });
        return;
      }

      const topic = await Topic.findByIdAndUpdate(
        topicId,
        { $inc: { reportCount: 1 } },
        { new: true }
      );

      if (!topic) {
        socket.emit('error', { message: 'Topic not found' });
        return;
      }

      // ถ้า report เยอะมากอาจพิจารณาไม่ broadcast ในอนาคต
      io.emit('update_topic', topic);
    } catch (err) {
      console.error('Report Error:', err);
      socket.emit('error', { message: 'Failed to report topic' });
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});