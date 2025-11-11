import { Stock, AIModel } from './types';

export const STOCKS: Stock[] = [
  { ticker: 'AAPL', name: 'Apple Inc.', currency: 'USD' },
  { ticker: 'GOOGL', name: 'Alphabet Inc.', currency: 'USD' },
  { ticker: 'MSFT', name: 'Microsoft Corp.', currency: 'USD' },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', currency: 'USD' },
  { ticker: 'TSLA', name: 'Tesla, Inc.', currency: 'USD' },
  { ticker: 'NVDA', name: 'NVIDIA Corp.', currency: 'USD' },
  { ticker: 'META', name: 'Meta Platforms, Inc.', currency: 'USD' },
  { ticker: 'JPM', name: 'JPMorgan Chase & Co.', currency: 'USD' },
  { ticker: '600519', name: '贵州茅台 (Kweichow Moutai)', currency: 'CNY' },
  { ticker: '601318', name: '中国平安 (Ping An Insurance)', currency: 'CNY' },
  { ticker: '300750', name: '宁德时代 (CATL)', currency: 'CNY' },
  { ticker: '002594', name: '比亚迪 (BYD Company)', currency: 'CNY' },
];

export const AI_MODELS: AIModel[] = [
  { id: 'gemini-2.5-pro', nameKey: 'settings.modelPro', provider: 'google' },
  { id: 'gemini-2.5-flash', nameKey: 'settings.modelFlash', provider: 'google' },
];