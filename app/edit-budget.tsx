import { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useData } from '../lib/store';
import {
  CATEGORY_ICONS,
  OTHER_CATEGORY_ID,
  canRemoveCategory,
  getCategory,
  isBuiltInCategory,
} from '../lib/categories';
import { parseAmountInput } from '../lib/format';
import { useKeyboardAwareScroll } from '../lib/use-keyboard-aware-scroll';
import { useFocusAfterTour, useScreenTour, type TourStep } from '../lib/tour';
import { ModalHeader } from '../components/modal-header';
import { TourTarget } from '../components/tour-target';
import { Text } from '../components/text';

// Only shown for a renameable category. Setting a plain limit needs no
// explanation; that you can turn Other into a category of your own does.
const TOUR: TourStep[] = [
  {
    target: 'budget-title',
    title: 'Give it your own name',
    body: 'Type over this to file the budget under a category of your own. Other stays where it is for everything else.',
  },
  {
    target: 'budget-icon',
    title: 'Pick an icon',
    body: 'Choose the icon this category shows in your lists and pickers.',
  },
];

export default function EditBudget() {
  const { categoryId } = useLocalSearchParams<{ categoryId: string }>();
  const {
    budgets,
    setBudget,
    removeBudget,
    customCategories,
    expenseCategories,
    addCategory,
    renameCategory,
    setCategoryIcon,
  } = useData();

  const category = getCategory(categoryId ?? '', customCategories);
  const existing = budgets[category.id];

  const builtIn = isBuiltInCategory(category.id);
  // Other is the catch-all, so renaming it spins off a new category instead of
  // losing the bucket everything falls back to. Custom categories rename in place.
  const clonesOnRename = category.id === OTHER_CATEGORY_ID;
  const titleEditable = clonesOnRename || !builtIn;

  const [title, setTitle] = useState(category.label);
  const [icon, setIcon] = useState(category.icon);
  const [amount, setAmount] = useState(existing ? String(existing) : '');
  const iconChanged = titleEditable && icon !== category.icon;
  const amountRef = useRef<TextInput>(null);
  const titleRef = useRef<TextInput>(null);
  const { scrollRef, keyboardPadding, onFocusInput, onBlurInput, onScroll } = useKeyboardAwareScroll();

  const parsedAmount = parseFloat(amount);
  const amountValid = !Number.isNaN(parsedAmount) && parsedAmount > 0;

  const trimmedTitle = title.trim();
  const titleChanged = titleEditable && trimmedTitle.length > 0 && trimmedTitle !== category.label;
  const canSave = amountValid || titleChanged || iconChanged;

  const save = () => {
    if (!canSave) return;

    if (titleChanged && clonesOnRename) {
      // Reuse a category that already carries this name rather than making a twin.
      const match = expenseCategories.find(
        (c) => c.label.toLowerCase() === trimmedTitle.toLowerCase() && c.id !== category.id
      );
      const target = match ?? addCategory(trimmedTitle, icon);
      if (match && iconChanged) setCategoryIcon(match.id, icon);
      if (amountValid) setBudget(target.id, parsedAmount);
    } else {
      if (titleChanged) renameCategory(category.id, trimmedTitle);
      if (iconChanged) setCategoryIcon(category.id, icon);
      if (amountValid) setBudget(category.id, parsedAmount);
    }

    router.back();
  };

  const clearBudget = () => {
    removeBudget(category.id);
    router.back();
  };

  // Keyed per category kind, so the rename explanation runs once for Other and
  // once for a category of your own, rather than on every budget you set.
  const tourId = titleEditable ? `budget-${clonesOnRename ? 'other' : 'custom'}` : 'budget-none';
  useScreenTour(tourId, TOUR);

  // The amount field would otherwise raise the keyboard on open, reflowing the
  // page out from under the spotlight. Focus waits for the tour, then lands.
  const autoFocusAmount = useFocusAfterTour(tourId, amountRef, titleEditable);

  const confirmRemoveCategory = () =>
    router.push({ pathname: '/confirm-delete', params: { kind: 'category', id: category.id } });

  return (
    <View className="flex-1 bg-bg">
      <ModalHeader title="Set Budget" />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerClassName="px-safe-or-5 pt-6"
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

          {titleEditable ? (
            <TourTarget id="budget-title" style={{ alignSelf: 'stretch' }}>
              <TextInput
                ref={titleRef}
                value={title}
                onChangeText={setTitle}
                onFocus={() => onFocusInput(titleRef)}
                onBlur={() => onBlurInput(titleRef)}
                placeholder="Category name"
                placeholderTextColorClassName="accent-muted"
                className="mt-3 w-full font-sans-semibold text-lg text-ink text-center"
              />
            </TourTarget>
          ) : (
            <Text className="mt-3 text-lg font-semibold text-ink">{category.label}</Text>
          )}

          <Text className="text-sm text-muted">Monthly limit</Text>
        </View>

        {clonesOnRename && (
          <Text className="mt-3 text-center text-xs text-muted">
            Rename this to file the budget under a new category. Other stays as it is.
          </Text>
        )}

        {titleEditable && (
          <TourTarget id="budget-icon" style={{ marginTop: 20 }}>
            <Text className="mb-2 text-sm font-medium text-ink">Icon</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORY_ICONS.map((name) => {
                const selected = icon === name;
                return (
                  <Pressable
                    key={name}
                    onPress={() => setIcon(name)}
                    accessibilityRole="button"
                    accessibilityState={selected ? { selected: true } : {}}
                    className="h-11 w-11 items-center justify-center rounded-full border active:opacity-70"
                    style={{
                      backgroundColor: selected ? category.color : `${category.color}18`,
                      borderColor: selected ? category.color : 'transparent',
                    }}
                  >
                    <Ionicons
                      name={name as any}
                      size={18}
                      color={selected ? 'white' : category.color}
                    />
                  </Pressable>
                );
              })}
            </View>
          </TourTarget>
        )}

        <TextInput
          ref={amountRef}
          value={amount ? `₦${parseAmountInput(amount).display}` : ''}
          onChangeText={(text) => setAmount(parseAmountInput(text).raw)}
          onFocus={() => onFocusInput(amountRef)}
          onBlur={() => onBlurInput(amountRef)}
          placeholder="₦0.00"
          placeholderTextColorClassName="accent-muted"
          keyboardType="decimal-pad"
          autoFocus={autoFocusAmount}
          className="mt-6 w-full font-sans-bold text-3xl text-ink text-center"
        />

        <Pressable
          onPress={save}
          disabled={!canSave}
          className={`mt-8 items-center rounded-2xl py-4 ${canSave ? 'bg-primary' : 'bg-primary/30'}`}
        >
          <Text className="text-base font-semibold text-white">
            {titleChanged && clonesOnRename ? 'Save as new category' : 'Save budget'}
          </Text>
        </Pressable>

        {existing != null && (
          <Pressable onPress={clearBudget} className="mt-3 items-center rounded-2xl py-4">
            <Text className="text-sm font-medium text-danger">Remove budget</Text>
          </Pressable>
        )}

        {canRemoveCategory(category.id) && (
          <Pressable onPress={confirmRemoveCategory} className="mt-1 items-center rounded-2xl py-4">
            <Text className="text-sm font-medium text-danger">
              {builtIn ? 'Hide this category' : 'Delete this category'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}
