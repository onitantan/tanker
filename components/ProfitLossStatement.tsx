'use client';

import { useState } from 'react';

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

type ProfitLossStatementProps = {
  transactions: Transaction[];
};

// タグのラベル定義
const TAG_LABELS: Record<string, string> = {
  food: '🍱 食費',
  daily: '🧻 日用品',
  transport: '🚃 交通費',
  housing: '🏠 住居・通信',
  social: '🍻 交際費',
  fun: '🎮 趣味・娯楽',
  medical: '🏥 医療費',
  education: '🎓 教育',
  other: '❓ その他',
};

// 生活維持費のタグ
const RUNNING_COST_TAGS = ['food', 'daily', 'transport', 'housing', 'medical', 'education'];

export default function ProfitLossStatement({ transactions }: ProfitLossStatementProps) {
  const [showRunningCostDetails, setShowRunningCostDetails] = useState(false);
  const [showDiscretionaryDetails, setShowDiscretionaryDetails] = useState(false);
  // 今月（Month to Date）のデータを取得
  const getCurrentMonthData = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions.filter((item) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= firstDayOfMonth;
    });
  };

  const monthData = getCurrentMonthData();

  // 売上（Income合計）
  const income = monthData
    .filter((item) => item.type === 'income')
    .reduce((acc, item) => acc + item.amount, 0);

  // 今月の日数を取得
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  // 固定費（Daily/Monthly/Yearlyの按分）
  const fixedExpenses = monthData
    .filter((item) => item.type === 'expense' && item.frequency !== 'one_time')
    .reduce((acc, item) => {
      // 日割り計算
      let monthlyAmount = 0;
      if (item.frequency === 'daily') monthlyAmount = item.amount * daysInMonth;
      else if (item.frequency === 'weekly') monthlyAmount = (item.amount / 7) * daysInMonth;
      else if (item.frequency === 'monthly') monthlyAmount = item.amount;
      else if (item.frequency === 'yearly') monthlyAmount = (item.amount / 365) * daysInMonth;
      
      return acc + monthlyAmount;
    }, 0);

  // One-timeの取引を生活維持費と変動費に分ける
  const oneTimeExpenses = monthData.filter(
    (item) => item.type === 'expense' && item.frequency === 'one_time'
  );

  // 生活維持費: 固定費 + One-timeの [食費, 日用品, 交通費, 住居, 医療費, 教育]
  const runningCostOneTime = oneTimeExpenses.filter((item) => {
    const tag = item.tag || 'other';
    return RUNNING_COST_TAGS.includes(tag);
  });

  const runningCostOneTimeTotal = runningCostOneTime.reduce((acc, item) => acc + item.amount, 0);
  const runningCosts = fixedExpenses + runningCostOneTimeTotal;

  // 変動費: 上記以外の One-time [交際費, 趣味, その他]
  const discretionaryExpenses = oneTimeExpenses.filter((item) => {
    const tag = item.tag || 'other';
    return !RUNNING_COST_TAGS.includes(tag);
  });

  const discretionaryTotal = discretionaryExpenses.reduce((acc, item) => acc + item.amount, 0);

  // 費用合計
  const totalExpenses = runningCosts + discretionaryTotal;

  // タグごとの集計（生活維持費のOne-time）
  const runningCostByTag: Record<string, number> = {};
  runningCostOneTime.forEach((item) => {
    const tag = item.tag || 'other';
    runningCostByTag[tag] = (runningCostByTag[tag] || 0) + item.amount;
  });

  // タグごとの集計（変動費）
  const discretionaryByTag: Record<string, number> = {};
  discretionaryExpenses.forEach((item) => {
    const tag = item.tag || 'other';
    discretionaryByTag[tag] = (discretionaryByTag[tag] || 0) + item.amount;
  });

  // 利益
  const profit = income - totalExpenses;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
        損益計算書（PL） - {new Date().getMonth() + 1}月（今月の成績表）
      </h3>
      <div className="space-y-4">
        {/* 売上 */}
        <div className="border-b border-slate-200 pb-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">売上</span>
            <span className="text-lg font-bold text-blue-600">
              {Math.round(income).toLocaleString()}円
            </span>
          </div>
        </div>

        {/* 費用 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">費用合計</span>
            <span className="text-sm font-bold text-red-600">
              {Math.round(totalExpenses).toLocaleString()}円
            </span>
          </div>
          <div className="pl-4 space-y-2">
            {/* 生活維持費 */}
            <div>
              <button
                onClick={() => setShowRunningCostDetails(!showRunningCostDetails)}
                className="flex justify-between items-center w-full text-left text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span>うち生活維持費（Running Costs）</span>
                <span className="font-bold">{Math.round(runningCosts).toLocaleString()}円</span>
                <span className="ml-2">{showRunningCostDetails ? '▼' : '▶'}</span>
              </button>
              {showRunningCostDetails && (
                <div className="pl-4 mt-1 space-y-1">
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <span>固定費（Fixed）</span>
                    <span>{Math.round(fixedExpenses).toLocaleString()}円</span>
                  </div>
                  {Object.entries(runningCostByTag).map(([tag, amount]) => (
                    <div key={tag} className="flex justify-between items-center text-xs text-slate-400">
                      <span>{TAG_LABELS[tag] || tag}</span>
                      <span>{Math.round(amount).toLocaleString()}円</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* 変動費 */}
            <div>
              <button
                onClick={() => setShowDiscretionaryDetails(!showDiscretionaryDetails)}
                className="flex justify-between items-center w-full text-left text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <span>うち変動費（Discretionary）</span>
                <span className="font-bold">{Math.round(discretionaryTotal).toLocaleString()}円</span>
                <span className="ml-2">{showDiscretionaryDetails ? '▼' : '▶'}</span>
              </button>
              {showDiscretionaryDetails && (
                <div className="pl-4 mt-1 space-y-1">
                  {Object.entries(discretionaryByTag).map(([tag, amount]) => (
                    <div key={tag} className="flex justify-between items-center text-xs text-slate-400">
                      <span>{TAG_LABELS[tag] || tag}</span>
                      <span>{Math.round(amount).toLocaleString()}円</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 利益 */}
        <div className="border-t border-slate-200 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">純利益（Profit）</span>
            <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{Math.round(profit).toLocaleString()}円
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
