import { exhaustive } from "../../../../subbable-state/src/exhaustive";
import { nullthrows } from "../../util";
import { MarkedSerializable, SerializationIndex } from "./MarkedSerializable";
import { isPrimitive, isSimplified, Primitive, Simplified } from "./simplify";

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
): MarkedSerializable<any> | Primitive {
  if (isPrimitive(json)) {
    return json;
  }

  if (!isSimplified(json)) {
    console.log("not a simplified obj", json);
    throw new Error("invalid serialization is not a non-null object");
  }

  switch (json.$$) {
    case "arr":
    case "map":
    case "set":
    case "val": {
      throw new Error("not implemented");
      // return initializePrimitive(json, metadata);
    }
    case "obj":
      return initializeObj(json, index);
    default:
      exhaustive(json, "invalid $$ type");
  }
}

export function initializeObj(
  simplified: Simplified["obj"],
  index: SerializationIndex
): MarkedSerializable<any> {
  const mark = nullthrows(
    index.get(simplified.kind),
    `kind ${simplified.kind} not found in SerializationIndex`
  );

  const entries = {} as Record<string, Primitive | MarkedSerializable<any>>;
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
