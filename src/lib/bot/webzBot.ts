import Post from '@/models/Post'
import User from '@/models/User'
import { performAIAnalysisOnPost } from '@/lib/ai/analysis'

const WEBZ_API_KEY = process.env.WEBZ_API_KEY
const WEBZ_API_BASE_URL = 'https://api.webz.io/newsApiLite'

// Bot configuration
const BOT_USERNAME = 'webzdotio'
const POSTS_PER_RUN = 3 // Post 3 articles per run (we get 10 per API call)

// Topics to rotate through - each cron run picks one randomly
const TOPICS = [
  { query: 'technology', prefix: '💻 Tech News:' },
  { query: 'business', prefix: '📈 Business:' },
  { query: 'science', prefix: '🔬 Science:' },
  { query: 'health', prefix: '🏥 Health:' },
  { query: 'entertainment', prefix: '🎬 Entertainment:' },
  { query: 'sports', prefix: '⚽ Sports:' },
  { query: 'world news', prefix: '🌍 World News:' },
]

interface WebzArticle {
  title: string
  text: string
  url: string
  thread: {
    main_image?: string
    site: string
    published: string
  }
}

interface WebzResponse {
  posts: WebzArticle[]
  totalResults: number
  moreResultsAvailable: number
}

async function fetchFromWebz(query: string): Promise<WebzArticle[]> {
  if (!WEBZ_API_KEY) {
    console.error('WEBZ_API_KEY is not set')
    return []
  }

  const url = new URL(WEBZ_API_BASE_URL)
  url.searchParams.append('token', WEBZ_API_KEY)
  url.searchParams.append('q', `${query} language:english`)
  url.searchParams.append('sort', 'crawled')

  try {
    const response = await fetch(url.toString())
    const data: WebzResponse = await response.json()

    if (data.posts && data.posts.length > 0) {
      console.log(`Webz.io returned ${data.posts.length} articles for "${query}"`)
      return data.posts
    }

    console.warn(`No articles found for query: ${query}`)
    return []
  } catch (error) {
    console.error('Error fetching from Webz.io:', error)
    return []
  }
}

async function getRecentPostUrls(userId: string, limit = 50): Promise<Set<string>> {
  const recentPosts = await Post.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('content')
    .lean()

  const urls = new Set<string>()
  for (const post of recentPosts) {
    // Extract URLs from post content
    const urlMatch = post.content?.match(/https?:\/\/[^\s]+/)
    if (urlMatch) {
      urls.add(urlMatch[0])
    }
  }
  return urls
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

export async function fetchWebzNewsAndPost() {
  console.log('\n--- Running Webz.io News Bot ---')

  // Find the bot user
  const botUser = await User.findOne({ username: BOT_USERNAME, isBot: true })

  if (!botUser) {
    console.error(`Bot user "${BOT_USERNAME}" not found. Please create it first.`)
    return { success: false, message: 'Bot user not found' }
  }

  // Get recently posted URLs to avoid duplicates
  const postedUrls = await getRecentPostUrls(botUser._id.toString())
  console.log(`Found ${postedUrls.size} recently posted URLs to avoid`)

  // Pick a random topic
  const topic = TOPICS[Math.floor(Math.random() * TOPICS.length)]
  console.log(`Selected topic: ${topic.query}`)

  // Fetch articles (1 API call = 10 articles)
  const articles = await fetchFromWebz(topic.query)

  if (articles.length === 0) {
    console.log('No articles to post')
    return { success: false, message: 'No articles found' }
  }

  // Filter out already posted articles
  const newArticles = articles.filter((a) => !postedUrls.has(a.url))
  console.log(`${newArticles.length} new articles after filtering duplicates`)

  // Post up to POSTS_PER_RUN articles
  let postsCreated = 0
  for (const article of newArticles.slice(0, POSTS_PER_RUN)) {
    if (!article.title || !article.text || !article.url) continue

    const description = truncateText(article.text, 280)
    const content =
      `**${topic.prefix}** ${article.title}\n\n` +
      `${description}\n\n` +
      `Source: ${article.thread?.site || 'Unknown'}\n` +
      `Read more: ${article.url}`

    try {
      const post = new Post({
        user: botUser._id,
        content,
        image: article.thread?.main_image || null,
        aiAnalysis: {
          sentiment: 'Unknown',
          emotions: [],
          toxicity: { detected: false, details: {} },
          topics: [],
          summary: '',
          category: 'News',
          factCheck: 'Unknown',
        },
      })

      const savedPost = await post.save()
      postsCreated++
      console.log(`Created post ${postsCreated}: ${article.title.substring(0, 50)}...`)

      // Trigger AI analysis in background
      performAIAnalysisOnPost(savedPost._id.toString()).catch((err) =>
        console.error('AI analysis failed:', err)
      )
    } catch (error) {
      console.error('Failed to create post:', error)
    }
  }

  console.log(`--- Webz.io Bot finished: ${postsCreated} posts created ---`)
  return { success: true, postsCreated }
}
