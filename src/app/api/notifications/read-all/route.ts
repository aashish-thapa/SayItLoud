import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Notification from '@/models/Notification';
import { withAuth } from '@/lib/auth/middleware';

export async function PUT(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      await dbConnect();

      await Notification.updateMany(
        { recipient: authUser._id, read: false },
        { $set: { read: true } }
      );

      return NextResponse.json({ message: 'All notifications marked as read.' });
    } catch (error) {
      console.error('Mark all notifications read error:', error);
      return NextResponse.json(
        { message: 'Server error marking all notifications as read.' },
        { status: 500 }
      );
    }
  });
}
