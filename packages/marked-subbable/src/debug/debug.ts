import { MarkedSubbable } from "../lib/SubbableMark";

export function pdb(marked: MarkedSubbable) {
  return `${marked.constructor.name}.${marked.$$mark._id}`;
}
