import React from 'react';
import { \
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer \
} from 'recharts';
// ▼ ここで新しい「types」を読み込むように修正しました
import { Transaction } from '@/types';

type Props = {
  transactions: Transaction[];
};

const AssetTrendChart = ({ transactions }: Props) => {
  // 日付順（古い順）に並べ替え
  const sortedData = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 累積データを計算
  let currentTotal = 0;
  const data = sortedData.map(t => {
    const amount = t.type === 'income' ? Number(t.amount) : -Number(t.amount);
    currentTotal += amount;
    return {
      date: new Date(t.date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
      total: currentTotal,
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 10, fill: '#94a3b8' }} 
          tickLine={false} 
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis 
          tick={{ fontSize: 10, fill: '#94a3b8' }} 
          tickLine={false} 
          axisLine={false}
          width={40}
        />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#06b6d4" 
          strokeWidth={3} 
          dot={{ r: 0 }} 
          activeDot={{ r: 6, fill: '#06b6d4' }} 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default AssetTrendChart;