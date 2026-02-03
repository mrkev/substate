import stringify from "json-stringify-deterministic";
import { PrimitiveKind, SSet, Structured } from ".";
import { SSchemaArray } from "./obj/SSchemaArray";
import { LinkedArray } from "./obj/LinkedArray";
import { Struct } from "./obj/Struct";
import { Struct2 } from "./obj/Struct2";
import { isPrimitiveKind, StructuredKind } from "./state/StructuredKinds";
import { exhaustive } from "./lib/assertions";
import { LinkedPrimitive } from "./obj/LinkedPrimitive";
import { mutationHashable } from "./state/MutationHashable";
import { CONTAINER_IGNORE_KEYS } from "./state/SubbableContainer";
import { SUnion } from "./sunion";

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

export function debugOutHtml(val: unknown, pad = 0, showUnknowns = true) {
  if (
    typeof val === "string" ||
    typeof val === "number" ||
    typeof val === "boolean" ||
    val == null
  ) {
    return debugOutPrm(val);
  } else if (typeof val === "function") {
    return "(function)";
  } else if (val instanceof LinkedArray) {
    return debugOutArray(val, pad, showUnknowns);
  } else if (val instanceof SSchemaArray) {
    return debugOutArray(val, pad, showUnknowns);
  } else if (val instanceof SSet) {
    return debugOutSet(val, pad, showUnknowns);
  } else if (val instanceof LinkedPrimitive) {
    return debugOutSPrimitive(val);
  } else if (val instanceof Struct) {
    return debugOutStruct(val, pad, showUnknowns);
  } else if (val instanceof Struct2) {
    return debugOutStruct(val, pad, showUnknowns);
  } else if (val instanceof Structured) {
    return debugOutStruct(val, pad, showUnknowns);
  } else if (val instanceof SUnion) {
    return debugOutUnion(val, pad, showUnknowns);
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

function debugOutUnion(union: SUnion<any>, pad = 0, showUnknowns: boolean) {
  return "union, todo";
}

function debugOutStruct(
  struct: Struct<any> | Struct2<any> | Structured<any, any>,
  pad = 0,
  showUnknowns: boolean,
): string {
  // const result: Record<any, any> = { _kind: struct._kind };
  let result = "";

  const keys = Object.keys(struct);

  for (const key of keys) {
    if (struct instanceof Structured && CONTAINER_IGNORE_KEYS.has(key)) {
      continue;
    }

    if (CONTAINER_IGNORE_KEYS.has(key)) {
      continue;
    }

    const val = (struct as any)[key];
    const keyFmt = span("attr", key);
    result += `\n  ${keyFmt}: ${debugOutHtml(val, pad, showUnknowns)
      .split("\n")
      .map((s) => `  ${s}`)
      .join("\n")
      .trim()},`;
  }

  const classname = span("classname", struct.constructor.name);
  return `${classname} ${header(struct)} {${result}\n}`;
}

function debugOutArray(
  arr: LinkedArray<any> | SSchemaArray<any>,
  pad = 0,
  showUnknowns: boolean,
) {
  let result = "";

  for (const elem of arr) {
    result += `\n${debugOutHtml(elem, pad, showUnknowns)
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

function debugOutSet(set: SSet<any>, pad = 0, showUnknowns: boolean) {
  let result = "";

  for (const elem of set) {
    result += `\n${debugOutHtml(elem, pad, showUnknowns)
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

function header(elem: StructuredKind, showContainerId = false) {
  const kindStr = (() => {
    if (elem instanceof LinkedArray) {
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
    } else if (elem instanceof SUnion) {
      return "uni";
    } else {
      exhaustive(elem);
    }
  })();

  const hashStr =
    elem instanceof LinkedPrimitive
      ? ""
      : `.${mutationHashable.getMutationHash(elem)}`;

  const container = showContainerId
    ? ` -^ ${[...elem._container.values()].map((v) => v._id).join(",")}`
    : "";

  const kind = span("kind", kindStr);
  const hash = span("hash", hashStr);
  return span("kind", `(${kind}: ${elem._id}${hashStr}${container})`);
}

function debugOutSPrimitive(obj: LinkedPrimitive<any>) {
  const val = obj.get();
  if (isPrimitiveKind(val)) {
    return `${header(obj)} ${debugOutPrm(val)}`;
  } else {
    return `${header(obj)} ${val}`;
  }
}

function debugOutPrm(val: PrimitiveKind | undefined): string {
  switch (true) {
    case typeof val === "string":
      return span("string", '"' + val + '"');
    case typeof val === "number":
      return span("number", String(val));
    default:
      return String(val); // "<unknown TODO>";
    // exhaustive(val);
  }
}

// class="hljs-attr"
function span(
  kind: "string" | "kind" | "number" | "classname" | "hash" | "attr" | "prm",
  value: string,
) {
  const classOfKind = ((): string => {
    switch (kind) {
      case "attr":
        return "attr";
      case "number":
      case "hash":
        return "number";
      case "string":
        return "string";
      case "classname":
        return "title class_";
      case "prm":
      case "kind":
        return "comment";
      default:
        exhaustive(kind);
    }
  })();

  return `<span class="hljs-${classOfKind}">${value}</span>`;
}
