'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  onTransactionAdded: () => void;
};

export default function TransactionForm({ onTransactionAdded }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'expense' as 'income' | 'expense',
    date: new Date().toISOString().split('T')[0],
    category: 'consumption' as string,
    tag: 'food' as string,
    payment_method: 'credit' as string,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount) return;

    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert('ログインが必要です');
        return;
      }

      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        name: formData.name,
        amount: Number(formData.amount),
        type: formData.type,
        date: formData.date,
        category: formData.category,
        tag: formData.tag,
        payment_method: formData.payment_method,
      });

      if (error) {
        console.error('Error:', error);
        alert('保存に失敗しました');
        return;
      }

      // フォームをリセット
      setFormData({
        name: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().split('T')[0],
        category: 'consumption',
        tag: 'food',
        payment_method: 'credit',
      });

      onTransactionAdded();
    } catch (error) {
      console.error('Error:', error);
      alert('保存に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
          項目名
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="例: 食費"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
          金額
        </label>
        <input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          className="w-full p-3 border rounded-lg"
          placeholder="0"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
          種類
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'expense' })}
            className={`flex-1 py-3 rounded-lg font-bold ${
              formData.type === 'expense'
                ? 'bg-red-500 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <span className="whitespace-nowrap">支出</span>
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, type: 'income' })}
            className={`flex-1 py-3 rounded-lg font-bold ${
              formData.type === 'income'
                ? 'bg-green-500 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}
          >
            <span className="whitespace-nowrap">収入</span>
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
          日付
        </label>
        <input
          type="date"
          value={formData.date}
          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
          className="w-full p-3 border rounded-lg"
          required
        />
      </div>
      {formData.type === 'expense' && (
        <>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
              分類
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-3 border rounded-lg"
            >
              <option value="consumption">消費</option>
              <option value="waste">浪費</option>
              <option value="investment">投資</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
              勘定科目（タグ）
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'food', label: '🍱 食費' },
                { value: 'daily', label: '🧻 日用品' },
                { value: 'transport', label: '🚃 交通費' },
                { value: 'housing', label: '🏠 住居・通信' },
                { value: 'social', label: '🍻 交際費' },
                { value: 'fun', label: '🎮 趣味' },
                { value: 'medical', label: '🏥 医療' },
                { value: 'other', label: '❓ その他' },
              ].map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, tag: tag.value })}
                  className={`p-2 rounded-lg border-2 text-xs font-bold transition-colors ${
                    formData.tag === tag.value
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 whitespace-nowrap">
              支払い方法
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'credit', label: '💳 クレカ' },
                { value: 'pay', label: '📱 電子マネー' },
                { value: 'cash', label: '💵 現金' },
                { value: 'bank', label: '🏦 銀行' },
              ].map((method) => (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, payment_method: method.value })}
                  className={`p-2 rounded-lg border-2 text-xs font-bold transition-colors ${
                    formData.payment_method === method.value
                      ? 'border-cyan-600 bg-cyan-50 text-cyan-700'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300'
                  }`}
                >
                  {method.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
      >
        <span className="whitespace-nowrap">{loading ? '保存中...' : '追加'}</span>
      </button>
    </form>
  );
}
