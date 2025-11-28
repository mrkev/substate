import { MarkedSubbable } from "./SubbableMark";

export function pdb(marked: MarkedSubbable) {
  return `${marked.constructor.name}.${marked.$$mark._id}`;
}
