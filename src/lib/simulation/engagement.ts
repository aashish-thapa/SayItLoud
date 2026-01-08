/**
 * Fake Engagement Simulation Service
 *
 * This module simulates user engagement (likes, comments) using bot users.
 * It's designed to be easily removable once real users start using the platform.
 *
 * TO REMOVE: Delete this file and remove imports from:
 * - src/app/api/simulate/route.ts
 * - Any other files importing from this module
 */

import mongoose from 'mongoose';
import User from '@/models/User';
import Post from '@/models/Post';

// Pool of generic comments that bots can use
const COMMENT_POOL = [
  "Interesting perspective!",
  "I never thought about it this way.",
  "Great point! 👏",
  "This is so true.",
  "Thanks for sharing this!",
  "Couldn't agree more.",
  "This needs more attention.",
  "Well said!",
  "Food for thought 🤔",
  "Exactly what I was thinking!",
  "This is important.",
  "Love this take!",
  "Makes you think...",
  "Spot on! 🎯",
  "Interesting read.",
  "I have a different view but respect this.",
  "This deserves more visibility.",
  "Brilliant observation!",
  "Keep these coming!",
  "Really insightful.",
  "This resonates with me.",
  "Thought-provoking!",
  "Absolutely!",
  "Fair point.",
  "I learned something new today.",
];

interface SimulationResult {
  likesAdded: number;
  commentsAdded: number;
  postsEngaged: number;
}

/**
 * Get all bot users from the database
 */
async function getBotUsers(): Promise<mongoose.Types.ObjectId[]> {
  const bots = await User.find({ isBot: true }).select('_id username');
  console.log(`[Simulation] Found ${bots.length} bot users:`, bots.map(b => b.username));
  return bots.map(bot => bot._id);
}

/**
 * Get random items from an array
 */
function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, array.length));
}

/**
 * Get a random number between min and max (inclusive)
 */
function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Simulate engagement on recent posts
 *
 * UNBIASED APPROACH:
 * - Prioritizes posts with LOW engagement to balance visibility
 * - Spreads engagement across ALL posts from past 3 days
 * - Random selection weighted towards underexposed content
 *
 * @param options Configuration options
 * @returns Summary of simulated engagement
 */
export async function simulateEngagement(options: {
  maxPostsToEngage?: number;
  maxLikesPerPost?: number;
  maxCommentsPerPost?: number;
  onlyRecentHours?: number;
} = {}): Promise<SimulationResult> {
  const {
    maxPostsToEngage = 50, // Increased from 15 to make engagement more visible
    maxLikesPerPost = 4,   // Increased from 3
    maxCommentsPerPost = 2, // Increased from 1
    onlyRecentHours = 72, // 3 days
  } = options;

  const result: SimulationResult = {
    likesAdded: 0,
    commentsAdded: 0,
    postsEngaged: 0,
  };

  // Get bot users
  const botUserIds = await getBotUsers();
  if (botUserIds.length === 0) {
    console.log('[Simulation] No bot users found');
    return result;
  }

  // Get posts from past 3 days (exclude admin posts only - bots can engage with each other)
  const cutoffDate = new Date(Date.now() - onlyRecentHours * 60 * 60 * 1000);
  const recentPosts = await Post.find({
    createdAt: { $gte: cutoffDate },
  }).populate('user', 'isBot isAdmin');

  // Filter out admin posts only - bots engage with bot posts and regular user posts
  const eligiblePosts = recentPosts.filter(post => {
    const user = post.user as unknown as { isAdmin?: boolean };
    return !user?.isAdmin;
  });

  console.log(`[Simulation] Found ${recentPosts.length} total posts, ${eligiblePosts.length} eligible for engagement`);

  if (eligiblePosts.length === 0) {
    console.log('[Simulation] No eligible posts found (all posts are from admins)');
    return result;
  }

  // UNBIASED SELECTION: Sort by engagement (lowest first) to prioritize underexposed posts
  const sortedByEngagement = [...eligiblePosts].sort((a, b) => {
    const engagementA = (a.likes?.length || 0) + (a.comments?.length || 0);
    const engagementB = (b.likes?.length || 0) + (b.comments?.length || 0);
    return engagementA - engagementB; // Lowest engagement first
  });

  // Take a mix: 70% low engagement posts, 30% random from all
  const lowEngagementCount = Math.ceil(maxPostsToEngage * 0.7);
  const randomCount = maxPostsToEngage - lowEngagementCount;

  const lowEngagementPosts = sortedByEngagement.slice(0, lowEngagementCount);
  const remainingPosts = sortedByEngagement.slice(lowEngagementCount);
  const randomPosts = getRandomItems(remainingPosts, randomCount);

  const postsToEngage = [...lowEngagementPosts, ...randomPosts];

  const engagedPostIds: string[] = [];

  for (const post of postsToEngage) {
    let postEngaged = false;
    const currentEngagement = (post.likes?.length || 0) + (post.comments?.length || 0);
    const beforeLikes = post.likes?.length || 0;
    const beforeComments = post.comments?.length || 0;

    // More engagement for posts with less existing engagement (balancing)
    const engagementMultiplier = currentEngagement < 3 ? 1.5 : currentEngagement < 10 ? 1 : 0.5;

    // Randomly decide how many likes to add
    const likesToAdd = Math.round(getRandomInt(1, maxLikesPerPost) * engagementMultiplier);
    const botsForLikes = getRandomItems(botUserIds, likesToAdd);

    for (const botId of botsForLikes) {
      // Check if bot already liked this post
      const alreadyLiked = post.likes.some(
        (likeId) => likeId.toString() === botId.toString()
      );

      if (!alreadyLiked) {
        post.likes.push(botId);
        result.likesAdded++;
        postEngaged = true;
      }
    }

    // Comments are rarer - only for very low engagement posts
    if (currentEngagement < 5 && Math.random() > 0.5) {
      const commentsToAdd = getRandomInt(0, maxCommentsPerPost);
      const botsForComments = getRandomItems(botUserIds, commentsToAdd);

      for (const botId of botsForComments) {
        const randomComment = COMMENT_POOL[getRandomInt(0, COMMENT_POOL.length - 1)];

        post.comments.push({
          user: botId,
          text: randomComment,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any);

        result.commentsAdded++;
        postEngaged = true;
      }
    }

    if (postEngaged) {
      // Use findByIdAndUpdate for reliable persistence (same fix as pin feature)
      const updatedPost = await Post.findByIdAndUpdate(
        post._id,
        {
          $set: {
            likes: post.likes,
            comments: post.comments,
          },
        },
        { new: true }
      );

      if (updatedPost) {
        engagedPostIds.push(post._id.toString());
        console.log(`[Simulation] Engaged post ${post._id}: likes ${beforeLikes} -> ${updatedPost.likes.length}, comments ${beforeComments} -> ${updatedPost.comments.length}`);
        result.postsEngaged++;
      } else {
        console.error(`[Simulation] Failed to update post ${post._id}`);
      }
    }
  }

  console.log(`[Simulation] Engaged post IDs:`, engagedPostIds);

  console.log(`[Simulation] Engagement complete:`, result);
  return result;
}

/**
 * Light engagement simulation - adds minimal engagement
 * Good for triggering on page loads without overwhelming
 * Uses same unbiased approach - prioritizes low engagement posts
 */
export async function simulateLightEngagement(): Promise<SimulationResult> {
  return simulateEngagement({
    maxPostsToEngage: 20,
    maxLikesPerPost: 3,
    maxCommentsPerPost: 1,
    onlyRecentHours: 72,
  });
}

/**
 * Bulk engagement simulation - adds significant engagement to many posts
 * Use this to seed the platform with visible engagement
 */
export async function simulateBulkEngagement(): Promise<SimulationResult> {
  const result: SimulationResult = {
    likesAdded: 0,
    commentsAdded: 0,
    postsEngaged: 0,
  };

  const botUserIds = await getBotUsers();
  if (botUserIds.length === 0) {
    console.log('[Bulk Simulation] No bot users found');
    return result;
  }

  // Get posts from past 7 days
  const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const posts = await Post.find({
    createdAt: { $gte: cutoffDate },
  }).limit(500);

  console.log(`[Bulk Simulation] Processing ${posts.length} posts with ${botUserIds.length} bots`);

  for (const post of posts) {
    const likesToAdd = getRandomInt(0, 100);
    const commentsToAdd = getRandomInt(1, 5);

    // Generate fake user IDs for likes (mix of bot IDs and random ObjectIds)
    const newLikes: mongoose.Types.ObjectId[] = [...post.likes];

    // Add bot likes first
    for (const botId of botUserIds) {
      if (!newLikes.some(l => l.toString() === botId.toString())) {
        newLikes.push(botId);
      }
    }

    // Add random fake likes to reach the target
    while (newLikes.length < likesToAdd) {
      const fakeUserId = new mongoose.Types.ObjectId();
      newLikes.push(fakeUserId);
    }

    // Generate comments from bots
    const newComments = [...post.comments];
    for (let i = 0; i < commentsToAdd; i++) {
      const randomBot = botUserIds[getRandomInt(0, botUserIds.length - 1)];
      const randomComment = COMMENT_POOL[getRandomInt(0, COMMENT_POOL.length - 1)];

      newComments.push({
        user: randomBot,
        text: randomComment,
        createdAt: new Date(Date.now() - getRandomInt(0, 24 * 60 * 60 * 1000)), // Random time in last 24h
        updatedAt: new Date(),
      } as any);
    }

    // Update the post
    await Post.findByIdAndUpdate(post._id, {
      $set: {
        likes: newLikes,
        comments: newComments,
      },
    });

    result.likesAdded += newLikes.length - post.likes.length;
    result.commentsAdded += commentsToAdd;
    result.postsEngaged++;
  }

  console.log(`[Bulk Simulation] Complete:`, result);
  return result;
}

/**
 * Check if simulation is enabled
 */
export function isSimulationEnabled(): boolean {
  return process.env.ENABLE_ENGAGEMENT_SIMULATION === 'true';
}
