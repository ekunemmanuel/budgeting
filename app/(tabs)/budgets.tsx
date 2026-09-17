import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useData } from '../../lib/store';
import { formatAmount, isSameMonth } from '../../lib/format';
import { useThemeColors } from '../../lib/theme';
import { ProgressBar } from '../../components/progress-bar';
import { TourTarget } from '../../components/tour-target';
import { useScreenTour, type TourStep } from '../../lib/tour';
import { Text } from '../../components/text';

const TOUR: TourStep[] = [
  {
    target: 'budgets-add',
    title: 'Make it yours',
    body: 'Add your own categories for the things you actually spend on. Ones you never use can be hidden from the same screen.',
  },
  {
    target: 'budgets-first-category',
    title: 'Set a monthly limit',
    body: 'Tap a category to give it a limit. Once set it moves to the top of the list, with a bar tracking what you have spent. The bar turns red if you go over.',
  },
];

export default function Budgets() {
  const { transactions, budgets, expenseCategories, hiddenCategories, restoreCategory } = useData();
  const colors = useThemeColors();
  const now = useMemo(() => new Date(), []);

  // Categories with a limit float to the top so the ones being tracked are the
  // first thing on screen; everything else keeps its usual order underneath.
  const orderedCategories = useMemo(() => {
    const hasLimit = (id: string) => (budgets[id] ?? 0) > 0;
    return [
      ...expenseCategories.filter((c) => hasLimit(c.id)),
      ...expenseCategories.filter((c) => !hasLimit(c.id)),
    ];
  }, [expenseCategories, budgets]);

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== 'expense' || !isSameMonth(t.date, now)) continue;
      map[t.categoryId] = (map[t.categoryId] ?? 0) + t.amount;
    }
    return map;
  }, [transactions, now]);

  useScreenTour('budgets', TOUR);

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-safe-or-5 pt-safe-or-4 pb-32"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-3xl font-bold text-ink">Budgets</Text>
            <Text className="mt-1 text-xs text-muted">Tap a category to set its limit or remove it</Text>
          </View>
          <TourTarget id="budgets-add">
            <Pressable onPress={() => router.push('/add-category')} hitSlop={8}>
              <Text className="text-sm font-medium text-primary">+ Add</Text>
            </Pressable>
          </TourTarget>
        </View>

        <View className="mt-5 gap-3">
          {orderedCategories.map((cat, index) => {
            const spent = spentByCategory[cat.id] ?? 0;
            const limit = budgets[cat.id] ?? 0;
            const hasLimit = limit > 0;
            const overBudget = hasLimit && spent > limit;

            const row = (
              <Pressable
                key={cat.id}
                onPress={() => router.push({ pathname: '/edit-budget', params: { categoryId: cat.id } })}
                className="rounded-2xl bg-surface p-4 border border-border active:opacity-70"
              >
                <View className="flex-row items-center justify-between gap-3">
                  <View className="flex-1 flex-row items-center gap-2">
                    <View
                      className="h-9 w-9 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${cat.color}22` }}
                    >
                      <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                    </View>
                    <Text className="flex-1 text-sm font-medium text-ink" numberOfLines={1}>
                      {cat.label}
                    </Text>
                  </View>

                  {hasLimit ? (
                    <Text
                      numberOfLines={1}
                      className={`shrink-0 text-sm ${overBudget ? 'text-danger font-semibold' : 'text-muted'}`}
                    >
                      {formatAmount(spent)} / {formatAmount(limit)}
                    </Text>
                  ) : (
                    <Text className="shrink-0 text-sm text-primary font-medium">Set budget</Text>
                  )}
                </View>

                {hasLimit && (
                  <View className="mt-3">
                    <ProgressBar progress={spent / limit} color={overBudget ? colors.danger : cat.color} />
                  </View>
                )}
              </Pressable>
            );

            // Only the first row is highlighted. Ringing the whole list left no
            // room on screen for the explanation card.
            return index === 0 ? (
              <TourTarget key={cat.id} id="budgets-first-category">
                {row}
              </TourTarget>
            ) : (
              row
            );
          })}
        </View>

        {hiddenCategories.length > 0 && (
          <View className="mt-8">
            <Text className="text-sm font-semibold text-ink">Hidden categories</Text>
            <Text className="mt-1 text-xs text-muted">
              These are kept out of the pickers. Restore one to start using it again.
            </Text>

            <View className="mt-3 gap-2">
              {hiddenCategories.map((cat) => (
                <View
                  key={cat.id}
                  className="flex-row items-center justify-between gap-3 rounded-2xl bg-surface p-3 border border-border"
                >
                  <View className="flex-1 flex-row items-center gap-2">
                    <View
                      className="h-8 w-8 shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: `${cat.color}22` }}
                    >
                      <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                    </View>
                    <Text className="flex-1 text-sm text-muted" numberOfLines={1}>
                      {cat.label}
                    </Text>
                  </View>
                  <Pressable onPress={() => restoreCategory(cat.id)} hitSlop={8} className="active:opacity-70">
                    <Text className="shrink-0 text-sm font-medium text-primary">Restore</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
