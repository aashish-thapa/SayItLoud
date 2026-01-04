import Notification from '@/models/Notification';
import mongoose from 'mongoose';

interface CreateNotificationParams {
  recipient: mongoose.Types.ObjectId | string;
  type: 'like' | 'comment' | 'follow';
  initiator: mongoose.Types.ObjectId | string;
  post?: mongoose.Types.ObjectId | string | null;
  message: string;
}

export async function createNotification({
  recipient,
  type,
  initiator,
  post,
  message,
}: CreateNotificationParams): Promise<void> {
  try {
    // Don't create notification if user is notifying themselves
    if (recipient.toString() === initiator.toString()) return;

    const notification = new Notification({
      recipient,
      type,
      initiator,
      post: post || undefined,
      message,
    });
    await notification.save();
    console.log(`Notification created for ${recipient}: ${message}`);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}
