/**
 * Feed Algorithm Module
 *
 * Exports the scoring algorithm for ranking posts in the feed.
 */

export {
  scorePost,
  rankPosts,
  createScoringContext,
  type ScoringContext,
  type ScoredPost,
} from './scoring';
