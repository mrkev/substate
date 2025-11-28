import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "../../../../subbable-state/index";
import { exhaustive } from "../../../../subbable-state/src/exhaustive";
import { nullthrows } from "../../util";
import { MarkedSerializable, SerializationIndex } from "./MarkedSerializable";
import {
  isPrimitive,
  isSimplified,
  Simplifiable,
  Simplified,
} from "./simplify";

export function constructSimplified(
  simplified: Simplified["any"],
  index: SerializationIndex
) {
  const result = initialize(simplified, index);
  return result;
}

export function initialize(
  json: unknown,
  index: SerializationIndex
): Simplifiable {
  if (isPrimitive(json)) {
    return json;
  }

  if (isSimplified(json)) {
    switch (json.$$) {
      case "arr":
        return initializeMarkedArray(json, index);
      case "map":
        return initializeMarkedMap(json, index);
      case "set":
        return initializeMarkedSet(json, index);
      case "val":
        return initializeMarkedValue(json, index);
      case "obj":
        return initializeObj(json, index);
      default:
        exhaustive(json, "invalid $$ type");
    }
  }

  return json as any; // todo: right type? Containers can hold normal objects/arrays/etc too
}

export function initializeObj(
  simplified: Simplified["obj"],
  index: SerializationIndex
): MarkedSerializable<any> {
  const mark = nullthrows(
    index.get(simplified.kind),
    `kind ${simplified.kind} not found in SerializationIndex`
  );

  const entries = {} as Record<string, Simplifiable>;
  for (const [key, value] of Object.entries(simplified.entries)) {
    const initialized = initialize(value, index);
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
  index: SerializationIndex
): MarkedValue<any> {
  const value = isSimplified(obj.value)
    ? initialize(obj.value, index)
    : obj.value;

  const result = MarkedValue.create(value);
  return result;
}

function initializeMarkedArray(
  arr: Simplified["arr"],
  index: SerializationIndex
): MarkedArray<any> {
  const result = MarkedArray.create(
    arr.entries.map((x) => initialize(x, index))
  );
  return result;
}

function initializeMarkedMap(
  map: Simplified["map"],
  index: SerializationIndex
): MarkedMap<any, any> {
  const result = MarkedMap.create(
    map.entries.map(
      (key, value) =>
        [initialize(key, index), initialize(value, index)] as const
    )
  );
  return result;
}

function initializeMarkedSet(
  set: Simplified["set"],
  index: SerializationIndex
): MarkedSet<any> {
  const result = MarkedSet.create(set.entries.map((x) => initialize(x, index)));
  return result;
}
