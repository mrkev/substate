import {
  MarkedArray,
  MarkedMap,
  MarkedSet,
  MarkedValue,
} from "@mrkev/subbable-state";
import { exhaustive } from "./exhaustive";
import { MarkedSerializable, SerializationIndex } from "./MarkedSerializable";
import { nullthrows } from "./nullthrows";
import { RefPackage } from "./RefPackage";
import {
  isPrimitive,
  isSimplified,
  Simplifiable,
  Simplified,
  SimplifiedPackage,
} from "./simplify";

type Resources = {
  index: SerializationIndex;
  refpkg: RefPackage;
  objmap: Map<string, Simplifiable>;
};

export function constructSimplifiedPackage(
  pkg: SimplifiedPackage,
  index: SerializationIndex
) {
  const refpkg = new RefPackage(pkg.refs);
  const objmap = new Map<string, Simplifiable>();
  const result = initialize(pkg.root, { index, refpkg, objmap });
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
        } else {
          const result = initialize(rsc.refpkg.get(json._id), rsc);
          rsc.objmap.set(json._id, result);
          return result;
        }
      }
      default:
        exhaustive(json, "invalid $$ type");
    }
  }

  return json as any; // todo: right type? Containers can hold normal objects/arrays/etc too
}

function initializeObj(
  simplified: Simplified["obj"],
  rsc: Resources
): MarkedSerializable<any> {
  const mark = nullthrows(
    rsc.index.get(simplified.kind),
    `kind ${simplified.kind} not found in SerializationIndex`
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
  rsc: Resources
): MarkedValue<any> {
  const value = isSimplified(obj.value)
    ? initialize(obj.value, rsc)
    : obj.value;

  const result = MarkedValue.create(value);
  return result;
}

function initializeMarkedArray(
  arr: Simplified["arr"],
  rsc: Resources
): MarkedArray<any> {
  const result = MarkedArray.create(arr.entries.map((x) => initialize(x, rsc)));
  return result;
}

function initializeMarkedMap(
  map: Simplified["map"],
  rsc: Resources
): MarkedMap<any, any> {
  const result = MarkedMap.create(
    map.entries.map(
      (key, value) => [initialize(key, rsc), initialize(value, rsc)] as const
    )
  );
  return result;
}

function initializeMarkedSet(
  set: Simplified["set"],
  rsc: Resources
): MarkedSet<any> {
  const result = MarkedSet.create(set.entries.map((x) => initialize(x, rsc)));
  return result;
}
