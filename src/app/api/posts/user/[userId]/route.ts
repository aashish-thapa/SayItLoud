import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import { withAuth } from '@/lib/auth/middleware';

// GET /api/posts/user/[userId] - Get posts by a specific user with pagination
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  return withAuth(request, async () => {
    try {
      await dbConnect();

      const { userId } = await params;
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        Post.find({ user: userId })
          .populate('user', 'username profilePicture')
          .populate('comments.user', 'username profilePicture')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Post.countDocuments({ user: userId }),
      ]);

      return NextResponse.json({
        posts,
        total,
        page,
        limit,
        hasMore: skip + posts.length < total,
      });
    } catch (error) {
      console.error('Get user posts error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}
