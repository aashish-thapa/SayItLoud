/**
 * Smart Feed Scoring Algorithm
 *
 * This module provides an unbiased, efficient algorithm for ranking posts.
 * It balances popular content with new/undiscovered posts.
 */

import { IPost } from '@/models/Post';
import { IUser } from '@/models/User';

// Scoring weights - easily adjustable
const WEIGHTS = {
  // Engagement signals
  LIKE: 2,
  COMMENT: 5,
  ENGAGEMENT_RATE: 15, // Bonus for high engagement rate (virality)

  // Social signals
  FOLLOWED_USER: 50,
  OWN_POST: 30,

  // Content quality (from AI)
  CATEGORY_MATCH: 8,
  TOPIC_MATCH: 4,
  FACT_SUPPORTED: 10,
  FACT_OPPOSED: -15, // Penalize misinformation
  TOXIC_PENALTY: -100,

  // Time factors
  RECENCY_MAX: 20, // Max points for fresh posts
  RECENCY_DECAY_HOURS: 72, // Hours until recency bonus is 0

  // Discovery/Diversity
  LOW_ENGAGEMENT_BOOST: 25, // Boost for posts with < 5 engagements
  NEW_POST_BOOST: 15, // Extra boost for posts < 2 hours old
  RANDOM_DIVERSITY: 10, // Random factor for diversity
};

export interface ScoringContext {
  userId: string;
  followedUserIds: string[];
  likedCategories: Map<string, number>;
  likedTopics: Map<string, number>;
}

export interface ScoredPost {
  post: IPost;
  score: number;
  breakdown: ScoreBreakdown;
}

interface ScoreBreakdown {
  engagement: number;
  social: number;
  quality: number;
  recency: number;
  discovery: number;
  personalization: number;
  total: number;
}

/**
 * Calculate engagement score based on likes and comments
 */
function calculateEngagementScore(post: IPost): number {
  const likes = post.likes?.length || 0;
  const comments = post.comments?.length || 0;

  let score = likes * WEIGHTS.LIKE + comments * WEIGHTS.COMMENT;

  // Calculate engagement rate (engagement per hour since creation)
  const ageHours = Math.max(1, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60));
  const totalEngagement = likes + comments;
  const engagementRate = totalEngagement / ageHours;

  // Virality bonus: High engagement rate indicates trending content
  if (engagementRate > 2) {
    score += WEIGHTS.ENGAGEMENT_RATE * Math.min(engagementRate, 10);
  }

  return score;
}

/**
 * Calculate social graph score
 */
function calculateSocialScore(post: IPost, context: ScoringContext): number {
  let score = 0;
  const postUserId = post.user._id?.toString() || post.user.toString();

  // Posts from followed users
  if (context.followedUserIds.includes(postUserId)) {
    score += WEIGHTS.FOLLOWED_USER;
  }

  // Own posts (slight boost to see your own content)
  if (postUserId === context.userId) {
    score += WEIGHTS.OWN_POST;
  }

  return score;
}

/**
 * Calculate content quality score from AI analysis
 */
function calculateQualityScore(post: IPost): number {
  let score = 0;

  if (!post.aiAnalysis) return score;

  // Fact-check signals
  if (post.aiAnalysis.factCheck === 'support') {
    score += WEIGHTS.FACT_SUPPORTED;
  } else if (post.aiAnalysis.factCheck === 'oppose') {
    score += WEIGHTS.FACT_OPPOSED;
  }

  // Toxicity penalty
  if (post.aiAnalysis.toxicity?.detected) {
    score += WEIGHTS.TOXIC_PENALTY;
  }

  // Positive sentiment slight boost
  if (post.aiAnalysis.sentiment === 'Positive') {
    score += 3;
  }

  return score;
}

/**
 * Calculate recency score with time decay
 */
function calculateRecencyScore(post: IPost): number {
  const ageMs = Date.now() - new Date(post.createdAt).getTime();
  const ageHours = ageMs / (1000 * 60 * 60);

  // Linear decay over RECENCY_DECAY_HOURS
  const recencyScore = Math.max(0, WEIGHTS.RECENCY_MAX * (1 - ageHours / WEIGHTS.RECENCY_DECAY_HOURS));

  // Extra boost for very new posts (< 2 hours)
  if (ageHours < 2) {
    return recencyScore + WEIGHTS.NEW_POST_BOOST;
  }

  return recencyScore;
}

/**
 * Calculate discovery score to surface underexposed content
 */
function calculateDiscoveryScore(post: IPost): number {
  let score = 0;
  const totalEngagement = (post.likes?.length || 0) + (post.comments?.length || 0);

  // Boost posts with low engagement to give them visibility
  if (totalEngagement < 5) {
    score += WEIGHTS.LOW_ENGAGEMENT_BOOST;
  }

  // Add small random factor for diversity
  score += Math.random() * WEIGHTS.RANDOM_DIVERSITY;

  return score;
}

/**
 * Calculate personalization score based on user preferences
 */
function calculatePersonalizationScore(post: IPost, context: ScoringContext): number {
  let score = 0;

  if (!post.aiAnalysis) return score;

  // Category match
  if (post.aiAnalysis.category && context.likedCategories.has(post.aiAnalysis.category)) {
    const categoryWeight = context.likedCategories.get(post.aiAnalysis.category) || 0;
    score += Math.min(categoryWeight * WEIGHTS.CATEGORY_MATCH, 50); // Cap at 50
  }

  // Topic matches
  if (post.aiAnalysis.topics && post.aiAnalysis.topics.length > 0) {
    post.aiAnalysis.topics.forEach((topic) => {
      if (context.likedTopics.has(topic)) {
        const topicWeight = context.likedTopics.get(topic) || 0;
        score += Math.min(topicWeight * WEIGHTS.TOPIC_MATCH, 20); // Cap at 20 per topic
      }
    });
  }

  return score;
}

/**
 * Score a single post with full breakdown
 */
export function scorePost(post: IPost, context: ScoringContext): ScoredPost {
  const engagement = calculateEngagementScore(post);
  const social = calculateSocialScore(post, context);
  const quality = calculateQualityScore(post);
  const recency = calculateRecencyScore(post);
  const discovery = calculateDiscoveryScore(post);
  const personalization = calculatePersonalizationScore(post, context);

  const total = engagement + social + quality + recency + discovery + personalization;

  return {
    post,
    score: total,
    breakdown: {
      engagement,
      social,
      quality,
      recency,
      discovery,
      personalization,
      total,
    },
  };
}

/**
 * Score and rank multiple posts
 */
export function rankPosts(posts: IPost[], context: ScoringContext): ScoredPost[] {
  const scoredPosts = posts.map((post) => scorePost(post, context));

  // Sort by score (highest first)
  scoredPosts.sort((a, b) => b.score - a.score);

  return scoredPosts;
}

/**
 * Get scoring context from user document
 */
export function createScoringContext(user: IUser): ScoringContext {
  return {
    userId: user._id.toString(),
    followedUserIds: user.following.map((id) => id.toString()),
    likedCategories: user.userPreferences?.likedCategories || new Map(),
    likedTopics: user.userPreferences?.likedTopics || new Map(),
  };
}
