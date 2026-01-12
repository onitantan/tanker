'use client';

import { Transaction } from '@/types';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  transactions: Transaction[];
  onTransactionUpdated: () => void;
};

export default function TransactionList({ transactions, onTransactionUpdated }: Props) {
  const handleDelete = async (id: string) => {
    if (!confirm('削除しますか？')) return;

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('ログインが必要です');
        return;
      }

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error:', error);
        alert('削除に失敗しました');
        return;
      }

      onTransactionUpdated();
    } catch (error) {
      console.error('Error:', error);
      alert('削除に失敗しました');
    }
  };

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

  // 決済方法のアイコン定義
  const paymentMethodIcons: Record<string, string> = {
    credit: '💳',
    pay: '📱',
    cash: '💵',
    bank: '🏦',
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8 whitespace-nowrap">
        取引がありません
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {transactions.map((item) => {
        const tagLabel = item.tag ? tagLabels[item.tag] || `❓ ${item.tag}` : '❓ その他';
        const paymentIcon = item.payment_method
          ? paymentMethodIcons[item.payment_method] || '💳'
          : '💳';

        return (
          <div
            key={item.id}
            className="bg-slate-50 p-4 rounded-lg flex justify-between items-center"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold">{item.name || item.description || '無題'}</p>
                {item.tag && (
                  <span className="px-2 py-1 bg-cyan-100 text-cyan-700 text-xs font-bold rounded-full whitespace-nowrap">
                    {tagLabel}
                  </span>
                )}
                <span className="text-lg" title={`支払い方法: ${item.payment_method || 'credit'}`}>
                  {paymentIcon}
                </span>
              </div>
              <p className="text-xs text-slate-400 whitespace-nowrap">
                {item.amount.toLocaleString()}円
                {item.date && ` - ${new Date(item.date).toLocaleDateString('ja-JP')}`}
              </p>
            </div>
            <div
              className={`font-bold mr-4 whitespace-nowrap ${
                item.type === 'income' ? 'text-green-600' : 'text-red-500'
              }`}
            >
              <span className="whitespace-nowrap">
                {item.type === 'income' ? '+' : '-'}
                {item.amount.toLocaleString()}円
              </span>
            </div>
            <button
              onClick={() => handleDelete(item.id)}
              className="p-2 text-slate-600 hover:text-red-600"
              aria-label="削除"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m-4.788 5.636a4.5 4.5 0 01-1.897-1.13L2.5 12.5m0 0l3.5-3.5m-3.5 3.5l3.5 3.5"
                />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
