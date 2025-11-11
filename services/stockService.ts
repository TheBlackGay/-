import { StockDataPoint, StockInfo, StockQuote } from '../types';
import { STOCKS } from '../constants';

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

// Helper to handle API responses and errors, including rate limiting notes
const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
    }
    const data = await response.json();
    if (data.Note && data.Note.includes('API call frequency')) {
        throw new Error('API rate limit reached. Please try again later.');
    }
    if (data['Error Message']) {
        throw new Error(`API Error: ${data['Error Message']}`);
    }
    return data;
};

// Helper to format ticker for Alpha Vantage API (e.g., adding .SS for Shanghai)
const getApiTicker = (ticker: string): string => {
    if (['600519', '601318'].includes(ticker)) return `${ticker}.SS`;
    if (['300750', '002594'].includes(ticker)) return `${ticker}.SZ`;
    return ticker;
};

// Internal function to fetch quote data to avoid code duplication
const fetchQuoteInternal = async (ticker: string): Promise<any> => {
    const cacheKey = `cache_alphavantage_quote_${ticker}`;
    const cachedData = getFromCache<any>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const apiTicker = getApiTicker(ticker);
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${apiTicker}&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await handleApiResponse(response);
    
    const quoteData = data['Global Quote'];
    if (!quoteData || Object.keys(quoteData).length === 0) {
        throw new Error('No quote data found. The ticker may be invalid or the daily API limit has been reached.');
    }

    setInCache(cacheKey, quoteData);
    return quoteData;
};

/**
 * Fetches historical intraday (60min) stock data.
 */
export const fetchStockData = async (ticker: string): Promise<StockDataPoint[]> => {
    const cacheKey = `cache_alphavantage_data_${ticker}`;
    const cachedData = getFromCache<StockDataPoint[]>(cacheKey);
    if (cachedData) {
        return cachedData;
    }

    const apiTicker = getApiTicker(ticker);
    const url = `${BASE_URL}?function=TIME_SERIES_INTRADAY&symbol=${apiTicker}&interval=60min&outputsize=compact&apikey=${API_KEY}`;
    const response = await fetch(url);
    const data = await handleApiResponse(response);
    
    const timeSeries = data['Time Series (60min)'];
    if (!timeSeries) {
        throw new Error('No time series data found for chart. The ticker may be invalid or the daily API limit has been reached.');
    }

    // Parse the API response object into an array of data points and sort chronologically
    const dataPoints: StockDataPoint[] = Object.entries(timeSeries)
        .map(([time, values]: [string, any]) => ({
            time: new Date(time).toISOString(),
            price: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'], 10),
        }))
        .reverse(); 

    setInCache(cacheKey, dataPoints);
    return dataPoints;
};

/**
 * Fetches current stock information using the GLOBAL_QUOTE endpoint.
 * Note: Market Cap is not available here and will be 'N/A'.
 * The detailed CompanyProfile component will fetch this separately.
 */
export const fetchCurrentStockInfo = async (ticker: string): Promise<StockInfo> => {
    const quoteData = await fetchQuoteInternal(ticker);
    
    const stockConstant = STOCKS.find(s => s.ticker === ticker);

    return {
        ticker: quoteData['01. symbol'],
        name: stockConstant?.name || ticker, // Fallback name
        price: parseFloat(quoteData['05. price']),
        change: parseFloat(quoteData['09. change']),
        changePercent: parseFloat(quoteData['10. change percent'].replace('%', '')),
        volume: quoteData['06. volume'],
        marketCap: 'N/A', // Not available from GLOBAL_QUOTE; fetched in CompanyProfile
        open: parseFloat(quoteData['02. open']),
        high: parseFloat(quoteData['03. high']),
        low: parseFloat(quoteData['04. low']),
        currency: stockConstant?.currency || (ticker.match(/^(60|00|30)/) ? 'CNY' : 'USD'),
    };
};

/**
 * Fetches a lightweight quote for a stock, suitable for frequent updates (if rate limits allowed).
 */
export const fetchQuote = async (ticker: string): Promise<StockQuote> => {
    const quoteData = await fetchQuoteInternal(ticker);
    return {
        price: parseFloat(quoteData['05. price']),
        change: parseFloat(quoteData['09. change']),
        changePercent: parseFloat(quoteData['10. change percent'].replace('%', '')),
        volume: quoteData['06. volume'],
        high: parseFloat(quoteData['03. high']),
        low: parseFloat(quoteData['04. low']),
    };
};