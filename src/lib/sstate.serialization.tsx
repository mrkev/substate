import * as s from "./sstate";
import type { Struct } from "./sstate";
import type { LinkedArray } from "./state/LinkedArray";

export function serialize(state: Struct<any> | LinkedArray<any>) {
  return JSON.stringify(state.toJSON());
}

export function construct(
  str: string,
  spec: s.SState<unknown> | typeof Struct
) {
  const json = JSON.parse(str);
  if (typeof json === "string") {
    return s.string(json);
  }

  if (typeof json === "number") {
    return s.number(json);
  }

  if (json == null) {
    return s.nil(json);
  }

  if (Array.isArray(json)) {
    throw new Error("UNIMPLEMENTED");
  }

  if (typeof json === "object") {
    // this will only set sprimitive, etc keys. let's set the rest
    const instance: Struct<any> = s.create2(spec as any, json);

    for (const key of Object.keys(json)) {
      if ((instance as any).stateKeys.has(key) || key === "_kind") {
        continue;
      } else {
        (instance as any)[key] = json[key];
      }
    }

    return instance;
  }

  console.log("UNKNOWN", json, typeof json);
  throw new Error(`Unknown data type ${json}`);
}
