import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      await dbConnect();

      // Define a time window for "trending" (last 7 days)
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const { searchParams } = new URL(req.url);
      const limit = parseInt(searchParams.get('limit') || '10');

      const trendingTopics = await Post.aggregate([
        // Stage 1: Filter posts by creation date
        {
          $match: {
            'aiAnalysis.topics': { $exists: true, $ne: [] },
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        // Stage 2: Deconstruct the topics array
        {
          $unwind: '$aiAnalysis.topics',
        },
        // Stage 3: Group by topic and count occurrences
        {
          $group: {
            _id: '$aiAnalysis.topics',
            count: { $sum: 1 },
          },
        },
        // Stage 4: Sort by count in descending order
        {
          $sort: { count: -1 },
        },
        // Stage 5: Limit to the top N topics
        {
          $limit: limit,
        },
        // Stage 6: Reshape the output documents
        {
          $project: {
            _id: 0,
            topic: '$_id',
            count: 1,
          },
        },
      ]);

      return NextResponse.json(trendingTopics);
    } catch (error) {
      console.error('Get trending topics error:', error);
      return NextResponse.json(
        { message: 'Server error fetching trending topics.' },
        { status: 500 }
      );
    }
  });
}
