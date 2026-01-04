import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Post from '@/models/Post';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';
import { createNotification } from '@/lib/notifications/create';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async (_req, authUser) => {
    try {
      const { id } = await params;

      await dbConnect();

      const post = await Post.findById(id);
      const user = await User.findById(authUser._id);

      if (!post) {
        return NextResponse.json(
          { message: 'Post not found.' },
          { status: 404 }
        );
      }
      if (!user) {
        return NextResponse.json(
          { message: 'User not found.' },
          { status: 404 }
        );
      }

      const userId = authUser._id.toString();
      const isLiked = post.likes.some((like) => like.toString() === userId);

      if (isLiked) {
        // User is unliking the post
        post.likes = post.likes.filter((like) => like.toString() !== userId);

        // Decrement user preferences
        if (post.aiAnalysis) {
          if (
            post.aiAnalysis.category &&
            user.userPreferences.likedCategories.has(post.aiAnalysis.category)
          ) {
            const currentCount =
              user.userPreferences.likedCategories.get(
                post.aiAnalysis.category
              ) || 0;
            if (currentCount > 1) {
              user.userPreferences.likedCategories.set(
                post.aiAnalysis.category,
                currentCount - 1
              );
            } else {
              user.userPreferences.likedCategories.delete(
                post.aiAnalysis.category
              );
            }
          }

          if (post.aiAnalysis.topics && post.aiAnalysis.topics.length > 0) {
            post.aiAnalysis.topics.forEach((topic) => {
              if (user.userPreferences.likedTopics.has(topic)) {
                const currentCount =
                  user.userPreferences.likedTopics.get(topic) || 0;
                if (currentCount > 1) {
                  user.userPreferences.likedTopics.set(topic, currentCount - 1);
                } else {
                  user.userPreferences.likedTopics.delete(topic);
                }
              }
            });
          }
        }

        await user.save();
        await post.save();

        return NextResponse.json({ message: 'Post unliked.', post });
      } else {
        // User is liking the post
        post.likes.push(authUser._id);

        // Increment user preferences
        if (post.aiAnalysis) {
          if (post.aiAnalysis.category) {
            const category = post.aiAnalysis.category;
            const currentCount =
              user.userPreferences.likedCategories.get(category) || 0;
            user.userPreferences.likedCategories.set(category, currentCount + 1);
          }

          if (post.aiAnalysis.topics && post.aiAnalysis.topics.length > 0) {
            post.aiAnalysis.topics.forEach((topic) => {
              const currentCount =
                user.userPreferences.likedTopics.get(topic) || 0;
              user.userPreferences.likedTopics.set(topic, currentCount + 1);
            });
          }
        }

        await user.save();
        await post.save();

        // Create notification for the post owner
        await createNotification({
          recipient: post.user,
          type: 'like',
          initiator: authUser._id,
          post: post._id,
          message: `${authUser.username} liked your post: "${post.content.substring(0, 30)}..."`,
        });

        return NextResponse.json({ message: 'Post liked.', post });
      }
    } catch (error) {
      console.error('Like post error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}
