'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  dailyValue: number;
  category?: 'consumption' | 'waste' | 'investment' | null;
};

type IncomeExpenseBarChartProps = {
  transactions: Transaction[];
  viewMode: 'daily' | 'weekly' | 'monthly' | 'yearly';
};

// カスタムツールチップ
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            <span className="font-bold">{entry.name}:</span>{' '}
            {Math.abs(entry.value).toLocaleString()}円
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function IncomeExpenseBarChart({
  transactions,
  viewMode,
}: IncomeExpenseBarChartProps) {
  // 期間に応じた倍率を計算
  const getMultiplier = () => {
    if (viewMode === 'daily') return 1;
    if (viewMode === 'weekly') return 7;
    if (viewMode === 'monthly') return 30;
    return 365; // yearly
  };

  const multiplier = getMultiplier();

  // 収入と支出を集計（one_timeは除外）
  const incomeTotal = transactions
    .filter((item) => item.type === 'income' && item.frequency !== 'one_time')
    .reduce((acc, item) => acc + item.dailyValue * multiplier, 0);

  const expenseTotal = transactions
    .filter((item) => item.type === 'expense' && item.frequency !== 'one_time')
    .reduce((acc, item) => acc + Math.abs(item.dailyValue) * multiplier, 0);

  const data = [
    {
      name: '収入',
      value: incomeTotal,
    },
    {
      name: '支出',
      value: expenseTotal,
    },
  ];

  // データがない場合は何も表示しない
  if (incomeTotal === 0 && expenseTotal === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
        収支比較
      </h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="value" radius={[8, 8, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={index === 0 ? '#3b82f6' : '#ef4444'} // 収入は青、支出は赤
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
