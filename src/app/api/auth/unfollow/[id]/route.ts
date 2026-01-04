import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const { id: userToUnfollowId } = await params;
      const loggedInUserId = authUser._id;

      if (userToUnfollowId === loggedInUserId.toString()) {
        return NextResponse.json(
          { message: 'You cannot unfollow yourself.' },
          { status: 400 }
        );
      }

      await dbConnect();

      const userToUnfollow = await User.findById(userToUnfollowId);
      const loggedInUser = await User.findById(loggedInUserId);

      if (!userToUnfollow || !loggedInUser) {
        return NextResponse.json(
          { message: 'User not found.' },
          { status: 404 }
        );
      }

      const isFollowing = loggedInUser.following.some(
        (id) => id.toString() === userToUnfollowId
      );

      if (!isFollowing) {
        return NextResponse.json(
          { message: 'Not currently following this user.' },
          { status: 400 }
        );
      }

      loggedInUser.following = loggedInUser.following.filter(
        (id) => id.toString() !== userToUnfollowId
      );
      userToUnfollow.followers = userToUnfollow.followers.filter(
        (id) => id.toString() !== loggedInUserId.toString()
      );

      await loggedInUser.save();
      await userToUnfollow.save();

      return NextResponse.json({
        message: `Successfully unfollowed ${userToUnfollow.username}.`,
      });
    } catch (error) {
      console.error('Unfollow error:', error);
      return NextResponse.json(
        { message: 'Server error during unfollow operation.' },
        { status: 500 }
      );
    }
  });
}
