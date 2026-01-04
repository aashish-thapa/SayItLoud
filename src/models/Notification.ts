import mongoose, { Document, Model } from 'mongoose';

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  type: 'like' | 'comment' | 'follow';
  initiator: mongoose.Types.ObjectId;
  post?: mongoose.Types.ObjectId;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['like', 'comment', 'follow'],
      required: true,
    },
    initiator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);

export default Notification;
