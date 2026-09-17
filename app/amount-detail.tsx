import { useMemo } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useData } from '../lib/store';
import { getCategory } from '../lib/categories';
import { formatCurrency, isSameMonth, monthLabel } from '../lib/format';
import { useThemeColors } from '../lib/theme';
import { Text } from '../components/text';

type Figure = 'balance' | 'income' | 'expense';

const TITLES: Record<Figure, string> = {
  balance: 'Balance this month',
  income: 'Income this month',
  expense: 'Expenses this month',
};

export default function AmountDetail() {
  const { figure = 'balance' } = useLocalSearchParams<{ figure?: Figure }>();
  const { transactions, customCategories } = useData();
  const colors = useThemeColors();
  const now = useMemo(() => new Date(), []);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => isSameMonth(t.date, now)),
    [transactions, now]
  );

  const income = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const total = figure === 'income' ? income : figure === 'expense' ? expense : income - expense;

  // Balance is made of the two totals; the other two break down by category.
  const rows = useMemo(() => {
    if (figure === 'balance') {
      return [
        { key: 'income', label: 'Income', value: income, color: colors.primary },
        { key: 'expense', label: 'Expenses', value: -expense, color: colors.danger },
      ];
    }

    const byCategory = new Map<string, number>();
    for (const t of monthTransactions) {
      if (t.type !== figure) continue;
      // Income has no category, so its source is what distinguishes one from another.
      const key = figure === 'income' ? t.source?.trim() || 'Income' : t.categoryId;
      byCategory.set(key, (byCategory.get(key) ?? 0) + t.amount);
    }

    return Array.from(byCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([key, value]) => {
        const category = figure === 'income' ? null : getCategory(key, customCategories);
        return {
          key,
          label: category ? category.label : key,
          value,
          color: category ? category.color : colors.primary,
        };
      });
  }, [figure, monthTransactions, customCategories, income, expense, colors]);

  const count = monthTransactions.filter((t) => figure === 'balance' || t.type === figure).length;

  return (
    <View className="bg-bg px-safe-or-5 pb-safe-or-6 pt-5">
      <Text className="text-sm text-muted">{TITLES[figure]}</Text>
      <Text className="mt-1 text-xs text-muted">{monthLabel(now)}</Text>

      <Text className={`mt-3 text-3xl font-bold ${total < 0 ? 'text-danger' : 'text-ink'}`}>
        {formatCurrency(total)}
      </Text>
      <Text className="mt-1 text-xs text-muted">
        {count} transaction{count === 1 ? '' : 's'} this month
      </Text>

      {rows.length > 0 && (
        <View className="mt-5 gap-3 border-t border-border pt-4">
          {rows.map((row) => (
            <View key={row.key} className="flex-row items-center justify-between gap-3">
              <View className="flex-1 flex-row items-center gap-2">
                <View className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <Text className="flex-1 text-sm text-ink" numberOfLines={1}>
                  {row.label}
                </Text>
              </View>
              <Text
                numberOfLines={1}
                className={`shrink-0 text-sm font-medium ${row.value < 0 ? 'text-danger' : 'text-ink'}`}
              >
                {formatCurrency(row.value)}
              </Text>
            </View>
          ))}
        </View>
      )}

      {rows.length === 0 && (
        <View className="mt-6 items-center">
          <Ionicons name="receipt-outline" size={24} color={colors.muted} />
          <Text className="mt-2 text-sm text-muted">Nothing recorded this month yet.</Text>
        </View>
      )}
    </View>
  );
}
