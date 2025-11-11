import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ComparisonDataPoint } from '../types';
import { useTranslations } from '../hooks/useTranslations';

interface StockComparisonChartProps {
  data: ComparisonDataPoint[];
  tickers: string[];
}

const COLORS = ['#22d3ee', '#facc15', '#a78bfa']; // cyan, yellow, purple

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
    const { t } = useTranslations();
    if (active && payload && payload.length) {
        return (
            <div className="bg-gray-900 border border-gray-600 p-3 rounded shadow-lg text-sm">
                <p className="label text-gray-300 mb-2">{`${t('stockChart.time')}: ${new Date(label).toLocaleString()}`}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.color }} className="font-semibold">
                        {`${pld.name}: ${pld.value.toFixed(2)}%`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const StockComparisonChart: React.FC<StockComparisonChartProps> = ({ data, tickers }) => {
    const { t } = useTranslations();
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart
                data={data}
                margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                }}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis 
                    dataKey="time" 
                    tickFormatter={(timeStr) => new Date(timeStr).toLocaleDateString([], { month: 'short', day: 'numeric' })} 
                    stroke="#a0aec0"
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    stroke="#a0aec0"
                    tickFormatter={(value) => `${value.toFixed(0)}%`}
                    tick={{ fontSize: 12 }}
                    label={{ value: t('compare.yAxisLabel'), angle: -90, position: 'insideLeft', fill: '#a0aec0' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {tickers.map((ticker, index) => (
                    <Line
                        key={ticker}
                        type="monotone"
                        dataKey={ticker}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={false}
                    />
                ))}
            </LineChart>
        </ResponsiveContainer>
    );
};

export default StockComparisonChart;
