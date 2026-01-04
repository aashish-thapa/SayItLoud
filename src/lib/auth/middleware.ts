import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import User, { IUser } from '@/models/User';

interface JwtPayload {
  id: string;
}

export async function withAuth(
  request: NextRequest,
  handler: (req: NextRequest, user: IUser) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { message: 'Not authorized, no token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

      await dbConnect();
      const user = await User.findById(decoded.id).select('-password');

      if (!user) {
        return NextResponse.json(
          { message: 'Not authorized, user not found' },
          { status: 401 }
        );
      }

      return handler(request, user);
    } catch {
      return NextResponse.json(
        { message: 'Not authorized, token failed' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return NextResponse.json(
      { message: 'Server error during authentication' },
      { status: 500 }
    );
  }
}
