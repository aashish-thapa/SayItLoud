import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import User from '@/models/User'

export async function POST(request: NextRequest) {
  try {
    // Protect with CRON_SECRET (use same secret for admin operations)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()

    // Check if bot already exists
    const existingBot = await User.findOne({ username: 'webzdotio' })
    if (existingBot) {
      return NextResponse.json({
        message: 'Bot user already exists',
        userId: existingBot._id,
      })
    }

    // Create the bot user
    const botUser = new User({
      username: 'webzdotio',
      email: 'webzdotio@intlnews.com',
      password: 'webzdotio',
      isBot: true,
      profilePicture: 'https://placehold.co/150x150/1a73e8/ffffff?text=WZ',
    })

    await botUser.save()

    return NextResponse.json({
      message: 'Webz.io bot user created successfully',
      userId: botUser._id,
    })
  } catch (error) {
    console.error('Failed to create bot user:', error)
    return NextResponse.json(
      { message: 'Failed to create bot user' },
      { status: 500 }
    )
  }
}
