import { SArray, SSchemaArray, Struct } from "./sstate";
import { SPrimitive } from "./lib/state/LinkedState";
import { LinkedArray } from "./lib/state/LinkedArray";

export function debugOut(val: unknown, pad = 0) {
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean" ||
    val == null
  ) {
    return `${JSON.stringify(val)}`;
  } else if (typeof val === "function") {
    return "(function)";
  } else if (val instanceof SArray) {
    return `${debugOutArray(val, pad)}`;
  } else if (val instanceof SSchemaArray) {
    return `${debugOutArray(val, pad)}`;
  } else if (val instanceof SPrimitive) {
    return `${debugOutPrimitive(val)}`;
  } else if (val instanceof Struct) {
    return debugOutStruct(val, pad);
  } else if (Array.isArray(val)) {
    return `${JSON.stringify(val)}`;
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
  return `${struct._kind} (${struct._id}.${struct._hash}) {${result}\n}`;
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

  return ` (${arr._id}.${arr._hash}) [${result}] (${
    arr instanceof SArray ? "arr" : "schema-arr"
  })`;
}

export function debugOutPrimitive(obj: SPrimitive<any>) {
  return `${obj.get()} (${obj._id})`;
}
