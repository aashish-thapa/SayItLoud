import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post, { IPost } from '@/models/Post';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';

interface ScoredPost extends Record<string, unknown> {
  relevanceScore: number;
}

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

      const followedUsersIds = user.following.map((id) => id.toString());
      const ownUserId = authUser._id.toString();

      // Fetch ALL posts for scoring (needed for personalization algorithm)
      const posts = await Post.find({})
        .populate('user', 'username profilePicture')
        .populate('comments.user', 'username profilePicture');

      // Personalization Logic
      const userLikedCategories = user.userPreferences.likedCategories;
      const userLikedTopics = user.userPreferences.likedTopics;

      // Define a scoring function for posts
      const scorePost = (post: IPost): number => {
        let score = 0;

        // Give a significant base score for posts from followed users or own posts
        if (
          followedUsersIds.includes(post.user._id.toString()) ||
          post.user._id.toString() === ownUserId
        ) {
          score += 100;
        }

        // Add score based on category match from AI analysis
        if (
          post.aiAnalysis &&
          post.aiAnalysis.category &&
          userLikedCategories.has(post.aiAnalysis.category)
        ) {
          score += (userLikedCategories.get(post.aiAnalysis.category) || 0) * 10;
        }

        // Add score based on topic match from AI analysis
        if (
          post.aiAnalysis &&
          post.aiAnalysis.topics &&
          post.aiAnalysis.topics.length > 0
        ) {
          post.aiAnalysis.topics.forEach((topic) => {
            if (userLikedTopics.has(topic)) {
              score += (userLikedTopics.get(topic) || 0) * 5;
            }
          });
        }

        // Add a small score for recent posts (decaying over time)
        const now = Date.now();
        const postAgeMs = now - new Date(post.createdAt).getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;
        // Max 5 points for very recent posts, decaying to 0 over 5 days
        score += Math.max(0, 5 - postAgeMs / (oneDayMs * 5));

        // Penalize toxic posts
        if (
          post.aiAnalysis &&
          post.aiAnalysis.toxicity &&
          post.aiAnalysis.toxicity.detected
        ) {
          score -= 50;
        }

        return score;
      };

      // Score all fetched posts
      const scoredPosts: ScoredPost[] = posts.map((post) => ({
        ...post.toObject(),
        relevanceScore: scorePost(post),
      }));

      // Sort posts: pinned first, then by relevance score (highest first), then by creation date
      scoredPosts.sort((a, b) => {
        // Pinned posts always come first
        const aIsPinned = a.isPinned as boolean;
        const bIsPinned = b.isPinned as boolean;
        if (aIsPinned && !bIsPinned) return -1;
        if (!aIsPinned && bIsPinned) return 1;

        // If both pinned, sort by pinnedAt (most recently pinned first)
        if (aIsPinned && bIsPinned) {
          return (
            new Date(b.pinnedAt as string).getTime() -
            new Date(a.pinnedAt as string).getTime()
          );
        }

        // Otherwise sort by relevance score
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return (
          new Date(b.createdAt as string).getTime() -
          new Date(a.createdAt as string).getTime()
        );
      });

      // Apply pagination after sorting
      const total = scoredPosts.length;
      const skip = (page - 1) * limit;
      const paginatedPosts = scoredPosts.slice(skip, skip + limit);

      return NextResponse.json({
        posts: paginatedPosts,
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
