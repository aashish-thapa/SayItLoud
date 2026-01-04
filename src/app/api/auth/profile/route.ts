import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  return withAuth(request, async (_req, user) => {
    try {
      await dbConnect();

      const fullUser = await User.findById(user._id)
        .select('-password')
        .populate('followers', 'username profilePicture')
        .populate('following', 'username profilePicture');

      if (fullUser) {
        return NextResponse.json(fullUser);
      } else {
        return NextResponse.json({ message: 'User not found.' }, { status: 404 });
      }
    } catch (error) {
      console.error('Get profile error:', error);
      return NextResponse.json({ message: 'Server error.' }, { status: 500 });
    }
  });
}
