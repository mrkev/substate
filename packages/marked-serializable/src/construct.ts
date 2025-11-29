import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "@mrkev/subbable-state";
import { exhaustive } from "./exhaustive";
import { MarkedSerializable, SerializationIndex } from "./MarkedSerializable";
import { nullthrows } from "./nullthrows";
import {
  isPrimitive,
  isSimplified,
  Primitive,
  Simplifiable,
  Simplified,
} from "./simplify";
import { RefPackage } from "./RefPackage";

export type SimplifiedPackage = {
  root: Simplified["any"] | Primitive;
  refs: Record<string, Exclude<Simplified["any"], Simplified["ref"]>>;
};

export function constructSimplifiedPackage(
  pkg: SimplifiedPackage,
  index: SerializationIndex
) {
  const refpkg = new RefPackage(pkg.refs);
  const result = initialize(pkg.root, index, refpkg);
  return result;
}

function initialize(
  json: unknown,
  index: SerializationIndex,
  refpkg: RefPackage
): Simplifiable {
  if (isPrimitive(json)) {
    return json;
  }

  if (isSimplified(json)) {
    switch (json.$$) {
      case "arr":
        return initializeMarkedArray(json, index, refpkg);
      case "map":
        return initializeMarkedMap(json, index, refpkg);
      case "set":
        return initializeMarkedSet(json, index, refpkg);
      case "val":
        return initializeMarkedValue(json, index, refpkg);
      case "obj":
        return initializeObj(json, index, refpkg);
      case "ref":
        throw new Error("not implemented");
      // return initializeObj(json, index);
      default:
        exhaustive(json, "invalid $$ type");
    }
  }

  return json as any; // todo: right type? Containers can hold normal objects/arrays/etc too
}

function initializeObj(
  simplified: Simplified["obj"],
  index: SerializationIndex,
  refpkg: RefPackage
): MarkedSerializable<any> {
  const mark = nullthrows(
    index.get(simplified.kind),
    `kind ${simplified.kind} not found in SerializationIndex`
  );

  const entries = {} as Record<string, Simplifiable>;
  for (const [key, value] of Object.entries(simplified.entries)) {
    const initialized = initialize(value, index, refpkg);
    entries[key] = initialized;
  }

  const instance = mark.construct(entries); // todo
  // note: we override id before calling initStructured. Important! So correct id gets registered
  // overrideId(instance, simplified._id);
  // initStructured(instance);
  // metadata.initializedNodes.set(instance._id, instance);
  return instance;
}

function initializeMarkedValue(
  obj: Simplified["val"],
  index: SerializationIndex,
  refpkg: RefPackage
): MarkedValue<any> {
  const value = isSimplified(obj.value)
    ? initialize(obj.value, index, refpkg)
    : obj.value;

  const result = MarkedValue.create(value);
  return result;
}

function initializeMarkedArray(
  arr: Simplified["arr"],
  index: SerializationIndex,
  refpkg: RefPackage
): MarkedArray<any> {
  const result = MarkedArray.create(
    arr.entries.map((x) => initialize(x, index, refpkg))
  );
  return result;
}

function initializeMarkedMap(
  map: Simplified["map"],
  index: SerializationIndex,
  refpkg: RefPackage
): MarkedMap<any, any> {
  const result = MarkedMap.create(
    map.entries.map(
      (key, value) =>
        [
          initialize(key, index, refpkg),
          initialize(value, index, refpkg),
        ] as const
    )
  );
  return result;
}

function initializeMarkedSet(
  set: Simplified["set"],
  index: SerializationIndex,
  refpkg: RefPackage
): MarkedSet<any> {
  const result = MarkedSet.create(
    set.entries.map((x) => initialize(x, index, refpkg))
  );
  return result;
}
