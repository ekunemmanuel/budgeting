import { memo } from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category, Transaction } from '../lib/types';
import { formatCurrency } from '../lib/format';
import { useThemeColors } from '../lib/theme';
import { Text } from './text';

/**
 * Income has no category of its own to describe it, so the source the user
 * entered stands in as the row's title when there is one.
 */
export function transactionTitle(transaction: Transaction, category: Category): string {
  if (transaction.type !== 'income') return category.label;
  return transaction.source?.trim() || category.label;
}

// Memoised so a change to one transaction does not re-render the whole list.
export const TransactionRow = memo(function TransactionRow({
  transaction,
  category,
  onPress,
  expanded = false,
  footer,
}: {
  transaction: Transaction;
  category: Category;
  /** Makes the row tappable and shows the expand chevron. */
  onPress?: () => void;
  expanded?: boolean;
  /** Revealed inside the same card when expanded. */
  footer?: React.ReactNode;
}) {
  const income = transaction.type === 'income';
  const colors = useThemeColors();

  const body = (
    <View className="flex-row items-center justify-between p-4">
      <View className="flex-1 flex-row items-center gap-3 mr-3">
        <View
          className="h-10 w-10 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: `${category.color}22` }}
        >
          <Ionicons name={category.icon as any} size={18} color={category.color} />
        </View>
        <View className="flex-1">
          <Text className="text-sm font-medium text-ink" numberOfLines={1}>
            {transactionTitle(transaction, category)}
          </Text>
          {!!transaction.note && (
            <Text className="text-xs text-muted" numberOfLines={1}>
              {transaction.note}
            </Text>
          )}
        </View>
      </View>

      <View className="shrink-0 flex-row items-center gap-1">
        <Text
          numberOfLines={1}
          className={`text-sm font-semibold ${income ? 'text-primary' : 'text-ink'}`}
        >
          {income ? '+' : '-'}
          {formatCurrency(transaction.amount)}
        </Text>
        {!!onPress && (
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={13}
            color={colors.muted}
          />
        )}
      </View>
    </View>
  );

  return (
    <View className="overflow-hidden rounded-2xl bg-surface border border-border">
      {onPress ? (
        <Pressable onPress={onPress} className="active:opacity-70">
          {body}
        </Pressable>
      ) : (
        body
      )}

      {expanded && !!footer && <View className="border-t border-border">{footer}</View>}
    </View>
  );
});
