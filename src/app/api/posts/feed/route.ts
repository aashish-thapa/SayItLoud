import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { rankPosts, createScoringContext } from '@/lib/algorithm/scoring';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      const user = await User.findById(authUser._id);
      if (!user) {
        return NextResponse.json(
          { message: 'User not found.' },
          { status: 404 }
        );
      }

      // Fetch posts (limit to recent posts for performance)
      const posts = await Post.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }, // Last 7 days
      })
        .populate('user', 'username profilePicture isBot')
        .populate('comments.user', 'username profilePicture');

      // Create scoring context from user preferences
      const context = createScoringContext(user);

      // Score and rank posts using the algorithm
      const rankedPosts = rankPosts(posts, context);

      // Separate pinned and regular posts
      const pinnedPosts = rankedPosts.filter((sp) => sp.post.isPinned);
      const regularPosts = rankedPosts.filter((sp) => !sp.post.isPinned);

      // Sort pinned by pinnedAt, combine with regular posts
      pinnedPosts.sort((a, b) => {
        const aTime = a.post.pinnedAt ? new Date(a.post.pinnedAt).getTime() : 0;
        const bTime = b.post.pinnedAt ? new Date(b.post.pinnedAt).getTime() : 0;
        return bTime - aTime;
      });

      const allSorted = [...pinnedPosts, ...regularPosts];

      // Apply pagination
      const total = allSorted.length;
      const skip = (page - 1) * limit;
      const paginatedPosts = allSorted.slice(skip, skip + limit);

      // Convert to response format with relevanceScore
      const responsePosts = paginatedPosts.map((sp) => ({
        ...sp.post.toObject(),
        relevanceScore: sp.score,
      }));

      return NextResponse.json({
        posts: responsePosts,
        total,
        page,
        limit,
        hasMore: skip + paginatedPosts.length < total,
      });
    } catch (error) {
      console.error('Get feed error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}
