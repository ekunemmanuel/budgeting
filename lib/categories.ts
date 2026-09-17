import { Category } from './types';

export const INCOME_CATEGORY_ID = 'income';
export const OTHER_CATEGORY_ID = 'other';

/**
 * Categories that can never be removed or hidden: income is the only home for
 * incoming money, and Other is where transactions are re-filed when their
 * category goes away.
 */
export const PROTECTED_CATEGORY_IDS = [INCOME_CATEGORY_ID, OTHER_CATEGORY_ID];

export const CATEGORIES: Category[] = [
  { id: INCOME_CATEGORY_ID, label: 'Income', icon: 'cash-outline', color: '#16a37a' },
  { id: 'food', label: 'Food & Drink', icon: 'fast-food-outline', color: '#e0923d' },
  { id: 'groceries', label: 'Groceries', icon: 'basket-outline', color: '#4d9de0' },
  { id: 'transport', label: 'Transport', icon: 'car-outline', color: '#7b6ee0' },
  { id: 'housing', label: 'Housing', icon: 'home-outline', color: '#c4577c' },
  { id: 'bills', label: 'Bills & Utilities', icon: 'receipt-outline', color: '#5a6b7d' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline', color: '#a04de0' },
  { id: 'shopping', label: 'Shopping', icon: 'bag-handle-outline', color: '#e04d84' },
  { id: 'health', label: 'Health', icon: 'medkit-outline', color: '#3dbf9c' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#8a8a94' },
];

export const EXPENSE_CATEGORIES = CATEGORIES.filter((c) => c.id !== INCOME_CATEGORY_ID);

const CUSTOM_CATEGORY_COLORS = ['#e0923d', '#4d9de0', '#7b6ee0', '#c4577c', '#5a6b7d', '#a04de0', '#e04d84', '#3dbf9c'];

/** Icons offered when naming a category of your own. Ionicons outline names. */
export const CATEGORY_ICONS = [
  'pricetag-outline',
  'fast-food-outline',
  'basket-outline',
  'car-outline',
  'home-outline',
  'receipt-outline',
  'film-outline',
  'bag-handle-outline',
  'medkit-outline',
  'school-outline',
  'airplane-outline',
  'barbell-outline',
  'paw-outline',
  'gift-outline',
  'phone-portrait-outline',
  'shirt-outline',
  'construct-outline',
  'wallet-outline',
];

export function nextCustomCategoryColor(existingCount: number): string {
  return CUSTOM_CATEGORY_COLORS[existingCount % CUSTOM_CATEGORY_COLORS.length];
}

export function getCategory(id: string, extra: Category[] = []): Category {
  return (
    CATEGORIES.find((c) => c.id === id) ?? extra.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1]
  );
}

export function isBuiltInCategory(id: string): boolean {
  return CATEGORIES.some((c) => c.id === id);
}

export function canRemoveCategory(id: string): boolean {
  return !PROTECTED_CATEGORY_IDS.includes(id);
}
