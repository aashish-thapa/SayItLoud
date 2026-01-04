import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      const { searchParams } = new URL(req.url);
      const topic = searchParams.get('topic');

      if (!topic) {
        return NextResponse.json(
          { message: 'Topic query parameter is required.' },
          { status: 400 }
        );
      }

      await dbConnect();

      // Find posts where the aiAnalysis.topics array contains the specified topic
      const posts = await Post.find({
        'aiAnalysis.topics': { $regex: topic, $options: 'i' },
      })
        .populate('user', 'username profilePicture')
        .populate('comments.user', 'username profilePicture')
        .sort({ createdAt: -1 });

      return NextResponse.json(posts);
    } catch (error) {
      console.error('Get posts by topic error:', error);
      return NextResponse.json(
        { message: 'Server error fetching posts by topic.' },
        { status: 500 }
      );
    }
  });
}
