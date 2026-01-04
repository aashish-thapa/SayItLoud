import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(request, async () => {
    try {
      const { id } = await params;

      await dbConnect();

      const user = await User.findById(id)
        .select('-password')
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture');

      if (!user) {
        return NextResponse.json(
          { message: 'User not found.' },
          { status: 404 }
        );
      }

      return NextResponse.json(user);
    } catch (error) {
      console.error('Get user by ID error:', error);
      return NextResponse.json(
        { message: 'Server error retrieving user profile.' },
        { status: 500 }
      );
    }
  });
}
