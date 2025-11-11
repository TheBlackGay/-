import { CompanyProfile } from '../types';

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
    if (['3D98TA15C9BWNHQL'].includes(ticker)) return `${ticker}.SZ`; // Shenzhen
    return ticker;
};


export const fetchCompanyProfile = async (ticker: string, name: string): Promise<CompanyProfile> => {
  const cacheKey = `cache_alphavantage_profile_${ticker}`;
  const cachedData = getFromCache<CompanyProfile>(cacheKey);
  if (cachedData) {
      return cachedData;
  }

  const apiTicker = getApiTicker(ticker);
  const url = `${BASE_URL}?function=OVERVIEW&symbol=${apiTicker}&apikey=${API_KEY}`;
  const response = await fetch(url);
  const data = await handleApiResponse(response);

  if (!data.Symbol || Object.keys(data).length === 0) {
    return {
      ticker,
      name,
      industry: "N/A",
      sector: "N/A",
      ceo: "N/A",
      headquarters: "N/A",
      website: "#",
      description: "No company profile information is available for this ticker, likely due to API limitations (e.g., daily limit reached) or an invalid ticker.",
    };
  }

  const profile = {
    ticker: data.Symbol,
    name: data.Name,
    industry: data.Industry,
    sector: data.Sector,
    ceo: data.CEO,
    headquarters: data.Address,
    website: data.Website || '#',
    description: data.Description,
  };
  
  setInCache(cacheKey, profile);
  return profile;
};