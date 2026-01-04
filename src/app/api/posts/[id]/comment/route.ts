import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post, { ICommentInput } from '@/models/Post';
import { withAuth } from '@/lib/auth/middleware';
import { createNotification } from '@/lib/notifications/create';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (req, authUser) => {
    try {
      const { id } = await params;
      const { text } = await req.json();

      if (!text) {
        return NextResponse.json(
          { message: 'Comment text is required.' },
          { status: 400 }
        );
      }

      await dbConnect();

      const post = await Post.findById(id);

      if (!post) {
        return NextResponse.json(
          { message: 'Post not found.' },
          { status: 404 }
        );
      }

      // Mongoose will auto-generate _id, createdAt, updatedAt on save
      const newComment: ICommentInput = { user: authUser._id, text };
      post.comments.push(newComment as never);
      const newCommentObjectId = post.comments[post.comments.length - 1]._id;

      await post.save();

      const updatedPost = await Post.findById(id).populate({
        path: 'comments.user',
        select: 'username profilePicture',
      });

      const newCommentWithUser = updatedPost?.comments.find(
        (c) => c._id.toString() === newCommentObjectId.toString()
      );

      // Create notification for the post owner
      await createNotification({
        recipient: post.user,
        type: 'comment',
        initiator: authUser._id,
        post: post._id,
        message: `${authUser.username} commented on your post: "${text.substring(0, 30)}..."`,
      });

      if (newCommentWithUser) {
        return NextResponse.json(newCommentWithUser, { status: 201 });
      } else {
        console.warn(
          'Could not find newly added comment after population.'
        );
        return NextResponse.json(
          {
            message:
              'Comment added successfully, but could not retrieve populated comment.',
            post: updatedPost,
          },
          { status: 201 }
        );
      }
    } catch (error) {
      console.error('Add comment error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}
