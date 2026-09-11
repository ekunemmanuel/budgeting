export type TransactionType = 'expense' | 'income';

export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  date: string;
}

export type Budgets = Record<string, number>;
