/**
 * Converts a number to an integer the way Array.prototype methods do
 * (ToIntegerOrInfinity): truncates, NaN and undefined become 0, ±Infinity is
 * kept.
 */
export function toIntegerOrInfinity(value: number | undefined): number {
  return Math.trunc(Number(value)) || 0;
}

/**
 * Resolves a relative index the way Array.prototype methods do (splice, fill,
 * slice...): negative values count back from the end, and the result is
 * clamped to [0, length].
 */
export function relativeIndex(
  index: number | undefined,
  length: number,
): number {
  const int = toIntegerOrInfinity(index);
  return int < 0 ? Math.max(length + int, 0) : Math.min(int, length);
}
