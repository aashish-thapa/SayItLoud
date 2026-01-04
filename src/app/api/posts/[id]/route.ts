import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import { withAuth } from '@/lib/auth/middleware';
import {
  deleteFromCloudinary,
  getCloudinaryPublicId,
} from '@/lib/upload/cloudinary';

// GET /api/posts/[id] - Get a single post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id } = await params;

      await dbConnect();

      const post = await Post.findById(id)
        .populate('user', 'username profilePicture')
        .populate('comments.user', 'username profilePicture');

      if (post) {
        return NextResponse.json(post);
      } else {
        return NextResponse.json(
          { message: 'Post not found.' },
          { status: 404 }
        );
      }
    } catch (error) {
      console.error('Get post error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}

// DELETE /api/posts/[id] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const { id } = await params;

      await dbConnect();

      const post = await Post.findById(id);

      if (!post) {
        return NextResponse.json(
          { message: 'Post not found.' },
          { status: 404 }
        );
      }

      // Check if the logged-in user is the owner of the post
      if (post.user.toString() !== authUser._id.toString()) {
        return NextResponse.json(
          { message: 'Not authorized to delete this post.' },
          { status: 401 }
        );
      }

      // Delete image from Cloudinary if it exists
      if (post.image) {
        const publicId = getCloudinaryPublicId(post.image);
        if (publicId) {
          try {
            await deleteFromCloudinary(publicId);
            console.log(`Cloudinary image deleted: ${publicId}`);
          } catch (cloudinaryError) {
            console.error(
              `Failed to delete image ${publicId} from Cloudinary:`,
              cloudinaryError
            );
          }
        }
      }

      await Post.deleteOne({ _id: id });
      return NextResponse.json({ message: 'Post removed.' });
    } catch (error) {
      console.error('Delete post error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}
