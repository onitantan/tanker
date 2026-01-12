'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  dailyValue: number;
  created_at?: string;
};

type DailyTrendChartProps = {
  transactions: Transaction[];
};

export default function DailyTrendChart({ transactions }: DailyTrendChartProps) {
  // 日付ごとにグループ化して収支を計算（直近30日間、One-timeを強調）
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
    const dailyMap = new Map<string, { income: number; expense: number; hasOneTime: boolean }>();

    filtered.forEach((item) => {
      if (!item.created_at) return;
      const date = new Date(item.created_at).toISOString().split('T')[0];
      const current = dailyMap.get(date) || { income: 0, expense: 0, hasOneTime: false };
      
      if (item.type === 'income') {
        current.income += item.amount;
      } else {
        current.expense += item.amount;
      }

      // One-timeの取引があるかチェック
      if (item.frequency === 'one_time') {
        current.hasOneTime = true;
      }
      
      dailyMap.set(date, current);
    });

    // 30日間の日付配列を作成
    const dateArray: string[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      dateArray.push(date.toISOString().split('T')[0]);
    }

    // 配列に変換
    const result = dateArray.map((date) => {
      const values = dailyMap.get(date) || { income: 0, expense: 0, hasOneTime: false };
      return {
        date: new Date(date).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        income: values.income,
        expense: -values.expense, // 負の値で表示
        balance: values.income - values.expense,
        hasOneTime: values.hasOneTime,
      };
    });

    return result;
  };

  const data = calculateDailyTrend();

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
          日次推移
        </h3>
        <div className="text-center text-slate-400 py-8">データがありません</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
        日次収支（直近30日間）
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: any, name: any) => {
              const numValue = value ?? 0;
              const nameStr = name ?? '';
              if (nameStr === 'expense') {
                return [`${Math.abs(numValue).toLocaleString()}円`, '支出'];
              }
              return [`${numValue.toLocaleString()}円`, nameStr === 'income' ? '収入' : '収支'];
            }}
            labelStyle={{ color: '#1e293b' }}
          />
          <Legend />
          <Bar dataKey="income" fill="#3b82f6" name="収入" />
          <Bar dataKey="expense" name="支出">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.hasOneTime ? '#dc2626' : '#ef4444'} // One-timeがある日は濃い赤
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
