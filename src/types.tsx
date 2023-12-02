export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>
  | ReadonlyArray<JSONValue>;
export type Constructor<T> = new (...args: any[]) => T;
export type Instantiate<T> = T extends Constructor<any> ? InstanceType<T> : T;
