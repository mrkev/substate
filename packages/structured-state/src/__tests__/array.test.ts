import { describe, it, expect, vi } from "vitest";
import { saveForHistory } from "../sstate.history";
import { LinkedArray } from "../state/LinkedArray";
import { SubbableContainer } from "../state/SubbableContainer";
import { array } from "..";

vi.mock("../sstate.history", () => ({
  saveForHistory: vi.fn(),
}));

vi.mock("./SubbableContainer", () => ({
  _notifyChange: vi.fn(),
}));

describe("array", () => {
  it("create", () => {
    const initialValues = [1, 2, 3];
    const arr = array(initialValues);
    expect(arr.length).toBe(3);
    expect(arr._getRaw()).toEqual(initialValues);
  });

  it("push", () => {
    const arr = array<number>([1, 2, 3]);
    arr.push(4);
    expect(arr.length).toBe(4);
    expect(arr._getRaw()).toEqual([1, 2, 3, 4]);
  });

  it("pop", () => {
    const arr = array([1, 2, 3]);
    const popped = arr.pop();
    expect(popped).toBe(3);
    expect(arr.length).toBe(2);
    expect(arr._getRaw()).toEqual([1, 2]);
  });

  it("shift", () => {
    const arr = array([1, 2, 3]);
    const shifted = arr.shift();
    expect(shifted).toBe(1);
    expect(arr.length).toBe(2);
    expect(arr._getRaw()).toEqual([2, 3]);
  });

  it("unshift", () => {
    const arr = array<number>([1, 2, 3]);
    arr.unshift(0);
    expect(arr.length).toBe(4);
    expect(arr._getRaw()).toEqual([0, 1, 2, 3]);
  });
});
