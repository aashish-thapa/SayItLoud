import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const { searchParams } = new URL(req.url);
      const username = searchParams.get('username');

      if (!username) {
        return NextResponse.json(
          { message: 'Search query (username) is required.' },
          { status: 400 }
        );
      }

      await dbConnect();

      const users = await User.find({
        username: { $regex: username, $options: 'i' },
        _id: { $ne: authUser._id },
      }).select('-password');

      return NextResponse.json(users);
    } catch (error) {
      console.error('Search users error:', error);
      return NextResponse.json(
        { message: 'Server error during user search.' },
        { status: 500 }
      );
    }
  });
}
