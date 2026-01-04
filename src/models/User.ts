import mongoose, { Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password: string;
  profilePicture: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  isAdmin: boolean;
  isBot: boolean;
  userPreferences: {
    likedCategories: Map<string, number>;
    likedTopics: Map<string, number>;
  };
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
  getSignedJwtToken(): string;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePicture: {
      type: String,
      default: 'https://placehold.co/150x150/cccccc/ffffff?text=Profile',
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isBot: {
      type: Boolean,
      default: false,
    },
    userPreferences: {
      likedCategories: {
        type: Map,
        of: Number,
        default: {},
      },
      likedTopics: {
        type: Map,
        of: Number,
        default: {},
      },
    },
  },
  {
    timestamps: true,
  }
);

// Encrypt password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.getSignedJwtToken = function (): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || '30d';
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET!, {
    expiresIn,
  } as jwt.SignOptions);
};

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
