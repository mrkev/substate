export function nullthrows<T>(val: T | null | undefined, message?: string): T {
  if (val == null) {
    throw new Error(message || `Expected ${val} to be non nil.`);
  }
  return val;
}

export function assertNotNull<T>(
  val: T | null | undefined,
  message?: string
): asserts val is T {
  if (val == null) {
    throw new Error(
      message || `AssertionError: expected ${val} to be non nil.`
    );
  }
}

export function mutablearr<T>(arr: readonly T[]): T[] {
  return arr as any;
}

export function mutableset<T>(set: ReadonlySet<T>): Set<T> {
  return set as any;
}

export function setWindow(prop: string, value: any) {
  (globalThis as any)[prop] = value;
}
