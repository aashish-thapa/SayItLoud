import { NextRequest, NextResponse } from 'next/server'
import dbConnect from '@/lib/db/mongodb'
import { fetchWebzNewsAndPost } from '@/lib/bot/webzBot'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    await dbConnect()
    const result = await fetchWebzNewsAndPost()

    return NextResponse.json({
      message: 'Webz.io bot completed',
      ...result,
    })
  } catch (error) {
    console.error('Webz.io cron job error:', error)
    return NextResponse.json({ message: 'Cron job failed' }, { status: 500 })
  }
}
