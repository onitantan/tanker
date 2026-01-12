'use client';

/**
 * データベースマイグレーション（Supabase SQL Editorで実行してください）:
 * 
 * ALTER TABLE transactions 
 * ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';
 * 
 * 注意: 既存のレコードには 'cash' がデフォルトで設定されます。
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import LiquidTankBackground from '@/components/LiquidTankBackground';
import ExpensePieChart from '@/components/ExpensePieChart';
import IncomeExpenseBarChart from '@/components/IncomeExpenseBarChart';
import AssetTrendChart from '@/components/AssetTrendChart';
import DailyTrendChart from '@/components/DailyTrendChart';
import IncomeExpenseTrendChart from '@/components/IncomeExpenseTrendChart';
import ProfitLossStatement from '@/components/ProfitLossStatement';
import BalanceSheet from '@/components/BalanceSheet';
import AuthGuard from '@/components/AuthGuard';

// 型定義（データベースから取得する型）
type TransactionDB = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: 'consumption' | 'waste' | 'investment' | null;
  tag?: string | null;
  payment_method?: string | null; // 決済方法（支払い手段）
  created_at?: string;
  user_id?: string;
};

// 表示用の型（dailyValueを追加）
type Transaction = TransactionDB & {
  dailyValue: number;
};

type TabMode = 'dashboard' | 'analytics';

export default function Home() {
  const router = useRouter();
  const [items, setItems] = useState<Transaction[]>([]);
  const [tabMode, setTabMode] = useState<TabMode>('dashboard');
  const [initialAsset, setInitialAsset] = useState<number>(0);
  const [dailyBudgetGoal, setDailyBudgetGoal] = useState<number>(3000);
  const [targetAsset, setTargetAsset] = useState<number>(1000000); // デフォルト: 100万
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    frequency: 'one_time' as 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    category: 'consumption' as 'consumption' | 'waste' | 'investment' | null,
    tag: 'food' as string,
    payment_method: 'credit' as string, // デフォルト: クレジットカード
    date: new Date().toISOString().split('T')[0],
  });

  // 日割り計算
  const calculateDailyValue = (amount: number, frequency: string, type: string) => {
    let dailyVal = 0;
    if (frequency === 'one_time') dailyVal = 0;
    else if (frequency === 'daily') dailyVal = amount;
    else if (frequency === 'weekly') dailyVal = amount / 7;
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

  // 設定を取得
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          setLoading(false);
          return;
        }
        const userId = user.id;

        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error);
        }

        if (data) {
          setInitialAsset(data.initial_asset || 0);
          setDailyBudgetGoal(data.daily_budget_goal || 3000);
          setTargetAsset(data.target_asset || 1000000); // target_assetを取得
        } else {
          // デフォルト値
          setInitialAsset(0);
          setDailyBudgetGoal(3000);
          setTargetAsset(1000000);
        }
      } catch (error) {
        console.error('Error:', error);
        setInitialAsset(0);
        setDailyBudgetGoal(3000);
        setTargetAsset(1000000);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // データ取得
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          return;
        }

        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching transactions:', error);
          setItems([]);
          return;
        }

        if (data) {
          const transformedData = data.map(transformTransaction);
          setItems(transformedData);
        } else {
          setItems([]);
        }
      } catch (error) {
        console.error('Error:', error);
        setItems([]);
      }
    };

    fetchTransactions();
  }, []);

  // 現在の資産額を計算
  const calculateCurrentAsset = () => {
    const totalTransactionBalance = items.reduce((acc, item) => {
      const actualAmount = item.type === 'expense' ? -item.amount : item.amount;
      return acc + actualAmount;
    }, 0);
    return initialAsset + totalTransactionBalance;
  };

  const currentAsset = calculateCurrentAsset();

  // 達成率の計算
  const percentage = targetAsset > 0 
    ? Math.min((currentAsset / targetAsset) * 100, 100)
    : 0;

  // フォームをリセット
  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      type: 'expense',
      frequency: 'one_time',
      category: 'consumption',
      tag: 'food',
      payment_method: 'credit', // デフォルト: クレジットカード
      date: new Date().toISOString().split('T')[0],
    });
    setEditingTransaction(null);
  };

  // 編集開始
  const handleEditItem = (item: Transaction) => {
    setEditingTransaction(item);
    setFormData({
      name: item.name,
      amount: item.amount.toString(),
      type: item.type,
      frequency: item.frequency,
      category: item.category || 'consumption',
      tag: item.tag || 'food',
      payment_method: item.payment_method || 'credit',
      date: item.created_at 
        ? new Date(item.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
    
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // 取引を追加/更新
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Error fetching user:', userError);
      alert('ログインが必要です。ログイン画面に移動します。');
      router.push('/auth');
      return;
    }

    const amountNum = parseInt(formData.amount);

    try {
      const updateData: any = {
        name: formData.name,
        amount: amountNum,
        type: formData.type,
        frequency: formData.frequency,
        user_id: user.id,
      };
      
      if (formData.type === 'expense' && formData.category) {
        updateData.category = formData.category;
      } else {
        updateData.category = null;
      }

      if (formData.tag) {
        updateData.tag = formData.tag;
      } else {
        updateData.tag = 'other';
      }

      // 決済方法を追加
      if (formData.payment_method) {
        updateData.payment_method = formData.payment_method;
      } else {
        updateData.payment_method = 'credit'; // デフォルト: クレカ
      }

      if (editingTransaction) {
        if (formData.frequency === 'one_time' && formData.date) {
          updateData.created_at = new Date(formData.date).toISOString();
        }

        const { error } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', editingTransaction.id)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error updating transaction:', error);
          return;
        }
      } else {
        if (formData.frequency === 'one_time' && formData.date) {
          updateData.created_at = new Date(formData.date).toISOString();
        }

        const { error } = await supabase
          .from('transactions')
          .insert([updateData]);

        if (error) {
          console.error('Error inserting transaction:', error);
          return;
        }
      }

      // データを再取得
      const { data: { user: fetchUser } } = await supabase.auth.getUser();
      if (!fetchUser) return;

      const { data: allData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', fetchUser.id)
        .order('created_at', { ascending: true });

      if (!fetchError && allData) {
        const transformedData = allData.map(transformTransaction);
        setItems(transformedData);
      }

      resetForm();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // 削除
  const handleDeleteItem = async (id: string) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('Error fetching user:', userError);
        alert('ログインが必要です。ログイン画面に移動します。');
        router.push('/auth');
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting transaction:', error);
        return;
      }

      // データを再取得
      const { data: { user: fetchUser } } = await supabase.auth.getUser();
      if (!fetchUser) return;

      const { data, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', fetchUser.id)
        .order('created_at', { ascending: false });

      if (!fetchError && data) {
        const transformedData = data.map(transformTransaction);
        setItems(transformedData);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ログアウト
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-transparent flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mb-4"></div>
            <p className="text-slate-600">読み込み中...</p>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans text-gray-900 relative">
        {/* Liquid Tank Background */}
        <LiquidTankBackground percentage={percentage} />
        
        {/* メインコンテンツ */}
        <main className="w-full max-w-7xl mx-auto space-y-6 relative z-10 px-4 md:px-6">
          {/* ヘッダー */}
          <header className="flex items-center justify-between px-6 py-4 bg-white/90 backdrop-blur-lg rounded-xl shadow-sm z-10 relative">
            <h1 className="text-xl font-black tracking-tighter text-cyan-600 whitespace-nowrap">
              TANKER
            </h1>
            <div className="flex gap-2">
              <Link
                href="/settings"
                className="p-2 text-gray-400 hover:text-cyan-600 transition-colors"
                aria-label="設定"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-cyan-600 transition-colors"
                aria-label="ログアウト"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </header>

          {/* タンクビジュアル（サマリーエリア） */}
          <div className="bg-white/90 backdrop-blur-lg p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between md:space-x-8 space-y-4 md:space-y-0">
              {/* 円形の達成率表示 */}
              <div className="relative w-48 h-48 mx-auto md:mx-0">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#e2e8f0"
                    strokeWidth="16"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke={percentage >= 100 ? "#22c55e" : "#06b6d4"}
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - percentage / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-slate-800">
                      {Math.round(percentage)}%
                    </div>
                    <div className="text-xs text-slate-500 mt-1">達成率</div>
                  </div>
                </div>
              </div>

              {/* 資産総額表示 */}
              <div className="text-center md:text-left space-y-2 flex-1">
                <p className="text-gray-500 text-sm font-medium">現在の資産総額</p>
                <p className="text-4xl font-bold text-gray-800 tracking-tight">
                  ¥{currentAsset.toLocaleString()}
                </p>
                <div className="h-1 w-16 bg-gray-200 mx-auto md:mx-0 rounded-full my-4"></div>
                <p className="text-gray-400 text-xs">
                  目標 ¥{targetAsset.toLocaleString()} まで <br/>
                  あと <span className="text-cyan-600 font-bold">¥{Math.max(0, targetAsset - currentAsset).toLocaleString()}</span>
                </p>
              </div>
            </div>
          </div>

          {/* タブ切り替え（セグメンテッド・コントロール風） */}
          <div className="bg-gray-100 p-1 rounded-lg inline-flex w-full">
            <button
              onClick={() => setTabMode('dashboard')}
              className={`flex-1 py-3 px-4 rounded-md font-bold text-sm transition-all whitespace-nowrap ${
                tabMode === 'dashboard'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Dashboard (入力・現状)
            </button>
            <button
              onClick={() => setTabMode('analytics')}
              className={`flex-1 py-3 px-4 rounded-md font-bold text-sm transition-all whitespace-nowrap ${
                tabMode === 'analytics'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Analytics (分析)
            </button>
          </div>

          {/* メインコンテンツ（スクロール可能） */}
          <div className="space-y-6 pb-8">
            {tabMode === 'dashboard' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 入力フォーム */}
                <div className="bg-white/90 backdrop-blur-lg p-6 rounded-xl shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    {editingTransaction ? '取引を編集' : '新しい取引を追加'}
                  </h2>
                  {editingTransaction && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-300 rounded-lg">
                      <p className="text-sm text-blue-800 font-bold">編集モード</p>
                    </div>
                  )}
                  <form onSubmit={handleAddItem} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
                        項目名
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                        placeholder="例: 食費"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
                        金額
                      </label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full p-3 border rounded-lg"
                        placeholder="0"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
                        種類
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, type: 'expense' })}
                          className={`flex-1 py-3 rounded-lg font-bold ${
                            formData.type === 'expense'
                              ? 'bg-red-500 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="whitespace-nowrap">支出</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, type: 'income' })}
                          className={`flex-1 py-3 rounded-lg font-bold ${
                            formData.type === 'income'
                              ? 'bg-green-500 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          <span className="whitespace-nowrap">収入</span>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
                        頻度
                      </label>
                      <select
                        value={formData.frequency}
                        onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                        className="w-full p-3 border rounded-lg"
                      >
                        <option value="one_time">一回限り</option>
                        <option value="daily">毎日</option>
                        <option value="weekly">毎週</option>
                        <option value="monthly">毎月</option>
                        <option value="yearly">毎年</option>
                      </select>
                    </div>
                    {formData.type === 'expense' && (
                      <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
                        分類
                      </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, category: 'consumption' })}
                            className={`p-3 rounded-lg border-2 ${
                              formData.category === 'consumption'
                                ? 'border-green-500 bg-green-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="text-lg mb-1">💸</div>
                            <div className="text-xs font-bold whitespace-nowrap">消費</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, category: 'waste' })}
                            className={`p-3 rounded-lg border-2 ${
                              formData.category === 'waste'
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="text-lg mb-1">🗑️</div>
                            <div className="text-xs font-bold whitespace-nowrap">浪費</div>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, category: 'investment' })}
                            className={`p-3 rounded-lg border-2 ${
                              formData.category === 'investment'
                                ? 'border-green-500 bg-green-50'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="text-lg mb-1">🌱</div>
                            <div className="text-xs font-bold whitespace-nowrap">投資</div>
                          </button>
                        </div>
                      </div>
                    )}
                    {formData.frequency === 'one_time' && (
                      <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
                        日付
                      </label>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full p-3 border rounded-lg"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        勘定科目（タグ）
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 'food', label: '🍱 食費', name: 'food' },
                          { value: 'daily', label: '🧻 日用品', name: 'daily' },
                          { value: 'transport', label: '🚃 交通費', name: 'transport' },
                          { value: 'housing', label: '🏠 住居・通信', name: 'housing' },
                          { value: 'social', label: '🍻 交際費', name: 'social' },
                          { value: 'fun', label: '🎮 趣味', name: 'fun' },
                          { value: 'medical', label: '🏥 医療', name: 'medical' },
                          { value: 'other', label: '❓ その他', name: 'other' },
                        ].map((tag) => (
                          <button
                            key={tag.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, tag: tag.value })}
                            className={`p-2 rounded-lg border-2 text-xs font-bold transition-colors ${
                              formData.tag === tag.value
                                ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                            }`}
                          >
                            {tag.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
                        支払い方法
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 'credit', label: '💳 クレカ', name: 'Credit' },
                          { value: 'pay', label: '📱 電子マネー', name: 'Pay' },
                          { value: 'cash', label: '💵 現金', name: 'Cash' },
                          { value: 'bank', label: '🏦 銀行', name: 'Bank' },
                        ].map((method) => (
                          <button
                            key={method.value}
                            type="button"
                            onClick={() => setFormData({ ...formData, payment_method: method.value })}
                            className={`p-2 rounded-lg border-2 text-xs font-bold transition-colors ${
                              formData.payment_method === method.value
                                ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                                : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                            }`}
                          >
                            {method.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {editingTransaction && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300"
                        >
                          <span className="whitespace-nowrap">キャンセル</span>
                        </button>
                      )}
                      <button
                        type="submit"
                        className={`flex-1 py-3 rounded-lg font-bold ${
                          editingTransaction
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                        }`}
                        >
                          <span className="whitespace-nowrap">{editingTransaction ? '更新' : '追加'}</span>
                        </button>
                    </div>
                  </form>
                </div>

                {/* 取引リスト */}
                <div className="bg-white/90 backdrop-blur-lg p-6 rounded-xl shadow-sm border border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 whitespace-nowrap">取引履歴</h2>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {items.length === 0 ? (
                      <p className="text-center text-slate-400 py-8">取引がありません</p>
                    ) : (
                      items.map((item) => {
                        // タグのラベル定義
                        const tagLabels: Record<string, string> = {
                          food: '🍱 食費',
                          daily: '🧻 日用品',
                          transport: '🚃 交通費',
                          housing: '🏠 住居・通信',
                          social: '🍻 交際費',
                          fun: '🎮 趣味',
                          medical: '🏥 医療',
                          other: '❓ その他',
                        };
                        const tagLabel = item.tag ? tagLabels[item.tag] || `❓ ${item.tag}` : '❓ その他';
                        
                        // 決済方法のアイコン定義
                        const paymentMethodIcons: Record<string, string> = {
                          credit: '💳',
                          pay: '📱',
                          cash: '💵',
                          bank: '🏦',
                        };
                        // 既存データ（null）への対応: デフォルトでクレカアイコンを表示
                        const paymentIcon = item.payment_method 
                          ? paymentMethodIcons[item.payment_method] || '💳'
                          : '💳';
                        
                        return (
                        <div key={item.id} className="bg-slate-50 p-4 rounded-lg flex justify-between items-center">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-bold">{item.name}</p>
                              <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full">
                                {tagLabel}
                              </span>
                              <span className="text-lg" title={`支払い方法: ${item.payment_method || 'credit'}`}>
                                {paymentIcon}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {item.amount.toLocaleString()}円 ({item.frequency})
                            </p>
                          </div>
                          <div className={`font-bold mr-4 ${item.type === 'income' ? 'text-green-600' : 'text-red-500'}`}>
                            {item.type === 'income' ? '+' : '-'}
                            {item.amount.toLocaleString()}円
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="p-2 text-slate-600 hover:text-blue-600"
                              aria-label="編集"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="p-2 text-slate-600 hover:text-red-600"
                              aria-label="削除"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m-4.788 5.636a4.5 4.5 0 01-1.897-1.13L2.5 12.5m0 0l3.5-3.5m-3.5 3.5l3.5 3.5" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* 分析画面 */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <AssetTrendChart transactions={items} initialAsset={initialAsset} />
                    <DailyTrendChart transactions={items} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <IncomeExpenseTrendChart transactions={items} />
                    <ProfitLossStatement transactions={items} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <BalanceSheet
                      transactions={items}
                      initialAsset={initialAsset}
                      onInitialAssetChange={async (value) => {
                        setInitialAsset(value);
                        try {
                          const { data: { user }, error: userError } = await supabase.auth.getUser();
                          if (userError || !user) return;
                          await supabase
                            .from('user_settings')
                            .upsert({
                              user_id: user.id,
                              initial_asset: value,
                              daily_budget_goal: dailyBudgetGoal,
                              target_asset: targetAsset,
                              currency_unit: '円',
                            }, { onConflict: 'user_id' });
                        } catch (error) {
                          console.error('Error saving initial asset:', error);
                        }
                      }}
                    />
                    <ExpensePieChart transactions={items} viewMode="monthly" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <IncomeExpenseBarChart transactions={items} viewMode="monthly" />
                  </div>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
