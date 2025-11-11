
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Watchlist from './components/Watchlist';
import StockChart from './components/StockChart';
import StockDetails from './components/StockDetails';
import AIAnalysisPanel from './components/AIAnalysisPanel';
import PortfolioView from './components/PortfolioView';
import AlertsManager from './components/AlertsManager';
import Notifications from './components/Notifications';
import NewsFeed from './components/NewsFeed';
import CompanyProfile from './components/CompanyProfile';
import StockComparisonModal from './components/StockComparisonModal';
import SettingsModal from './components/SettingsModal';
import AIComprehensiveAnalysis from './components/AIComprehensiveAnalysis';
import { getTradingAnalysis, getComprehensiveCompanyAnalysis } from './services/geminiService';
import { fetchStockData, fetchCurrentStockInfo } from './services/stockService';
import { fetchNews } from './services/newsService';
import { fetchCompanyProfile } from './services/companyService';
import { Stock, StockInfo, StockDataPoint, AIAnalysisResult, Trade, PortfolioSummary, PortfolioPosition, PriceAlert, NotificationMessage, NewsArticle, CompanyProfile as CompanyProfileType, PortfolioHistoryPoint, ComparisonDataPoint, AIComprehensiveAnalysisResult, TechnicalIndicator } from './types';
import { STOCKS } from './constants';
import { NewspaperIcon, BuildingOfficeIcon, SparklesIcon } from './components/IconComponents';
import { LanguageProvider } from './contexts/LanguageContext';
import { useTranslations } from './hooks/useTranslations';
import { SettingsProvider, useSettings } from './contexts/SettingsContext';

// Helper functions for technical indicators
const calculateRSI = (data: StockDataPoint[], period: number = 14): number | null => {
    if (data.length <= period) return null;
    const prices = data.map(d => d.price);
    let gains = 0;
    let losses = 0;

    // Initial average calculation
    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i-1];
        if (diff >= 0) {
            gains += diff;
        } else {
            losses -= diff;
        }
    }
    
    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Smoothed average for the rest
    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i-1];
        if (diff >= 0) {
            avgGain = (avgGain * (period - 1) + diff) / period;
            avgLoss = (avgLoss * (period - 1)) / period;
        } else {
            avgGain = (avgGain * (period - 1)) / period;
            avgLoss = (avgLoss * (period - 1) - diff) / period;
        }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};

const calculateMACD = (data: StockDataPoint[], shortPeriod: number = 12, longPeriod: number = 26): { macdLine: number } | null => {
    if (data.length < longPeriod) return null;
    const prices = data.map(d => d.price);
    
    const calculateEMA = (priceData: number[], period: number): number[] => {
        const multiplier = 2 / (period + 1);
        const ema: number[] = [priceData[0]];
        for (let i = 1; i < priceData.length; i++) {
            ema.push((priceData[i] - ema[i-1]) * multiplier + ema[i-1]);
        }
        return ema;
    };

    const emaShort = calculateEMA(prices, shortPeriod);
    const emaLong = calculateEMA(prices, longPeriod);
    
    const macdLine = emaShort[emaShort.length - 1] - emaLong[emaLong.length - 1];
    return { macdLine };
};

const AppContent: React.FC = () => {
    const { t } = useTranslations();
    const { activeModel, isSettingsOpen, closeSettings } = useSettings();
    const [currentView, setCurrentView] = useState<'dashboard' | 'portfolio'>('dashboard');
    const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>(STOCKS);
    const [selectedStock, setSelectedStock] = useState<string>(STOCKS[0].ticker);

    const [stockData, setStockData] = useState<StockDataPoint[]>([]);
    const [watchlistData, setWatchlistData] = useState<Map<string, StockInfo>>(new Map());
    const [isStockDataLoading, setIsStockDataLoading] = useState<boolean>(true);
    const [stockDataError, setStockDataError] = useState<string | null>(null);

    const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [analysisError, setAnalysisError] = useState<string | null>(null);

    const [trades, setTrades] = useState<Trade[]>([]);
    const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
    const [historicalPortfolioData, setHistoricalPortfolioData] = useState<PortfolioHistoryPoint[]>([]);

    const [alerts, setAlerts] = useState<PriceAlert[]>([]);
    const [notifications, setNotifications] = useState<NotificationMessage[]>([]);

    const [news, setNews] = useState<NewsArticle[]>([]);
    const [isFetchingNews, setIsFetchingNews] = useState<boolean>(false);
    const [newsError, setNewsError] = useState<string | null>(null);

    const [companyProfile, setCompanyProfile] = useState<CompanyProfileType | null>(null);
    const [isFetchingProfile, setIsFetchingProfile] = useState<boolean>(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [activeInfoTab, setActiveInfoTab] = useState<'news' | 'profile' | 'analysis'>('news');

    const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
    const [comparisonData, setComparisonData] = useState<ComparisonDataPoint[] | null>(null);
    const [comparisonTickers, setComparisonTickers] = useState<string[]>([]);
    const [isComparing, setIsComparing] = useState(false);
    const [compareError, setCompareError] = useState<string | null>(null);

    const [comprehensiveAnalysis, setComprehensiveAnalysis] = useState<AIComprehensiveAnalysisResult | null>(null);
    const [isAnalyzingComprehensive, setIsAnalyzingComprehensive] = useState<boolean>(false);
    const [comprehensiveAnalysisError, setComprehensiveAnalysisError] = useState<string | null>(null);

    const [selectedIndicators, setSelectedIndicators] = useState<Set<TechnicalIndicator>>(
        new Set(['sma10', 'sma50', 'rsi', 'macd'])
    );

    const stockInfo = watchlistData.get(selectedStock) || null;

    const handleSelectStock = useCallback((ticker: string) => {
        setSelectedStock(ticker);
        setAiAnalysis(null);
        setAnalysisError(null);
        setComprehensiveAnalysis(null);
        setComprehensiveAnalysisError(null);
        setActiveInfoTab('news');
    }, []);

    const handleAddStock = (ticker: string) => {
        const upperTicker = ticker.toUpperCase();
        if (!watchlistStocks.some(s => s.ticker === upperTicker)) {
            // Detect currency based on ticker format
            const isCNY = /^(60|00|30)/.test(upperTicker);
            const currency: 'USD' | 'CNY' = isCNY ? 'CNY' : 'USD';
            setWatchlistStocks(prev => [...prev, { ticker: upperTicker, name: `${upperTicker}`, currency: currency }]); 
        }
        handleSelectStock(upperTicker);
    };

    const handleAddToWatchlist = (ticker: string, name: string) => {
        const upperTicker = ticker.toUpperCase();
        if (!watchlistStocks.some(s => s.ticker === upperTicker)) {
            const stockToAdd = STOCKS.find(s => s.ticker === upperTicker) || { ticker: upperTicker, name, currency: 'USD' };
            setWatchlistStocks(prev => [...prev, stockToAdd]);
            const newNotification: NotificationMessage = {
                id: `notif-add-${upperTicker}`,
                message: t('notifications.addWatchlistMessage', { name, ticker: upperTicker }),
                type: 'success'
            };
            setNotifications(prev => [newNotification, ...prev]);
        }
    };

    const handleAnalyze = useCallback(async () => {
        if (!stockInfo || !activeModel) return;
        setIsAnalyzing(true);
        setAnalysisError(null);
        setAiAnalysis(null);
        try {
            const indicatorsToAnalyze: { sma10?: number | null; sma50?: number | null; rsi?: number | null; macd?: number | null } = {};

            if (selectedIndicators.has('sma10')) {
                const last10 = stockData.slice(-10);
                indicatorsToAnalyze.sma10 = last10.length >= 10 ? last10.reduce((acc, curr) => acc + curr.price, 0) / 10 : null;
            }
            if (selectedIndicators.has('sma50')) {
                const last50 = stockData.slice(-50);
                indicatorsToAnalyze.sma50 = last50.length >= 50 ? last50.reduce((acc, curr) => acc + curr.price, 0) / 50 : null;
            }
            if (selectedIndicators.has('rsi')) {
                indicatorsToAnalyze.rsi = calculateRSI(stockData);
            }
            if (selectedIndicators.has('macd')) {
                const macdResult = calculateMACD(stockData);
                indicatorsToAnalyze.macd = macdResult ? macdResult.macdLine : null;
            }

            const result = await getTradingAnalysis(
                selectedStock, 
                stockData, 
                indicatorsToAnalyze,
                activeModel
            );
            setAiAnalysis(result);
        } catch (error) {
            setAnalysisError(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsAnalyzing(false);
        }
    }, [selectedStock, stockData, stockInfo, activeModel, selectedIndicators]);
    
    const handleAnalyzeCompany = useCallback(async () => {
        if (!companyProfile || news.length === 0 || !stockInfo || !activeModel) {
            setComprehensiveAnalysisError("Cannot perform analysis: Missing company profile, news, or market data.");
            return;
        }
        setIsAnalyzingComprehensive(true);
        setComprehensiveAnalysis(null);
        setComprehensiveAnalysisError(null);
        try {
            const result = await getComprehensiveCompanyAnalysis(companyProfile, news, stockInfo, activeModel);
            setComprehensiveAnalysis(result);
        } catch (error) {
            setComprehensiveAnalysisError(error instanceof Error ? error.message : "An unknown error occurred during company analysis.");
        } finally {
            setIsAnalyzingComprehensive(false);
        }
    }, [companyProfile, news, stockInfo, activeModel]);

    const handleTrade = useCallback((ticker: string, shares: number, price: number, currency: 'USD' | 'CNY', type: 'BUY' | 'SELL', tradeParams?: { targetPrice?: number; stopLoss?: number }) => {
        const newTrade: Trade = { ticker, shares, price, currency, type, timestamp: Date.now(), ...tradeParams };
        setTrades(prev => [...prev, newTrade]);
    }, []);

    const handleAddAlert = useCallback((alert: Omit<PriceAlert, 'id' | 'status' | 'currency'>) => {
        if (!stockInfo) return;
        const newAlert: PriceAlert = { ...alert, id: Date.now().toString(), status: 'active', currency: stockInfo.currency };
        setAlerts(prev => [...prev, newAlert]);
    }, [stockInfo]);

    const handleRemoveAlert = useCallback((id: string) => {
        setAlerts(prev => prev.filter(a => a.id !== id));
    }, []);
    
    const handleDismissNotification = useCallback((id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    const handleCompareStocks = useCallback(async (tickers: string[]) => {
        setIsComparing(true);
        setIsCompareModalOpen(true);
        setComparisonTickers(tickers);
        setComparisonData(null);
        setCompareError(null);

        try {
            const dataPromises = tickers.map(ticker => fetchStockData(ticker));
            const allData = await Promise.all(dataPromises);

            const firstDataPoints = allData.map(d => d.length > 0 ? d[0].price : 0);
            const referenceTimePoints = allData[0].map(d => d.time);

            const normalizedData: ComparisonDataPoint[] = referenceTimePoints.map((time, index) => {
                const point: ComparisonDataPoint = { time };
                tickers.forEach((ticker, tickerIndex) => {
                    const initialPrice = firstDataPoints[tickerIndex];
                    if (initialPrice === 0) {
                        point[ticker] = 0;
                        return;
                    }
                    const currentPrice = allData[tickerIndex][index]?.price ?? initialPrice;
                    const percentageChange = ((currentPrice / initialPrice) - 1) * 100;
                    point[ticker] = percentageChange;
                });
                return point;
            });
            setComparisonData(normalizedData);
        } catch (error) {
            console.error("Error fetching comparison data:", error);
            setCompareError(t('compare.error'));
            setComparisonData(null); 
        } finally {
            setIsComparing(false);
        }
    }, [t]);

    const handleCloseCompareModal = () => {
        setIsCompareModalOpen(false);
        setComparisonData(null);
        setComparisonTickers([]);
    };

    useEffect(() => {
        const fetchDeepData = async () => {
            if (!selectedStock) return;

            setIsStockDataLoading(true);
            setStockDataError(null);
            setIsFetchingNews(true);
            setNewsError(null);
            setIsFetchingProfile(true);
            setProfileError(null);

            try {
                // Fetch chart data, news, and profile in parallel
                const [data, articles, profile] = await Promise.all([
                    fetchStockData(selectedStock),
                    fetchNews(selectedStock),
                    fetchCompanyProfile(selectedStock, STOCKS.find(s => s.ticker === selectedStock)?.name || selectedStock)
                ]);
                setStockData(data);
                setNews(articles);
                setCompanyProfile(profile);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : t('stockChart.error');
                setStockDataError(errorMessage);
                setStockData([]);
                setNews([]);
                setNewsError("Failed to fetch news.");
                setCompanyProfile(null);
                setProfileError("Failed to fetch profile.");
            } finally {
                setIsStockDataLoading(false);
                setIsFetchingNews(false);
                setIsFetchingProfile(false);
            }
        };
        fetchDeepData();
    }, [selectedStock, t]);

    // Fetch watchlist data sequentially on initial load to avoid rate limiting.
    useEffect(() => {
        let isCancelled = false;
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        const fetchInitialWatchlistData = async () => {
            console.log("Fetching initial data for watchlist sequentially to respect rate limits...");
            
            for (const stock of watchlistStocks) {
                if (isCancelled) break;

                try {
                    const info = await fetchCurrentStockInfo(stock.ticker);
                    if (!isCancelled) {
                        setWatchlistData(prevMap => new Map(prevMap).set(info.ticker, info));
                    }
                } catch (error) {
                    console.error(`Initial fetch failed for ${stock.ticker}:`, error instanceof Error ? error.message : String(error));
                    if (!isCancelled) {
                        // Set dummy data on failure to prevent UI from breaking
                        setWatchlistData(prevMap => new Map(prevMap).set(stock.ticker, {
                            ticker: stock.ticker, name: stock.name, currency: stock.currency,
                            price: 0, change: 0, changePercent: 0, volume: '0', marketCap: 'N/A',
                            open: 0, high: 0, low: 0,
                        }));
                    }
                }
                
                // Wait for 13 seconds before the next request to stay under the 5 requests/minute limit.
                if (!isCancelled) {
                    await delay(13000);
                }
            }
        };

        fetchInitialWatchlistData();

        return () => {
           isCancelled = true;
        };
    }, [watchlistStocks]);


    const calculatePortfolio = useCallback(async (currentTrades: Trade[]): Promise<PortfolioSummary | null> => {
        if (currentTrades.length === 0) {
            return { totalValue: 0, totalGainLoss: 0, totalGainLossPercent: 0, positions: [] };
        }
        const uniqueTickers = Array.from(new Set(currentTrades.map(t => t.ticker)));
        const infoPromises = uniqueTickers.map(ticker => fetchCurrentStockInfo(ticker));
        try {
            const infos = await Promise.all(infoPromises);
            const currentInfosMap = new Map<string, StockInfo>();
            infos.forEach(info => currentInfosMap.set(info.ticker, info));
            const positionsMap = new Map<string, { shares: number, cost: number }>();
            currentTrades.forEach(trade => {
                const pos = positionsMap.get(trade.ticker) || { shares: 0, cost: 0 };
                if (trade.type === 'BUY') {
                    pos.shares += trade.shares;
                    pos.cost += trade.shares * trade.price;
                } else {
                    const avgCost = pos.shares > 0 ? pos.cost / pos.shares : 0;
                    pos.shares -= trade.shares;
                    pos.cost -= trade.shares * avgCost;
                }
                positionsMap.set(trade.ticker, pos);
            });
            const positions: PortfolioPosition[] = [];
            let totalValue = 0, totalCost = 0;
            for (const [ticker, posData] of positionsMap.entries()) {
                if (posData.shares <= 0) continue;
                const currentInfo = currentInfosMap.get(ticker);
                if (!currentInfo) continue;
                const currentPrice = currentInfo.price, currentValue = posData.shares * currentPrice;
                const averageCost = posData.cost / posData.shares, totalGainLoss = currentValue - posData.cost;
                const totalGainLossPercent = posData.cost > 0 ? (totalGainLoss / posData.cost) * 100 : 0;
                positions.push({ ticker, name: currentInfo.name, shares: posData.shares, averageCost, currentPrice, currentValue, totalGainLoss, totalGainLossPercent, currency: currentInfo.currency });
                totalValue += currentValue; 
                totalCost += posData.cost;
            }
            const totalGainLoss = totalValue - totalCost;
            const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
            return { totalValue, totalGainLoss, totalGainLossPercent, positions };
        } catch (error) {
            console.error("Error calculating portfolio:", error);
            return null;
        }
    }, []);

    useEffect(() => {
        const updateAndLogPortfolio = async () => {
            const summary = await calculatePortfolio(trades);
            setPortfolioSummary(summary);
            if (summary) {
                const newPoint: PortfolioHistoryPoint = { time: new Date().toISOString(), value: summary.totalValue };
                setHistoricalPortfolioData(prev => {
                    const newData = [...prev, newPoint];
                    return newData.length > 500 ? newData.slice(newData.length - 500) : newData;
                });
            }
        };
        const portfolioInterval = setInterval(updateAndLogPortfolio, 60000); // Recalculate portfolio every minute
        updateAndLogPortfolio(); // Initial calculation

        return () => clearInterval(portfolioInterval);
    }, [trades, calculatePortfolio]);

    const InfoTabButton: React.FC<{
        label: string;
        tabName: 'news' | 'profile' | 'analysis';
        icon: React.ReactNode;
    }> = ({ label, tabName, icon }) => (
        <button
            onClick={() => setActiveInfoTab(tabName)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2
                ${activeInfoTab === tabName
                    ? 'text-cyan-400 border-cyan-400'
                    : 'text-gray-400 border-transparent hover:text-white hover:border-gray-500'}`
            }
        >
            {icon}
            <span>{label}</span>
        </button>
    );

    return (
        <div className="bg-gray-900 text-gray-200 flex flex-col h-screen font-sans">
            <Notifications notifications={notifications} onDismiss={handleDismissNotification} />
            <Header currentView={currentView} onSetView={setCurrentView} />
            <main className="flex-grow flex flex-row overflow-hidden">
                {currentView === 'dashboard' ? (
                    <>
                        <div className="flex-shrink-0 flex flex-col w-64 border-r border-gray-700">
                           <Watchlist
                                stocks={watchlistStocks}
                                stockInfos={Array.from(watchlistData.values())}
                                selectedStock={selectedStock}
                                onSelectStock={handleSelectStock}
                                onAddStock={handleAddStock}
                                onCompare={handleCompareStocks}
                                isComparing={isComparing && isCompareModalOpen}
                            />
                            <AlertsManager 
                                alerts={alerts}
                                selectedStock={selectedStock}
                                onAddAlert={handleAddAlert}
                                onRemoveAlert={handleRemoveAlert}
                            />
                        </div>
                        <div className="flex-grow flex flex-col p-4 overflow-y-auto">
                            <StockDetails 
                                info={stockInfo} 
                                profile={companyProfile}
                                isWatchlisted={!!stockInfo && watchlistStocks.some(s => s.ticker === stockInfo.ticker)}
                                onAddToWatchlist={handleAddToWatchlist}
                            />
                            <div className="mt-4">
                                <StockChart 
                                    data={stockData} 
                                    info={stockInfo} 
                                    isLoading={isStockDataLoading} 
                                    error={stockDataError} 
                                />
                            </div>
                            <div className="bg-gray-800 rounded-lg mt-4 flex-grow flex flex-col">
                                <div className="flex border-b border-gray-700 px-2">
                                    <InfoTabButton label={t('news.title')} tabName="news" icon={<NewspaperIcon className="h-5 w-5" />} />
                                    <InfoTabButton label={t('profile.title')} tabName="profile" icon={<BuildingOfficeIcon className="h-5 w-5" />} />
                                    <InfoTabButton label={t('aiAnalysis.title')} tabName="analysis" icon={<SparklesIcon className="h-5 w-5" />} />
                                </div>
                                <div className="p-4 overflow-y-auto flex-grow">
                                {activeInfoTab === 'news' ? (
                                    <NewsFeed 
                                        ticker={selectedStock}
                                        articles={news}
                                        isLoading={isFetchingNews}
                                        error={newsError}
                                    />
                                    ) : activeInfoTab === 'profile' ? (
                                    <CompanyProfile
                                        profile={companyProfile}
                                        isLoading={isFetchingProfile}
                                        error={profileError}
                                    />
                                ) : (
                                    <AIComprehensiveAnalysis
                                        analysis={comprehensiveAnalysis}
                                        isLoading={isAnalyzingComprehensive}
                                        error={comprehensiveAnalysisError}
                                        onAnalyze={handleAnalyzeCompany}
                                    />
                                )}
                                </div>
                            </div>
                        </div>
                        <AIAnalysisPanel
                            analysis={aiAnalysis}
                            isLoading={isAnalyzing}
                            error={analysisError}
                            onAnalyze={handleAnalyze}
                            ticker={selectedStock}
                            currentStockInfo={stockInfo}
                            onTrade={handleTrade}
                            selectedIndicators={selectedIndicators}
                            onSelectedIndicatorsChange={setSelectedIndicators}
                        />
                    </>
                ) : (
                    <PortfolioView summary={portfolioSummary} trades={trades} historicalData={historicalPortfolioData} />
                )}
            </main>
            <StockComparisonModal
                isOpen={isCompareModalOpen}
                onClose={handleCloseCompareModal}
                data={compareError ? null : comparisonData}
                tickers={comparisonTickers}
                isLoading={isComparing}
            />
            <SettingsModal isOpen={isSettingsOpen} onClose={closeSettings} />
        </div>
    );
};

const App: React.FC = () => (
    <LanguageProvider>
        <SettingsProvider>
            <AppContent />
        </SettingsProvider>
    </LanguageProvider>
);


export default App;
