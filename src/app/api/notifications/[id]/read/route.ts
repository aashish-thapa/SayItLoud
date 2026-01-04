import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Notification from '@/models/Notification';
import { withAuth } from '@/lib/auth/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const { id } = await params;

      await dbConnect();

      const notification = await Notification.findById(id);

      if (!notification) {
        return NextResponse.json(
          { message: 'Notification not found.' },
          { status: 404 }
        );
      }

      if (notification.recipient.toString() !== authUser._id.toString()) {
        return NextResponse.json(
          { message: 'Not authorized to mark this notification as read.' },
          { status: 401 }
        );
      }

      notification.read = true;
      await notification.save();

      return NextResponse.json({
        message: 'Notification marked as read.',
        notification,
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      return NextResponse.json(
        { message: 'Server error marking notification as read.' },
        { status: 500 }
      );
    }
  });
}
