export function nullthrows<T>(val: T | null | undefined, message?: string): T {
  if (val == null) {
    throw new Error(message || `Expected ${String(val)} to be non nil.`);
  }
  return val;
}
