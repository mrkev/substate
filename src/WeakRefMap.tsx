export class WeakRefMap<T extends WeakKey> {
  private readonly map: Map<string, WeakRef<T>> = new Map();
  private readonly cleanFactor: number;
  private actionCounter = 0;

  constructor(cleanFactor: number) {
    this.cleanFactor = cleanFactor;
  }

  private _clean() {
    for (const [key, value] of this.map.entries()) {
      if (value.deref() == null) {
        this.map.delete(key);
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

  print() {
    for (const [key, value] of this.map.entries()) {
      console.log(key, value.deref() ?? null);
    }
  }
}
