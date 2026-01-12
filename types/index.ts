// types/index.ts
export type Transaction = {
    id: string;
    user_id: string;
    date: string;
    amount: number;
    type: 'income' | 'expense';
    category: string;
    name?: string;
    description?: string;
    payment_method?: string;
    tag?: string;
    created_at?: string;
  };
  
  export type UserSettings = {
    id: string;
    user_id: string;
    initial_asset: number;
    target_asset: number;
    monthly_target?: number;
  };