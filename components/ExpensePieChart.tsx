import React from 'react';
import { \
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend \
} from 'recharts';
import { Transaction } from '@/types';

type Props = {
  transactions: Transaction[];
};

const COLORS = ['#22d3ee', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#94a3b8'];

const ExpensePieChart = ({ transactions }: Props) => {
  // 支出のみを抽出し、タグごとの合計を集計
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const categorySummary = expenses.reduce((acc, t) => {
    // タグがない場合は「その他」にする
    const tag = t.tag || t.category || 'その他';
    // 金額を加算
    acc[tag] = (acc[tag] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  // グラフ用データ形式に変換
  const data = Object.entries(categorySummary)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value); // 金額が大きい順

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={70}
          paddingAngle={4}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend 
          layout="vertical" 
          verticalAlign="middle" 
          align="right"
          iconSize={8}
          wrapperStyle={{ fontSize: '10px' }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default ExpensePieChart;