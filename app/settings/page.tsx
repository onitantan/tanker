'use client'; // 👈 これが重要！クライアント部品として動かします

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // 👈 next/router から変更
import Link from 'next/link';
import { supabase } from '../../lib/supabaseClient'; // パス階層を調整

export default function Settings() {
  const router = useRouter();
  const [initialAmount, setInitialAmount] = useState<number>(0);
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [monthlyTarget, setMonthlyTarget] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // データ読み込み
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // ログインしてなければログイン画面へ
        if (!user) {
          router.push('/auth');
          return;
        }

        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error);
        }

        if (data) {
          setInitialAmount(data.initial_amount || 0);
          setTargetAmount(data.target_amount || 0);
          setMonthlyTarget(data.monthly_target || 0);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

// 保存処理（シンプル＆最強版）
const handleSave = async (e: React.FormEvent) => {
  e.preventDefault();
  setSaving(true);
  setMessage(null);

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No user found');

    // データの準備
    const updates = {
      user_id: user.id,
      initial_amount: initialAmount,
      target_amount: targetAmount,
      monthly_target: monthlyTarget,
      updated_at: new Date().toISOString(),
    };

    // Upsert: データがあれば上書き、なければ新規作成（これを1行でやる）
    const { error } = await supabase
      .from('user_settings')
      .upsert(updates);

    if (error) throw error;

    setMessage({ text: '設定を保存しました！', type: 'success' });
    
    // 成功したらホームへ
    setTimeout(() => {
      router.push('/');
    }, 1500);

  } catch (error) {
    console.error('Error saving settings:', error);
    setMessage({ text: '保存に失敗しました。', type: 'error' });
  } finally {
    setSaving(false);
  }
};

  if (loading) {
    return <div className="p-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* ヘッダー */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
          <h1 className="text-lg font-bold text-gray-800">設定</h1>
          <Link href="/" className="text-sm text-gray-500 hover:text-cyan-600">
            キャンセル
          </Link>
        </div>
      </header>

      <main className="mx-auto mt-20 max-w-md px-4">
        <form onSubmit={handleSave} className="space-y-6">
          
          {/* メッセージ表示 */}
          {message && (
            <div className={`rounded-lg p-4 text-sm ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* 初期資産 */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              現在の総資産（スタート地点）
            </label>
            <div className="relative">
              <input
                type="number"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 p-3 text-lg focus:border-cyan-500 focus:outline-none"
                placeholder="例: 100000"
              />
              <span className="absolute right-4 top-3.5 text-gray-400">円</span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              これがタンクの水位の「底上げ」になります。
            </p>
          </div>

          {/* 目標金額 */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <label className="mb-2 block text-sm font-bold text-gray-700">
              目標金額（タンクの容量）
            </label>
            <div className="relative">
              <input
                type="number"
                value={targetAmount}
                onChange={(e) => setTargetAmount(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 p-3 text-lg focus:border-cyan-500 focus:outline-none"
                placeholder="例: 3000000"
              />
              <span className="absolute right-4 top-3.5 text-gray-400">円</span>
            </div>
          </div>

          {/* 保存ボタン */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-cyan-600 py-4 font-bold text-white shadow-lg transition-all hover:bg-cyan-700 disabled:opacity-50"
          >
            {saving ? '保存中...' : '設定を保存する'}
          </button>
          
          <div className="text-center">
              <button 
                type="button"
                onClick={() => supabase.auth.signOut().then(() => router.push('/auth'))}
                className="mt-4 text-sm text-red-500 underline"
              >
                ログアウト
              </button>
          </div>

        </form>
      </main>
    </div>
  );
}