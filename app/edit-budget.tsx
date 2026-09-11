import { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useData } from '../lib/store';
import { getCategory } from '../lib/categories';
import { useKeyboardAwareScroll } from '../lib/use-keyboard-aware-scroll';
import { ModalHeader } from '../components/modal-header';
import { Text } from '../components/text';

export default function EditBudget() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const { budgets, setBudget, removeBudget, customCategories } = useData();
  const category = getCategory(categoryId ?? '', customCategories);
  const existing = budgets[category.id];

  const [amount, setAmount] = useState(existing ? String(existing) : '');
  const amountRef = useRef<TextInput>(null);
  const { scrollRef, keyboardPadding, onFocusInput, onBlurInput, onScroll } = useKeyboardAwareScroll();

  const parsedAmount = parseFloat(amount);
  const canSave = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const save = () => {
    if (!canSave) return;
    setBudget(category.id, parsedAmount);
    router.back();
  };

  const remove = () => {
    removeBudget(category.id);
    router.back();
  };

  return (
    <View className="flex-1 bg-bg">
      <ModalHeader title="Set Budget" />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerClassName="px-5 pt-6"
        contentContainerStyle={{ paddingBottom: 32 + keyboardPadding }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="items-center">
          <View
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `${category.color}22` }}
          >
            <Ionicons name={category.icon as any} size={24} color={category.color} />
          </View>
          <Text className="mt-3 text-lg font-semibold text-ink">{category.label}</Text>
          <Text className="text-sm text-muted">Monthly limit</Text>
        </View>

        <TextInput
          ref={amountRef}
          value={amount ? `₦${amount}` : ''}
          onChangeText={(text) => setAmount(text.replace(/[^0-9.]/g, ''))}
          onFocus={() => onFocusInput(amountRef)}
          onBlur={() => onBlurInput(amountRef)}
          placeholder="₦0.00"
          placeholderTextColorClassName="accent-muted"
          keyboardType="decimal-pad"
          autoFocus
          className="mt-6 w-full font-sans-bold text-3xl text-ink text-center"
        />

        <Pressable
          onPress={save}
          disabled={!canSave}
          className={`mt-8 items-center rounded-2xl py-4 ${canSave ? 'bg-primary' : 'bg-primary/30'}`}
        >
          <Text className="text-base font-semibold text-white">Save budget</Text>
        </Pressable>

        {existing != null && (
          <Pressable onPress={remove} className="mt-3 items-center rounded-2xl py-4">
            <Text className="text-sm font-medium text-danger">Remove budget</Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
