import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "@mrkev/marked-subbable";
import { exhaustive } from "./exhaustive";
import { MarkedSerializable, SerializationIndex } from "./MarkedSerializable";
import { nullthrows } from "./nullthrows";
import { RefMap } from "./RefMap";
import {
  isPrimitive,
  isSimplified,
  Simplifiable,
  Simplified,
  SimplifiedPackage,
} from "./simplify";

type Resources = {
  index: SerializationIndex;
  refmap: RefMap;
  objmap: Map<string, Simplifiable>;
  // ids of refs being built right now; meeting one again means a cycle
  pending: Set<string>;
};

export function constructSimplifiedPackage(
  pkg: SimplifiedPackage,
  index: SerializationIndex,
) {
  const refmap = new RefMap(pkg.refs);
  const objmap = new Map<string, Simplifiable>();
  const result = initialize(pkg.root, {
    index,
    refmap,
    objmap,
    pending: new Set(),
  });
  return result;
}

function initialize(json: unknown, rsc: Resources): Simplifiable {
  if (isPrimitive(json)) {
    return json;
  }

  if (isSimplified(json)) {
    switch (json.$$) {
      case "arr": {
        return initializeMarkedArray(json, rsc);
      }
      case "map": {
        return initializeMarkedMap(json, rsc);
      }
      case "set": {
        return initializeMarkedSet(json, rsc);
      }
      case "val": {
        return initializeMarkedValue(json, rsc);
      }
      case "obj": {
        return initializeObj(json, rsc);
      }
      case "ref": {
        const existing = rsc.objmap.get(json._id);
        if (existing != null) {
          return existing;
        }
        // objects are stored in objmap only once built, so a ref to one
        // that's still being built means the package contains a cycle
        if (rsc.pending.has(json._id)) {
          throw new Error(`can't load a cycle: ${json._id} contains itself`);
        }
        rsc.pending.add(json._id);
        const result = initialize(rsc.refmap.get(json._id), rsc);
        rsc.pending.delete(json._id);
        rsc.objmap.set(json._id, result);
        return result;
      }
      default:
        exhaustive(json, "invalid $$ type");
    }
  }

  return json as any; // todo: right type? Containers can hold normal objects/arrays/etc too
}

function initializeObj(
  simplified: Simplified["obj"],
  rsc: Resources,
): MarkedSerializable<any> {
  const mark = nullthrows(
    rsc.index.get(simplified.kind),
    `kind ${simplified.kind} not found in SerializationIndex`,
  );

  const entries = {} as Record<string, Simplifiable>;
  for (const [key, value] of Object.entries(simplified.entries)) {
    const initialized = initialize(value, rsc);
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
  rsc: Resources,
): MarkedValue<any> {
  const value = isSimplified(obj.value)
    ? initialize(obj.value, rsc)
    : obj.value;

  const result = MarkedValue.create(value);
  return result;
}

function initializeMarkedArray(
  arr: Simplified["arr"],
  rsc: Resources,
): MarkedArray<any> {
  const result = MarkedArray.create(arr.entries.map((x) => initialize(x, rsc)));
  return result;
}

function initializeMarkedMap(
  map: Simplified["map"],
  rsc: Resources,
): MarkedMap<any, any> {
  const result = MarkedMap.create(
    map.entries.map(
      ([key, value]) => [initialize(key, rsc), initialize(value, rsc)] as const,
    ),
  );
  return result;
}

function initializeMarkedSet(
  set: Simplified["set"],
  rsc: Resources,
): MarkedSet<any> {
  const result = MarkedSet.create(set.entries.map((x) => initialize(x, rsc)));
  return result;
}
