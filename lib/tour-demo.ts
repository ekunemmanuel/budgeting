import { Transaction } from './types';

/**
 * Stand-in entries shown only while a tour is running on an otherwise empty
 * screen, so the guide has something real-looking to point at.
 *
 * These are never saved and never counted. Screens fall back to them only when
 * the user has no data of their own and a tour is active.
 */
export function demoTransactions(): Transaction[] {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  return [
    {
      id: 'tour-demo-1',
      type: 'income',
      amount: 450000,
      categoryId: 'income',
      note: '',
      date: today.toISOString(),
      source: 'Salary',
    },
    {
      id: 'tour-demo-2',
      type: 'expense',
      amount: 12500,
      categoryId: 'groceries',
      note: 'Weekly shop',
      date: today.toISOString(),
    },
    {
      id: 'tour-demo-3',
      type: 'expense',
      amount: 3200,
      categoryId: 'transport',
      note: 'Bus fare',
      date: yesterday.toISOString(),
    },
  ];
}
