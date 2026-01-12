import React from 'react';
// ↓ 記号を削除しました
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Transaction } from '../types';

type Props = {
  transactions: Transaction[];
};

const COLORS = ['#22d3ee', '#34d399', '#f87171', '#fbbf24', '#a78bfa', '#f472b6', '#94a3b8'];

const ExpensePieChart = ({ transactions }: Props) => {
  const expenses = transactions.filter(t => t.type === 'expense');
  
  const categorySummary = expenses.reduce((acc, t) => {
    const tag = t.tag || t.category || 'その他';
    acc[tag] = (acc[tag] || 0) + Number(t.amount);
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(categorySummary)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

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