import React, { useMemo, useState, useEffect, useRef } from 'react';
// FIX: Added 'LineChart' to the recharts import to resolve 'Cannot find name' errors.
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, Line, BarChart, Bar, Cell, ComposedChart, ReferenceLine, LineChart } from 'recharts';
import { StockDataPoint, StockInfo } from '../types';
import { useTranslations } from '../hooks/useTranslations';
import Tooltip from './Tooltip';
import { InformationCircleIcon, SpinnerIcon, ExclamationTriangleIcon } from './IconComponents';

interface StockChartProps {
  data: StockDataPoint[];
  info: StockInfo | null;
  isLoading: boolean;
  error: string | null;
}

// Helper functions for indicators
const calculateSMA = (data: StockDataPoint[], period: number): (number | null)[] => {
    return data.map((d, i, arr) => {
        if (i < period - 1) return null;
        const slice = arr.slice(i - period + 1, i + 1);
        const sum = slice.reduce((acc, val) => acc + val.price, 0);
        return parseFloat((sum / period).toFixed(2));
    });
};

const calculateRSI = (data: StockDataPoint[], period: number = 14): (number | null)[] => {
    const rsiValues: (number | null)[] = Array(data.length).fill(null);
    if (data.length <= period) return rsiValues;

    const prices = data.map(d => d.price);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i-1];
        if (diff >= 0) gains += diff;
        else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period; i < prices.length; i++) {
        if (i > period) {
            const diff = prices[i] - prices[i-1];
            if (diff >= 0) {
                avgGain = (avgGain * (period - 1) + diff) / period;
                avgLoss = (avgLoss * (period - 1)) / period;
            } else {
                avgGain = (avgGain * (period - 1)) / period;
                avgLoss = (avgLoss * (period - 1) - diff) / period;
            }
        }
        if (avgLoss === 0) {
            rsiValues[i] = 100;
        } else {
            const rs = avgGain / avgLoss;
            rsiValues[i] = 100 - (100 / (1 + rs));
        }
    }
    return rsiValues;
};

const calculateMACD = (data: StockDataPoint[], shortPeriod: number = 12, longPeriod: number = 26, signalPeriod: number = 9): ({ macd: number; signal: number; histogram: number; } | null)[] => {
    const macdValues: ({ macd: number; signal: number; histogram: number; } | null)[] = Array(data.length).fill(null);
    if (data.length < longPeriod) return macdValues;

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
    const macdLine: (number | null)[] = Array(data.length).fill(null);

    for (let i = longPeriod - 1; i < data.length; i++) {
        macdLine[i] = emaShort[i] - emaLong[i];
    }
    
    const macdLineForSignal = macdLine.slice(longPeriod - 1);
    const signalLineData = calculateEMA(macdLineForSignal as number[], signalPeriod);
    const signalLine: (number | null)[] = [...Array(longPeriod - 1).fill(null), ...signalLineData];

    for (let i = longPeriod - 1; i < data.length; i++) {
        if (macdLine[i] !== null && signalLine[i] !== null) {
             macdValues[i] = {
                macd: macdLine[i] as number,
                signal: signalLine[i] as number,
                histogram: (macdLine[i] as number) - (signalLine[i] as number)
            };
        }
    }

    return macdValues;
};

const formatVolume = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return value.toString();
};

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  const { t } = useTranslations();
  const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
  
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const currency = data.currency || 'USD';
    return (
      <div className="bg-gray-800 border border-gray-600 p-2 rounded shadow-lg text-sm">
        {/* FIX: Provide arguments to `toLocaleTimeString` to resolve the error and ensure consistent formatting. */}
        <p className="label text-gray-300">{`${t('stockChart.time')}: ${new Date(label).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</p>
        {data.price && <p className="font-bold text-cyan-400">{`${t('stockChart.price')}: ${formatCurrency(data.price, currency)}`}</p>}
        {data.sma10 && <p className="font-bold text-yellow-400">{`SMA (10): ${formatCurrency(data.sma10, currency)}`}</p>}
        {data.rsi && <p className="font-bold text-purple-400">{`RSI (14): ${data.rsi.toFixed(2)}`}</p>}
        {data.macd && <p className="font-bold text-blue-400">{`MACD: ${data.macd.toFixed(2)}`}</p>}
        {data.signal && <p className="font-bold text-orange-400">{`Signal: ${data.signal.toFixed(2)}`}</p>}
        {data.volume && <p className="font-bold text-gray-300">{`${t('stockChart.volume')}: ${data.volume.toLocaleString()}`}</p>}
      </div>
    );
  }
  return null;
};

const IndicatorLegend: React.FC<{ items: { nameKey: string, color: string, tooltipKey: string }[] }> = ({ items }) => {
    const { t } = useTranslations();
    return (
        <div className="flex justify-center space-x-4 -mt-2">
            {items.map((item) => (
                <div key={item.nameKey} className="flex items-center space-x-2 text-xs text-gray-300">
                    <svg width="10" height="10" viewBox="0 0 10 10" className="mt-0.5"><rect width="10" height="10" fill={item.color} /></svg>
                    <span>{t(item.nameKey)}</span>
                    <Tooltip text={t(item.tooltipKey)}>
                        <InformationCircleIcon className="h-3.5 w-3.5 text-gray-500 cursor-pointer" />
                    </Tooltip>
                </div>
            ))}
        </div>
    );
};


const StockChart: React.FC<StockChartProps> = ({ data, info, isLoading, error }) => {
  const { t } = useTranslations();
  const priceRef = useRef<number>();
  const [flashClass, setFlashClass] = useState('');
  
  const formatCurrency = (value: number, currency: 'USD' | 'CNY') => new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

  const chartData = useMemo(() => {
    const sma10 = calculateSMA(data, 10);
    const rsi = calculateRSI(data);
    const macd = calculateMACD(data);

    return data.map((d, i, arr) => {
        const isUp = i > 0 && d.price >= arr[i-1].price;
        return { 
            ...d,
            currency: info?.currency,
            sma10: sma10[i],
            rsi: rsi[i],
            macd: macd[i]?.macd,
            signal: macd[i]?.signal,
            histogram: macd[i]?.histogram,
            volumeBarFill: i === 0 ? '#808080' : isUp ? '#22c55e' : '#ef4444',
            histogramBarFill: macd[i]?.histogram && macd[i]!.histogram > 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)',
        };
    });
  }, [data, info?.currency]);

    useEffect(() => {
        if (data.length > 0) {
            const currentLastPrice = data[data.length - 1].price;
            const previousPrice = priceRef.current;

            if (previousPrice !== undefined && previousPrice !== currentLastPrice) {
                setFlashClass(currentLastPrice > previousPrice ? 'shadow-green-500' : 'shadow-red-500');
                const timer = setTimeout(() => setFlashClass(''), 1000); // Flash for 1 second
                
                return () => clearTimeout(timer);
            }
            
            priceRef.current = currentLastPrice;
        }
    }, [data]);

  if (isLoading) {
    return (
      <div className="h-[700px] flex flex-col items-center justify-center bg-gray-800 rounded-lg">
        <SpinnerIcon className="h-12 w-12 text-cyan-400 mb-4" />
        <p className="text-gray-500">{t('stockChart.loading')}</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="h-[700px] flex flex-col items-center justify-center bg-gray-800 rounded-lg">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!info || data.length === 0) {
    return (
      <div className="h-[700px] flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-gray-500">{t('stockChart.noData')}</p>
      </div>
    );
  }

  const isUp = info.change >= 0;
  const strokeColor = isUp ? '#22c55e' : '#ef4444';
  const gradientColor = isUp ? 'url(#colorUv)' : 'url(#colorPv)';
  
  const minPrice = Math.min(...data.map(d => d.price));
  const maxPrice = Math.max(...data.map(d => d.price));
  const domainMargin = (maxPrice - minPrice) * 0.1;

  const priceLegendItems = [
      { nameKey: 'stockChart.price', color: strokeColor, tooltipKey: 'tooltips.price' },
      { nameKey: 'stockChart.sma10', color: '#facc15', tooltipKey: 'tooltips.sma10' }
  ];
  const rsiLegendItems = [{ nameKey: 'stockChart.rsi14', color: '#c084fc', tooltipKey: 'tooltips.rsi14' }];
  const macdLegendItems = [
      { nameKey: 'stockChart.macd', color: '#60a5fa', tooltipKey: 'tooltips.macd' },
      { nameKey: 'stockChart.signal9', color: '#fb923c', tooltipKey: 'tooltips.signal9' }
  ];

  return (
    <div className={`h-[700px] bg-gray-800 rounded-lg p-4 flex flex-col transition-shadow duration-1000 shadow-lg ${flashClass}`}>
      {/* Price Chart */}
      <ResponsiveContainer width="100%" height="50%">
        <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 0 }} syncId="stockSync">
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.4}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
            <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/><stop offset="95%" stopColor="#ef4444" stopOpacity={0}/></linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis dataKey="time" hide={true} />
          <YAxis domain={[minPrice - domainMargin, maxPrice + domainMargin]} stroke="#a0aec0" tickFormatter={(value) => formatCurrency(value as number, info.currency)} tick={{ fontSize: 12 }} />
          <RechartsTooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 10 }} />
          <Legend content={<IndicatorLegend items={priceLegendItems} />} verticalAlign="top" wrapperStyle={{paddingBottom: '10px'}} />
          <Area type="monotone" dataKey="price" name={t('stockChart.price')} stroke={strokeColor} strokeWidth={2} fillOpacity={1} fill={gradientColor} />
          <Line type="monotone" dataKey="sma10" name={t('stockChart.sma10')} stroke="#facc15" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
      
      {/* Volume Chart */}
      <ResponsiveContainer width="100%" height="15%">
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }} syncId="stockSync">
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis dataKey="time" hide={true} />
          <YAxis stroke="#a0aec0" tickFormatter={formatVolume} tick={{ fontSize: 12 }} domain={[0, 'dataMax * 1.8']} />
          <RechartsTooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 10 }} />
          <Bar dataKey="volume" name={t('stockChart.volume')}>
            {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.volumeBarFill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* MACD Chart */}
      <ResponsiveContainer width="100%" height="20%">
        <ComposedChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }} syncId="stockSync">
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="time" hide={true} />
            <YAxis stroke="#a0aec0" tick={{ fontSize: 12 }} tickFormatter={(value) => value.toFixed(2)} />
            <RechartsTooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 10 }} />
            <Legend content={<IndicatorLegend items={macdLegendItems} />} verticalAlign="top" />
            <ReferenceLine y={0} stroke="#a0aec0" strokeDasharray="3 3" />
            <Bar dataKey="histogram" name="Histogram">
                {chartData.map((entry, index) => <Cell key={`cell-macd-${index}`} fill={entry.histogramBarFill} />)}
            </Bar>
            <Line type="monotone" dataKey="macd" name="MACD" stroke="#60a5fa" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="signal" name="Signal" stroke="#fb923c" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>

      {/* RSI Chart */}
      <ResponsiveContainer width="100%" height="15%">
        <LineChart data={chartData} margin={{ top: 15, right: 20, left: -10, bottom: 5 }} syncId="stockSync">
            <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
            <XAxis dataKey="time" tickFormatter={(timeStr) => new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} stroke="#a0aec0" tick={{ fontSize: 12 }} />
            <YAxis stroke="#a0aec0" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <RechartsTooltip content={<CustomTooltip />} wrapperStyle={{ zIndex: 10 }} />
            <Legend content={<IndicatorLegend items={rsiLegendItems} />} verticalAlign="top" />
            <ReferenceLine y={70} label={{ value: t('stockChart.overbought'), fill: '#a0aec0', fontSize: 10, position: 'insideTopRight' }} stroke="#ef4444" strokeDasharray="3 3" />
            <ReferenceLine y={30} label={{ value: t('stockChart.oversold'), fill: '#a0aec0', fontSize: 10, position: 'insideBottomRight' }} stroke="#22c55e" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="rsi" name="RSI" stroke="#c084fc" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default StockChart;