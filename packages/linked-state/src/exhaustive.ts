export function exhaustive(x: never, msg?: string): never {
  throw new Error(msg ?? `Exhaustive violation, unexpected value ${x}`);
}
