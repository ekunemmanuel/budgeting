import { Platform, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useData } from '../lib/store';
import { getCategory, isBuiltInCategory } from '../lib/categories';
import { dayLabel, formatCurrency } from '../lib/format';
import { useThemeColors } from '../lib/theme';
import { transactionTitle } from '../components/transaction-row';
import { Text } from '../components/text';

type Kind = 'transaction' | 'category';

export default function ConfirmDelete() {
  const { kind, id } = useLocalSearchParams<{ kind: Kind; id: string }>();
  const { transactions, customCategories, deleteTransaction, removeCategory, countTransactionsIn } =
    useData();
  const colors = useThemeColors();

  const transaction = kind === 'transaction' ? transactions.find((t) => t.id === id) : undefined;
  const category = kind === 'category' ? getCategory(id, customCategories) : undefined;

  // The row was deleted from elsewhere while the sheet was opening.
  if (kind === 'transaction' && !transaction) {
    router.back();
    return null;
  }

  const hiding = category ? isBuiltInCategory(category.id) : false;
  const affected = category ? countTransactionsIn(category.id) : 0;

  const confirm = () => {
    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    if (transaction) {
      deleteTransaction(transaction.id);
      router.back();
      return;
    }

    if (category) {
      removeCategory(category.id);
      // The screen behind this sheet is that category's budget editor, which
      // now points at something that no longer exists.
      router.dismissAll();
    }
  };

  const title = transaction
    ? 'Delete this transaction?'
    : hiding
      ? `Hide ${category?.label}?`
      : `Delete ${category?.label}?`;

  const explanation = transaction
    ? 'It will be removed from your history and your totals for the month will change.'
    : `${
        affected > 0
          ? `${affected} transaction${affected === 1 ? '' : 's'} will move to Other so your totals stay the same. `
          : ''
      }${hiding ? 'You can restore it from the Budgets screen.' : 'This cannot be undone.'}`;

  return (
    <View className="bg-bg px-safe-or-5 pb-safe-or-6 pt-5">
      <View className="flex-row items-center gap-3">
        <View
          className="h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${colors.danger}22` }}
        >
          <Ionicons name={hiding ? 'eye-off-outline' : 'trash-outline'} size={20} color={colors.danger} />
        </View>
        <Text className="flex-1 text-lg font-semibold text-ink">{title}</Text>
      </View>

      <Text className="mt-3 text-sm text-muted">{explanation}</Text>

      {transaction && (
        <View className="mt-5 gap-2 rounded-2xl bg-surface p-4 border border-border">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-sm font-medium text-ink" numberOfLines={1}>
              {transactionTitle(transaction, getCategory(transaction.categoryId, customCategories))}
            </Text>
            <Text
              numberOfLines={1}
              className={`shrink-0 text-sm font-semibold ${
                transaction.type === 'income' ? 'text-primary' : 'text-ink'
              }`}
            >
              {transaction.type === 'income' ? '+' : '-'}
              {formatCurrency(transaction.amount)}
            </Text>
          </View>
          <Text className="text-xs text-muted">{dayLabel(transaction.date)}</Text>
          {!!transaction.note && (
            <Text className="text-xs text-muted" numberOfLines={2}>
              {transaction.note}
            </Text>
          )}
        </View>
      )}

      <Pressable
        onPress={confirm}
        className="mt-6 items-center rounded-2xl bg-danger py-4 active:opacity-80"
      >
        <Text className="text-base font-semibold text-white">{hiding ? 'Hide' : 'Delete'}</Text>
      </Pressable>

      <Pressable onPress={() => router.back()} className="mt-2 items-center rounded-2xl py-4 active:opacity-70">
        <Text className="text-base font-medium text-muted">Cancel</Text>
      </Pressable>
    </View>
  );
}
