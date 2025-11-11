import React from 'react';
import { StockInfo, CompanyProfile as CompanyProfileType } from '../types';
import { ArrowUpIcon, ArrowDownIcon, LinkIcon, PlusCircleIcon, InformationCircleIcon } from './IconComponents';
import { useTranslations } from '../hooks/useTranslations';
import Tooltip from './Tooltip';

interface StockDetailsProps {
  info: StockInfo | null;
  profile: CompanyProfileType | null;
  isWatchlisted: boolean;
  onAddToWatchlist: (ticker: string, name: string) => void;
}

const DetailItem: React.FC<{ label: string, value: string | number, tooltipKey: string }> = ({ label, value, tooltipKey }) => {
    const { t } = useTranslations();
    return (
        <div className="flex justify-between items-center py-2 border-b border-gray-700/50">
            <div className="flex items-center space-x-1.5">
                <span className="text-sm text-gray-400">{label}</span>
                <Tooltip text={t(tooltipKey)}>
                    <InformationCircleIcon className="h-4 w-4 text-gray-500 cursor-pointer" />
                </Tooltip>
            </div>
            <span className="text-sm font-mono text-white">{value}</span>
        </div>
    );
};

const StockDetails: React.FC<StockDetailsProps> = ({ info, profile, isWatchlisted, onAddToWatchlist }) => {
  const { t } = useTranslations();
  const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  if (!info) {
    return (
      <div className="flex-grow p-4 bg-gray-800 rounded-lg mt-4 flex items-center justify-center">
        <p className="text-gray-500">{t('stockDetails.selectStock')}</p>
      </div>
    );
  }

  const isUp = info.change >= 0;
  const colorClass = isUp ? 'text-green-400' : 'text-red-400';

  return (
    <div className="flex-grow p-4 mt-4">
        <div className="flex items-center flex-wrap mb-2">
            <h2 className="text-3xl font-bold text-white mr-3">{info.ticker}</h2>
            <p className="text-lg text-gray-400 mr-3">{info.name}</p>
            {profile && profile.website && profile.website !== '#' && (
                <a 
                    href={profile.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="mr-3 text-gray-500 hover:text-cyan-400 transition-colors"
                    title={t('stockDetails.visitWebsite')}
                    aria-label={`Visit ${info.name} website`}
                >
                    <LinkIcon className="h-5 w-5" />
                </a>
            )}
            {!isWatchlisted && (
                <button
                    onClick={() => onAddToWatchlist(info.ticker, info.name)}
                    className="flex items-center text-sm text-gray-400 hover:text-cyan-400 transition-colors px-2 py-1 rounded-md bg-gray-700/50 hover:bg-gray-700"
                    title={t('stockDetails.addToWatchlist')}
                    aria-label={`Add ${info.name} to watchlist`}
                >
                    <PlusCircleIcon className="h-5 w-5 mr-1" />
                    <span>{t('stockDetails.addToWatchlist')}</span>
                </button>
            )}
        </div>
        <div className="flex items-end space-x-4 mb-4">
            <p className="text-4xl font-mono font-bold text-white">{formatCurrency(info.price, info.currency)}</p>
            <div className={`flex items-center text-xl font-semibold ${colorClass}`}>
                {isUp ? <ArrowUpIcon className="h-5 w-5" /> : <ArrowDownIcon className="h-5 w-5" />}
                <span>{info.change.toFixed(2)}</span>
                <span className="ml-2">({info.changePercent.toFixed(2)}%)</span>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8">
            <DetailItem label={t('stockDetails.open')} value={formatCurrency(info.open, info.currency)} tooltipKey="tooltips.open" />
            <DetailItem label={t('stockDetails.high')} value={formatCurrency(info.high, info.currency)} tooltipKey="tooltips.high" />
            <DetailItem label={t('stockDetails.low')} value={formatCurrency(info.low, info.currency)} tooltipKey="tooltips.low" />
            <DetailItem label={t('stockDetails.volume')} value={info.volume} tooltipKey="tooltips.volume" />
        </div>
        <DetailItem label={t('stockDetails.marketCap')} value={info.marketCap} tooltipKey="tooltips.marketCap" />
    </div>
  );
};

export default StockDetails;