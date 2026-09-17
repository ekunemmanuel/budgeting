const CURRENCY = '₦';

// Grouped by hand rather than via toLocaleString: Hermes ships a trimmed Intl
// on Android and silently drops the grouping separators, so the digits would
// come back as "1234567" on device while looking correct in the simulator.
function group(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function withCommas(value: number, decimals: number): string {
  const [whole, fraction] = Math.abs(value).toFixed(decimals).split('.');
  return fraction ? `${group(whole)}.${fraction}` : group(whole);
}

/** Exact amount, always grouped: ₦1,284,300.50. Used where the figure matters. */
export function formatCurrency(amount: number): string {
  return `${amount < 0 ? '-' : ''}${CURRENCY}${withCommas(amount, 2)}`;
}

const UNITS = [
  { limit: 1e12, suffix: 'T' },
  { limit: 1e9, suffix: 'B' },
  { limit: 1e6, suffix: 'M' },
];

/**
 * Rounding to two decimals carries to "1000" once the scaled value reaches
 * 999.995, which would print ₦1000M rather than ₦1B. Letting an amount claim
 * the next unit slightly early keeps the suffix and the digits in step.
 */
const CARRY = 0.999995;

/**
 * Amount shortened only as far as it has to be, so a summary figure always
 * stays on one line without being truncated:
 *
 *   under ₦10,000   ₦9,999.99   kobo still matter at this size
 *   under ₦1m       ₦245,000    grouped digits, no decimals
 *   under ₦1b       ₦12.84M
 *   above           ₦1.28B / ₦1.28T
 */
export function formatAmount(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);

  if (abs < 10_000) return `${sign}${CURRENCY}${withCommas(abs, 2)}`;
  // Rounded before the comparison so ₦999,999.60 reads as ₦1M rather than
  // rendering the 10-character ₦1,000,000 this branch is meant to avoid.
  if (Math.round(abs) < 1_000_000) return `${sign}${CURRENCY}${withCommas(abs, 0)}`;

  for (const { limit, suffix } of UNITS) {
    if (abs >= limit * CARRY) {
      const scaled = (abs / limit).toFixed(2).replace(/\.?0+$/, '');
      return `${sign}${CURRENCY}${scaled}${suffix}`;
    }
  }

  return `${sign}${CURRENCY}${withCommas(abs, 0)}`;
}

/**
 * Normalises what someone types into an amount field. `raw` is the parseable
 * value to keep in state; `display` is the same value with grouping separators
 * so the digits stay readable while they are still typing.
 *
 * Kept as one function so the two can never drift apart: the field renders
 * `display` and stores `raw` from the very same pass over the text.
 */
export function parseAmountInput(text: string): { raw: string; display: string } {
  const cleaned = text.replace(/[^0-9.]/g, '');
  const dot = cleaned.indexOf('.');

  // Strip leading zeros so "0012" reads as "12", but keep a lone "0" typed
  // before a decimal point.
  const whole = (dot === -1 ? cleaned : cleaned.slice(0, dot)).replace(/^0+(?=\d)/, '');
  if (dot === -1) return { raw: whole, display: group(whole) };

  // Later dots are dropped rather than rejected, and kobo stop at two places.
  const fraction = cleaned.slice(dot + 1).replace(/\./g, '').slice(0, 2);
  return { raw: `${whole}.${fraction}`, display: `${group(whole)}.${fraction}` };
}

export function isSameMonth(dateIso: string, reference: Date): boolean {
  const d = new Date(dateIso);
  return d.getFullYear() === reference.getFullYear() && d.getMonth() === reference.getMonth();
}

export function monthLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function dayLabel(dateIso: string): string {
  const d = new Date(dateIso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';

  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
