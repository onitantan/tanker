'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  dailyValue: number;
  tag?: string | null;
  created_at?: string;
};

type BalanceSheetProps = {
  transactions: Transaction[];
  initialAsset: number;
  onInitialAssetChange: (value: number) => void;
};

// デフォルトユーザーID（UUID形式）
const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

export default function BalanceSheet({
  transactions,
  initialAsset: propInitialAsset,
  onInitialAssetChange,
}: BalanceSheetProps) {
  const [initialAsset, setInitialAsset] = useState<number>(propInitialAsset || 0);

  // user_settingsから初期資産を取得
  useEffect(() => {
    const fetchInitialAsset = async () => {
      try {
        // ログイン中のユーザーIDを取得（認証がある場合）
        const { data: { user } } = await supabase.auth.getUser();
        const userId = user?.id || DEFAULT_USER_ID;

        const { data, error } = await supabase
          .from('user_settings')
          .select('initial_asset')
          .eq('user_id', userId)
          .single();

        if (error && error.code !== 'PGRST116') {
          // PGRST116は「行が見つからない」エラー
          console.error('Error fetching initial asset:', error);
          // propsから受け取った値を使用
          if (propInitialAsset !== undefined) {
            setInitialAsset(propInitialAsset);
          }
          return;
        }

        if (data) {
          const fetchedInitialAsset = data.initial_asset || 0;
          setInitialAsset(fetchedInitialAsset);
          // 親コンポーネントにも通知（必要に応じて）
          if (fetchedInitialAsset !== propInitialAsset) {
            onInitialAssetChange(fetchedInitialAsset);
          }
        } else if (propInitialAsset !== undefined) {
          // データがない場合、propsから受け取った値を使用
          setInitialAsset(propInitialAsset);
        }
      } catch (error) {
        console.error('Error:', error);
        // エラー時はpropsから受け取った値を使用
        if (propInitialAsset !== undefined) {
          setInitialAsset(propInitialAsset);
        }
      }
    };

    fetchInitialAsset();
  }, [propInitialAsset, onInitialAssetChange]);
  // 全期間の収支累計
  const totalBalance = transactions.reduce((acc, item) => {
    const actualAmount = item.type === 'expense' ? -item.amount : item.amount;
    return acc + actualAmount;
  }, 0);

  // 現金・預金（初期資産 + 収支累計）
  const cashAndDeposits = initialAsset + totalBalance;

  // 純資産（利益剰余金）
  const retainedEarnings = cashAndDeposits;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
        貸借対照表（BS） - 現在の資産総額（推定）
      </h3>
      
      {/* 初期資産入力フォーム */}
      <div className="mb-4 p-3 bg-slate-50 rounded-lg">
        <label className="block text-xs font-bold text-slate-500 mb-1">
          初期資産（Initial Asset）
        </label>
        <input
          type="number"
          value={initialAsset}
          onChange={(e) => onInitialAssetChange(parseInt(e.target.value) || 0)}
          className="w-full p-2 border rounded-lg text-sm"
          placeholder="0"
        />
      </div>

      {/* T字勘定レイアウト */}
      <div className="grid grid-cols-2 gap-4">
        {/* 左側：資産 */}
        <div className="border-r border-slate-200 pr-4">
          <h4 className="text-xs font-bold text-slate-600 mb-3 uppercase">資産</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700">現金・預金</span>
              <span className="text-sm font-bold text-slate-800">
                {Math.round(cashAndDeposits).toLocaleString()}円
              </span>
            </div>
          </div>
        </div>

        {/* 右側：純資産 */}
        <div className="pl-4">
          <h4 className="text-xs font-bold text-slate-600 mb-3 uppercase">純資産</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-700">利益剰余金</span>
              <span className="text-sm font-bold text-slate-800">
                {Math.round(retainedEarnings).toLocaleString()}円
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 合計 */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-600">合計</span>
          <span className="text-sm font-bold text-slate-800">
            {Math.round(cashAndDeposits).toLocaleString()}円
          </span>
        </div>
      </div>
    </div>
  );
}
