export function nullthrows<T>(val: T | null | undefined, message?: string): T {
  if (val == null) {
    throw new Error(message || `Expected ${String(val)} to be non nil.`);
  }
  return val;
}

export function assertNotNull<T>(
  val: T | null | undefined,
  message?: string
): asserts val is T {
  if (val == null) {
    throw new Error(
      message || `AssertionError: expected ${String(val)} to be non nil.`
    );
  }
}

export function mutablearr<T>(arr: readonly T[]): T[] {
  return arr as T[];
}

export function mutableset<T>(set: ReadonlySet<T>): Set<T> {
  return set as Set<T>;
}

export function setWindow(prop: string, value: unknown) {
  (globalThis as Record<string, unknown>)[prop] = value;
}
