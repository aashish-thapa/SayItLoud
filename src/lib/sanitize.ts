/**
 * Text sanitization utilities for cleaning post content before AI analysis.
 * Removes unnecessary elements that would waste model processing time.
 */

/**
 * Remove HTML tags from text.
 */
function stripHtmlTags(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Remove URLs from text, replacing them with a placeholder.
 */
function removeUrls(text: string): string {
  // Match http/https URLs
  const urlPattern = /https?:\/\/[^\s]+/gi;
  return text.replace(urlPattern, '[link]');
}

/**
 * Remove email addresses from text.
 */
function removeEmails(text: string): string {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.replace(emailPattern, '[email]');
}

/**
 * Normalize whitespace - collapse multiple spaces/newlines into single space.
 */
function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n') // Normalize line endings
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
    .replace(/[ \t]+/g, ' ') // Collapse horizontal whitespace
    .replace(/\n /g, '\n') // Remove leading spaces after newlines
    .replace(/ \n/g, '\n'); // Remove trailing spaces before newlines
}

/**
 * Remove common markdown formatting that doesn't add semantic value.
 */
function removeMarkdownFormatting(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Bold **text**
    .replace(/\*([^*]+)\*/g, '$1') // Italic *text*
    .replace(/__([^_]+)__/g, '$1') // Bold __text__
    .replace(/_([^_]+)_/g, '$1') // Italic _text_
    .replace(/~~([^~]+)~~/g, '$1') // Strikethrough ~~text~~
    .replace(/`([^`]+)`/g, '$1') // Inline code `text`
    .replace(/^#+\s*/gm, '') // Headers # ## ###
    .replace(/^>\s*/gm, '') // Blockquotes
    .replace(/^[-*+]\s+/gm, ''); // List markers
}

/**
 * Remove mentions (@username) - keep as placeholder for context.
 */
function normalizeMentions(text: string): string {
  return text.replace(/@[a-zA-Z0-9_]+/g, '@user');
}

/**
 * Remove hashtags formatting but keep the word.
 */
function normalizeHashtags(text: string): string {
  return text.replace(/#([a-zA-Z0-9_]+)/g, '$1');
}

/**
 * Remove zero-width characters and other invisible unicode.
 */
function removeInvisibleChars(text: string): string {
  return text.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '');
}

/**
 * Remove excessive punctuation repetition.
 */
function normalizePunctuation(text: string): string {
  return text
    .replace(/!{2,}/g, '!') // Multiple exclamation marks
    .replace(/\?{2,}/g, '?') // Multiple question marks
    .replace(/\.{4,}/g, '...') // Excessive dots
    .replace(/,{2,}/g, ','); // Multiple commas
}

export interface SanitizeOptions {
  /** Remove URLs (default: true) */
  removeUrls?: boolean;
  /** Remove email addresses (default: true) */
  removeEmails?: boolean;
  /** Remove markdown formatting (default: true) */
  removeMarkdown?: boolean;
  /** Normalize @mentions to @user (default: true) */
  normalizeMentions?: boolean;
  /** Remove # from hashtags (default: true) */
  normalizeHashtags?: boolean;
  /** Maximum length to truncate to (default: no limit) */
  maxLength?: number;
}

const DEFAULT_OPTIONS: SanitizeOptions = {
  removeUrls: true,
  removeEmails: true,
  removeMarkdown: true,
  normalizeMentions: true,
  normalizeHashtags: true,
};

/**
 * Sanitize text content for AI analysis.
 *
 * Removes unnecessary elements that would waste model processing:
 * - HTML tags
 * - URLs (replaced with [link])
 * - Email addresses (replaced with [email])
 * - Markdown formatting
 * - Excessive whitespace
 * - Invisible unicode characters
 * - Excessive punctuation repetition
 *
 * @param text - The raw text content to sanitize
 * @param options - Optional configuration for sanitization
 * @returns Cleaned text ready for AI analysis
 */
export function sanitizeForAnalysis(
  text: string,
  options: SanitizeOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  let result = text;

  // Remove HTML tags first
  result = stripHtmlTags(result);

  // Remove invisible characters
  result = removeInvisibleChars(result);

  // Optionally remove URLs
  if (opts.removeUrls) {
    result = removeUrls(result);
  }

  // Optionally remove emails
  if (opts.removeEmails) {
    result = removeEmails(result);
  }

  // Optionally remove markdown
  if (opts.removeMarkdown) {
    result = removeMarkdownFormatting(result);
  }

  // Optionally normalize mentions
  if (opts.normalizeMentions) {
    result = normalizeMentions(result);
  }

  // Optionally normalize hashtags
  if (opts.normalizeHashtags) {
    result = normalizeHashtags(result);
  }

  // Normalize punctuation
  result = normalizePunctuation(result);

  // Normalize whitespace (always do this)
  result = normalizeWhitespace(result);

  // Trim
  result = result.trim();

  // Optionally truncate
  if (opts.maxLength && result.length > opts.maxLength) {
    result = result.slice(0, opts.maxLength).trim();
    // Try to break at word boundary
    const lastSpace = result.lastIndexOf(' ');
    if (lastSpace > opts.maxLength * 0.8) {
      result = result.slice(0, lastSpace);
    }
  }

  return result;
}
