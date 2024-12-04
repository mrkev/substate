import { Struct } from "../Struct";
import { ConstructableStructure } from "../Structured";
import { StructSchema } from "../StructuredKinds";
import {
  InitializationMetadata,
  initialize,
  initializePrimitive,
  initializeStructured,
} from "./initialize";
import { isSimplePackage, SimplePackage } from "./simplify";

function preInitialize(json: SimplePackage, metadata: InitializationMetadata) {
  console.log(
    "pre-init of nodes",
    json.nodes.map(([_, node]) => `${node.$$}:${node._id}`)
  );
  for (const [id, node] of json.nodes) {
    const _ = initializePrimitive(node as any, metadata);
    console.log("inited", id);
  }
}

export function construct(
  str: string,
  spec:
    | StructSchema
    | StructSchema[]
    // | SState<unknown>
    | typeof Struct // Struct
    | (typeof Struct)[] // SArray
    | null
) {
  try {
    const json = JSON.parse(str);
    if (!isSimplePackage(json)) {
      throw new Error("not a simple package");
    }

    const metadata = new InitializationMetadata(json);
    preInitialize(json, metadata);

    const result = initialize(json.simplified, spec, metadata);
    return result;
  } catch (e) {
    console.log("issue with", JSON.parse(str));
    throw e;
  }
}

export const constructFn = {
  structured<Spec extends ConstructableStructure<any>>(
    str: string,
    spec: Spec
  ) {
    try {
      const json = JSON.parse(str);
      if (!isSimplePackage(json)) {
        throw new Error("not a simple package");
      }

      const metadata = new InitializationMetadata(json);
      preInitialize(json, metadata);

      const simple = json.simplified;
      if (simple.$$ !== "structured") {
        throw new Error(
          `Construction: expected ${"structured"} but got ${json.simplified}`
        );
      }

      initializeStructured(simple, spec, metadata);

      const result = initialize(json.simplified, spec as any, metadata);
      return result;
    } catch (e) {
      console.log("issue with", JSON.parse(str));
      throw e;
    }
  },
};

// function generalConstruct(str: string) {
//   try {
//     const json = JSON.parse(str);
//     if (!isSimplePackage(json)) {
//       throw new Error("not a simple package");
//     }

//     const metadata = new InitializationMetadata(json);
//     const simple = json.simplified;
//     if (simple.$$ !== "structured") {
//       throw new Error(
//         `Construction: expected ${"structured"} but got ${json.simplified}`
//       );
//     }

//     initializeStructured(simple, spec, metadata);

//     const result = initialize(json.simplified, spec as any, metadata);
//     return result;
//   } catch (e) {
//     console.log("issue with", JSON.parse(str));
//     throw e;
//   }
// }
