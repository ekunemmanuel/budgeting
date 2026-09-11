import 'expo-sqlite/localStorage/install';
import { Budgets, Category, Transaction } from './types';

const TRANSACTIONS_KEY = '@budgeting/transactions';
const BUDGETS_KEY = '@budgeting/budgets';
const CATEGORIES_KEY = '@budgeting/custom-categories';

export function loadTransactions(): Transaction[] {
  const raw = localStorage.getItem(TRANSACTIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveTransactions(transactions: Transaction[]): void {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
}

export function loadBudgets(): Budgets {
  const raw = localStorage.getItem(BUDGETS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export function saveBudgets(budgets: Budgets): void {
  localStorage.setItem(BUDGETS_KEY, JSON.stringify(budgets));
}

export function loadCustomCategories(): Category[] {
  const raw = localStorage.getItem(CATEGORIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveCustomCategories(categories: Category[]): void {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
}
