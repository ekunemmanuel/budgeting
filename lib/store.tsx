import React, { createContext, useContext, useMemo, useState } from 'react';
import { Budgets, Category, Transaction, TransactionType } from './types';
import {
  EXPENSE_CATEGORIES,
  OTHER_CATEGORY_ID,
  canRemoveCategory,
  isBuiltInCategory,
  nextCustomCategoryColor,
} from './categories';
import {
  loadBudgets,
  loadCustomCategories,
  loadHiddenCategories,
  loadTransactions,
  saveBudgets,
  saveCustomCategories,
  saveHiddenCategories,
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
  source?: string;
}

interface DataContextValue {
  transactions: Transaction[];
  budgets: Budgets;
  customCategories: Category[];
  /** Built-in categories the user hid, in their original order. */
  hiddenCategories: Category[];
  /** Every expense category that should appear in pickers and lists. */
  expenseCategories: Category[];
  addTransaction: (t: NewTransaction) => void;
  updateTransaction: (id: string, changes: NewTransaction) => void;
  deleteTransaction: (id: string) => void;
  setBudget: (categoryId: string, limit: number) => void;
  removeBudget: (categoryId: string) => void;
  addCategory: (label: string, icon?: string) => Category;
  renameCategory: (id: string, label: string) => void;
  /** Changes a custom category's icon. Built-in categories keep theirs. */
  setCategoryIcon: (id: string, icon: string) => void;
  /** Deletes a custom category, or hides a built-in one. Protected ids are ignored. */
  removeCategory: (id: string) => void;
  restoreCategory: (id: string) => void;
  countTransactionsIn: (categoryId: string) => number;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);
  const [budgets, setBudgets] = useState<Budgets>(loadBudgets);
  const [customCategories, setCustomCategories] = useState<Category[]>(loadCustomCategories);
  const [hiddenIds, setHiddenIds] = useState<string[]>(loadHiddenCategories);

  const hiddenCategories = useMemo(
    () => EXPENSE_CATEGORIES.filter((c) => hiddenIds.includes(c.id)),
    [hiddenIds]
  );

  const expenseCategories = useMemo(
    () => [...EXPENSE_CATEGORIES.filter((c) => !hiddenIds.includes(c.id)), ...customCategories],
    [hiddenIds, customCategories]
  );

  const value = useMemo<DataContextValue>(
    () => ({
      transactions,
      budgets,
      customCategories,
      hiddenCategories,
      expenseCategories,
      addTransaction: (t) => {
        setTransactions((prev) => {
          const next = [{ id: generateId(), ...t }, ...prev];
          saveTransactions(next);
          return next;
        });
      },
      updateTransaction: (id, changes) => {
        setTransactions((prev) => {
          const next = prev.map((t) => (t.id === id ? { ...t, ...changes } : t));
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
      addCategory: (label, icon) => {
        const category: Category = {
          id: generateId(),
          label,
          icon: icon ?? 'pricetag-outline',
          color: nextCustomCategoryColor(customCategories.length),
        };
        setCustomCategories((prev) => {
          const next = [...prev, category];
          saveCustomCategories(next);
          return next;
        });
        return category;
      },
      setCategoryIcon: (id, icon) => {
        setCustomCategories((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, icon } : c));
          saveCustomCategories(next);
          return next;
        });
      },
      renameCategory: (id, label) => {
        setCustomCategories((prev) => {
          const next = prev.map((c) => (c.id === id ? { ...c, label } : c));
          saveCustomCategories(next);
          return next;
        });
      },
      removeCategory: (id) => {
        if (!canRemoveCategory(id)) return;

        // Re-file anything already booked against it so no amount is lost.
        setTransactions((prev) => {
          const next = prev.map((t) =>
            t.categoryId === id ? { ...t, categoryId: OTHER_CATEGORY_ID } : t
          );
          saveTransactions(next);
          return next;
        });

        setBudgets((prev) => {
          const next = { ...prev };
          delete next[id];
          saveBudgets(next);
          return next;
        });

        if (isBuiltInCategory(id)) {
          setHiddenIds((prev) => {
            const next = prev.includes(id) ? prev : [...prev, id];
            saveHiddenCategories(next);
            return next;
          });
        } else {
          setCustomCategories((prev) => {
            const next = prev.filter((c) => c.id !== id);
            saveCustomCategories(next);
            return next;
          });
        }
      },
      restoreCategory: (id) => {
        setHiddenIds((prev) => {
          const next = prev.filter((hidden) => hidden !== id);
          saveHiddenCategories(next);
          return next;
        });
      },
      countTransactionsIn: (categoryId) =>
        transactions.reduce((count, t) => (t.categoryId === categoryId ? count + 1 : count), 0),
    }),
    [transactions, budgets, customCategories, hiddenCategories, expenseCategories]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
