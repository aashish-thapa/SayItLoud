import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { createNotification } from '@/lib/notifications/create';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const { id: userToFollowId } = await params;
      const loggedInUserId = authUser._id;

      if (userToFollowId === loggedInUserId.toString()) {
        return NextResponse.json(
          { message: 'You cannot follow yourself.' },
          { status: 400 }
        );
      }

      await dbConnect();

      const userToFollow = await User.findById(userToFollowId);
      const loggedInUser = await User.findById(loggedInUserId);

      if (!userToFollow || !loggedInUser) {
        return NextResponse.json(
          { message: 'User not found.' },
          { status: 404 }
        );
      }

      const isAlreadyFollowing = loggedInUser.following.some(
        (id) => id.toString() === userToFollowId
      );

      if (isAlreadyFollowing) {
        return NextResponse.json(
          { message: 'Already following this user.' },
          { status: 400 }
        );
      }

      loggedInUser.following.push(userToFollow._id);
      userToFollow.followers.push(loggedInUser._id);

      await loggedInUser.save();
      await userToFollow.save();

      await createNotification({
        recipient: userToFollow._id,
        type: 'follow',
        initiator: authUser._id,
        post: null,
        message: `${authUser.username} started following you.`,
      });

      return NextResponse.json({
        message: `Successfully followed ${userToFollow.username}.`,
      });
    } catch (error) {
      console.error('Follow error:', error);
      return NextResponse.json(
        { message: 'Server error during follow operation.' },
        { status: 500 }
      );
    }
  });
}
