import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const { id } = await params;

      await dbConnect();

      // Check if user is admin
      const user = await User.findById(authUser._id);
      if (!user || !user.isAdmin) {
        return NextResponse.json(
          { message: 'Unauthorized. Admin access required.' },
          { status: 403 }
        );
      }

      const post = await Post.findById(id);

      if (!post) {
        return NextResponse.json(
          { message: 'Post not found.' },
          { status: 404 }
        );
      }

      // Toggle pin status
      const newPinnedStatus = !post.isPinned;

      // Use findByIdAndUpdate for reliable persistence
      const updatedPost = await Post.findByIdAndUpdate(
        id,
        newPinnedStatus ? { $set: { isPinned: true, pinnedAt: new Date() } } : { $set: { isPinned: false }, $unset: { pinnedAt: 1 } },
        { new: true }
      );

      console.log('Pin toggled:', { postId: id, isPinned: updatedPost?.isPinned, pinnedAt: updatedPost?.pinnedAt });

      const populatedPost = await Post.findById(id).populate(
        'user',
        'username email profilePicture'
      );

      return NextResponse.json({
        message: newPinnedStatus ? 'Post pinned.' : 'Post unpinned.',
        post: populatedPost,
      });
    } catch (error) {
      console.error('Pin post error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}
