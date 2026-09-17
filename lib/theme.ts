import { useCSSVariable } from 'uniwind';

export function useThemeColors() {
  const [primary, danger, muted, ink, surface, border] = useCSSVariable([
    '--color-primary',
    '--color-danger',
    '--color-muted',
    '--color-ink',
    '--color-surface',
    '--color-border',
  ]) as [string, string, string, string, string, string];

  return { primary, danger, muted, ink, surface, border };
}
