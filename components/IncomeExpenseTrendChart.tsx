'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  dailyValue: number;
  tag?: string | null;
  created_at?: string;
};

type IncomeExpenseTrendChartProps = {
  transactions: Transaction[];
};

export default function IncomeExpenseTrendChart({ transactions }: IncomeExpenseTrendChartProps) {
  // 日付ごとにグループ化して収支を計算（直近30日間）
  const calculateDailyTrend = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // 直近30日間のデータのみをフィルタリング
    const filtered = transactions.filter((item) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= thirtyDaysAgo && itemDate <= today;
    });

    // 日付ごとにグループ化
    const dailyMap = new Map<string, { income: number; expense: number }>();

    filtered.forEach((item) => {
      if (!item.created_at) return;
      const date = new Date(item.created_at).toISOString().split('T')[0];
      const current = dailyMap.get(date) || { income: 0, expense: 0 };
      
      if (item.type === 'income') {
        current.income += item.amount;
      } else {
        current.expense += item.amount;
      }

      dailyMap.set(date, current);
    });

    // 30日間の日付配列を作成
    const result: { date: string; income: number; expense: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dailyData = dailyMap.get(dateStr) || { income: 0, expense: 0 };
      
      result.push({
        date: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        income: Math.round(dailyData.income),
        expense: Math.round(dailyData.expense),
      });
    }

    return result;
  };

  const data = calculateDailyTrend();

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 text-center whitespace-nowrap">
          収支推移（直近30日間）
        </h3>
        <div className="text-center text-slate-400 py-8">データがありません</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center whitespace-nowrap">
        収支推移（直近30日間）
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: number | undefined, name: string) => {
              const numValue = value ?? 0;
              const label = name === 'income' ? '収入' : '支出';
              return [`${numValue.toLocaleString()}円`, label];
            }}
            labelStyle={{ color: '#1e293b' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="income"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="収入"
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ r: 4 }}
            name="支出"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
