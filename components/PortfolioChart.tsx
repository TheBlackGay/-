import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PortfolioHistoryPoint } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface PortfolioChartProps {
  data: PortfolioHistoryPoint[];
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  const { t } = useTranslations();
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 border border-gray-600 p-2 rounded shadow-lg text-sm">
        <p className="label text-gray-300">{`${t('stockChart.time')}: ${new Date(label).toLocaleString()}`}</p>
        <p className="font-bold text-cyan-400">{`${t('portfolioChart.value')}: $${payload[0].value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</p>
      </div>
    );
  }
  return null;
};

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  const { t } = useTranslations();
  if (data.length < 2) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-800 rounded-lg">
        <p className="text-gray-500">{t('portfolioChart.loading')}</p>
      </div>
    );
  }

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const domainMargin = (maxVal - minVal) * 0.1 || 10; // Add margin or a default if flat

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
          <XAxis 
            dataKey="time" 
            tickFormatter={(timeStr) => new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
            stroke="#a0aec0"
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            domain={[minVal - domainMargin, maxVal + domainMargin]} 
            stroke="#a0aec0"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            tick={{ fontSize: 12 }}
            orientation="right"
          />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="value" name={t('portfolioChart.value')} stroke="#22d3ee" strokeWidth={2} fillOpacity={1} fill="url(#portfolioGradient)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PortfolioChart;
