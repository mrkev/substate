import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkedValue } from "../MarkedValue";
import { subbable } from "./Subbable";
import { MarkedSubbable, SubbableMark } from "./SubbableMark";

class Pair implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();
  constructor(
    public left: MarkedValue<number>,
    public right: MarkedValue<number>,
  ) {
    this.$$mark.register(this, [left, right]);
  }

  setLeft(value: MarkedValue<number>) {
    this.$$mark.mutate(this, (contain, uncontain) => {
      uncontain([this.left]);
      contain([value]);
      this.left = value;
    });
  }
}

describe("SubbableMark", () => {
  describe(".register", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("contains each registered child, without warning", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const left = MarkedValue.create(1);
      const right = MarkedValue.create(2);
      const pair = new Pair(left, right);
      expect(left.$$mark._container.get(pair)).toBe(1);
      expect(right.$$mark._container.get(pair)).toBe(1);
      expect(warn).not.toHaveBeenCalled();
    });

    it("warns when the same child is registered twice, but counts it twice", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const child = MarkedValue.create(1);
      const pair = new Pair(child, child);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(child.$$mark._container.get(pair)).toBe(2);
    });

    it("warns when register is called twice with the same child", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      const child = MarkedValue.create(1);
      const holder = { $$mark: SubbableMark.create() };
      holder.$$mark.register(holder, [child]);
      expect(warn).not.toHaveBeenCalled();
      holder.$$mark.register(holder, [child]);
      expect(warn).toHaveBeenCalledTimes(1);
    });

    it("doesn't warn about repeated non-marked values", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      class Holder implements MarkedSubbable {
        readonly $$mark = SubbableMark.create();
        constructor() {
          this.$$mark.register(this, [1, 1, "a", "a", null, null]);
        }
      }
      new Holder();
      expect(warn).not.toHaveBeenCalled();
    });

    it("accepts a one-shot iterator", () => {
      const left = MarkedValue.create(1);
      const right = MarkedValue.create(2);
      const holder = { $$mark: SubbableMark.create() };
      function* children() {
        yield left;
        yield right;
      }
      holder.$$mark.register(holder, children());
      expect(left.$$mark._container.get(holder)).toBe(1);
      expect(right.$$mark._container.get(holder)).toBe(1);
    });

    it("swapping one of two fields holding the same child keeps it linked", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const child = MarkedValue.create(1);
      const pair = new Pair(child, child);
      pair.setLeft(MarkedValue.create(3));

      expect(child.$$mark._container.get(pair)).toBe(1);
      const cb = vi.fn();
      subbable.subscribe(pair, cb);
      child.set(5);
      expect(cb).toHaveBeenCalledTimes(1);
    });

    it("works with no children", () => {
      class Empty implements MarkedSubbable {
        readonly $$mark = SubbableMark.create();
        constructor() {
          this.$$mark.register(this);
        }
      }
      expect(() => new Empty()).not.toThrow();
    });
  });
});
