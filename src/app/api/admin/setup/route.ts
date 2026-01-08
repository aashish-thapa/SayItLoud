import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';

// This endpoint sets a specific user as admin
// Should only be used once for initial setup, then deleted
export async function POST() {
  try {
    await dbConnect();

    const adminEmail = 'aashish@admin.com';

    const result = await User.findOneAndUpdate(
      { email: adminEmail },
      { $set: { isAdmin: true } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { message: `No user found with email: ${adminEmail}` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: `Successfully set ${adminEmail} as admin`,
      user: {
        _id: result._id,
        username: result.username,
        email: result.email,
        isAdmin: result.isAdmin,
      },
    });
  } catch (error) {
    console.error('Set admin error:', error);
    return NextResponse.json({ message: 'Server error.' }, { status: 500 });
  }
}
