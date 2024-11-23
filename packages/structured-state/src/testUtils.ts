import * as s from "./index";
import { initializeStructured } from "./serialization.initialize";
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
