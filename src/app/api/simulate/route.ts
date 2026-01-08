/**
 * Engagement Simulation API
 *
 * This endpoint triggers fake engagement simulation.
 * TO REMOVE: Delete this file when real users are active.
 */

import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import {
  simulateEngagement,
  simulateLightEngagement,
  simulateBulkEngagement,
  isSimulationEnabled,
} from '@/lib/simulation/engagement';

// POST /api/simulate - Trigger engagement simulation
export async function POST(request: NextRequest) {
  try {
    // Check if simulation is enabled
    const enabled = isSimulationEnabled();
    console.log('[Simulation API] Enabled:', enabled);

    if (!enabled) {
      return NextResponse.json(
        { message: 'Simulation is disabled. Set ENABLE_ENGAGEMENT_SIMULATION=true', enabled: false },
        { status: 200 }
      );
    }

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('mode') || 'light';
    console.log('[Simulation API] Mode:', mode);

    let result;
    if (mode === 'bulk') {
      // Bulk mode: 0-100 likes, 1-5 comments on 500 posts
      result = await simulateBulkEngagement();
    } else if (mode === 'full') {
      result = await simulateEngagement();
    } else {
      result = await simulateLightEngagement();
    }

    console.log('[Simulation API] Result:', result);

    return NextResponse.json({
      message: 'Simulation completed',
      enabled: true,
      ...result,
    });
  } catch (error) {
    console.error('Simulation error:', error);
    return NextResponse.json(
      { message: 'Simulation failed', error: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/simulate - Check simulation status and show engaged posts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const showEngaged = searchParams.get('debug') === 'true';

  if (showEngaged) {
    await dbConnect();
    const User = (await import('@/models/User')).default;
    const Post = (await import('@/models/Post')).default;

    // Get bot user IDs
    const bots = await User.find({ isBot: true }).select('_id username');
    const botIds = bots.map((b) => b._id.toString());

    // Find posts with bot likes
    const postsWithBotLikes = await Post.find({
      likes: { $in: bots.map((b) => b._id) },
    })
      .populate('user', 'username')
      .select('_id content likes comments createdAt user')
      .sort({ createdAt: -1 })
      .limit(20);

    return NextResponse.json({
      enabled: isSimulationEnabled(),
      debug: true,
      botUsers: bots.map((b) => ({ id: b._id, username: b.username })),
      postsWithBotEngagement: postsWithBotLikes.map((p) => ({
        id: p._id,
        content: p.content.substring(0, 100) + '...',
        author: p.user?.username || 'Unknown',
        likesCount: p.likes.length,
        commentsCount: p.comments.length,
        hasBotLikes: p.likes.some((l: unknown) => botIds.includes(String(l))),
        createdAt: p.createdAt,
      })),
    });
  }

  return NextResponse.json({
    enabled: isSimulationEnabled(),
    message: isSimulationEnabled()
      ? 'Simulation is enabled. Add ?debug=true to see engaged posts.'
      : 'Simulation is disabled. Set ENABLE_ENGAGEMENT_SIMULATION=true in .env.local',
  });
}
