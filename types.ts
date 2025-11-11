// FIX: Removed self-import of `Stock` which was causing a conflict with its own declaration.

export interface AIModel {
  id: string;
  nameKey: string;
  provider: 'google' | 'custom';
  url?: string;
}

export interface Stock {
  ticker: string;
  name: string;
  currency: 'USD' | 'CNY';
}

export interface StockDataPoint {
  time: string;
  price: number;
  volume: number;
}

export interface StockInfo {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  marketCap: string;
  open: number;
  high: number;
  low: number;
  currency: 'USD' | 'CNY';
}

// FIX: Added missing StockQuote interface required by stockService.ts
export interface StockQuote {
  price: number;
  change: number;
  changePercent: number;
  volume: string;
  high: number;
  low: number;
}

export interface AIAnalysisResult {
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  summary: string[];
  entryPrice?: number;
  targetPrice?: number;
  stopLoss?: number;
  sellStrategy?: string;
}

export interface AIComprehensiveAnalysisResult {
  valuation: {
    summary: string;
    keyPoints: string[];
  };
  financialHealth: {
    summary: string;
    keyPoints: string[];
  };
  technologicalEdge: {
    summary: string;
    keyPoints: string[];
  };
  riskFactors: {
    summary: string;
    keyPoints: string[];
  };
  investmentThesis: string;
}

export interface Trade {
  ticker: string;
  shares: number;
  price: number;
  type: 'BUY' | 'SELL';
  timestamp: number;
  targetPrice?: number;
  stopLoss?: number;
  currency: 'USD' | 'CNY';
}

export interface PortfolioPosition {
  ticker: string;
  name: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  currentValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  currency: 'USD' | 'CNY';
}

export interface PortfolioSummary {
  totalValue: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  positions: PortfolioPosition[];
}

export interface PortfolioHistoryPoint {
  time: string;
  value: number;
}

export interface PriceAlert {
  id: string;
  ticker: string;
  targetPrice: number;
  condition: 'above' | 'below';
  status: 'active' | 'triggered';
  currency: 'USD' | 'CNY';
}

export interface NotificationMessage {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error';
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
}

export interface CompanyProfile {
    ticker: string;
    name: string;
    industry: string;
    sector: string;
    ceo: string;
    headquarters: string;
    website: string;
    description: string;
}

export interface ComparisonDataPoint {
  time: string;
  [ticker: string]: number | string;
}

export type TechnicalIndicator = 'sma10' | 'sma50' | 'rsi' | 'macd';