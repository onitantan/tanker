'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // ログインページの場合はガードしない（無限ループ防止の最重要ポイント）
    if (pathname === '/auth') {
      setLoading(false);
      return;
    }

    // ログイン状態の変化を監視（初期セッションも含む）
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || session) {
        // ログイン済みなら表示許可
        setUser(session?.user || null);
        setLoading(false);
      } else if (event === 'SIGNED_OUT' || !session) {
        // ログアウト済みなら /auth へ追放
        if (pathname !== '/auth') {
          router.replace('/auth');
        }
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router, pathname]);

  // ログインページの場合は、そのまま表示（ガードしない）
  if (pathname === '/auth') {
    return <>{children}</>;
  }

  // ロード中は「読み込み中...」を表示
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mb-4"></div>
          <div className="text-xl text-cyan-600 animate-pulse">Loading Tanker...</div>
        </div>
      </div>
    );
  }

  // ログインしていない場合は何も表示しない（リダイレクト待ち）
  if (!user) return null;

  // ログイン済みなら中身を表示
  return <>{children}</>;
}
