import { getCachedNews, cacheNews } from './cache'

export interface NewsItem {
  title: string
  description: string
  url: string
  publishedAt: string
  source: string
}

export async function fetchNews(symbol: string, limit: number = 10): Promise<NewsItem[]> {
  // Check cache first
  const cached = await getCachedNews(symbol)
  if (cached) {
    return cached.slice(0, limit)
  }
  
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) {
    console.warn('NewsAPI key not configured, returning empty news')
    return []
  }
  
  try {
    // Search for company name and stock symbol
    const query = `${symbol} stock OR ${symbol} company`
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=${limit}&apiKey=${apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`NewsAPI returned ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.status === 'error') {
      throw new Error(data.message || 'NewsAPI error')
    }
    
    const news: NewsItem[] = (data.articles || []).map((article: any) => ({
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      publishedAt: article.publishedAt || new Date().toISOString(),
      source: article.source?.name || 'Unknown',
    }))
    
    // Cache the news
    cacheNews(symbol, news)
    
    return news
  } catch (error) {
    console.error(`Error fetching news for ${symbol}:`, error)
    // Return empty array on error to allow analysis to continue
    return []
  }
}

