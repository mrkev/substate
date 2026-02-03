import { LinkedArray } from "./LinkedArray";
import { Struct } from "../Struct";
import { Struct2 } from "../Struct2";
import { Structured } from "../Structured";
import { StructSchema } from "../StructuredKinds";

/** Describes an array of subbable objects */
export class SSchemaArray<
  T extends Struct<any> | Struct2<any> | Structured<any, any>,
> extends LinkedArray<T> {
  _schema: StructSchema[];

  // // TODO: do I need this? I think I was planning on using this in history, but since
  // // we just recreate the whole thing instead we don't need it anymore.
  // protected override _containedIds: WeakRefMap<T>;
  // protected override _contain(items: Array<T>) {
  //   for (const elem of items) {
  //     elem._container = this;
  //     // When initializng, we contain all values passed to super(), before we create this._containedIds, so it will be null
  //     // TODO, we can remove this by removing the initail contain out to SSchemaArray and SArray. We stop containing twice on init too.
  //     this._containedIds?.set(elem._id, elem);
  //   }
  // }
  // protected override _uncontain(item: T) {
  //   if (isContainable(item)) {
  //     item._container = null;
  //     this._containedIds.delete(item._id);
  //     // TODO: safety
  //     if ("_destroy" in item) {
  //       item._destroy();
  //     }
  //   }
  // }
  constructor(val: T[], id: string, schema: StructSchema[]) {
    super(val, id);
    this._schema = schema;
    /**
     * We want to store the ids we contain to replace on history. When we want to
     * to replace with a serialized array:
     * - If we still contain that containable, we just replace it
     * - If we don't contain that containable, we add it
     * - TODO: figure out what to do if elemnet is not containable. Or split definition here,
     *   between arrays of containables and arrays of non-containables, and just always override
     *   the underlying array when we're dealing with an array of non-containables
     *
     * TODO: we acutally never use this, so commenting it out for now
     */
    // this._containedIds = new WeakRefMap<T>(10_000, "SSchemaArray");
  }
}
