'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import ExpensePieChart from '@/components/ExpensePieChart';
import IncomeExpenseBarChart from '@/components/IncomeExpenseBarChart';
import AssetTrendChart from '@/components/AssetTrendChart';
import DailyTrendChart from '@/components/DailyTrendChart';
import ProfitLossStatement from '@/components/ProfitLossStatement';
import BalanceSheet from '@/components/BalanceSheet';
import LiquidTankBackground from '@/components/LiquidTankBackground';

// 型定義（データベースから取得する型）
type TransactionDB = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: 'consumption' | 'waste' | 'investment' | null;
  tag?: string | null;
  created_at?: string;
};

// 表示用の型（dailyValueを追加）
type Transaction = TransactionDB & {
  dailyValue: number;
};

type ViewMode = 'daily' | 'weekly' | 'monthly' | 'yearly';
type TabMode = 'dashboard' | 'analytics';

export default function Home() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [tabMode, setTabMode] = useState<TabMode>('dashboard');
  const [initialAsset, setInitialAsset] = useState<number>(0);
  const [dailyBudgetGoal, setDailyBudgetGoal] = useState<number>(3000);
  const [targetAsset, setTargetAsset] = useState<number>(10000000); // デフォルト: 1000万
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'expense',
    frequency: 'one_time',
    category: 'consumption' as 'consumption' | 'waste' | 'investment' | null,
    tag: 'food' as string,
    date: new Date().toISOString().split('T')[0], // デフォルトは今日
  });

  // 日割り計算（one_timeは将来予測には含めないため0、ただしその日の集計には使う）
  const calculateDailyValue = (amount: number, frequency: string, type: string) => {
    let dailyVal = 0;
    if (frequency === 'one_time') dailyVal = 0; // 将来予測には含めない
    else if (frequency === 'daily') dailyVal = amount;
    else if (frequency === 'weekly') dailyVal = amount / 7;
    else if (frequency === 'monthly') dailyVal = amount / 30;
    else if (frequency === 'yearly') dailyVal = amount / 365;
    return type === 'expense' ? -dailyVal : dailyVal;
  };

  // 実際の金額を取得（one_timeも含む）
  const getActualAmount = (amount: number, frequency: string, type: string) => {
    return type === 'expense' ? -amount : amount;
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
        // ログイン中のユーザーIDを取得（認証がある場合）
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || 'default';

        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116は「行が見つからない」エラー（初回アクセス時など）
          console.error('Error fetching settings:', error);
          // フォールバック: localStorageから読み込む
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tanker_initial_asset');
            if (saved) {
              setInitialAsset(parseInt(saved, 10));
            }
          }
          return;
        }

        if (data) {
          setInitialAsset(data.initial_asset || 0);
          setDailyBudgetGoal(data.daily_budget_goal || 3000);
          setTargetAsset(data.target_asset || 10000000); // デフォルト: 1000万
        } else {
          // データがない場合、localStorageから読み込む
          if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tanker_initial_asset');
            if (saved) {
              setInitialAsset(parseInt(saved, 10));
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
        // フォールバック: localStorageから読み込む
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('tanker_initial_asset');
          if (saved) {
            setInitialAsset(parseInt(saved, 10));
          }
        }
      }
    };

    fetchSettings();
  }, []);

  // データ取得
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: true });

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

  // フォームをリセットする関数
  const resetForm = () => {
    setFormData({
      name: '',
      amount: '',
      type: 'expense',
      frequency: 'one_time',
      category: 'consumption',
      tag: 'food',
      date: new Date().toISOString().split('T')[0],
    });
    setEditingTransaction(null);
  };

  // 編集開始時の処理
  const handleEditItem = (item: Transaction) => {
    setEditingTransaction(item);
    setFormData({
      name: item.name,
      amount: item.amount.toString(),
      type: item.type,
      frequency: item.frequency,
      category: item.category || 'consumption',
      tag: item.tag || 'food',
      date: item.created_at 
        ? new Date(item.created_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    });
    
    // フォーム位置にスクロール
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    const amountNum = parseInt(formData.amount);

    try {
      const updateData: any = {
        name: formData.name,
        amount: amountNum,
        type: formData.type,
        frequency: formData.frequency,
      };
      
      // 支出の場合のみcategoryを追加
      if (formData.type === 'expense' && formData.category) {
        updateData.category = formData.category;
      } else {
        updateData.category = null;
      }

      // tagを追加（nullやundefinedの場合は'other'として扱う）
      if (formData.tag) {
        updateData.tag = formData.tag;
      } else {
        updateData.tag = 'other';
      }

      // 編集モードの場合
      if (editingTransaction) {
        // One-timeの場合、指定された日付をcreated_atとして使用（更新時は既存の日付を保持）
        if (formData.frequency === 'one_time' && formData.date) {
          updateData.created_at = new Date(formData.date).toISOString();
        }

        const { error } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', editingTransaction.id);

        if (error) {
          console.error('Error updating transaction:', error);
          return;
        }
      } else {
        // 新規追加の場合
        // One-timeの場合、指定された日付をcreated_atとして使用
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

      // データを再取得して画面を更新
      const { data: allData, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: true });

      if (!fetchError && allData) {
        const transformedData = allData.map(transformTransaction);
        setItems(transformedData);
      }

      // フォームをリセット
      resetForm();
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
    if (viewMode === 'weekly') return 7;
    if (viewMode === 'monthly') return 30;
    return 365; // yearly
  };

  // 期間に応じた合計額を計算（one_timeは除外）
  const getTotalBalance = () => {
    const multiplier = getMultiplier();
    return items
      .filter((item) => item.frequency !== 'one_time')
      .reduce((acc, item) => acc + item.dailyValue * multiplier, 0);
  };

  // 期間に応じた表示値を計算
  const getDisplayValue = (dailyValue: number) => {
    const multiplier = getMultiplier();
    return dailyValue * multiplier;
  };

  // 期間に応じたラベルを取得
  const getBalanceLabel = () => {
    if (viewMode === 'daily') return "Today's Balance";
    if (viewMode === 'weekly') return "Weekly Balance";
    if (viewMode === 'monthly') return "Monthly Balance";
    return "Yearly Balance";
  };

  // 期間に応じた単位ラベルを取得
  const getUnitLabel = () => {
    if (viewMode === 'daily') return '1日あたりの収支';
    if (viewMode === 'weekly') return '1週間あたりの収支';
    if (viewMode === 'monthly') return '1ヶ月あたりの収支';
    return '1年あたりの収支';
  };

  const totalBalance = getTotalBalance();

  // 現在の資産額を計算（初期資産 + 全取引の合計）
  const calculateCurrentAsset = () => {
    const totalTransactionBalance = items.reduce((acc, item) => {
      const actualAmount = item.type === 'expense' ? -item.amount : item.amount;
      return acc + actualAmount;
    }, 0);
    return initialAsset + totalTransactionBalance;
  };

  const currentAsset = calculateCurrentAsset();

  // 前日の資産額を計算
  const calculatePreviousDayAsset = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const previousDayTransactions = items.filter((item) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate < yesterday;
    });

    const previousDayBalance = previousDayTransactions.reduce((acc, item) => {
      const actualAmount = item.type === 'expense' ? -item.amount : item.amount;
      return acc + actualAmount;
    }, 0);

    return initialAsset + previousDayBalance;
  };

  const previousDayAsset = calculatePreviousDayAsset();

  // 警告状態を判定（今月の収支が赤字、または前日比で大幅減少）
  const isWarningState = () => {
    // 今月の収支が赤字かどうか
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const monthData = items.filter((item) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= firstDayOfMonth;
    });

    const income = monthData
      .filter((item) => item.type === 'income')
      .reduce((acc, item) => acc + item.amount, 0);

    const expense = monthData
      .filter((item) => item.type === 'expense')
      .reduce((acc, item) => acc + item.amount, 0);

    const isMonthNegative = expense > income;

    // 前日比で大幅減少（10%以上減少）かどうか
    const decreaseRate = previousDayAsset > 0 
      ? ((previousDayAsset - currentAsset) / previousDayAsset) * 100
      : 0;
    const isSignificantDecrease = decreaseRate >= 10;

    // 資産がマイナスの場合も警告
    const isNegativeAsset = currentAsset < 0;

    return isMonthNegative || isSignificantDecrease || isNegativeAsset;
  };

  const isNegative = isWarningState();

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans text-gray-900 relative">
      {/* Liquid Tank Background - 最背面に配置 */}
      <LiquidTankBackground
        currentAsset={currentAsset}
        targetAsset={targetAsset}
        isNegative={isNegative}
      />
      
      {/* メインコンテンツ - z-indexを高くして浮き上がらせる */}
      <main className="max-w-4xl mx-auto space-y-6 relative z-10">
        {/* コンテンツの背景を半透明にして視認性を確保 */}
        <style jsx global>{`
          .bg-white {
            background-color: rgba(255, 255, 255, 0.9) !important;
            backdrop-filter: blur(8px);
          }
        `}</style>
        {/* タイトルと設定アイコン */}
        <div className="text-center relative">
          <Link
            href="/settings"
            className="absolute top-0 right-0 text-slate-600 hover:text-slate-800 transition-colors p-2 rounded-lg hover:bg-slate-100"
            aria-label="設定"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
          <h1 className="text-4xl font-bold text-slate-800">Tanker</h1>
          <p className="text-slate-500 mt-2">個人の財務管理ツール</p>
        </div>

        {/* ダッシュボード/推移の切り替えタブ */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setTabMode('dashboard')}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${
              tabMode === 'dashboard'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Dashboard (入力・現状)
          </button>
          <button
            onClick={() => setTabMode('analytics')}
            className={`px-6 py-2 rounded-lg font-bold transition-colors ${
              tabMode === 'analytics'
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Analytics (分析)
          </button>
        </div>

        {tabMode === 'dashboard' ? (
          <>
            {/* 期間切り替えタブ */}
            <div className="flex justify-center gap-2 flex-wrap">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors text-sm ${
                viewMode === 'daily'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              日次
            </button>
            <button
              onClick={() => setViewMode('weekly')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors text-sm ${
                viewMode === 'weekly'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              週次
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors text-sm ${
                viewMode === 'monthly'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              月次
            </button>
            <button
              onClick={() => setViewMode('yearly')}
              className={`px-4 py-2 rounded-lg font-bold transition-colors text-sm ${
                viewMode === 'yearly'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              年次
            </button>
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

        <form 
          onSubmit={handleAddItem} 
          className={`p-6 rounded-xl shadow-sm border-2 space-y-4 transition-colors ${
            editingTransaction 
              ? 'bg-blue-50 border-blue-300' 
              : 'bg-white border-slate-100'
          }`}
        >
          {editingTransaction && (
            <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 mb-4">
              <p className="text-sm font-bold text-blue-800">
                ✏️ 編集モード: {editingTransaction.name} を編集中
              </p>
            </div>
          )}
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
          
          {/* 勘定科目（タグ）選択 */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">勘定科目（タグ）</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'food' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'food'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">🍱</div>
                <div className="font-bold text-slate-700">食費</div>
                <div className="text-xs text-slate-500">Food</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'daily' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'daily'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">🧻</div>
                <div className="font-bold text-slate-700">日用品</div>
                <div className="text-xs text-slate-500">Daily</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'transport' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'transport'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">🚃</div>
                <div className="font-bold text-slate-700">交通費</div>
                <div className="text-xs text-slate-500">Transport</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'housing' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'housing'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">🏠</div>
                <div className="font-bold text-slate-700">住居・通信</div>
                <div className="text-xs text-slate-500">Housing</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'social' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'social'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">🍻</div>
                <div className="font-bold text-slate-700">交際費</div>
                <div className="text-xs text-slate-500">Social</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'fun' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'fun'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">🎮</div>
                <div className="font-bold text-slate-700">趣味・娯楽</div>
                <div className="text-xs text-slate-500">Fun</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'medical' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'medical'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">🏥</div>
                <div className="font-bold text-slate-700">医療費</div>
                <div className="text-xs text-slate-500">Medical</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'education' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'education'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">🎓</div>
                <div className="font-bold text-slate-700">教育</div>
                <div className="text-xs text-slate-500">Education</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, tag: 'other' })}
                className={`p-2 rounded-lg border-2 transition-all text-xs ${
                  formData.tag === 'other'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                }`}
              >
                <div className="text-sm mb-1">❓</div>
                <div className="font-bold text-slate-700">その他</div>
                <div className="text-xs text-slate-500">Other</div>
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">タイプ</label>
              <select
                className="w-full p-2 border rounded-lg bg-white"
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'income' | 'expense';
                  setFormData({ 
                    ...formData, 
                    type: newType,
                    category: newType === 'expense' ? formData.category || 'consumption' : null,
                  });
                }}
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
                <option value="one_time">One-time (今回のみ)</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>

          {/* One-timeの場合、日付指定を表示 */}
          {formData.frequency === 'one_time' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">日付</label>
              <input
                type="date"
                className="w-full p-2 border rounded-lg"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          )}
          
          {/* 支出の場合のみ分類を表示 */}
          {formData.type === 'expense' && (
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">分類</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'consumption' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.category === 'consumption'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="text-lg mb-1">💧</div>
                  <div className="text-xs font-bold text-slate-700">消費</div>
                  <div className="text-xs text-slate-500 mt-1">Consumption</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'waste' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.category === 'waste'
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 bg-white hover:border-red-300'
                  }`}
                >
                  <div className="text-lg mb-1">⚠️</div>
                  <div className="text-xs font-bold text-slate-700">浪費</div>
                  <div className="text-xs text-slate-500 mt-1">Waste</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, category: 'investment' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    formData.category === 'investment'
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 bg-white hover:border-green-300'
                  }`}
                >
                  <div className="text-lg mb-1">🌱</div>
                  <div className="text-xs font-bold text-slate-700">投資</div>
                  <div className="text-xs text-slate-500 mt-1">Investment</div>
                </button>
              </div>
            </div>
          )}
          <div className="flex gap-2">
            {editingTransaction && (
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-slate-200 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-300 transition-colors"
              >
                キャンセル
              </button>
            )}
            <button 
              type="submit" 
              className={`flex-1 py-3 rounded-lg font-bold transition-colors ${
                editingTransaction
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              {editingTransaction ? '更新 (Update)' : '追加 (Add)'}
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
              <div className="flex-1">
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-slate-400">{item.amount.toLocaleString()}円 ({item.frequency})</p>
              </div>
              <div className={`font-bold mr-4 ${item.dailyValue >= 0 ? 'text-blue-600' : 'text-red-500'}`}>
                {item.frequency === 'one_time' ? (
                  <>
                    {item.type === 'expense' ? '-' : '+'}
                    {item.amount.toLocaleString()}円
                    <span className="text-xs text-slate-400 ml-1">(今回のみ)</span>
                  </>
                ) : (
                  <>
                    {item.dailyValue >= 0 ? '+' : ''}
                    {Math.round(getDisplayValue(item.dailyValue)).toLocaleString()}円
                    {viewMode === 'daily' ? '/日' : viewMode === 'weekly' ? '/週' : viewMode === 'monthly' ? '/月' : '/年'}
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEditItem(item)}
                  className="text-blue-500 hover:text-blue-700 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                  aria-label="編集"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                </button>
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
            </div>
          ))}
        </div>
          </>
        ) : (
          <>
            {/* 推移タブの内容 */}
            <div className="space-y-6">
              {/* グラフエリア */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AssetTrendChart transactions={items} initialAsset={initialAsset} />
                <DailyTrendChart transactions={items} />
              </div>

              {/* PL/BSエリア */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProfitLossStatement transactions={items} />
                <BalanceSheet
                  transactions={items}
                  initialAsset={initialAsset}
                  onInitialAssetChange={async (value) => {
                    setInitialAsset(value);
                    // Supabaseに保存
                    try {
                      // ログイン中のユーザーIDを取得（認証がある場合）
                      const { data: { user } } = await supabase.auth.getUser();
                      const userId = user?.id || 'default';

                      await supabase
                        .from('user_settings')
                        .upsert(
                          {
                            user_id: userId,
                            initial_asset: value,
                            daily_budget_goal: dailyBudgetGoal,
                            target_asset: targetAsset,
                            currency_unit: '円',
                          },
                          { onConflict: 'user_id' }
                        );
                    } catch (error) {
                      console.error('Error saving initial asset:', error);
                      // フォールバック: localStorageに保存
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('tanker_initial_asset', value.toString());
                      }
                    }
                  }}
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}