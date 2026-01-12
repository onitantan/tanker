'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

type UserSettings = {
  user_id: string;
  initial_asset: number;
  daily_budget_goal: number;
  currency_unit: string;
};

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [userId, setUserId] = useState<string>('default');
  const [settings, setSettings] = useState<UserSettings>({
    user_id: 'default',
    initial_asset: 0,
    daily_budget_goal: 3000,
    currency_unit: '円',
  });

  // ユーザーIDを取得
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id || 'default';
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

  // 設定を保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: userId,
            initial_asset: settings.initial_asset,
            daily_budget_goal: settings.daily_budget_goal,
            currency_unit: settings.currency_unit,
          },
          { onConflict: 'user_id' }
        );

      if (error) {
        console.error('Error saving settings:', error);
        alert('設定の保存に失敗しました');
        setLoading(false);
        return;
      }

      // 成功通知
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);

      setLoading(false);
    } catch (error) {
      console.error('Error:', error);
      alert('設定の保存に失敗しました');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-gray-900">
      <main className="max-w-2xl mx-auto space-y-6">
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
