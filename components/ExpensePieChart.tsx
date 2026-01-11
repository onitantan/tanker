'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  dailyValue: number;
  category?: 'consumption' | 'waste' | 'investment' | null;
};

type ExpensePieChartProps = {
  transactions: Transaction[];
  viewMode: 'daily' | 'weekly' | 'monthly' | 'yearly';
};

// 分類ごとの色定義
const CATEGORY_COLORS: Record<string, string> = {
  consumption: '#3b82f6', // blue-500 (消費)
  waste: '#ef4444', // red-500 (浪費)
  investment: '#22c55e', // green-500 (投資)
};

// 分類ごとのラベル
const CATEGORY_LABELS: Record<string, string> = {
  consumption: '💧 消費',
  waste: '⚠️ 浪費',
  investment: '🌱 投資',
};

// カスタムツールチップ
const CustomTooltip = ({ active, payload, viewMode }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const unit = viewMode === 'daily' ? '日' : viewMode === 'weekly' ? '週' : viewMode === 'monthly' ? '月' : '年';
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
        <p className="font-bold text-slate-800">{data.name}</p>
        <p className="text-sm text-slate-600">
          {Math.abs(data.value).toLocaleString()}円/{unit}
        </p>
      </div>
    );
  }
  return null;
};

// カスタム凡例
const renderCustomLegend = (props: any) => {
  const { payload } = props;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-slate-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function ExpensePieChart({
  transactions,
  viewMode,
}: ExpensePieChartProps) {
  // 期間に応じた倍率を計算
  const getMultiplier = () => {
    if (viewMode === 'daily') return 1;
    if (viewMode === 'weekly') return 7;
    if (viewMode === 'monthly') return 30;
    return 365; // yearly
  };

  const multiplier = getMultiplier();

  // 期間に応じた単位ラベル
  const getUnitLabel = () => {
    if (viewMode === 'daily') return '1日あたり';
    if (viewMode === 'weekly') return '1週間あたり';
    if (viewMode === 'monthly') return '1ヶ月あたり';
    return '1年あたり';
  };

  // 支出のみをフィルタリングし、分類ごとに集計
  const expenseTransactions = transactions.filter((item) => item.type === 'expense');
  
  // 分類ごとに集計
  const categoryTotals: Record<string, number> = {
    consumption: 0,
    waste: 0,
    investment: 0,
  };

  expenseTransactions.forEach((item) => {
    const category = item.category || 'consumption'; // デフォルトは消費
    if (categoryTotals.hasOwnProperty(category)) {
      categoryTotals[category] += Math.abs(item.dailyValue) * multiplier;
    }
  });

  // グラフ用データに変換
  const expenseData = Object.entries(categoryTotals)
    .filter(([_, value]) => value > 0) // 値が0より大きいもののみ
    .map(([category, value]) => ({
      name: CATEGORY_LABELS[category],
      value: value,
      category: category,
    }));

  // データがない場合は何も表示しない
  if (expenseData.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
        支出の内訳（{getUnitLabel()}）
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={expenseData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={100}
            innerRadius={50}
            fill="#8884d8"
            dataKey="value"
          >
            {expenseData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CATEGORY_COLORS[entry.category] || '#94a3b8'}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip viewMode={viewMode} />} />
          <Legend content={renderCustomLegend} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
