import { MutationHashable } from "./lib/state/MutationHashable";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import { SArray, SSchemaArray, Struct } from "./sstate";

export function debugOut(val: unknown, pad = 0) {
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean" ||
    val == null
  ) {
    return JSON.stringify(val);
  } else if (typeof val === "function") {
    return "(function)";
  } else if (val instanceof SArray) {
    return debugOutArray(val, pad);
  } else if (val instanceof SSchemaArray) {
    return debugOutArray(val, pad);
  } else if (val instanceof LinkedPrimitive) {
    return debugOutPrimitive(val);
  } else if (val instanceof Struct) {
    return debugOutStruct(val, pad);
  } else if (Array.isArray(val)) {
    return JSON.stringify(val);
  } else {
    return `(unknown: ${JSON.stringify(val, null, 2)})`;
  }
}

export function debugOutStruct(struct: Struct<any>, pad = 0): string {
  // const result: Record<any, any> = { _kind: struct._kind };
  let result = "";

  const keys = Object.keys(struct);

  for (const key of keys) {
    if (Struct.IGNORE_KEYS.has(key)) {
      continue;
    }

    const val = (struct as any)[key];
    result += `\n  ${key}: ${debugOut(val)
      .split("\n")
      .map((s) => `  ${s}`)
      .join("\n")
      .trim()},`;
  }
  const hash = MutationHashable.getMutationHash(struct);
  return `${struct._kind} (${struct._id}.${hash}) {${result}\n}`;
}

export function debugOutArray(arr: SArray<any> | SSchemaArray<any>, pad = 0) {
  let result = "";

  for (const elem of arr) {
    result += `\n${debugOut(elem, pad)
      .split("\n")
      .map((s) => `  ${s}`)
      .join("\n")},`;
  }

  if (result.trim().length === 0) {
    result = "";
  } else {
    result = result + "\n";
  }

  const hash = MutationHashable.getMutationHash(arr);
  const kind = arr instanceof SArray ? "arr" : "schema-arr";
  return ` (${arr._id}.${hash}) [${result}] (${kind})`;
}

export function debugOutPrimitive(obj: LinkedPrimitive<any>) {
  return `${obj.get()} (${obj._id})`;
}