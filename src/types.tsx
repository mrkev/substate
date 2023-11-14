export type JSONValue =
  | string
  | number
  | boolean
  | { [x: string]: JSONValue }
  | Array<JSONValue>
  | ReadonlyArray<JSONValue>;
type Constructor = new (...args: any[]) => any;
export type Instantiate<T> = T extends Constructor ? InstanceType<T> : T;
