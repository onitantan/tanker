'use client';

import React, { useState, useEffect } from 'react';
// 相対パス(..)ではなく、絶対パス(@)を使用
import TransactionForm from '@/components/TransactionForm';
import TransactionList from '@/components/TransactionList';
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import TankChart from '@/components/TankChart';
// ↓もしここが赤いままなら、utilsフォルダが見つかっていません
import { supabase } from '@/utils/supabaseClient'; 
// ↓もしここが赤いままなら、typesフォルダが見つかっていません
import { Transaction, UserSettings } from '@/types'; 
import Link from 'next/link';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 設定取得
    const { data: settingsData } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (settingsData) setSettings(settingsData);

    // 取引履歴取得
    const { data: transactionData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (transactionData) setTransactions(transactionData);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // 資産計算: 初期資産 + (収入 - 支出)
  const currentAsset = (settings?.initial_asset || 0) + transactions.reduce((sum, t) => {
    return sum + (t.type === 'income' ? Number(t.amount) : -Number(t.amount));
  }, 0);

  const targetAsset = settings?.target_asset || 1000000;
  const progress = targetAsset > 0 ? (currentAsset / targetAsset) * 100 : 0;

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* 画面幅の制御用コンテナ */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* --- ヘッダー --- */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-cyan-700 tracking-tight">TANKER</h1>
          {/* アイコンパッケージのエラー回避のため絵文字を使用 */}
          <Link href="/settings" className="p-2 text-2xl hover:opacity-70 transition-opacity">
            ⚙️
          </Link>
        </div>

        {/* --- メインビジュアル（タンク） --- */}
        <div className="mb-10 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="w-48 h-48 flex-shrink-0">
               <TankChart percentage={progress} />
            </div>
            <div className="text-center md:text-left">
              <p className="text-gray-500 text-sm font-medium mb-1">現在の資産総額</p>
              <p className="text-4xl font-bold text-gray-900 mb-2">
                ¥{currentAsset.toLocaleString()}
              </p>
              <div className="text-sm text-gray-400">
                目標 ¥{targetAsset.toLocaleString()} まで<br/>
                あと <span className="text-cyan-600 font-bold">¥{(targetAsset - currentAsset).toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- コンテンツエリア（グリッドレイアウト） --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* 左カラム：入力フォーム */}
          <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-4">
            <h2 className="text-lg font-bold text-gray-800 mb-4">✏️ 記帳する</h2>
            <TransactionForm onTransactionAdded={fetchData} />
          </div>

          {/* 右カラム：分析＆履歴 */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
               <h2 className="text-lg font-bold text-gray-800 mb-4">📊 資産推移</h2>
               <AnalyticsDashboard transactions={transactions} />
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📜 最近の履歴</h2>
              <TransactionList transactions={transactions} onTransactionUpdated={fetchData} />
            </section>
          </div>

        </div>
      </div>
    </main>
  );
}