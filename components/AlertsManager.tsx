import React, { useState, useEffect } from 'react';
import { PriceAlert } from '../types';
import { BellIcon, XCircleIcon } from './IconComponents';
import { useTranslations } from '../hooks/useTranslations';

interface AlertsManagerProps {
  alerts: PriceAlert[];
  selectedStock: string;
  onAddAlert: (alert: Omit<PriceAlert, 'id' | 'status' | 'currency'>) => void;
  onRemoveAlert: (id: string) => void;
}

const AlertsManager: React.FC<AlertsManagerProps> = ({ alerts, selectedStock, onAddAlert, onRemoveAlert }) => {
    const { t } = useTranslations();
    const [ticker, setTicker] = useState(selectedStock);
    const [price, setPrice] = useState('');
    const [condition, setCondition] = useState<'above' | 'below'>('above');

    useEffect(() => {
        setTicker(selectedStock);
        setPrice('');
    }, [selectedStock]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const targetPrice = parseFloat(price);
        if (ticker.trim() && !isNaN(targetPrice) && targetPrice > 0) {
            onAddAlert({ ticker: ticker.trim().toUpperCase(), targetPrice, condition });
            setPrice('');
        }
    };

    const activeAlerts = alerts.filter(a => a.status === 'active');
    const triggeredAlerts = alerts.filter(a => a.status === 'triggered');
    
    const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

    const AlertItem: React.FC<{ alert: PriceAlert }> = ({ alert }) => (
        <li className="flex justify-between items-center text-sm p-2 rounded bg-gray-700/50">
            <div>
                <span className="font-bold">{alert.ticker}</span>
                <span className={`ml-2 ${alert.condition === 'above' ? 'text-green-400' : 'text-red-400'}`}>
                    {alert.condition === 'above' ? '>' : '<'} {formatCurrency(alert.targetPrice, alert.currency)}
                </span>
            </div>
            <button onClick={() => onRemoveAlert(alert.id)} className="text-gray-500 hover:text-white">
                <XCircleIcon className="h-5 w-5" />
            </button>
        </li>
    );

    return (
        <div className="bg-gray-800/50 border-t border-gray-700 p-3 flex flex-col">
            <h2 className="text-lg font-semibold text-gray-300 flex items-center mb-3">
                <BellIcon className="h-5 w-5 mr-2 text-cyan-400" />
                {t('alerts.title')}
            </h2>
            <form onSubmit={handleSubmit} className="mb-4">
                <div className="flex flex-col space-y-2">
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder="Ticker"
                        className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        readOnly
                    />
                    <div className="flex space-x-2">
                         <input
                            type="number"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder={t('alerts.targetPrice')}
                            className="flex-grow bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <select
                            value={condition}
                            onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                            className="bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            <option value="above">{t('alerts.above')}</option>
                            <option value="below">{t('alerts.below')}</option>
                        </select>
                    </div>
                    <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-1 text-sm rounded transition-colors">
                        {t('alerts.setAlert')}
                    </button>
                </div>
            </form>

            <div className="flex-grow overflow-y-auto space-y-3" style={{maxHeight: '200px'}}>
                <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('alerts.active')}</h3>
                    {activeAlerts.length > 0 ? (
                        <ul className="space-y-1">
                            {activeAlerts.map(alert => <AlertItem key={alert.id} alert={alert} />)}
                        </ul>
                    ) : <p className="text-xs text-gray-500">{t('alerts.noActive')}</p>}
                </div>
                 <div>
                    <h3 className="text-sm font-semibold text-gray-400 mb-2">{t('alerts.triggered')}</h3>
                     {triggeredAlerts.length > 0 ? (
                        <ul className="space-y-1">
                            {triggeredAlerts.map(alert => <AlertItem key={alert.id} alert={alert} />)}
                        </ul>
                    ) : <p className="text-xs text-gray-500">{t('alerts.noTriggered')}</p>}
                </div>
            </div>
        </div>
    );
};

export default AlertsManager;