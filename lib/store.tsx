import React, { createContext, useContext, useMemo, useState } from 'react';
import { Budgets, Category, Transaction, TransactionType } from './types';
import { nextCustomCategoryColor } from './categories';
import {
  loadBudgets,
  loadCustomCategories,
  loadTransactions,
  saveBudgets,
  saveCustomCategories,
  saveTransactions,
} from './storage';

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

interface NewTransaction {
  type: TransactionType;
  amount: number;
  categoryId: string;
  note: string;
  date: string;
}

interface DataContextValue {
  transactions: Transaction[];
  budgets: Budgets;
  customCategories: Category[];
  addTransaction: (t: NewTransaction) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (categoryId: string, limit: number) => void;
  removeBudget: (categoryId: string) => void;
  addCategory: (label: string) => Category;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [budgets, setBudgets] = useState<Budgets>(loadBudgets);
  const [customCategories, setCustomCategories] = useState<Category[]>(loadCustomCategories);

  const value = useMemo<DataContextValue>(
    () => ({
      transactions,
      budgets,
      customCategories,
      addTransaction: (t) => {
        setTransactions((prev) => {
          const next = [{ id: generateId(), ...t }, ...prev];
          saveTransactions(next);
          return next;
        });
      },
      deleteTransaction: (id) => {
        setTransactions((prev) => {
          const next = prev.filter((t) => t.id !== id);
          saveTransactions(next);
          return next;
        });
      },
      setBudget: (categoryId, limit) => {
        setBudgets((prev) => {
          const next = { ...prev, [categoryId]: limit };
          saveBudgets(next);
          return next;
        });
      },
      removeBudget: (categoryId) => {
        setBudgets((prev) => {
          const next = { ...prev };
          delete next[categoryId];
          saveBudgets(next);
          return next;
        });
      },
      addCategory: (label) => {
        const category: Category = {
          id: generateId(),
          label,
          icon: 'pricetag-outline',
          color: nextCustomCategoryColor(customCategories.length),
        };
        setCustomCategories((prev) => {
          const next = [...prev, category];
          saveCustomCategories(next);
          return next;
        });
        return category;
      },
    }),
    [transactions, budgets, customCategories]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
