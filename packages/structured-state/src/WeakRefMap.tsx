export class WeakRefMap<T extends WeakKey> {
  private readonly map: Map<string, WeakRef<T>> = new Map();
  private readonly cleanFactor: number;
  private actionCounter = 0;
  /**
   * On structured (linked) arrays we don't actually expect clean to do anything, since we
   * do cleanup ourselves. In that case if clean removes something. String value is just
   * some debug string, to help with debugging.
   */
  private expectsCleanToClean: true | string;

  constructor(cleanFactor: number, expectsCleanToClean: true | string = true) {
    this.cleanFactor = cleanFactor;
    this.expectsCleanToClean = expectsCleanToClean;
  }

  private _clean() {
    for (const [key, value] of this.map.entries()) {
      if (value.deref() == null) {
        this.map.delete(key);
        if (this.expectsCleanToClean !== true) {
          console.warn(
            `WeakRefMap: (${this.expectsCleanToClean}) cleaned ${key} but expects to clean nothing.`
          );
        }
      }
    }
  }

  set(id: string, value: T) {
    this.map.set(id, new WeakRef(value));
    this.actionCounter++;
    if (this.actionCounter > this.cleanFactor) {
      this._clean();
      this.actionCounter = 0;
    }
  }

  get(id: string): T | null {
    return this.map.get(id)?.deref() ?? null;
  }

  delete(key: string) {
    return this.map.delete(key);
  }

  print() {
    for (const [key, value] of this.map.entries()) {
      console.log(key, value.deref() ?? null);
    }
  }
}
