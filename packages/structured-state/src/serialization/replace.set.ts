import { nullthrows } from "../lib/nullthrows";
import { SSet } from "../state/LinkedSet";
import { isStructuredKind } from "../StructuredKinds";
import { InitializationMetadata, initialize } from "./initialize";
import { replace } from "./replace";
import { NSimplified, isSimplified } from "./serialization";

/**
 * Replaces a set
 *
 * 1. delete  A
 * 2. replace B
 * 3. add     C
 *
 *    ┌──────┐ <- json
 *    │    C │
 * ┌──│───┐  │
 * │  │ B │  │
 * │  └──────┘
 * │ A    │
 * └──────┘ <- current (set)
 */
export function replaceSSet(
  json: NSimplified["set"],
  set: SSet<any>,
  acc: InitializationMetadata
) {
  // set is current state
  if (json._schema != Boolean(set._schema != null)) {
    throw new Error("non-matching schemas");
  }

  // we only ever have to get from json._value
  const b = new Map(
    json._value.map((x) => {
      if (isSimplified(x)) {
        return [x._id, x];
      } else {
        return [x, x];
      }
    })
  );

  const getWithAFromB = (elem: unknown) => {
    const result = b.get(isStructuredKind(elem) ? elem._id : elem);
    return result;
  };

  const removeBFromB = (elem: unknown) => {
    b.delete(isSimplified(elem) ? elem._id : elem);
  };

  const prepare = (elem: unknown) => {
    if (isSimplified(elem)) {
      const initialized = initialize(
        elem,
        nullthrows(
          set._schema,
          "set holds structured state, but defines no schema"
        ),
        acc
      );
      return initialized;
    } else {
      return elem;
    }
  };

  // 1. delete A
  for (const ai of set) {
    const equivalent = getWithAFromB(ai);
    if (equivalent == null) {
      set.delete(ai);
    }
  }

  const replace2 = (curr: unknown, bi: unknown) => {
    if (isSimplified(bi) && isStructuredKind(curr)) {
      // console.log("REPLACE");
      replace(bi, curr, acc);
    } else if (isSimplified(bi)) {
      throw new Error(`simplified found, but element is not structured in set`);
    } else if (isStructuredKind(curr)) {
      throw new Error(
        `structured kind found, but can't replace with non-simplified`
      );
    } else {
      // do nothing
    }
  };

  // 2. replace
  for (const ai of set) {
    const bi = getWithAFromB(ai);
    replace2(ai, bi);
    removeBFromB(bi);
  }

  // 3. add C
  for (const bi of b.values()) {
    const prepared = prepare(bi);

    set.add(prepared);
  }
}
