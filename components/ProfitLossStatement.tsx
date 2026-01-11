'use client';

type Transaction = {
  id: string;
  name: string;
  amount: number;
  type: 'income' | 'expense';
  frequency: 'one_time' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  dailyValue: number;
  created_at?: string;
};

type ProfitLossStatementProps = {
  transactions: Transaction[];
};

export default function ProfitLossStatement({ transactions }: ProfitLossStatementProps) {
  // 今月（Month to Date）のデータを取得
  const getCurrentMonthData = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return transactions.filter((item) => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate >= firstDayOfMonth;
    });
  };

  const monthData = getCurrentMonthData();

  // 売上（Income合計）
  const income = monthData
    .filter((item) => item.type === 'income')
    .reduce((acc, item) => acc + item.amount, 0);

  // 固定費（Daily/Monthly/Yearlyの按分）
  const fixedExpenses = monthData
    .filter((item) => item.type === 'expense' && item.frequency !== 'one_time')
    .reduce((acc, item) => {
      // 今月の日数を取得
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      
      // 日割り計算
      let monthlyAmount = 0;
      if (item.frequency === 'daily') monthlyAmount = item.amount * daysInMonth;
      else if (item.frequency === 'weekly') monthlyAmount = (item.amount / 7) * daysInMonth;
      else if (item.frequency === 'monthly') monthlyAmount = item.amount;
      else if (item.frequency === 'yearly') monthlyAmount = (item.amount / 365) * daysInMonth;
      
      return acc + monthlyAmount;
    }, 0);

  // 変動費（One-timeの合計）
  const variableExpenses = monthData
    .filter((item) => item.type === 'expense' && item.frequency === 'one_time')
    .reduce((acc, item) => acc + item.amount, 0);

  // 費用合計
  const totalExpenses = fixedExpenses + variableExpenses;

  // 利益
  const profit = income - totalExpenses;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
      <h3 className="text-sm font-bold text-slate-700 mb-4 text-center">
        損益計算書（PL） - {new Date().getMonth() + 1}月（今月の成績表）
      </h3>
      <div className="space-y-4">
        {/* 売上 */}
        <div className="border-b border-slate-200 pb-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">売上</span>
            <span className="text-lg font-bold text-blue-600">
              {Math.round(income).toLocaleString()}円
            </span>
          </div>
        </div>

        {/* 費用 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600">費用合計</span>
            <span className="text-sm font-bold text-red-600">
              {Math.round(totalExpenses).toLocaleString()}円
            </span>
          </div>
          <div className="pl-4 space-y-1">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>うち固定費（Fixed）</span>
              <span>{Math.round(fixedExpenses).toLocaleString()}円</span>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>うち変動費（Variable/One-time）</span>
              <span>{Math.round(variableExpenses).toLocaleString()}円</span>
            </div>
          </div>
        </div>

        {/* 利益 */}
        <div className="border-t border-slate-200 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">純利益（Profit）</span>
            <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {profit >= 0 ? '+' : ''}{Math.round(profit).toLocaleString()}円
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
