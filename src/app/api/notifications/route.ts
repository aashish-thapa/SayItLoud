import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Notification from '@/models/Notification';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);
      const skip = (page - 1) * limit;

      const [notifications, total] = await Promise.all([
        Notification.find({ recipient: authUser._id })
          .populate('initiator', 'username profilePicture')
          .populate('post', 'content')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Notification.countDocuments({ recipient: authUser._id }),
      ]);

      return NextResponse.json({
        notifications,
        total,
        page,
        limit,
        hasMore: skip + notifications.length < total,
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      return NextResponse.json(
        { message: 'Server error fetching notifications.' },
        { status: 500 }
      );
    }
  });
}
