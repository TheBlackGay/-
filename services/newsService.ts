import { NewsArticle } from '../types';

const API_KEY = '3D98TA15C9BWNHQL';
const BASE_URL = 'https://www.alphavantage.co/query';

// --- CACHE HELPERS ---
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

const getFromCache = <T>(key: string): T | null => {
    try {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        const item = JSON.parse(itemStr);
        const now = new Date().getTime();
        
        if (now > item.timestamp + CACHE_TTL_MS) {
            localStorage.removeItem(key);
            return null;
        }
        return item.data;
    } catch (error) {
        console.error("Error reading from cache:", error);
        return null;
    }
};

const setInCache = <T>(key: string, data: T): void => {
    try {
        const item = {
            data,
            timestamp: new Date().getTime()
        };
        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.error("Error writing to cache:", error);
    }
};
// --- END CACHE HELPERS ---

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('API rate limit reached. Please wait a minute and try again.');
    }
    if (data['Error Message']) {
        throw new Error(`API Error: ${data['Error Message']}`);
    }
    return data;
};

const getApiTicker = (ticker: string): string => {
    if (['600519', '601318'].includes(ticker)) return `${ticker}.SS`; // Shanghai
    if (['300750', '002594'].includes(ticker)) return `${ticker}.SZ`; // Shenzhen
    return ticker;
};


export const fetchNews = async (ticker: string): Promise<NewsArticle[]> => {
  const cacheKey = `cache_alphavantage_news_${ticker}`;
  const cachedData = getFromCache<NewsArticle[]>(cacheKey);
  if (cachedData) {
      return cachedData;
  }

  const apiTicker = getApiTicker(ticker);
  const url = `${BASE_URL}?function=NEWS_SENTIMENT&tickers=${apiTicker}&limit=20&apikey=${API_KEY}`;
  const response = await fetch(url);
  const data = await handleApiResponse(response);

  if (!data.feed || data.feed.length === 0) {
    setInCache(cacheKey, []);
    return [];
  }

  const articles = data.feed.map((article: any) => {
      const publishedDate = new Date(
          `${article.time_published.slice(0, 4)}-${article.time_published.slice(4, 6)}-${article.time_published.slice(6, 8)}T${article.time_published.slice(9, 11)}:${article.time_published.slice(11, 13)}:${article.time_published.slice(13, 15)}Z`
      );
      return {
          id: article.url + article.time_published,
          title: article.title,
          summary: article.summary,
          source: article.source,
          url: article.url,
          publishedAt: publishedDate.toISOString(),
      };
  });

  setInCache(cacheKey, articles);
  return articles;
};