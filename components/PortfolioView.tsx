import React from 'react';
import { PortfolioSummary, PortfolioPosition, Trade, PortfolioHistoryPoint } from '../types';
import { ArrowUpIcon, ArrowDownIcon } from './IconComponents';
import PortfolioChart from './PortfolioChart';
import { useTranslations } from '../hooks/useTranslations';

const SummaryCard: React.FC<{ title: string; value: string; change: string; changePercent: string; isPositive: boolean }> = ({ title, value, change, changePercent, isPositive }) => (
    <div className="bg-gray-800 rounded-lg p-6">
        <p className="text-sm text-gray-400 mb-2">{title}</p>
        <p className="text-3xl font-bold text-white">{value}</p>
        <div className={`flex items-center mt-2 text-lg ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? <ArrowUpIcon className="h-5 w-5 mr-1" /> : <ArrowDownIcon className="h-5 w-5 mr-1" />}
            <span>{change}</span>
            <span className="text-sm ml-2">({changePercent})</span>
        </div>
    </div>
);


const PositionRow: React.FC<{ position: PortfolioPosition }> = ({ position }) => {
    const isPositive = position.totalGainLoss >= 0;
    const gainLossColor = isPositive ? 'text-green-400' : 'text-red-400';
    const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    return (
        <tr className="border-b border-gray-700 hover:bg-gray-800/50">
            <td className="p-4">
                <p className="font-bold text-white">{position.ticker}</p>
                <p className="text-xs text-gray-400">{position.name}</p>
            </td>
            <td className="p-4 font-mono text-white text-right">{position.shares}</td>
            <td className="p-4 font-mono text-white text-right">{formatCurrency(position.averageCost, position.currency)}</td>
            <td className="p-4 font-mono text-white text-right">{formatCurrency(position.currentPrice, position.currency)}</td>
            <td className="p-4 font-mono text-white text-right">{formatCurrency(position.currentValue, position.currency)}</td>
            <td className={`p-4 font-mono text-right ${gainLossColor}`}>
                {isPositive ? '+' : ''}{formatCurrency(position.totalGainLoss, position.currency)}
            </td>
            <td className={`p-4 font-mono text-right ${gainLossColor}`}>
                ({position.totalGainLossPercent.toFixed(2)}%)
            </td>
        </tr>
    );
};

const TradeHistoryRow: React.FC<{ trade: Trade }> = ({ trade }) => {
    const { t } = useTranslations();
    const isBuy = trade.type === 'BUY';
    const totalValue = trade.shares * trade.price;
    const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    return (
        <tr className="border-b border-gray-700 hover:bg-gray-800/50">
            <td className="p-4">
                <p className="font-bold text-white">{trade.ticker}</p>
            </td>
            <td className="p-4 text-center">
                <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full uppercase ${isBuy ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {isBuy ? t('aiPanel.buy') : t('aiPanel.sell')}
                </span>
            </td>
            <td className="p-4 font-mono text-white text-right">{trade.shares}</td>
            <td className="p-4 font-mono text-white text-right">{formatCurrency(trade.price, trade.currency)}</td>
            <td className="p-4 font-mono text-white text-right">{formatCurrency(totalValue, trade.currency)}</td>
            <td className="p-4 font-mono text-green-400/70 text-right">
                {trade.targetPrice ? formatCurrency(trade.targetPrice, trade.currency) : 'N/A'}
            </td>
            <td className="p-4 font-mono text-red-400/70 text-right">
                {trade.stopLoss ? formatCurrency(trade.stopLoss, trade.currency) : 'N/A'}
            </td>
            <td className="p-4 text-xs text-gray-400 text-right">{new Date(trade.timestamp).toLocaleString()}</td>
        </tr>
    );
};

interface PortfolioViewProps {
    summary: PortfolioSummary | null;
    trades: Trade[];
    historicalData: PortfolioHistoryPoint[];
}

const PortfolioView: React.FC<PortfolioViewProps> = ({ summary, trades, historicalData }) => {
    const { t } = useTranslations();
    if (!summary) {
        return <div className="p-8 text-center text-gray-500">{t('portfolio.calculating')}</div>;
    }

    const { totalValue, totalGainLoss, totalGainLossPercent, positions } = summary;
    const isOverallPositive = totalGainLoss >= 0;
    
    return (
        <div className="flex-grow p-6 bg-gray-900 overflow-y-auto">
            <h1 className="text-3xl font-bold text-white mb-6">{t('portfolio.title')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <SummaryCard
                    title={t('portfolio.totalValue')}
                    value={`$${totalValue.toFixed(2)}`}
                    change={`${isOverallPositive ? '+' : ''}${totalGainLoss.toFixed(2)}`}
                    changePercent={`${totalGainLossPercent.toFixed(2)}%`}
                    isPositive={isOverallPositive}
                />
            </div>

            <div className="bg-gray-800 rounded-lg p-4 mb-8">
                <h2 className="text-xl font-semibold text-white mb-4">{t('portfolio.history')}</h2>
                <PortfolioChart data={historicalData} />
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden mb-8">
                 <h2 className="text-xl font-semibold text-white p-4 border-b border-gray-700">{t('portfolio.positions')}</h2>
                 {positions.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-900 text-left text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">{t('portfolio.asset')}</th>
                                <th className="p-4 text-right">{t('portfolio.shares')}</th>
                                <th className="p-4 text-right">{t('portfolio.avgCost')}</th>
                                <th className="p-4 text-right">{t('portfolio.currentPrice')}</th>
                                <th className="p-4 text-right">{t('portfolio.currentValue')}</th>
                                <th className="p-4 text-right" colSpan={2}>{t('portfolio.totalPL')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {positions.map(pos => <PositionRow key={pos.ticker} position={pos} />)}
                        </tbody>
                    </table>
                 ) : (
                    <div className="p-8 text-center text-gray-500">
                        {t('portfolio.noPositions')}
                    </div>
                 )}
            </div>

            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <h2 className="text-xl font-semibold text-white p-4 border-b border-gray-700">{t('portfolio.tradeHistory')}</h2>
                {trades.length > 0 ? (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-900 text-left text-gray-400 uppercase tracking-wider">
                            <tr>
                                <th className="p-4">{t('portfolio.asset')}</th>
                                <th className="p-4 text-center">{t('portfolio.type')}</th>
                                <th className="p-4 text-right">{t('portfolio.shares')}</th>
                                <th className="p-4 text-right">{t('portfolio.price')}</th>
                                <th className="p-4 text-right">{t('portfolio.totalValueHeader')}</th>
                                <th className="p-4 text-right">{t('portfolio.targetPrice')}</th>
                                <th className="p-4 text-right">{t('portfolio.stopLoss')}</th>
                                <th className="p-4 text-right">{t('portfolio.timestamp')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...trades].reverse().map(trade => <TradeHistoryRow key={`${trade.ticker}-${trade.timestamp}`} trade={trade} />)}
                        </tbody>
                    </table>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        {t('portfolio.noTrades')}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PortfolioView;