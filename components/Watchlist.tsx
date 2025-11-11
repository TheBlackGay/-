import React, { useState, useEffect, useRef } from 'react';
import { Stock, StockInfo } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './IconComponents';
import { useTranslations } from '../hooks/useTranslations';

interface WatchlistProps {
  stocks: Stock[];
  stockInfos: StockInfo[];
  selectedStock: string;
  onSelectStock: (ticker: string) => void;
  onAddStock: (ticker: string) => void;
  onCompare: (tickers: string[]) => void;
  isComparing: boolean;
}

const WatchlistItem: React.FC<{
  stockData: StockInfo;
  isSelected: boolean;
  onSelect: () => void;
  isSelectedForCompare: boolean;
  onToggleCompare: (ticker: string) => void;
}> = ({ stockData, isSelected, onSelect, isSelectedForCompare, onToggleCompare }) => {
    const isUp = stockData.change >= 0;
    const [flashClass, setFlashClass] = useState('');
    // FIX: Initialize `useRef` with `undefined` to satisfy TypeScript's expectation of an initial argument and correctly type the ref's `current` property as `number | undefined`.
    const prevPriceRef = useRef<number | undefined>(undefined);
    
    const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    useEffect(() => {
        if (prevPriceRef.current !== undefined && stockData.price !== prevPriceRef.current) {
            setFlashClass(stockData.price > prevPriceRef.current ? 'bg-green-500/30' : 'bg-red-500/30');
            const timer = setTimeout(() => setFlashClass(''), 300);
            return () => clearTimeout(timer);
        }
        prevPriceRef.current = stockData.price;
    }, [stockData.price]);
    
    const handleContainerClick = (e: React.MouseEvent) => {
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

const Watchlist: React.FC<WatchlistProps> = ({
  stocks,
  stockInfos,
  selectedStock,
  onSelectStock,
  onAddStock,
  onCompare,
  isComparing,
}) => {
  const { t } = useTranslations();
  const [compareSelection, setCompareSelection] = useState<Set<string>>(new Set());
  
  const handleToggleCompare = (ticker: string) => {
      setCompareSelection(prev => {
          const newSelection = new Set(prev);
          if (newSelection.has(ticker)) {
              newSelection.delete(ticker);
          } else if (newSelection.size < 3) {
              newSelection.add(ticker);
          }
          return newSelection;
      });
  };

  const handleCompareClick = () => {
    if (compareSelection.size >= 2) {
      onCompare(Array.from(compareSelection));
    }
  };

  return (
    <div className="flex-grow flex flex-col overflow-hidden">
      <div className="p-3 border-b border-gray-700">
        <h2 className="text-lg font-semibold text-gray-300">{t('watchlist.title')}</h2>
      </div>
      <div className="flex-grow overflow-y-auto">
        {stocks.map((stock) => {
          const info = stockInfos.find(i => i.ticker === stock.ticker);
          if (info) {
            return (
              <WatchlistItem
                key={info.ticker}
                stockData={info}
                isSelected={info.ticker === selectedStock}
                onSelect={() => onSelectStock(info.ticker)}
                isSelectedForCompare={compareSelection.has(info.ticker)}
                onToggleCompare={handleToggleCompare}
              />
            );
          }
          // Placeholder for loading stocks
          return (
            <div key={stock.ticker} className="flex justify-between items-center p-3 opacity-50">
              <div>
                <p className="font-bold text-white">{stock.ticker}</p>
                <p className="text-xs text-gray-400">{stock.name}</p>
              </div>
              <div className="text-xs text-gray-500">Loading...</div>
            </div>
          );
        })}
      </div>
       <div className="border-t border-gray-700">
            <div className="p-3 space-y-2">
                <button
                    onClick={handleCompareClick}
                    disabled={compareSelection.size < 2 || isComparing}
                    className="w-full bg-gray-700 hover:bg-gray-600 disabled:bg-gray-700/50 disabled:cursor-not-allowed text-white font-semibold py-2 text-sm rounded transition-colors"
                >
                    {isComparing ? '...' : `${t('compare.button', { count: compareSelection.size })}`}
                </button>
                {compareSelection.size < 2 && (
                    <p className="text-xs text-center text-gray-500">{t('compare.helperText')}</p>
                )}
            </div>
            <AddStockForm onAdd={onAddStock} />
       </div>
    </div>
  );
};

export default Watchlist;
