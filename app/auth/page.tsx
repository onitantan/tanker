'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    // 既にログインしている場合はホームにリダイレクト
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/');
      }
    };

    checkSession();

    // ログイン状態を監視（ログイン・登録完了時に自動リダイレクト）
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // ログイン済みならホームへ飛ばす
        router.push('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-4 relative">
      {/* Liquid Tank Background - 認証画面にも背景を表示 */}
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none">
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: '30%',
            background: 'linear-gradient(to top, rgba(34, 211, 238, 0.8), rgba(59, 130, 246, 0.7))',
          }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* ロゴ/タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-slate-800 mb-2">Tanker</h1>
          <p className="text-slate-600">個人の財務管理ツール</p>
        </div>

        {/* 認証カード */}
        <div className="bg-white/95 backdrop-blur-lg p-8 rounded-2xl shadow-xl border border-slate-200">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#06b6d4', // シアン
                    brandAccent: '#3b82f6', // 青
                  },
                },
              },
              style: {
                button: {
                  borderRadius: '8px',
                  fontWeight: 'bold',
                },
                input: {
                  borderRadius: '8px',
                },
              },
            }}
            providers={[]} // Emailのみ有効
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/` : '/'}
          />
        </div>
      </div>
    </div>
  );
}
