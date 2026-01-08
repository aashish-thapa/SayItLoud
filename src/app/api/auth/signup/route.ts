import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Please enter all fields.' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists
    const existingEmailUser = await User.findOne({ email });
    if (existingEmailUser) {
      return NextResponse.json(
        { message: 'User with this email already exists.' },
        { status: 400 }
      );
    }

    const existingUsernameUser = await User.findOne({ username });
    if (existingUsernameUser) {
      return NextResponse.json(
        { message: 'Username already taken.' },
        { status: 400 }
      );
    }

    const user = new User({ username, email, password });
    await user.save();

    return NextResponse.json(
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        isAdmin: user.isAdmin,
        token: user.getSignedJwtToken(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { message: 'Server error during signup.' },
      { status: 500 }
    );
  }
}
