import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import { withAuth } from '@/lib/auth/middleware';
import { uploadToCloudinary } from '@/lib/upload/cloudinary';

// GET /api/posts - Get all posts with pagination
export async function GET(request: NextRequest) {
  return withAuth(request, async () => {
    try {
      await dbConnect();

      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        Post.find({})
          .populate('user', 'username profilePicture')
          .populate('comments.user', 'username profilePicture')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit),
        Post.countDocuments({}),
      ]);

      return NextResponse.json({
        posts,
        total,
        page,
        limit,
        hasMore: skip + posts.length < total,
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
