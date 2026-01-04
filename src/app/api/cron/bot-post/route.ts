import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { fetchNewsAndPost } from '@/lib/bot/newsBot';

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    await fetchNewsAndPost();

    return NextResponse.json({ message: 'Bot posting completed successfully.' });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ message: 'Cron job failed.' }, { status: 500 });
  }
}
