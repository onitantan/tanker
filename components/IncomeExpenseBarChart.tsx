import React from 'react';
// ↓ 記号を削除しました
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Transaction } from '../types';

type Props = {
  transactions: Transaction[];
};

const IncomeExpenseBarChart = ({ transactions }: Props) => {
  const summary = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') acc.income += Number(t.amount);
      else acc.expense += Number(t.amount);
      return acc;
    },
    { income: 0, expense: 0 }
  );

  const data = [
    { name: '収入', value: summary.income, color: '#22d3ee' },
    { name: '支出', value: summary.expense, color: '#f87171' },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" barSize={30}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          tick={{ fontSize: 12, fill: '#64748b' }} 
          tickLine={false} 
          axisLine={false}
          width={40}
        />
        <Tooltip cursor={{ fill: 'transparent' }} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
};

export default IncomeExpenseBarChart;