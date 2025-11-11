import React, { useState, useEffect } from 'react';
import { AIAnalysisResult, StockInfo, TechnicalIndicator } from '../types';
import { TrendingUpIcon, TrendingDownIcon, MinusCircleIcon, StarIcon, InformationCircleIcon } from './IconComponents';
import { useTranslations } from '../hooks/useTranslations';

interface AIAnalysisPanelProps {
  analysis: AIAnalysisResult | null;
  isLoading: boolean;
  error: string | null;
  onAnalyze: () => void;
  ticker: string;
  currentStockInfo: StockInfo | null;
  onTrade: (ticker: string, shares: number, price: number, currency: 'USD' | 'CNY', type: 'BUY' | 'SELL', tradeParams?: { targetPrice?: number; stopLoss?: number }) => void;
  selectedIndicators: Set<TechnicalIndicator>;
  onSelectedIndicatorsChange: (indicators: Set<TechnicalIndicator>) => void;
}

const LoadingSkeleton: React.FC = () => (
    <div className="space-y-6 animate-pulse mt-4">
        <div className="h-24 bg-gray-700 rounded-lg w-full"></div>
        <div className="space-y-2">
            <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            <div className="h-3 bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
        </div>
        <div className="h-20 bg-gray-700 rounded-lg w-full"></div>
         <div className="h-20 bg-gray-700 rounded-lg w-full"></div>
    </div>
);

const SignalCard: React.FC<{ signal: 'BUY' | 'SELL' | 'HOLD' }> = ({ signal }) => {
    const { t } = useTranslations();
    const signalConfig = {
        BUY: {
            text: t('aiPanel.buy').toUpperCase(),
            icon: <TrendingUpIcon className="h-10 w-10" />,
            bg: 'bg-green-500/10 border-green-500',
            text_color: 'text-green-400',
        },
        SELL: {
            text: t('aiPanel.sell').toUpperCase(),
            icon: <TrendingDownIcon className="h-10 w-10" />,
            bg: 'bg-red-500/10 border-red-500',
            text_color: 'text-red-400',
        },
        HOLD: {
            text: t('aiPanel.hold').toUpperCase(),
            icon: <MinusCircleIcon className="h-10 w-10" />,
            bg: 'bg-gray-500/10 border-gray-500',
            text_color: 'text-gray-400',
        },
    };

    const config = signalConfig[signal];

    return (
        <div className={`flex flex-col items-center justify-center p-4 rounded-lg border ${config.bg} ${config.text_color}`}>
            {config.icon}
            <p className="text-3xl font-bold mt-2">{config.text}</p>
        </div>
    );
};

const ConfidenceMeter: React.FC<{ score: number }> = ({ score }) => {
    const { t } = useTranslations();
    return (
        <div>
            <h3 className="text-md font-semibold text-gray-300 mb-2">{t('aiPanel.confidence')}</h3>
            <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                    <StarIcon key={i} className={`h-5 w-5 ${i < score ? 'text-cyan-400' : 'text-gray-600'}`} />
                ))}
            </div>
        </div>
    );
};

const PriceLevels: React.FC<{
    analysis: AIAnalysisResult;
    tradeTargetPrice: string;
    onTradeTargetPriceChange: (value: string) => void;
    tradeStopLoss: string;
    onTradeStopLossChange: (value: string) => void;
    currency: 'USD' | 'CNY';
}> = ({ analysis, tradeTargetPrice, onTradeTargetPriceChange, tradeStopLoss, onTradeStopLossChange, currency }) => {
    const { t } = useTranslations();
    const formatCurrency = (value: number, cur: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    if (analysis.signal === 'HOLD') return null;

    return (
        <div className="space-y-2">
            <h3 className="text-md font-semibold text-gray-300 mb-2">{t('aiPanel.keyLevels')}</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-gray-900 p-2 rounded">
                    <p className="text-xs text-gray-400">{t('aiPanel.entry')}</p>
                    <p className="text-sm font-mono font-semibold text-white pt-1">{analysis.entryPrice ? formatCurrency(analysis.entryPrice, currency) : 'N/A'}</p>
                </div>
                <div className="bg-gray-900 p-2 rounded">
                    <p className="text-xs text-green-400">{t('aiPanel.target')}</p>
                    {analysis.signal === 'BUY' ? (
                        <input
                            type="number"
                            step="0.01"
                            value={tradeTargetPrice}
                            onChange={(e) => onTradeTargetPriceChange(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                    ) : (
                        <p className="text-sm font-mono font-semibold text-white pt-1">{analysis.targetPrice ? formatCurrency(analysis.targetPrice, currency) : 'N/A'}</p>
                    )}
                </div>
                <div className="bg-gray-900 p-2 rounded">
                    <p className="text-xs text-red-400">{t('aiPanel.stopLoss')}</p>
                    {analysis.signal === 'BUY' || analysis.signal === 'SELL' ? (
                         <input
                            type="number"
                            step="0.01"
                            value={tradeStopLoss}
                            onChange={(e) => onTradeStopLossChange(e.target.value)}
                            className="w-full bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-sm font-mono text-center focus:outline-none focus:ring-1 focus:ring-cyan-500"
                        />
                    ) : (
                        <p className="text-sm font-mono font-semibold text-white pt-1">{analysis.stopLoss ? formatCurrency(analysis.stopLoss, currency) : 'N/A'}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

const ExitStrategy: React.FC<{ strategy?: string }> = ({ strategy }) => {
    const { t } = useTranslations();
    if (!strategy) return null;

    return (
        <div>
            <h3 className="text-md font-semibold text-gray-300 mb-2 flex items-center">
                <InformationCircleIcon className="h-5 w-5 mr-2 text-cyan-400" />
                {t('aiPanel.exitStrategy')}
            </h3>
            <p className="text-sm text-gray-400 bg-gray-900 p-3 rounded-lg leading-relaxed border border-gray-700">
                {strategy}
            </p>
        </div>
    );
};

const TradeExecution: React.FC<{
    ticker: string;
    currentStockInfo: StockInfo | null;
    onTrade: (ticker: string, shares: number, price: number, currency: 'USD' | 'CNY', type: 'BUY' | 'SELL', tradeParams?: { targetPrice?: number; stopLoss?: number }) => void;
    tradeTargetPrice: string;
    tradeStopLoss: string;
}> = ({ ticker, currentStockInfo, onTrade, tradeTargetPrice, tradeStopLoss }) => {
    const { t } = useTranslations();
    const [shares, setShares] = useState('10');
    const [tradeFeedback, setTradeFeedback] = useState('');
    const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    const handleTrade = (type: 'BUY' | 'SELL') => {
        if (!currentStockInfo || !shares || parseInt(shares) <= 0) {
            setTradeFeedback('Please enter a valid number of shares.');
            return;
        }
        const { price, currency } = currentStockInfo;
        const numShares = parseInt(shares);
        
        const tradeParams: { targetPrice?: number; stopLoss?: number } = {};
        if (type === 'BUY') {
            if (tradeTargetPrice) tradeParams.targetPrice = parseFloat(tradeTargetPrice);
            if (tradeStopLoss) tradeParams.stopLoss = parseFloat(tradeStopLoss);
        } else if (type === 'SELL') {
            if (tradeStopLoss) tradeParams.stopLoss = parseFloat(tradeStopLoss);
        }

        onTrade(ticker, numShares, price, currency, type, Object.keys(tradeParams).length > 0 ? tradeParams : undefined);
        
        let feedback = type === 'BUY' 
            ? t('aiPanel.tradeFeedback.bought', { shares: numShares, ticker, price: formatCurrency(price, currency) })
            : t('aiPanel.tradeFeedback.sold', { shares: numShares, ticker, price: formatCurrency(price, currency) });

        if (type === 'BUY' && tradeParams.targetPrice) {
            feedback += ` ${t('aiPanel.tradeFeedback.target', { targetPrice: formatCurrency(tradeParams.targetPrice, currency) })}`;
        }
        if (tradeParams.stopLoss) {
            feedback += ` ${t('aiPanel.tradeFeedback.stopLoss', { stopLoss: formatCurrency(tradeParams.stopLoss, currency) })}`;
        }

        setTradeFeedback(feedback);
        setTimeout(() => setTradeFeedback(''), 4000); // Clear feedback after 4s
    };
    
    return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
            <h3 className="text-md font-semibold text-gray-300 mb-3">{t('aiPanel.tradeExecution')}</h3>
            <div className="flex items-center space-x-2">
                <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder={t('aiPanel.shares')}
                    className="w-20 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button onClick={() => handleTrade('BUY')} className="flex-1 bg-green-600 hover:bg-green-500 text-white font-semibold py-1 text-sm rounded transition-colors">
                    {t('aiPanel.buy')}
                </button>
                <button onClick={() => handleTrade('SELL')} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-1 text-sm rounded transition-colors">
                    {t('aiPanel.sell')}
                </button>
            </div>
            {tradeFeedback && <p className="text-xs text-cyan-400 mt-2 text-center">{tradeFeedback}</p>}
        </div>
    );
};

const IndicatorSelector: React.FC<{
    selected: Set<TechnicalIndicator>;
    onChange: (selection: Set<TechnicalIndicator>) => void;
}> = ({ selected, onChange }) => {
    const { t } = useTranslations();
    const indicators: { id: TechnicalIndicator; label: string }[] = [
        { id: 'sma10', label: t('aiPanel.indicatorSMA10') },
        { id: 'sma50', label: t('aiPanel.indicatorSMA50') },
        { id: 'rsi', label: t('aiPanel.indicatorRSI') },
        { id: 'macd', label: t('aiPanel.indicatorMACD') },
    ];

    const handleToggle = (indicatorId: TechnicalIndicator) => {
        const newSelection = new Set(selected);
        if (newSelection.has(indicatorId)) {
            newSelection.delete(indicatorId);
        } else {
            newSelection.add(indicatorId);
        }
        onChange(newSelection);
    };

    return (
        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
            <h3 className="text-md font-semibold text-gray-300 mb-3">{t('aiPanel.indicatorSelection')}</h3>
            <div className="grid grid-cols-2 gap-2">
                {indicators.map(({ id, label }) => (
                    <label key={id} className="flex items-center space-x-2 cursor-pointer p-2 rounded-md hover:bg-gray-800 transition-colors">
                        <input
                            type="checkbox"
                            checked={selected.has(id)}
                            onChange={() => handleToggle(id)}
                            className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-cyan-500 focus:ring-cyan-600"
                        />
                        <span className="text-sm text-gray-300">{label}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};


const AIAnalysisPanel: React.FC<AIAnalysisPanelProps> = ({ 
    analysis, 
    isLoading, 
    error, 
    onAnalyze, 
    ticker, 
    currentStockInfo, 
    onTrade,
    selectedIndicators,
    onSelectedIndicatorsChange
}) => {
    const { t } = useTranslations();
    const [tradeTargetPrice, setTradeTargetPrice] = useState('');
    const [tradeStopLoss, setTradeStopLoss] = useState('');

    useEffect(() => {
        if (analysis) {
            setTradeTargetPrice(analysis.targetPrice?.toFixed(2) ?? '');
            setTradeStopLoss(analysis.stopLoss?.toFixed(2) ?? '');
        } else {
            setTradeTargetPrice('');
            setTradeStopLoss('');
        }
    }, [analysis]);

    return (
        <div className="bg-gray-800/50 border-l border-gray-700 w-96 flex flex-col p-4">
            <h2 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-700 pb-3">{t('aiPanel.title')}</h2>
            <div className="flex-grow overflow-y-auto pr-2">
                {error && <div className="text-red-400 bg-red-900/50 p-3 rounded">{error}</div>}
                
                {isLoading ? (
                    <LoadingSkeleton />
                ) : analysis ? (
                    <div className="space-y-6">
                        <SignalCard signal={analysis.signal} />
                        <ConfidenceMeter score={analysis.confidence} />
                        <div>
                           <h3 className="text-md font-semibold text-gray-300 mb-2">{t('aiPanel.takeaways')}</h3>
                           <ul className="list-disc list-inside space-y-1 text-sm text-gray-400 bg-gray-900 p-3 rounded-lg border border-gray-700">
                               {analysis.summary.map((point, index) => (
                                   <li key={index} className="leading-relaxed">{point}</li>
                               ))}
                           </ul>
                        </div>
                        {currentStockInfo && (
                            <PriceLevels 
                              analysis={analysis} 
                              tradeTargetPrice={tradeTargetPrice}
                              onTradeTargetPriceChange={setTradeTargetPrice}
                              tradeStopLoss={tradeStopLoss}
                              onTradeStopLossChange={setTradeStopLoss}
                              currency={currentStockInfo.currency}
                            />
                        )}
                        <TradeExecution 
                            ticker={ticker} 
                            currentStockInfo={currentStockInfo} 
                            onTrade={onTrade}
                            tradeTargetPrice={tradeTargetPrice}
                            tradeStopLoss={tradeStopLoss}
                        />
                        <ExitStrategy strategy={analysis.sellStrategy} />
                    </div>
                ) : (
                    <p className="text-gray-500 text-center mt-10">{t('aiPanel.prompt', { ticker })}</p>
                )}
            </div>
            <div className="mt-4 space-y-4">
                <IndicatorSelector selected={selectedIndicators} onChange={onSelectedIndicatorsChange} />
                <button
                    onClick={onAnalyze}
                    disabled={isLoading}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                >
                    {isLoading ? t('aiPanel.analyzing', { ticker }) : t('aiPanel.analyze', { ticker })}
                </button>
            </div>
        </div>
    );
};

export default AIAnalysisPanel;