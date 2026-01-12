// components/AnalyticsDashboard.tsx
import React from 'react';
import { Transaction } from '@/types';
// ↓もしファイル名が違うとエラーになるので、ファイル一覧にある名前と合わせています
import AssetTrendChart from './AssetTrendChart';
import ExpensePieChart from './ExpensePieChart';
// ↓ファイル一覧で途切れていましたが、おそらくこの名前のはずです
import IncomeExpenseBarChart from './IncomeExpenseBarChart';

type Props = {
  transactions: Transaction[];
};

const AnalyticsDashboard = ({ transactions }: Props) => {
  return (
    <div className="space-y-6">
      {/* 資産推移 */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="text-gray-600 font-bold mb-4 text-sm">📈 資産推移</h3>
        <div className="h-64">
           {transactions.length > 0 ? (
             <AssetTrendChart transactions={transactions} />
           ) : (
             <div className="h-full flex items-center justify-center text-gray-400 text-sm">データなし</div>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 収支バランス */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-600 font-bold mb-4 text-sm">⚖️ 収支バランス</h3>
          <div className="h-64">
            {/* ↓もしここが赤くなったら、ファイル名を確認してください */}
            <IncomeExpenseBarChart transactions={transactions} />
          </div>
        </div>

        {/* 支出の内訳 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-gray-600 font-bold mb-4 text-sm">🍩 支出の内訳</h3>
          <div className="h-64">
            <ExpensePieChart transactions={transactions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;