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
  /**
   * Where an income came from — salary, a client, a gift. Optional, and only
   * meaningful on income, which has no category of its own to describe it.
   */
  source?: string;
}

export type Budgets = Record<string, number>;
