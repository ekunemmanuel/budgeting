import 'expo-sqlite/localStorage/install';
import { Budgets, Category, Transaction } from './types';

const TRANSACTIONS_KEY = '@budgeting/transactions';
const BUDGETS_KEY = '@budgeting/budgets';
const CATEGORIES_KEY = '@budgeting/custom-categories';
const HIDDEN_CATEGORIES_KEY = '@budgeting/hidden-categories';
const TOURS_SEEN_KEY = '@budgeting/tours-seen';

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

/** Ids of built-in categories the user has hidden. Custom ones are deleted outright. */
export function loadHiddenCategories(): string[] {
  const raw = localStorage.getItem(HIDDEN_CATEGORIES_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveHiddenCategories(ids: string[]): void {
  localStorage.setItem(HIDDEN_CATEGORIES_KEY, JSON.stringify(ids));
}

/** Ids of the screen tours the user has already been shown. */
export function loadToursSeen(): string[] {
  const raw = localStorage.getItem(TOURS_SEEN_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function saveToursSeen(ids: string[]): void {
  localStorage.setItem(TOURS_SEEN_KEY, JSON.stringify(ids));
}
