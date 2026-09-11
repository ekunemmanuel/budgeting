import { useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useData } from '../lib/store';
import { useKeyboardAwareScroll } from '../lib/use-keyboard-aware-scroll';
import { ModalHeader } from '../components/modal-header';
import { Text } from '../components/text';

export default function AddCategory() {
  const { addCategory } = useData();
  const [label, setLabel] = useState('');
  const nameRef = useRef<TextInput>(null);
  const { scrollRef, keyboardPadding, onFocusInput, onBlurInput, onScroll } = useKeyboardAwareScroll();

  const trimmed = label.trim();
  const canSave = trimmed.length > 0;

  const save = () => {
    if (!canSave) return;
    addCategory(trimmed);
    router.back();
  };

  return (
    <View className="flex-1 bg-bg">
      <ModalHeader title="Add Category" />
      <ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerClassName="px-5 pt-6"
        contentContainerStyle={{ paddingBottom: 32 + keyboardPadding }}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="mb-2 text-sm font-medium text-ink">Category name</Text>
        <TextInput
          ref={nameRef}
          value={label}
          onChangeText={setLabel}
          onFocus={() => onFocusInput(nameRef)}
          onBlur={() => onBlurInput(nameRef)}
          placeholder="e.g. Pet care"
          placeholderTextColorClassName="accent-muted"
          autoFocus
          className="rounded-2xl bg-surface border border-border p-3.5 font-sans text-sm text-ink"
        />

        <Pressable
          onPress={save}
          disabled={!canSave}
          className={`mt-8 items-center rounded-2xl py-4 ${canSave ? 'bg-primary' : 'bg-primary/30'}`}
        >
          <Text className="text-base font-semibold text-white">Add category</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
