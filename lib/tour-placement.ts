export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlacementInput {
  /** The spotlight hole, already clamped to the screen. */
  hole: Rect;
  screenHeight: number;
  insetTop: number;
  insetBottom: number;
  /** Height the card last rendered at, or 0 before it has been measured. */
  cardHeight: number;
  gap: number;
  edge: number;
  minCard: number;
}

export interface Placement {
  top: number;
  maxHeight: number;
  placedBelow: boolean;
  /** True when the highlight leaves too little room for a readable card. */
  overlaps: boolean;
}

/**
 * Decides where the explanation card sits relative to the spotlight.
 *
 * The card goes on whichever side of the highlight has more room and is then
 * capped to that room, rather than being placed first and clamped on screen
 * afterwards. With a large system font the card can be taller than either gap,
 * and clamping it into view necessarily drops it on top of the very thing it
 * is describing.
 *
 * Pure so the behaviour can be checked across screen sizes and text scales
 * without a device.
 */
export function placeTourCard({
  hole,
  screenHeight,
  insetTop,
  insetBottom,
  cardHeight,
  gap,
  edge,
  minCard,
}: PlacementInput): Placement {
  const topLimit = insetTop + edge;
  const bottomLimit = screenHeight - insetBottom - edge;

  const spaceAbove = hole.y - gap - topLimit;
  const spaceBelow = bottomLimit - (hole.y + hole.height + gap);

  const placedBelow = spaceBelow >= spaceAbove;
  const room = placedBelow ? spaceBelow : spaceAbove;
  const maxHeight = Math.max(minCard, room);

  const top = placedBelow
    ? hole.y + hole.height + gap
    : Math.max(topLimit, hole.y - gap - Math.min(cardHeight || maxHeight, maxHeight));

  return { top, maxHeight, placedBelow, overlaps: room < minCard };
}
