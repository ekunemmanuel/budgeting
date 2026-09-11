import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useData } from '../../lib/store';
import { EXPENSE_CATEGORIES } from '../../lib/categories';
import { formatCurrency, isSameMonth } from '../../lib/format';
import { useThemeColors } from '../../lib/theme';
import { ProgressBar } from '../../components/progress-bar';
import { Text } from '../../components/text';

export default function Budgets() {
  const { transactions, budgets, customCategories } = useData();
  const colors = useThemeColors();
  const now = useMemo(() => new Date(), []);
  const allExpenseCategories = [...EXPENSE_CATEGORIES, ...customCategories];

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== 'expense' || !isSameMonth(t.date, now)) continue;
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    }
    return map;
  }, [transactions, now]);

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-safe-or-4 pb-28"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-ink">Budgets</Text>
            <Text className="mt-1 text-xs text-muted">Tap a category to set its monthly limit</Text>
          </View>
          <Pressable onPress={() => router.push('/add-category')}>
            <Text className="text-sm font-medium text-primary">+ Add</Text>
          </Pressable>
        </View>

        <View className="mt-5 gap-3">
          {allExpenseCategories.map((cat) => {
            const spent = spentByCategory[cat.id] ?? 0;
            const limit = budgets[cat.id] ?? 0;
            const hasLimit = limit > 0;
            const overBudget = hasLimit && spent > limit;

            return (
              <Pressable
                key={cat.id}
                onPress={() => router.push({ pathname: '/edit-budget', params: { categoryId: cat.id } })}
                className="rounded-2xl bg-surface p-4 border border-border active:opacity-70"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <View
                      className="h-9 w-9 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${cat.color}22` }}
                    >
                      <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                    </View>
                    <Text className="text-sm font-medium text-ink">{cat.label}</Text>
                  </View>

                  {hasLimit ? (
                    <Text className={`text-sm ${overBudget ? 'text-danger font-semibold' : 'text-muted'}`}>
                      {formatCurrency(spent)} / {formatCurrency(limit)}
                    </Text>
                  ) : (
                    <Text className="text-sm text-primary font-medium">Set budget</Text>
                  )}
                </View>

                {hasLimit && (
                  <View className="mt-3">
                    <ProgressBar progress={spent / limit} color={overBudget ? colors.danger : cat.color} />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
