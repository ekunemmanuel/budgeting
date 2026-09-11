import { useCSSVariable } from 'uniwind';

export function useThemeColors() {
  const [primary, danger, muted, ink, surface] = useCSSVariable([
    '--color-primary',
    '--color-danger',
    '--color-muted',
    '--color-ink',
    '--color-surface',
  ]) as [string, string, string, string, string];

  return { primary, danger, muted, ink, surface };
}
