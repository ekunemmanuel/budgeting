import { useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useData } from '../lib/store';
import { INCOME_CATEGORY_ID } from '../lib/categories';
import { parseAmountInput } from '../lib/format';
import { TransactionType } from '../lib/types';
import { useKeyboardAwareScroll } from '../lib/use-keyboard-aware-scroll';
import { ModalHeader } from '../components/modal-header';
import { Text } from '../components/text';

export default function AddTransaction() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { transactions, addTransaction, updateTransaction, expenseCategories } = useData();

  const editing = transactions.find((t) => t.id === id);

  const [type, setType] = useState<TransactionType>(editing?.type ?? 'expense');
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '');
  const [categoryId, setCategoryId] = useState(
    editing && editing.type === 'expense' ? editing.categoryId : expenseCategories[0].id
  );
  const [source, setSource] = useState(editing?.source ?? '');
  const [note, setNote] = useState(editing?.note ?? '');
  const [date, setDate] = useState(editing ? new Date(editing.date) : new Date());
  const [showAndroidPicker, setShowAndroidPicker] = useState(false);

  const amountRef = useRef<TextInput>(null);
  const sourceRef = useRef<TextInput>(null);
  const noteRef = useRef<TextInput>(null);
  const { scrollRef, keyboardPadding, onFocusInput, onBlurInput, onContentSizeChangeInput, onScroll } =
    useKeyboardAwareScroll();

  const parsedAmount = parseFloat(amount);
  const canSave = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const save = () => {
    if (!canSave) return;

    const payload = {
      type,
      amount: parsedAmount,
      categoryId: type === 'income' ? INCOME_CATEGORY_ID : categoryId,
      note: note.trim(),
      date: date.toISOString(),
      source: type === 'income' ? source.trim() : undefined,
    };

    if (editing) updateTransaction(editing.id, payload);
    else addTransaction(payload);

    if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <View className="flex-1 bg-bg">
      <ModalHeader title={editing ? 'Edit Transaction' : 'Add Transaction'} />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerClassName="px-safe-or-5 pt-4"
        contentContainerStyle={{ paddingBottom: 64 + keyboardPadding }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-row rounded-2xl bg-surface border border-border p-1">
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`flex-1 items-center rounded-xl py-2.5 ${t === type ? 'bg-primary' : ''}`}
            >
              <Text className={`text-sm font-semibold capitalize ${t === type ? 'text-white' : 'text-muted'}`}>
                {t}
              </Text>
            </Pressable>
          ))}
        </View>

        <View className="mt-6 items-center">
          <Text className="text-sm text-muted">Amount</Text>
          <TextInput
            ref={amountRef}
            value={amount ? `₦${parseAmountInput(amount).display}` : ''}
            onChangeText={(text) => setAmount(parseAmountInput(text).raw)}
            onFocus={() => onFocusInput(amountRef)}
            onBlur={() => onBlurInput(amountRef)}
            placeholder="₦0.00"
            placeholderTextColorClassName="accent-muted"
            keyboardType="decimal-pad"
            className="mt-1 w-full font-sans-bold text-3xl text-ink text-center"
            autoFocus
          />
        </View>

        {type === 'income' ? (
          <View className="mt-6">
            <View className="mb-2 flex-row items-baseline justify-between">
              <Text className="text-sm font-medium text-ink">Source</Text>
              <Text className="text-xs text-muted">Optional</Text>
            </View>
            <TextInput
              ref={sourceRef}
              value={source}
              onChangeText={setSource}
              onFocus={() => onFocusInput(sourceRef)}
              onBlur={() => onBlurInput(sourceRef)}
              placeholder="e.g. Salary, Freelance, Gift"
              placeholderTextColorClassName="accent-muted"
              className="rounded-2xl bg-surface border border-border p-3.5 font-sans text-sm text-ink"
            />
          </View>
        ) : (
          <View className="mt-6">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-ink">Category</Text>
              <Pressable onPress={() => router.push('/add-category')}>
                <Text className="text-sm font-medium text-primary">+ Add</Text>
              </Pressable>
            </View>
            <View className="flex-row flex-wrap gap-2">
              {expenseCategories.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setCategoryId(cat.id)}
                    className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${
                      selected ? '' : 'bg-surface border-border'
                    }`}
                    style={selected ? { backgroundColor: cat.color, borderColor: cat.color } : undefined}
                  >
                    <Ionicons name={cat.icon as any} size={14} color={selected ? 'white' : cat.color} />
                    <Text className={`text-xs font-medium ${selected ? 'text-white' : 'text-ink'}`}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        <View className="mt-6">
          <Text className="mb-2 text-sm font-medium text-ink">Date</Text>
          {Platform.OS === 'ios' ? (
            <View className="items-start rounded-2xl bg-surface border border-border p-3">
              <DateTimePicker
                value={date}
                mode="date"
                display="compact"
                maximumDate={new Date()}
                onValueChange={(_, selected) => setDate(selected)}
              />
            </View>
          ) : (
            <>
              <Pressable
                onPress={() => setShowAndroidPicker(true)}
                className="rounded-2xl bg-surface border border-border p-3.5"
              >
                <Text className="text-sm text-ink">{date.toDateString()}</Text>
              </Pressable>
              {showAndroidPicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onValueChange={(_, selected) => {
                    setShowAndroidPicker(false);
                    setDate(selected);
                  }}
                  onDismiss={() => setShowAndroidPicker(false)}
                />
              )}
            </>
          )}
        </View>

        <View className="mt-6">
          <Text className="mb-2 text-sm font-medium text-ink">Note</Text>
          <TextInput
            ref={noteRef}
            value={note}
            onChangeText={setNote}
            onFocus={() => onFocusInput(noteRef)}
            onBlur={() => onBlurInput(noteRef)}
            onContentSizeChange={() => onContentSizeChangeInput(noteRef)}
            placeholder="Optional"
            placeholderTextColorClassName="accent-muted"
            multiline
            className="min-h-24 rounded-2xl bg-surface border border-border p-3.5 font-sans text-sm text-ink"
            textAlignVertical="top"
          />
        </View>

        <Pressable
          onPress={save}
          disabled={!canSave}
          className={`mt-8 items-center rounded-2xl py-4 ${canSave ? 'bg-primary' : 'bg-primary/30'}`}
        >
          <Text className="text-base font-semibold text-white">
            {editing ? 'Save changes' : 'Save transaction'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
