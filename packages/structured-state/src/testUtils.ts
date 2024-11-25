import * as s from "./index";
import { Structured } from "./index";
import { initializeStructured } from "./serialization/initialize";
import { EmptyObject } from "./types";

export class Minimal extends s.Structured<EmptyObject, typeof Minimal> {
  override replace(): void {}
  override autoSimplify(): EmptyObject {
    return {};
  }
  static construct(): Minimal {
    return s.Structured.create(Minimal);
  }

  static withId(id: string) {
    const min = initializeStructured(
      { $$: "structured", _id: id, _value: {} },
      Minimal,
      null
    );
    return min;
  }
}

type ASimple = { num: s.SNumber };
export class Simple extends s.Structured<ASimple, typeof Minimal> {
  constructor(readonly num: s.SNumber) {
    super();
  }

  override autoSimplify() {
    return { num: this.num };
  }

  override replace(
    autoJson: s.JSONOfAuto<ASimple>,
    replace: s.ReplaceFunctions
  ): void {
    replace.number(autoJson.num, this.num);
  }
  static construct(auto: s.JSONOfAuto<ASimple>, init: s.InitFunctions): Simple {
    return Structured.create(Simple, init.number(auto.num));
  }

  static withIds(sid: string, numid: string) {
    const min = initializeStructured(
      {
        $$: "structured",
        _id: sid,
        _value: {
          num: {
            $$: "prim",
            _id: numid,
            _value: 0,
          },
        },
      },
      Simple,
      null
    );
    return min;
  }
}
