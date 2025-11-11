import React, { useState, useEffect } from 'react';
import { Stock, StockInfo } from '../types';
import { fetchCurrentStockInfo } from '../services/stockService';
import { ArrowUpIcon, ArrowDownIcon } from './IconComponents';
import { useTranslations } from '../hooks/useTranslations';

interface WatchlistProps {
  stocks: Stock[];
  selectedStock: string;
  onSelectStock: (ticker: string) => void;
  onAddStock: (ticker: string) => void;
  updates: number;
  onCompare: (tickers: string[]) => void;
  isComparing: boolean;
}

interface WatchlistItemData extends StockInfo {
    lastPrice?: number;
}

const WatchlistItem: React.FC<{
  stockData: WatchlistItemData;
  isSelected: boolean;
  onSelect: () => void;
  isSelectedForCompare: boolean;
  onToggleCompare: (ticker: string) => void;
}> = ({ stockData, isSelected, onSelect, isSelectedForCompare, onToggleCompare }) => {
    const isUp = stockData.change >= 0;
    const [flashClass, setFlashClass] = useState('');
    
    const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    useEffect(() => {
        if(stockData.price !== stockData.lastPrice && stockData.lastPrice !== undefined) {
            setFlashClass(stockData.price > stockData.lastPrice ? 'bg-green-500/30' : 'bg-red-500/30');
            const timer = setTimeout(() => setFlashClass(''), 300);
            return () => clearTimeout(timer);
        }
    }, [stockData.price, stockData.lastPrice]);
    
    const handleContainerClick = (e: React.MouseEvent) => {
        // Prevent row selection when clicking the checkbox input
        if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') {
            return;
        }
        onSelect();
    };


    return (
        <div
            onClick={handleContainerClick}
            className={`flex justify-between items-center p-3 cursor-pointer border-l-4 transition-all duration-200 ${
            isSelected ? 'border-cyan-400 bg-gray-700' : 'border-transparent hover:bg-gray-700/50'
            } ${flashClass} ${isSelectedForCompare ? 'bg-cyan-900/50' : ''}`}
        >
            <div className="flex items-center">
                 <input
                    type="checkbox"
                    checked={isSelectedForCompare}
                    onChange={() => onToggleCompare(stockData.ticker)}
                    className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600 mr-4"
                    aria-label={`Select ${stockData.ticker} for comparison`}
                />
                <div>
                    <p className="font-bold text-white">{stockData.ticker}</p>
                    <p className="text-xs text-gray-400">{stockData.name}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-mono font-semibold text-white">{formatCurrency(stockData.price, stockData.currency)}</p>
                <div className={`flex items-center justify-end text-xs ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                    {isUp ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
                    <span>{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)</span>
                </div>
            </div>
        </div>
    );
};

const AddStockForm: React.FC<{ onAdd: (ticker: string) => void }> = ({ onAdd }) => {
    const { t } = useTranslations();
    const [ticker, setTicker] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (ticker.trim()) {
            onAdd(ticker.trim());
            setTicker('');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-3">
            <div className="flex space-x-2">
                <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder={t('watchlist.addPlaceholder')}
                    className="flex-grow bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold px-3 py-1 text-sm rounded transition-colors">
                    {t('watchlist.addButton')}
                </button>
            </div>
        </form>
    );
};


const Watchlist: React.FC<WatchlistProps> = ({ stocks, selectedStock, onSelectStock, onAddStock, updates, onCompare, isComparing }) => {
    const { t } = useTranslations();
    const [watchlistData, setWatchlistData] = useState<Map<string, WatchlistItemData>>(new Map());
    const [comparisonSelection, setComparisonSelection] = useState<string[]>([]);

    const handleSelectionChange = (ticker: string) => {
        setComparisonSelection(prev => {
            if (prev.includes(ticker)) {
                return prev.filter(t => t !== ticker);
            }
            if (prev.length < 3) {
                return [...prev, ticker];
            }
            // Logic to notify user about limit could be added here
            return prev;
        });
    };

    useEffect(() => {
        const fetchWatchlistData = async () => {
            const promises = stocks.map(stock => fetchCurrentStockInfo(stock.ticker));
            const results = await Promise.all(promises);
            const newWatchlistData = new Map<string, WatchlistItemData>();
            results.forEach(info => {
                const oldData = watchlistData.get(info.ticker);
                newWatchlistData.set(info.ticker, {...info, lastPrice: oldData ? oldData.price : info.price});
            });
            setWatchlistData(newWatchlistData);
        };

        fetchWatchlistData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stocks, updates]);

  return (
    <div className="bg-gray-800/50 flex flex-col flex-grow min-h-0">
      <h2 className="text-lg font-semibold p-3 border-b border-gray-700 text-gray-300">{t('watchlist.title')}</h2>
      <div className="flex-grow overflow-y-auto">
        {stocks.map(stock => {
            const data = watchlistData.get(stock.ticker);
            return data ? (
                <WatchlistItem
                    key={stock.ticker}
                    stockData={data}
                    isSelected={selectedStock === stock.ticker}
                    onSelect={() => onSelectStock(stock.ticker)}
                    isSelectedForCompare={comparisonSelection.includes(stock.ticker)}
                    onToggleCompare={handleSelectionChange}
                />
            ) : null;
        })}
      </div>
      <div className="p-3 border-t border-gray-700">
        <button
            onClick={() => {
                onCompare(comparisonSelection);
                setComparisonSelection([]); // Clear selection after initiating compare
            }}
            disabled={isComparing || comparisonSelection.length < 2 || comparisonSelection.length > 3}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors duration-200"
        >
            {isComparing ? t('compare.loading') : t('compare.button', { count: comparisonSelection.length })}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">{t('compare.helperText')}</p>
        <AddStockForm onAdd={onAddStock} />
      </div>
    </div>
  );
};

export default Watchlist;