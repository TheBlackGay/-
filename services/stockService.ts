import { StockDataPoint, StockInfo, Stock } from '../types';
import { STOCKS } from '../constants';

const formatMarketCap = (value: number): string => {
    if (value >= 1e12) {
        return `${(value / 1e12).toFixed(2)}T`;
    }
    if (value >= 1e9) {
        return `${(value / 1e9).toFixed(2)}B`;
    }
    if (value >= 1e6) {
        return `${(value / 1e6).toFixed(2)}M`;
    }
    return value.toString();
};

const generateHistoricalData = (basePrice: number): StockDataPoint[] => {
  const data: StockDataPoint[] = [];
  let currentPrice = basePrice;
  const now = new Date();

  for (let i = 100; i > 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000); // Hourly data for past 100 hours
    const change = (Math.random() - 0.5) * (basePrice * 0.01);
    currentPrice += change;
    currentPrice = Math.max(currentPrice, 10); // Ensure price doesn't go too low
    data.push({ 
        time: time.toISOString(), 
        price: parseFloat(currentPrice.toFixed(2)),
        volume: Math.floor(Math.random() * 2000000 + 500000)
    });
  }
  return data;
};

const basePrices: { [key: string]: number } = {
  'AAPL': 170,
  'GOOGL': 140,
  'MSFT': 380,
  'AMZN': 150,
  'TSLA': 240,
  'NVDA': 500,
  'META': 330,
  'JPM': 155,
  '600519': 1550,
  '601318': 42,
  '300750': 195,
  '002594': 245,
};

let simulatedStockData: { [key: string]: { info: StockInfo, historical: StockDataPoint[] } } = {};

const initializeStock = (stock: Stock) => {
    const basePrice = basePrices[stock.ticker] || (Math.random() * 450 + 50);
    const historical = generateHistoricalData(basePrice);
    const currentPrice = historical[historical.length - 1].price;
    const openPrice = historical[historical.length - 24]?.price || currentPrice * 0.99;
    const change = currentPrice - openPrice;
    const changePercent = (change / openPrice) * 100;

    // More realistic market cap simulation. Correlate it slightly with price.
    // Simulate shares outstanding between 1B and 15B.
    const sharesOutstanding = Math.random() * 14e9 + 1e9;
    const marketCapValue = currentPrice * sharesOutstanding;

    simulatedStockData[stock.ticker] = {
        historical,
        info: {
            ticker: stock.ticker,
            name: stock.name,
            price: parseFloat(currentPrice.toFixed(2)),
            change: parseFloat(change.toFixed(2)),
            changePercent: parseFloat(changePercent.toFixed(2)),
            volume: `${(Math.random() * 50 + 20).toFixed(2)}M`,
            marketCap: formatMarketCap(marketCapValue),
            open: parseFloat(openPrice.toFixed(2)),
            high: Math.max(...historical.slice(-24).map(p => p.price)),
            low: Math.min(...historical.slice(-24).map(p => p.price)),
            currency: stock.currency,
        }
    }
}

STOCKS.forEach(initializeStock);

export const fetchStockData = async (ticker: string): Promise<StockDataPoint[]> => {
  if (!simulatedStockData[ticker]) {
      let stock = STOCKS.find(s => s.ticker === ticker);
      if(!stock) {
        stock = { ticker, name: `${ticker} (Custom)`, currency: 'USD' };
      }
      initializeStock(stock);
  }
  return Promise.resolve([...simulatedStockData[ticker].historical]);
};

export const fetchCurrentStockInfo = async (ticker: string): Promise<StockInfo> => {
    if (!simulatedStockData[ticker]) {
        let stock = STOCKS.find(s => s.ticker === ticker);
        if(!stock) {
            stock = { ticker, name: `${ticker} (Custom)`, currency: 'USD' };
        }
        initializeStock(stock);
    }
  return Promise.resolve({...simulatedStockData[ticker].info});
};

export const simulateRealTimeUpdate = (): void => {
    Object.keys(simulatedStockData).forEach(ticker => {
        const currentStock = simulatedStockData[ticker];
        const lastDataPoint = currentStock.historical[currentStock.historical.length - 1];
        const lastPrice = lastDataPoint.price;
        const change = (Math.random() - 0.5) * (lastPrice * 0.001);
        const newPrice = parseFloat((lastPrice + change).toFixed(2));
        const newVolume = Math.max(50000, Math.floor(lastDataPoint.volume * (0.95 + Math.random() * 0.1)));

        // Create a new point for the historical data
        const newPoint = { time: new Date().toISOString(), price: newPrice, volume: newVolume };
        
        // Create a new array for historical data using an immutable approach
        let updatedHistorical = [...currentStock.historical, newPoint];
        if (updatedHistorical.length > 200) {
            // slice returns a new array, maintaining immutability
            updatedHistorical = updatedHistorical.slice(1);
        }
        
        const openPrice = currentStock.info.open;
        const newChange = newPrice - openPrice;
        const newChangePercent = (newChange / openPrice) * 100;

        // Create a new info object using an immutable approach
        const updatedInfo = {
            ...currentStock.info,
            price: newPrice,
            change: parseFloat(newChange.toFixed(2)),
            changePercent: parseFloat(newChangePercent.toFixed(2)),
            high: Math.max(currentStock.info.high, newPrice),
            low: Math.min(currentStock.info.low, newPrice),
        };

        // Replace the old stock data with the new, immutable data
        simulatedStockData[ticker] = {
            info: updatedInfo,
            historical: updatedHistorical,
        };
    });
};