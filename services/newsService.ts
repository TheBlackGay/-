import { NewsArticle } from '../types';
import { STOCKS } from '../constants';

const newsTemplates = [
  {
    title: "{name} Announces Record Quarterly Earnings, Shares Surge",
    summary: "In a recent press release, {name} reported quarterly earnings that exceeded analyst expectations, driven by strong sales in its flagship product division. The company's stock price saw a significant uptick in after-hours trading following the announcement.",
    source: "MarketWatch",
  },
  {
    title: "Analysts Upgrade {ticker} to 'Strong Buy' Amid Positive Market Outlook",
    summary: "Leading financial analysts have upgraded their rating for {ticker}, citing a favorable macroeconomic environment and innovative product pipeline. The new price target suggests a potential 20% upside from its current valuation.",
    source: "Reuters",
  },
  {
    title: "New Product Launch from {name} Could Disrupt the Industry",
    summary: "{name} has unveiled its latest product, which analysts believe could be a game-changer. The new offering boasts several innovative features that set it apart from competitors.",
    source: "Bloomberg",
  },
  {
    title: "Regulatory Scrutiny Looms Over {ticker} Following Recent Controversy",
    summary: "Government regulators are reportedly investigating {name} over anticompetitive concerns. The news has caused some volatility in {ticker}'s stock price as investors await further details.",
    source: "The Wall Street Journal",
  },
  {
    title: "{name} Expands into New International Markets",
    summary: "As part of its global growth strategy, {name} announced its expansion into several key emerging markets. The move is expected to significantly boost the company's revenue streams in the coming years.",
    source: "Financial Times",
  },
  {
    title: "Supply Chain Issues Continue to Impact {ticker}'s Production",
    summary: "Persistent global supply chain disruptions are affecting production timelines for {name}. The company is actively seeking alternative suppliers to mitigate the impact on its quarterly output.",
    source: "CNBC",
  },
  {
    title: "CEO of {name} to Speak at Major Tech Conference",
    summary: "The CEO of {name} is scheduled to deliver a keynote address at the upcoming Global Tech Summit, where they are expected to share insights on the future of the industry and the company's strategic direction.",
    source: "TechCrunch",
  }
];

// Helper to shuffle an array
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};


export const fetchNews = async (ticker: string): Promise<NewsArticle[]> => {
  return new Promise(resolve => {
    setTimeout(() => {
      const stockInfo = STOCKS.find(s => s.ticker === ticker) || { ticker, name: ticker };
      const { name } = stockInfo;

      const shuffledTemplates = shuffleArray(newsTemplates);
      const articleCount = Math.floor(Math.random() * 4) + 2; // 2 to 5 articles

      const articles: NewsArticle[] = shuffledTemplates.slice(0, articleCount).map((template, index) => {
        const publishedDate = new Date(Date.now() - index * 3 * 3600 * 1000 - Math.random() * 3600 * 1000); // Staggered publication times
        return {
          id: `${ticker}-${index}-${publishedDate.getTime()}`,
          title: template.title.replace(/{name}|{ticker}/g, match => match === '{name}' ? name : ticker),
          summary: template.summary.replace(/{name}|{ticker}/g, match => match === '{name}' ? name : ticker),
          source: template.source,
          url: '#', // Using a placeholder URL as it's a simulation
          publishedAt: publishedDate.toISOString(),
        };
      });

      resolve(articles);
    }, 800); // Simulate network delay
  });
};
