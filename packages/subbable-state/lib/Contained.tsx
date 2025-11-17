import { MarkedSubbable, SubbableMark } from "./SubbableMark";

export interface Contained {
  readonly _container: Set<MarkedSubbable>;
}

export function isContainable(value: unknown): value is MarkedSubbable {
  return (
    typeof value === "object" &&
    value !== null &&
    "$$token" in value &&
    value.$$token instanceof SubbableMark
  );
}
