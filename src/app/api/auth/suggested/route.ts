import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      await dbConnect();

      const loggedInUser = await User.findById(authUser._id);
      if (!loggedInUser) {
        return NextResponse.json(
          { message: 'User not found.' },
          { status: 404 }
        );
      }

      const followingIds = loggedInUser.following.map((id) => id.toString());
      const ownUserId = loggedInUser._id.toString();

      const suggestedUsers = await User.find({
        _id: { $ne: ownUserId, $nin: followingIds },
      }).select('-password -email -followers');

      return NextResponse.json(suggestedUsers);
    } catch (error) {
      console.error('Get suggested users error:', error);
      return NextResponse.json(
        { message: 'Server error fetching suggested users.' },
        { status: 500 }
      );
    }
  });
}
