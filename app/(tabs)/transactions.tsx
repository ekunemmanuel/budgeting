import { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Pressable, SectionList, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useData } from '../../lib/store';
import { getCategory } from '../../lib/categories';
import { dayLabel } from '../../lib/format';
import { useThemeColors } from '../../lib/theme';
import { Transaction } from '../../lib/types';
import { TransactionRow } from '../../components/transaction-row';
import { TourTarget } from '../../components/tour-target';
import { useScreenTour, useTour, type TourStep } from '../../lib/tour';
import { demoTransactions } from '../../lib/tour-demo';
import { Text } from '../../components/text';

const ROW_SPACING = { marginBottom: 8 };

const FirstRowTarget = ({ children }: { children: React.ReactNode }) => (
  <TourTarget id="transactions-first-row" style={ROW_SPACING}>
    {children}
  </TourTarget>
);

const PlainRow = ({ children }: { children: React.ReactNode }) => (
  <View style={ROW_SPACING}>{children}</View>
);

/** Only the first row's actions are worth measuring for the tour. */
const ActionsWrapper = ({ isFirst, children }: { isFirst: boolean; children: React.ReactNode }) =>
  isFirst ? <TourTarget id="transactions-first-row-actions">{children}</TourTarget> : <>{children}</>;

const TOUR: TourStep[] = [
  {
    target: 'transactions-first-row',
    title: 'Tap for actions',
    body: 'Tap any transaction and it opens up to reveal Edit and Delete. Only one stays open at a time.',
  },
  {
    target: 'transactions-first-row-actions',
    title: 'Edit or delete',
    body: 'Edit reopens the entry so you can correct the amount, category, date or note. Delete asks you to confirm first, showing exactly what is about to go.',
  },
  {
    target: 'tab-add',
    title: 'Add as you spend',
    body: 'Record an expense or your income here. Pick a category for spending, or name the source for income.',
  },
];

export default function Transactions() {
  const { transactions: saved, customCategories } = useData();
  const { isActive: tourRunning, hasSeen, activeSteps, stepIndex } = useTour();
  const colors = useThemeColors();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sample entries stand in on an empty list so the tour has a real row to
  // point at. They are never saved.
  //
  // These render from the moment the screen does, not once the tour starts:
  // the first step points at a row, and if the row only appeared after the
  // tour began, the tour would have to sit and wait for it to lay out before
  // it could show anything.
  const showDemo = saved.length === 0 && (tourRunning || !hasSeen('transactions'));
  const transactions = useMemo(
    () => (showDemo ? demoTransactions() : saved),
    [saved, showDemo]
  );

  const sections = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => (a.date < b.date ? 1 : -1));
    const groups = new Map<string, Transaction[]>();
    for (const t of sorted) {
      const key = dayLabel(t.date);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(t);
    }
    return Array.from(groups.entries()).map(([title, data]) => ({ title, data }));
  }, [transactions]);

  // Only one row is ever open, so the list never turns into a wall of buttons.
  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId((current) => (current === id ? null : id));
  };

  const edit = (t: Transaction) => {
    setExpandedId(null);
    router.push({ pathname: '/add-transaction', params: { id: t.id } });
  };

  const confirmDelete = (t: Transaction) => {
    setExpandedId(null);
    router.push({ pathname: '/confirm-delete', params: { kind: 'transaction', id: t.id } });
  };

  useScreenTour('transactions', TOUR);

  // The tour is action driven: when it reaches the step about Edit and Delete,
  // the row opens itself so those buttons are on screen to be pointed at.
  const currentTarget = activeSteps[stepIndex]?.target;
  const firstRowId = sections[0]?.data[0]?.id;
  useEffect(() => {
    if (currentTarget === 'transactions-first-row-actions' && firstRowId) {
      setExpandedId(firstRowId);
    }
  }, [currentTarget, firstRowId]);

  return (
    <View className="flex-1 bg-bg">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-safe-or-5 pt-safe-or-4 pb-32"
        stickySectionHeadersEnabled={false}
        extraData={expandedId}
        ListHeaderComponent={
          <View className="mb-2">
            <Text className="text-3xl font-bold text-ink">Transactions</Text>
            <Text className="mt-1 text-xs text-muted">Tap a transaction for its actions</Text>
          </View>
        }
        ListEmptyComponent={
          <View className="mt-16 items-center">
            <Ionicons name="receipt-outline" size={32} color={colors.muted} />
            <Text className="mt-3 text-sm text-muted">No transactions yet. Tap + to add one.</Text>
          </View>
        }
        renderSectionHeader={({ section }) => (
          <Text className="mb-2 mt-4 text-xs font-semibold uppercase text-muted">{section.title}</Text>
        )}
        renderItem={({ item, index, section }) => {
          // Only the very first row is a tour target; registering one per row
          // would leave dozens of rects for a single step to choose from.
          const isFirst = index === 0 && section === sections[0];
          const Wrapper = isFirst ? FirstRowTarget : PlainRow;

          return (
            <Wrapper>
              <TransactionRow
              transaction={item}
              category={getCategory(item.categoryId, customCategories)}
              onPress={() => toggle(item.id)}
              expanded={expandedId === item.id}
              footer={
                <ActionsWrapper isFirst={isFirst}>
                <View className="flex-row">
                  <Pressable
                    onPress={() => edit(item)}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3.5 active:opacity-70"
                  >
                    <Ionicons name="pencil" size={15} color={colors.primary} />
                    <Text className="text-sm font-medium text-primary">Edit</Text>
                  </Pressable>
                  <View className="w-px bg-border" />
                  <Pressable
                    onPress={() => confirmDelete(item)}
                    className="flex-1 flex-row items-center justify-center gap-2 py-3.5 active:opacity-70"
                  >
                    <Ionicons name="trash" size={15} color={colors.danger} />
                    <Text className="text-sm font-medium text-danger">Delete</Text>
                  </Pressable>
                </View>
                </ActionsWrapper>
                }
              />
            </Wrapper>
          );
        }}
      />
    </View>
  );
}
