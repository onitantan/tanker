'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import ExpensePieChart from '@/components/ExpensePieChart';
import IncomeExpenseBarChart from '@/components/IncomeExpenseBarChart';

// 型定義（データベースから取得する型）
type TransactionDB = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'daily' | 'monthly' | 'yearly';
};

// 表示用の型（dailyValueを追加）
type Transaction = TransactionDB & {
  dailyValue: number;
};

type ViewMode = 'daily' | 'monthly' | 'yearly';

export default function Home() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'expense',
    frequency: 'monthly',
  });

  // 日割り計算
  const calculateDailyValue = (amount: number, frequency: string, type: string) => {
    let dailyVal = 0;
    if (frequency === 'daily') dailyVal = amount;
    else if (frequency === 'monthly') dailyVal = amount / 30;
    else if (frequency === 'yearly') dailyVal = amount / 365;
    return type === 'expense' ? -dailyVal : dailyVal;
  };

  // データベースから取得したデータを表示用の型に変換
  const transformTransaction = (dbItem: TransactionDB): Transaction => {
    return {
      ...dbItem,
      dailyValue: calculateDailyValue(dbItem.amount, dbItem.frequency, dbItem.type),
    };
  };

  // データ取得
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        if (data) {
          const transformedData = data.map(transformTransaction);
          setItems(transformedData);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    fetchTransactions();
  }, []);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const amountNum = parseInt(formData.amount);

    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([
          {
            name: formData.name,
            amount: amountNum,
            type: formData.type,
            frequency: formData.frequency,
          },
        ])
        .select();

      if (error) {
        console.error('Error inserting transaction:', error);
        return;
      }

      if (data && data.length > 0) {
        // データを再取得して画面を更新
        const { data: allData, error: fetchError } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!fetchError && allData) {
          const transformedData = allData.map(transformTransaction);
          setItems(transformedData);
        }
      }

      setFormData({ ...formData, name: '', amount: '' });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return;
      }

      // データを再取得して画面を更新
      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fetchError && data) {
        const transformedData = data.map(transformTransaction);
        setItems(transformedData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 期間に応じた倍率を計算
  const getMultiplier = () => {
    if (viewMode === 'daily') return 1;
    if (viewMode === 'monthly') return 30;
    return 365; // yearly
  };

  // 期間に応じた合計額を計算
  const getTotalBalance = () => {
    const multiplier = getMultiplier();
    return items.reduce((acc, item) => acc + item.dailyValue * multiplier, 0);
  };

  // 期間に応じた表示値を計算
  const getDisplayValue = (dailyValue: number) => {
    const multiplier = getMultiplier();
    return dailyValue * multiplier;
  };

  // 期間に応じたラベルを取得
  const getBalanceLabel = () => {
    if (viewMode === 'daily') return "Today's Balance";
    if (viewMode === 'monthly') return "Monthly Balance";
    return "Yearly Balance";
  };

  // 期間に応じた単位ラベルを取得
  const getUnitLabel = () => {
    if (viewMode === 'daily') return '1日あたりの収支';
    if (viewMode === 'monthly') return '1ヶ月あたりの収支';
    return '1年あたりの収支';
  };

  const totalBalance = getTotalBalance();

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <main className="max-w-4xl mx-auto space-y-6">
        {/* タイトルと期間切り替えタブ */}
        <div className="text-center space-y-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">Tanker</h1>
            <p className="text-slate-500 mt-2">今日の生存コストを可視化</p>
          </div>
          
          {/* 期間切り替えタブ */}
          <div className="flex justify-center gap-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                viewMode === 'daily'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              日次
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              月次
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-6 py-2 rounded-lg font-bold transition-colors ${
                viewMode === 'yearly'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              年次
            </button>
          </div>
        </div>

        {/* Balance表示 */}
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center border border-slate-100">
          <h2 className="text-xs font-bold text-slate-400 uppercase mb-2">
            {getBalanceLabel()}
          </h2>
          <div className={`text-5xl font-black ${totalBalance >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
            {totalBalance >= 0 ? '+' : ''}{Math.round(totalBalance).toLocaleString()}
            <span className="text-xl text-slate-400 ml-1">円</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{getUnitLabel()}</p>
        </div>

        {/* グラフエリア */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <IncomeExpenseBarChart transactions={items} viewMode={viewMode} />
          <ExpensePieChart transactions={items} viewMode={viewMode} />
        </div>

        <form onSubmit={handleAddItem} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">項目</label>
              <input
                type="text"
                className="w-full p-2 border rounded-lg"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="例: ランチ"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">金額</label>
              <input
                type="number"
                className="w-full p-2 border rounded-lg"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">タイプ</label>
              <select
                className="w-full p-2 border rounded-lg bg-white"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="expense">支出</option>
                <option value="income">収入</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">頻度</label>
              <select
                className="w-full p-2 border rounded-lg bg-white"
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              >
                <option value="daily">毎日</option>
                <option value="monthly">毎月</option>
                <option value="yearly">毎年</option>
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold">
            追加
          </button>
        </form>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
              <div className="flex-1">
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-slate-400">{item.amount.toLocaleString()}円 ({item.frequency})</p>
              </div>
              <div className={`font-bold mr-4 ${item.dailyValue >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                {item.dailyValue >= 0 ? '+' : ''}
                {Math.round(getDisplayValue(item.dailyValue)).toLocaleString()}円
                {viewMode === 'daily' ? '/日' : viewMode === 'monthly' ? '/月' : '/年'}
              </div>
              <button
                onClick={() => handleDeleteItem(item.id)}
                className="text-red-500 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                aria-label="削除"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}