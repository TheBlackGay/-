import React from 'react';
import { XCircleIcon } from './IconComponents';
import { ComparisonDataPoint } from '../types';
import StockComparisonChart from './StockComparisonChart';
import { useTranslations } from '../hooks/useTranslations';

interface StockComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ComparisonDataPoint[] | null;
  tickers: string[];
  isLoading: boolean;
}

const StockComparisonModal: React.FC<StockComparisonModalProps> = ({ isOpen, onClose, data, tickers, isLoading }) => {
    const { t } = useTranslations();
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="comparison-modal-title"
        >
            <div 
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col p-6 border border-gray-700"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-gray-700 pb-3 mb-4">
                    <h2 id="comparison-modal-title" className="text-2xl font-bold text-white">
                        {t('compare.modalTitle')}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label={t('notifications.close')}>
                        <XCircleIcon className="h-8 w-8" />
                    </button>
                </div>
                <div className="flex-grow min-h-0">
                    {isLoading ? (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-gray-400">{t('compare.loading')}</p>
                        </div>
                    ) : data ? (
                        <StockComparisonChart data={data} tickers={tickers} />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <p className="text-red-400">{t('compare.error')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockComparisonModal;
