import { Text as RNText, TextProps } from 'react-native';

const WEIGHT_CLASS_MAP: Record<string, string> = {
  'font-bold': 'font-sans-bold',
  'font-semibold': 'font-sans-semibold',
  'font-medium': 'font-sans-medium',
};

function resolveFontClassName(className?: string): string {
  const tokens = (className ?? '').split(/\s+/).filter(Boolean);
  let hasWeight = false;

  const mapped = tokens.map((token) => {
    const replacement = WEIGHT_CLASS_MAP[token];
    if (replacement) {
      hasWeight = true;
      return replacement;
    }
    return token;
  });

  if (!hasWeight) mapped.unshift('font-sans');
  return mapped.join(' ');
}

/**
 * Text scales with the reader's system font setting, but only so far. Left
 * uncapped, a device set to the largest text size pushes amounts out of their
 * cards and breaks rows that fit perfectly on a default phone, which is why the
 * app can look right on one device and wrong on another.
 *
 * Pass maxFontSizeMultiplier explicitly to override it for a given piece of text.
 */
const MAX_FONT_SCALE = 1.3;

export function Text({ className, maxFontSizeMultiplier, ...props }: TextProps) {
  return (
    <RNText
      className={resolveFontClassName(className)}
      maxFontSizeMultiplier={maxFontSizeMultiplier ?? MAX_FONT_SCALE}
      {...props}
    />
  );
}
