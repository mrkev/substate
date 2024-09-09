import stringify from "json-stringify-deterministic";
import { SSet, SString, Structured } from ".";
import { Struct2 } from "./Struct2";
import { LinkedPrimitive } from "../state/LinkedPrimitive";
import { MutationHashable } from "../state/MutationHashable";
import { SArray, SSchemaArray } from "./sstate";
import { Struct } from "./Struct";
import { STRUCTURED_IGNORE_KEYS } from "./Structured";
import { exhaustive } from "./assertions";
import { StructuredKinds } from "./StructuredKinds";

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
  } else if (val instanceof SSet) {
    return debugOutSet(val, pad, showUnknowns);
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
    if (struct instanceof Structured && STRUCTURED_IGNORE_KEYS.has(key)) {
      continue;
    }

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
  return `${struct.constructor.name} ${header(struct)} {${result}\n}`;
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

  return `${header(arr)} [${result}]`;
}

export function debugOutSet(set: SSet<any>, pad = 0, showUnknowns: boolean) {
  let result = "";

  for (const elem of set) {
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

  return `${header(set)} (${result})`;
}

export function header(elem: StructuredKinds, showContainerId = false) {
  const kind = (() => {
    if (elem instanceof SArray) {
      return "arr";
    } else if (elem instanceof SSchemaArray) {
      return "s_arr";
    } else if (elem instanceof SSet) {
      return "set";
    } else if (elem instanceof LinkedPrimitive) {
      return "prm";
    } else if (elem instanceof Struct) {
      return "Sct";
    } else if (elem instanceof Struct2) {
      return "Sct2";
    } else if (elem instanceof Structured) {
      return "Strd";
    } else {
      exhaustive(elem);
    }
  })();

  const hash =
    elem instanceof LinkedPrimitive
      ? ""
      : `.${MutationHashable.getMutationHash(elem)}`;

  const container = showContainerId ? ` -^ ${elem._container?._id}` : "";

  return `(${kind}: ${elem._id}${hash}${container})`;
}

export function debugOutPrimitive(obj: LinkedPrimitive<any>) {
  const val = obj.get();
  if (typeof val === "string") {
    return `${header(obj)} '${val}'`;
  } else {
    return `${header(obj)} ${val}`;
  }
}
