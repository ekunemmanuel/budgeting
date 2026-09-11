import { ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { useData } from '../../lib/store';
import { formatCurrency, isSameMonth, monthLabel } from '../../lib/format';
import { EXPENSE_CATEGORIES, getCategory } from '../../lib/categories';
import { useThemeColors } from '../../lib/theme';
import { ProgressBar } from '../../components/progress-bar';
import { Fab } from '../../components/fab';
import { Text } from '../../components/text';
import { Ionicons } from '@expo/vector-icons';

export default function Dashboard() {
  const { transactions, budgets, customCategories } = useData();
  const colors = useThemeColors();
  const allExpenseCategories = [...EXPENSE_CATEGORIES, ...customCategories];
  const now = useMemo(() => new Date(), []);

  const monthTransactions = useMemo(
    () => transactions.filter((t) => isSameMonth(t.date, now)),
    [transactions, now]
  );

  const income = useMemo(
    () => monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );
  const expense = useMemo(
    () => monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
    [monthTransactions]
  );
  const balance = income - expense;

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of monthTransactions) {
      if (t.type !== 'expense') continue;
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    }
    return map;
  }, [monthTransactions]);

  const budgetedCategories = allExpenseCategories.filter((c) => budgets[c.id] > 0).slice(0, 4);
  const recent = transactions.slice(0, 5);

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pt-safe-or-4 pb-28"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-sm text-muted">{monthLabel(now)}</Text>
        <Text className="mt-1 text-3xl font-bold text-ink">Overview</Text>

        <View className="mt-6 rounded-3xl bg-surface p-5 border border-border">
          <Text className="text-sm text-muted">Balance this month</Text>
          <Text className={`mt-1 text-4xl font-bold ${balance < 0 ? 'text-danger' : 'text-ink'}`}>
            {formatCurrency(balance)}
          </Text>

          <View className="mt-5 flex-row gap-4">
            <View className="flex-1 flex-row items-center gap-3 rounded-2xl bg-primary-soft p-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-primary">
                <Ionicons name="arrow-down" size={16} color="white" />
              </View>
              <View>
                <Text className="text-xs text-muted">Income</Text>
                <Text className="text-base font-semibold text-ink">{formatCurrency(income)}</Text>
              </View>
            </View>
            <View className="flex-1 flex-row items-center gap-3 rounded-2xl bg-danger-soft p-3">
              <View className="h-9 w-9 items-center justify-center rounded-full bg-danger">
                <Ionicons name="arrow-up" size={16} color="white" />
              </View>
              <View>
                <Text className="text-xs text-muted">Expenses</Text>
                <Text className="text-base font-semibold text-ink">{formatCurrency(expense)}</Text>
              </View>
            </View>
          </View>
        </View>

        {budgetedCategories.length > 0 && (
          <View className="mt-8">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-ink">Budgets</Text>
              <Link href="/(tabs)/budgets" className="text-sm text-primary font-sans-medium">
                See all
              </Link>
            </View>

            <View className="mt-3 gap-3">
              {budgetedCategories.map((cat) => {
                const spent = spentByCategory[cat.id] ?? 0;
                const limit = budgets[cat.id];
                return (
                  <View key={cat.id} className="rounded-2xl bg-surface p-4 border border-border">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                        <Text className="text-sm font-medium text-ink">{cat.label}</Text>
                      </View>
                      <Text className="text-sm text-muted">
                        {formatCurrency(spent)} / {formatCurrency(limit)}
                      </Text>
                    </View>
                    <View className="mt-3">
                      <ProgressBar progress={spent / limit} color={spent > limit ? colors.danger : cat.color} />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        <View className="mt-8">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-ink">Recent activity</Text>
            <Link href="/(tabs)/transactions" className="text-sm text-primary font-sans-medium">
              See all
            </Link>
          </View>

          {recent.length === 0 ? (
            <Text className="mt-4 text-sm text-muted">No transactions yet. Tap + to add one.</Text>
          ) : (
            <View className="mt-3 gap-2">
              {recent.map((t) => {
                const cat = getCategory(t.categoryId, customCategories);
                return (
                  <View
                    key={t.id}
                    className="flex-row items-center justify-between rounded-2xl bg-surface p-4 border border-border"
                  >
                    <View className="flex-1 flex-row items-center gap-3 mr-3">
                      <View
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${cat.color}22` }}
                      >
                        <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-ink" numberOfLines={1}>
                          {cat.label}
                        </Text>
                        {!!t.note && (
                          <Text className="text-xs text-muted" numberOfLines={1}>
                            {t.note}
                          </Text>
                        )}
                      </View>
                    </View>
                    <Text className={`text-sm font-semibold ${t.type === 'income' ? 'text-primary' : 'text-ink'}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
      <Fab href="/add-transaction" />
    </View>
  );
}
