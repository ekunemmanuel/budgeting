import { useMemo } from 'react';
import { Alert, Platform, Pressable, SectionList, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useData } from '../../lib/store';
import { getCategory } from '../../lib/categories';
import { dayLabel, formatCurrency } from '../../lib/format';
import { useThemeColors } from '../../lib/theme';
import { Transaction } from '../../lib/types';
import { Fab } from '../../components/fab';
import { Text } from '../../components/text';

export default function Transactions() {
  const { transactions, deleteTransaction, customCategories } = useData();
  const colors = useThemeColors();

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

  const confirmDelete = (t: Transaction) => {
    Alert.alert('Delete transaction?', `${getCategory(t.categoryId, customCategories).label} · ${formatCurrency(t.amount)}`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteTransaction(t.id);
        },
      },
    ]);
  };

  return (
    <View className="flex-1 bg-bg">
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerClassName="px-5 pt-safe-or-4 pb-28"
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View className="mb-2">
            <Text className="text-3xl font-bold text-ink">Transactions</Text>
            <Text className="mt-1 text-xs text-muted">Long press an entry to delete it</Text>
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
        renderItem={({ item }) => {
          const cat = getCategory(item.categoryId, customCategories);
          return (
            <Pressable
              onLongPress={() => confirmDelete(item)}
              className="mb-2 flex-row items-center justify-between rounded-2xl bg-surface p-4 border border-border active:opacity-70"
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
                  {!!item.note && (
                    <Text className="text-xs text-muted" numberOfLines={1}>
                      {item.note}
                    </Text>
                  )}
                </View>
              </View>
              <Text className={`text-sm font-semibold ${item.type === 'income' ? 'text-primary' : 'text-ink'}`}>
                {item.type === 'income' ? '+' : '-'}
                {formatCurrency(item.amount)}
              </Text>
            </Pressable>
          );
        }}
      />
      <Fab href="/add-transaction" />
    </View>
  );
}
