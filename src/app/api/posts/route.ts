import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToCloudinary } from '@/lib/upload/cloudinary';
import { rankPosts, ScoringContext } from '@/lib/algorithm/scoring';

// GET /api/posts - Get all posts with pagination (Explore - discovery focused)
export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, authUser) => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      // Fetch recent posts
      const posts = await Post.find({
        createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) }, // Last 14 days for explore
      })
        .populate('user', 'username profilePicture isBot')
        .populate('comments.user', 'username profilePicture');

      // Filter out current user's posts (unless pinned) for explore
      const currentUserId = authUser._id.toString();
      const filteredPosts = posts.filter((post) => {
        const postUserId = post.user._id?.toString() || post.user.toString();
        // Keep if: pinned OR not the current user's post
        return post.isPinned || postUserId !== currentUserId;
      });

      // Create a neutral context for explore (no personalization)
      const exploreContext: ScoringContext = {
        userId: currentUserId,
        followedUserIds: [],
        likedCategories: new Map(),
        likedTopics: new Map(),
      };

      // Score and rank posts
      const rankedPosts = rankPosts(filteredPosts, exploreContext);

      // Separate pinned and regular posts
      const pinnedPosts = rankedPosts.filter((sp) => sp.post.isPinned);
      const regularPosts = rankedPosts.filter((sp) => !sp.post.isPinned);

      // Sort pinned by pinnedAt
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

      // Convert to response format
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
      console.error('Get posts error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  return withAuth(request, async (req, user) => {
    try {
      const contentType = req.headers.get('content-type') || '';

      let content: string;
      let imageUrl: string | null = null;

      if (contentType.includes('multipart/form-data')) {
        const formData = await req.formData();
        content = formData.get('content') as string;
        const file = formData.get('image') as File | null;

        if (file && file.size > 0) {
          const uploadResult = await uploadToCloudinary(
            file,
            'second-brain-posts'
          );
          imageUrl = uploadResult.secure_url;
        }
      } else {
        const body = await req.json();
        content = body.content;
      }

      if (!content) {
        return NextResponse.json(
          { message: 'Post content is required.' },
          { status: 400 }
        );
      }

      await dbConnect();

      const post = new Post({
        user: user._id,
        content,
        image: imageUrl,
        aiAnalysis: {
          sentiment: 'Unknown',
          emotions: [],
          toxicity: { detected: false, details: {} },
          topics: [],
          summary: '',
          category: 'Uncategorized',
          factCheck: 'Unknown',
        },
      });

      const createdPost = await post.save();

      // Populate user data before returning
      const populatedPost = await Post.findById(createdPost._id)
        .populate('user', 'username profilePicture')
        .populate('comments.user', 'username profilePicture');

      return NextResponse.json(populatedPost, { status: 201 });
    } catch (error) {
      console.error('Create post error:', error);
      return NextResponse.json(
        { message: 'Server error during post creation.' },
        { status: 500 }
      );
    }
  });
}
