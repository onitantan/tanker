'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import LiquidTankBackground from '@/components/LiquidTankBackground';

type UserSettings = {
  user_id: string;
  initial_asset: number;
  daily_budget_goal: number;
  target_asset?: number;
  currency_unit: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  // デフォルトユーザーID（UUID形式）
  const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';
  
  const [userId, setUserId] = useState<string>(DEFAULT_USER_ID);
  const [settings, setSettings] = useState<UserSettings>({
    user_id: DEFAULT_USER_ID,
    initial_asset: 0,
    daily_budget_goal: 3000,
    target_asset: 10000000, // デフォルト: 1000万
    currency_unit: '円',
  });
  const [currentAsset, setCurrentAsset] = useState<number>(0);

  // ユーザーIDを取得
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id || DEFAULT_USER_ID;
        setUserId(currentUserId);
        setSettings(prev => ({ ...prev, user_id: currentUserId }));
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUserId();
  }, []);

  // 設定を取得
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116は「行が見つからない」エラー（初回アクセス時など）
          console.error('Error fetching settings:', error);
          return;
        }

        if (data) {
          setSettings(data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (userId) {
      fetchSettings();
    }
  }, [userId]);

  // 現在の資産額を計算（初期資産 + 全取引の合計）
  useEffect(() => {
    const fetchCurrentAsset = async () => {
      try {
        const { data: transactions, error } = await supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) {
          console.error('Error fetching transactions:', error);
          return;
        }

        if (transactions) {
          const totalTransactionBalance = transactions.reduce((acc, item) => {
            const actualAmount = item.type === 'expense' ? -item.amount : item.amount;
            return acc + actualAmount;
          }, 0);
          setCurrentAsset(settings.initial_asset + totalTransactionBalance);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    if (settings.initial_asset !== undefined) {
      fetchCurrentAsset();
    }
  }, [settings.initial_asset]);

  // 設定を保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 現在のユーザー情報を取得
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // エラーハンドリングを強化
      if (userError) {
        console.error('Error fetching user:', userError);
        console.error('User error details:', JSON.stringify(userError, null, 2));
      }

      // ユーザーIDを決定（認証ユーザーがいない場合はUUID形式のダミーIDを使用）
      const currentUserId = user?.id || DEFAULT_USER_ID;

      // upsertのデータに必ずuser_idを含める（★ここが超重要）
      const upsertData = {
        user_id: currentUserId, // 明示的にuser_idを設定
        initial_asset: Number(settings.initial_asset) || 0,
        daily_budget_goal: Number(settings.daily_budget_goal) || 3000,
            target_asset: Number(settings.target_asset) || 10000000, // デフォルト: 1000万
        currency_unit: settings.currency_unit || '円',
      };

      console.log('Saving settings with data:', upsertData);

      const { data: upsertResult, error } = await supabase
        .from('user_settings')
        .upsert(upsertData, { onConflict: 'user_id' })
        .select();

      if (error) {
        console.error('Error saving settings:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error hint:', error.hint);
        
        // より詳細なエラーメッセージを表示
        let errorMessage = '設定の保存に失敗しました';
        if (error.message) {
          errorMessage += `: ${error.message}`;
        }
        if (error.hint) {
          errorMessage += ` (ヒント: ${error.hint})`;
        }
        alert(errorMessage);
        setLoading(false);
        return;
      }

      console.log('Settings saved successfully:', upsertResult);

      // 成功通知
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      setLoading(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      alert('設定の保存に失敗しました: ' + (error instanceof Error ? error.message : 'Unknown error'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent p-4 md:p-8 font-sans text-gray-900 relative">
      {/* Liquid Tank Background - 設定画面にも背景を表示 */}
      <LiquidTankBackground
        currentAsset={currentAsset}
        targetAsset={settings.target_asset || 10000000}
        isNegative={currentAsset < 0}
      />
      <main className="max-w-2xl mx-auto space-y-6 relative z-10">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-slate-600 hover:text-slate-800 transition-colors flex items-center gap-2"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            戻る
          </Link>
          <h1 className="text-3xl font-bold text-slate-800">設定</h1>
          <div className="w-20"></div> {/* スペーサー */}
        </div>

        {/* トースト通知 */}
        {showToast && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            <div className="flex items-center gap-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              設定を保存しました
            </div>
          </div>
        )}

        {/* 設定フォーム */}
        <form onSubmit={handleSave} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
          {/* 初期資産設定 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              💰 初期資産 (Initial Asset)
            </label>
            <input
              type="number"
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.initial_asset}
              onChange={(e) =>
                setSettings({ ...settings, initial_asset: parseInt(e.target.value) || 0 })
              }
              placeholder="0"
            />
            <p className="text-xs text-slate-500">
              資産推移グラフのスタート地点となる金額です。
            </p>
          </div>

          {/* 1日の目標単価 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              🎯 1日の目標単価 (Daily Goal)
            </label>
            <input
              type="number"
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.daily_budget_goal}
              onChange={(e) =>
                setSettings({ ...settings, daily_budget_goal: parseInt(e.target.value) || 0 })
              }
              placeholder="3000"
            />
          </div>

          {/* 目標資産 */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              🏆 目標資産 (Goal)
            </label>
            <input
              type="number"
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.target_asset || ''}
              onChange={(e) =>
                setSettings({ ...settings, target_asset: parseInt(e.target.value) || 0 })
              }
              placeholder="1000000"
            />
            <p className="text-xs text-slate-500">
              タンクが満タンになる金額です。
            </p>
          </div>

          {/* 通貨単位（将来的な拡張のため） */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-slate-700">
              通貨単位 (Currency Unit)
            </label>
            <input
              type="text"
              className="w-full p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={settings.currency_unit}
              onChange={(e) =>
                setSettings({ ...settings, currency_unit: e.target.value })
              }
              placeholder="円"
            />
          </div>

          {/* 保存ボタン */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-bold transition-colors ${
              loading
                ? 'bg-slate-400 text-white cursor-not-allowed'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </form>
      </main>
    </div>
  );
}
