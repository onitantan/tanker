'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  dailyValue: number;
  created_at?: string;
};

type AssetTrendChartProps = {
  transactions: Transaction[];
  initialAsset: number;
};

export default function AssetTrendChart({
  transactions,
  initialAsset,
}: AssetTrendChartProps) {
  // 日付ごとにグループ化して累積を計算（直近30日間）
  // 固定費（Monthly等を日割り）を毎日引き、One-timeの収入/支出を足し引き
  const calculateDailyTrend = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(today.getDate() - 30);

    // 過去の全取引を処理して初期資産を計算
    const allPastTransactions = transactions.filter((item) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate < thirtyDaysAgo;
    });

    let cumulative = initialAsset;
    allPastTransactions.forEach((item) => {
      const actualAmount = item.type === 'expense' ? -item.amount : item.amount;
      cumulative += actualAmount;
    });

    // 固定費（Daily/Weekly/Monthly/Yearly）の日割り計算
    const calculateDailyFixedCost = () => {
      let dailyCost = 0;
      transactions.forEach((item) => {
        if (item.frequency === 'one_time') return; // One-timeは除外
        
        let dailyAmount = 0;
        if (item.frequency === 'daily') dailyAmount = item.amount;
        else if (item.frequency === 'weekly') dailyAmount = item.amount / 7;
        else if (item.frequency === 'monthly') dailyAmount = item.amount / 30;
        else if (item.frequency === 'yearly') dailyAmount = item.amount / 365;
        
        if (item.type === 'expense') {
          dailyCost += dailyAmount;
        } else {
          dailyCost -= dailyAmount; // 収入は負の値
        }
      });
      return dailyCost;
    };

    const dailyFixedCost = calculateDailyFixedCost();

    // One-timeの取引を日付ごとにグループ化
    const oneTimeMap = new Map<string, number>();
    transactions.forEach((item) => {
      if (item.frequency !== 'one_time' || !item.created_at) return;
      const itemDate = new Date(item.created_at);
      if (itemDate < thirtyDaysAgo || itemDate > today) return;
      
      const date = itemDate.toISOString().split('T')[0];
      const current = oneTimeMap.get(date) || 0;
      const actualAmount = item.type === 'expense' ? -item.amount : item.amount;
      oneTimeMap.set(date, current + actualAmount);
    });

    // 30日間の日付配列を作成して計算
    const result: { date: string; value: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 固定費を毎日引く
      cumulative += dailyFixedCost;
      
      // One-timeの取引があれば加算
      if (oneTimeMap.has(dateStr)) {
        cumulative += oneTimeMap.get(dateStr)!;
      }
      
      result.push({
        date: date.toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' }),
        value: Math.round(cumulative),
      });
    }

    return result;
  };

  const data = calculateDailyTrend();

  if (data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
          資産推移（直近30日間）
        </h3>
        <div className="text-center text-slate-400 py-8">データがありません</div>
      </div>
    );
  }

  // 最初と最後の値を比較して傾向を判定
  const firstValue = data[0]?.value || initialAsset;
  const lastValue = data[data.length - 1]?.value || initialAsset;
  const isPositive = lastValue >= firstValue;
  const lineColor = isPositive ? '#22c55e' : '#ef4444'; // 緑または赤

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
        資産推移（直近30日間）
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()}円`, '資産']}
            labelStyle={{ color: '#1e293b' }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={lineColor}
            strokeWidth={2}
            dot={{ r: 4 }}
            name="資産"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
