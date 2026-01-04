import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import User from '@/models/User';
import { withAuth } from '@/lib/auth/middleware';
import {
  uploadToCloudinary,
  deleteFromCloudinary,
  getCloudinaryPublicId,
} from '@/lib/upload/cloudinary';

const DEFAULT_PROFILE_PIC =
  'https://placehold.co/150x150/cccccc/ffffff?text=Profile';

export async function PUT(request: NextRequest) {
  return withAuth(request, async (req, authUser) => {
    try {
      const formData = await req.formData();
      const file = formData.get('profilePicture') as File | null;

      if (!file) {
        return NextResponse.json(
          { message: 'No image file provided.' },
          { status: 400 }
        );
      }

      await dbConnect();

      const user = await User.findById(authUser._id);
      if (!user) {
        return NextResponse.json(
          { message: 'User not found.' },
          { status: 404 }
        );
      }

      // Delete old profile picture from Cloudinary if it exists
      if (user.profilePicture && user.profilePicture !== DEFAULT_PROFILE_PIC) {
        const oldPublicId = getCloudinaryPublicId(user.profilePicture);
        if (oldPublicId) {
          await deleteFromCloudinary(oldPublicId);
        }
      }

      // Upload new profile picture
      const uploadResult = await uploadToCloudinary(
        file,
        'second-brain-profile-pictures'
      );

      user.profilePicture = uploadResult.secure_url;
      await user.save();

      return NextResponse.json({
        message: 'Profile picture updated successfully.',
        profilePicture: user.profilePicture,
        userId: user._id,
      });
    } catch (error) {
      console.error('Profile picture update error:', error);
      return NextResponse.json(
        { message: 'Server error updating profile picture.' },
        { status: 500 }
      );
    }
  });
}
