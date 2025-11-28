import { nanoid } from "nanoid";
import { MarkedSubbable, SubbableMark } from "../lib/SubbableMark";

/**
 * MarkedValue is a MarkedSubbable holding a single atomic value
 */
export class MarkedValue<S> implements MarkedSubbable {
  readonly $$mark: SubbableMark;
  private _value: Readonly<S>;

  private constructor(initialValue: S, id: string) {
    // Note: made this a subbable container.
    this.$$mark = new SubbableMark(this, id, [initialValue]);
    this._value = initialValue;
  }

  static create<T>(val: T) {
    return new this<T>(val, nanoid(5));
  }

  set(value: Readonly<S>): void {
    return this.$$mark.mutate(this, (contain, uncontain) => {
      uncontain([value]);
      contain([value]);
      this._value = value;
    });
  }

  setDyn(cb: (prevState: S) => S) {
    const newVal = cb(this.get());
    this.set(newVal);
  }

  get(): Readonly<S> {
    return this._value;
  }

  replace(value: Readonly<S>): void {
    this.set(value);
  }
}
