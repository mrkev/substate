import { exhaustive } from "../../../structured-state/src/lib/assertions";

// Its own file (not LinkedStateDebug.tsx) so that file only exports
// components, which Vite fast refresh needs.
export const classOfKind = (
  kind: "string" | "kind" | "number" | "classname" | "hash" | "attr" | "prm",
): string => {
  switch (kind) {
    case "attr":
      return "hljs-attr";
    case "number":
    case "hash":
      return "hljs-number";
    case "string":
      return "hljs-string";
    case "classname":
      return "hljs-title class_";
    case "prm":
    case "kind":
      return "hljs-comment";
    default:
      exhaustive(kind);
  }
};
