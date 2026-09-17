import { Pressable, ScrollView, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useMemo } from 'react';
import { useData } from '../../lib/store';
import { formatAmount, isSameMonth, monthLabel } from '../../lib/format';
import { getCategory } from '../../lib/categories';
import { useThemeColors } from '../../lib/theme';
import { ProgressBar } from '../../components/progress-bar';
import { TransactionRow } from '../../components/transaction-row';
import { TourTarget } from '../../components/tour-target';
import { useScreenTour, useTour, type TourStep } from '../../lib/tour';
import { demoTransactions } from '../../lib/tour-demo';
import { Text } from '../../components/text';
import { Ionicons } from '@expo/vector-icons';

const TOUR: TourStep[] = [
  {
    target: 'overview-card',
    title: 'Your month at a glance',
    body: 'Money in, money out, and what is left. Big amounts are shortened so they always fit on one line, and you can tap any figure here to see more info.',
  },
  {
    target: 'overview-balance',
    title: 'Balance this month',
    body: 'What is left after everything you have spent. Tap it to open the full breakdown, with the exact amount down to the kobo.',
  },
  {
    target: 'overview-income',
    title: 'Income',
    body: 'Everything you have received this month. Tap it to see the exact total and which source each payment came from.',
  },
  {
    target: 'overview-expense',
    title: 'Expenses',
    body: 'Everything you have spent this month. Tap it to see the exact total split by category, so you know where it went.',
  },
  {
    target: 'overview-budgets',
    title: 'Your budgets',
    body: 'Any category you set a limit on shows up here with a bar tracking how much of it you have used.',
  },
  {
    target: 'overview-recent',
    title: 'Recent activity',
    body: 'Your latest few entries appear here. The Transactions tab holds the full history.',
  },
  {
    target: 'tab-add',
    title: 'Add as you spend',
    body: 'Record an expense or your income here. Pick a category for spending, or name the source for income.',
  },
  {
    target: 'tab-bar',
    title: 'Getting around',
    body: 'Overview is this page, where you see the highlights of your month. Transactions is the list of everything you have recorded. Budgets is where you set the limits you want to stick to.',
  },
];

export default function Dashboard() {
  const { transactions: saved, budgets, customCategories, expenseCategories } = useData();
  const { isActive: tourRunning, resetTours } = useTour();
  const colors = useThemeColors();
  const now = useMemo(() => new Date(), []);

  // With nothing recorded yet the whole page reads as zeroes, which gives the
  // tour nothing to explain. Sample entries stand in for the duration only and
  // are never saved.
  const transactions = useMemo(
    () => (saved.length === 0 && tourRunning ? demoTransactions() : saved),
    [saved, tourRunning]
  );

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

  const budgetedCategories = expenseCategories.filter((c) => budgets[c.id] > 0).slice(0, 4);
  const recent = transactions.slice(0, 5);

  const showDetail = (figure: 'balance' | 'income' | 'expense') =>
    router.push({ pathname: '/amount-detail', params: { figure } });

  useScreenTour('overview', TOUR);

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-safe-or-5 pt-safe-or-4 pb-32"
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-sm text-muted">{monthLabel(now)}</Text>
            <Text className="mt-1 text-3xl font-bold text-ink">Overview</Text>
          </View>
          <Pressable
            onPress={resetTours}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Replay the guided tours"
            className="h-9 w-9 items-center justify-center rounded-full bg-surface border border-border active:opacity-70"
          >
            <Ionicons name="help" size={17} color={colors.muted} />
          </Pressable>
        </View>

        {/* Each figure is shortened to hold one line, so tapping opens a sheet
            with the exact amount and where it came from. */}
        <TourTarget id="overview-card" style={{ marginTop: 24 }}>
        <View className="rounded-3xl bg-surface p-5 border border-border">
          <TourTarget id="overview-balance">
          <Pressable onPress={() => showDetail('balance')} className="active:opacity-70">
            <View className="flex-row items-center gap-1">
              <Text className="text-sm text-muted">Balance this month</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.muted} />
            </View>
            <Text
              numberOfLines={1}
              className={`mt-1 text-4xl font-bold ${balance < 0 ? 'text-danger' : 'text-ink'}`}
            >
              {formatAmount(balance)}
            </Text>
          </Pressable>
          </TourTarget>

          <View className="mt-5 flex-row gap-4">
            <TourTarget id="overview-income" style={{ flex: 1 }}>
            <Pressable
              onPress={() => showDetail('income')}
              className="flex-1 flex-row items-center gap-3 rounded-2xl bg-primary-soft p-3 active:opacity-70"
            >
              <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary">
                <Ionicons name="arrow-down" size={16} color="white" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-0.5">
                  <Text className="text-xs text-muted">Income</Text>
                  <Ionicons name="chevron-forward" size={11} color={colors.muted} />
                </View>
                <Text numberOfLines={1} className="text-base font-semibold text-ink">
                  {formatAmount(income)}
                </Text>
              </View>
            </Pressable>
            </TourTarget>
            <TourTarget id="overview-expense" style={{ flex: 1 }}>
            <Pressable
              onPress={() => showDetail('expense')}
              className="flex-1 flex-row items-center gap-3 rounded-2xl bg-danger-soft p-3 active:opacity-70"
            >
              <View className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-danger">
                <Ionicons name="arrow-up" size={16} color="white" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-0.5">
                  <Text className="text-xs text-muted">Expenses</Text>
                  <Ionicons name="chevron-forward" size={11} color={colors.muted} />
                </View>
                <Text numberOfLines={1} className="text-base font-semibold text-ink">
                  {formatAmount(expense)}
                </Text>
              </View>
            </Pressable>
            </TourTarget>
          </View>

          <Text className="mt-3 text-center text-[11px] text-muted">
            Tap any figure for the exact amount
          </Text>
        </View>
        </TourTarget>

        <TourTarget id="overview-budgets" style={{ marginTop: 32 }}>
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold text-ink">Budgets</Text>
            <Link href="/(tabs)/budgets" className="text-sm text-primary font-sans-medium">
              See all
            </Link>
          </View>

          {budgetedCategories.length === 0 ? (
            <View className="mt-3 rounded-2xl bg-surface p-4 border border-border">
              <Text className="text-sm text-muted">
                No limits set yet. Once you set one in the Budgets tab, it appears here with a bar
                showing how much of it you have used.
              </Text>
            </View>
          ) : (
            <View className="mt-3 gap-3">
              {budgetedCategories.map((cat) => {
                const spent = spentByCategory[cat.id] ?? 0;
                const limit = budgets[cat.id];
                return (
                  <View key={cat.id} className="rounded-2xl bg-surface p-4 border border-border">
                    <View className="flex-row items-center justify-between gap-3">
                      <View className="flex-1 flex-row items-center gap-2">
                        <Ionicons name={cat.icon as any} size={16} color={cat.color} />
                        <Text className="flex-1 text-sm font-medium text-ink" numberOfLines={1}>
                          {cat.label}
                        </Text>
                      </View>
                      <Text className="shrink-0 text-sm text-muted" numberOfLines={1}>
                        {formatAmount(spent)} / {formatAmount(limit)}
                      </Text>
                    </View>
                    <View className="mt-3">
                      <ProgressBar progress={spent / limit} color={spent > limit ? colors.danger : cat.color} />
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </TourTarget>

        <TourTarget id="overview-recent" style={{ marginTop: 32 }}>
        <View>
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
              {recent.map((t) => (
                <TransactionRow
                  key={t.id}
                  transaction={t}
                  category={getCategory(t.categoryId, customCategories)}
                />
              ))}
            </View>
          )}
        </View>
        </TourTarget>
      </ScrollView>
    </View>
  );
}
