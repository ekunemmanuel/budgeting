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

export function Text({ className, ...props }: TextProps) {
  return <RNText className={resolveFontClassName(className)} {...props} />;
}
