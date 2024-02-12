import stringify from "json-stringify-deterministic";
import { SString, Structured } from ".";
import { Struct2 } from "./Struct2";
import { LinkedPrimitive } from "./lib/state/LinkedPrimitive";
import { MutationHashable } from "./lib/state/MutationHashable";
import { SArray, SSchemaArray } from "./sstate";
import { Struct } from "./Struct";

function stringifyUnknown(val: unknown) {
  const res = stringify(val, {
    space: " ",
    cycles: true,
  });
  if (res === "{\n}") {
    return "{}";
  } else {
    return res;
  }
}

export function debugOut(val: unknown, pad = 0, showUnknowns = true) {
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
    return debugOutArray(val, pad, showUnknowns);
  } else if (val instanceof SSchemaArray) {
    return debugOutArray(val, pad, showUnknowns);
  } else if (val instanceof LinkedPrimitive) {
    return debugOutPrimitive(val);
  } else if (val instanceof Struct) {
    return debugOutStruct(val, pad, showUnknowns);
  } else if (val instanceof Struct2) {
    return debugOutStruct(val, pad, showUnknowns);
  } else if (val instanceof Structured) {
    return debugOutStruct(val, pad, showUnknowns);
  } else if (Array.isArray(val)) {
    return JSON.stringify(val);
  } else {
    if (showUnknowns) {
      return `(unknown: ${stringifyUnknown(val)})`;
    } else {
      return `(unknown: ${val.constructor.name})`;
    }
  }
}

export function debugOutStruct(
  struct: Struct<any> | Struct2<any> | Structured<any, any>,
  pad = 0,
  showUnknowns: boolean
): string {
  // const result: Record<any, any> = { _kind: struct._kind };
  let result = "";

  const keys = Object.keys(struct);

  for (const key of keys) {
    if (Struct.IGNORE_KEYS.has(key)) {
      continue;
    }

    const val = (struct as any)[key];
    result += `\n  ${key}: ${debugOut(val, pad, showUnknowns)
      .split("\n")
      .map((s) => `  ${s}`)
      .join("\n")
      .trim()},`;
  }
  const hash = MutationHashable.getMutationHash(struct);
  return `${struct._kind} (${struct._id}.${hash}) {${result}\n}`;
}

export function debugOutArray(
  arr: SArray<any> | SSchemaArray<any>,
  pad = 0,
  showUnknowns: boolean
) {
  let result = "";

  for (const elem of arr) {
    result += `\n${debugOut(elem, pad, showUnknowns)
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
  const val = obj.get();
  if (typeof val === "string") {
    return `'${val}' (${obj._id})`;
  }

  return `${val} (${obj._id})`;
}
