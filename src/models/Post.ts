import mongoose, { Document, Model } from 'mongoose';

export interface IComment {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

// Input type for creating a new comment (Mongoose auto-generates _id, createdAt, updatedAt)
export interface ICommentInput {
  user: mongoose.Types.ObjectId;
  text: string;
}

export interface IAIAnalysis {
  sentiment: 'Positive' | 'Negative' | 'Neutral' | 'Mixed' | 'Unknown' | 'Error';
  emotions: { emotion: string; score: number }[];
  toxicity: { detected: boolean; details: Record<string, number> };
  topics: string[];
  summary: string;
  category: string;
  factCheck: 'support' | 'neutral' | 'oppose' | 'Unknown';
  factCheckReason?: string;
}

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  image?: string;
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  aiAnalysis: IAIAnalysis;
  isPinned: boolean;
  pinnedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const aiAnalysisSchema = new mongoose.Schema(
  {
    sentiment: {
      type: String,
      enum: ['Positive', 'Negative', 'Neutral', 'Mixed', 'Unknown', 'Error'],
      default: 'Unknown',
    },
    emotions: [
      {
        emotion: { type: String },
        score: { type: Number },
      },
    ],
    toxicity: {
      detected: { type: Boolean, default: false },
      details: { type: mongoose.Schema.Types.Mixed },
    },
    topics: [{ type: String }],
    summary: { type: String },
    category: { type: String },
    factCheck: {
      type: String,
      enum: ['support', 'neutral', 'oppose', 'Unknown'],
      default: 'Unknown',
    },
    factCheckReason: {
      type: String,
      default: '',
    },
  },
  {
    _id: false,
  }
);

const postSchema = new mongoose.Schema<IPost>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
    aiAnalysis: aiAnalysisSchema,
    isPinned: {
      type: Boolean,
      default: false,
    },
    pinnedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const Post: Model<IPost> =
  mongoose.models.Post || mongoose.model<IPost>('Post', postSchema);

export default Post;
