import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { withAuth } from '@/lib/auth/middleware';
import { performAIAnalysisOnPost } from '@/lib/ai/analysis';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { postId } = await params;

      await dbConnect();

      const updatedPost = await performAIAnalysisOnPost(postId);

      if (updatedPost) {
        return NextResponse.json({
          postId: updatedPost._id,
          content: updatedPost.content,
          aiAnalysis: updatedPost.aiAnalysis,
          message: 'Post analyzed successfully and analysis saved.',
        });
      } else {
        return NextResponse.json(
          { message: 'Failed to perform AI analysis or post not found.' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error in analyzePost:', error);
      return NextResponse.json(
        { message: 'Server error during AI analysis request.' },
        { status: 500 }
      );
    }
  });
}
