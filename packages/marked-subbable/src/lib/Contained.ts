import { MarkedSubbable, SubbableMark } from "./SubbableMark";

export interface Contained {
  // container => number of times it contains us
  readonly _container: Map<MarkedSubbable, number>;
}

export function isContainable(value: unknown): value is MarkedSubbable {
  return (
    typeof value === "object" &&
    value !== null &&
    "$$mark" in value &&
    value.$$mark instanceof SubbableMark
  );
}
