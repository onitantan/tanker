'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient'; // 👈 lib に修正
import LiquidTankBackground from '../components/LiquidTankBackground';

export default function Home() {
  const [initialAmount, setInitialAmount] = useState(0);
  const [targetAmount, setTargetAmount] = useState(1000000); // デフォルト100万
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (data) {
            // 👇 ここが重要！データベースの列名(amount)に合わせる
            setInitialAmount(data.initial_amount || 0);
            setTargetAmount(data.target_amount || 1000000);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 達成率の計算（ゼロ除算を防ぐ）
  const percentage = targetAmount > 0 
    ? (initialAmount / targetAmount) * 100 
    : 0;

  return (
    <div className="relative min-h-screen bg-white">
      {/* ヘッダー */}
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm z-10 relative">
        <h1 className="text-xl font-black tracking-tighter text-cyan-600">
          TANKER
        </h1>
        <Link href="/settings" className="p-2 text-gray-400 hover:text-cyan-600 transition-colors">
          {/* 歯車アイコン */}
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </Link>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-col items-center pt-10 px-4">
        
        {/* タンクコンポーネント（スマホ対応版） */}
        <div className="w-full max-w-[280px]">
          <LiquidTankBackground percentage={percentage} />
        </div>

        {/* 数値表示 */}
        <div className="mt-8 text-center space-y-2">
          <p className="text-gray-500 text-sm font-medium">現在の資産総額</p>
          <p className="text-4xl font-bold text-gray-800 tracking-tight">
            ¥{initialAmount.toLocaleString()}
          </p>
          <div className="h-1 w-16 bg-gray-200 mx-auto rounded-full my-4"></div>
          <p className="text-gray-400 text-xs">
            目標 ¥{targetAmount.toLocaleString()} まで <br/>
            あと <span className="text-cyan-600 font-bold">¥{(targetAmount - initialAmount).toLocaleString()}</span>
          </p>
        </div>

        {/* ログインしていない場合の案内 */}
        {!loading && initialAmount === 0 && targetAmount === 1000000 && (
           <div className="mt-10 px-6 py-4 bg-blue-50 rounded-xl text-center">
             <p className="text-sm text-blue-800 mb-2">まだデータがありません</p>
             <Link href="/settings" className="text-sm font-bold text-cyan-600 underline">
               設定画面で資産を入力する →
             </Link>
           </div>
        )}

      </main>
    </div>
  );
}