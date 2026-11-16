// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import { MarkedSubbable } from "./lib/SubbableMark";
import { MarkedArray } from "./MarkedArray";
import { MarkedValue } from "./MarkedValue";
import { useLink, useLinkAsState } from "./useLink";

// vitest globals are off, so Testing Library can't register this itself
afterEach(cleanup);

function subscriberCount(obj: MarkedSubbable) {
  return obj.$$mark._subscriptors.size;
}

/** renders a component that links `obj`, counting renders */
function renderLinked<S extends MarkedSubbable>(obj: S, recursive?: boolean) {
  const result = {
    renders: 0,
    accessors: [] as (() => S)[],
    rerender: (_next: S) => {},
  };
  function Linked({ obj }: { obj: S }) {
    result.renders++;
    result.accessors.push(useLink(obj, recursive));
    return null;
  }
  const { rerender } = render(<Linked obj={obj} />);
  result.rerender = (next) => rerender(<Linked obj={next} />);
  return result;
}

describe("useLink", () => {
  it("re-renders when the linked object changes", () => {
    const arr = MarkedArray.create<number>([]);
    const linked = renderLinked(arr);
    expect(linked.renders).toBe(1);

    act(() => {
      arr.push(1);
    });

    expect(linked.renders).toBe(2);
    expect(linked.accessors.at(-1)!()).toBe(arr);
  });

  it("doesn't re-render for a nested change by default", () => {
    const child = MarkedValue.create(0);
    const arr = MarkedArray.create([child]);
    const linked = renderLinked(arr);

    act(() => child.set(1));

    expect(linked.renders).toBe(1);
  });

  it("re-renders for a nested change when recursive", () => {
    const child = MarkedValue.create(0);
    const arr = MarkedArray.create([child]);
    const linked = renderLinked(arr, true);

    act(() => child.set(1));

    expect(linked.renders).toBe(2);
  });

  it("doesn't re-render when an unrelated object changes", () => {
    const linkedArr = MarkedArray.create<number>([]);
    const other = MarkedArray.create<number>([]);
    const linked = renderLinked(linkedArr, true);

    act(() => {
      other.push(1);
    });

    expect(linked.renders).toBe(1);
  });

  it("returns a new accessor each render, so React Compiler output stays fresh", () => {
    const arr = MarkedArray.create<number>([]);
    const linked = renderLinked(arr);

    act(() => {
      arr.push(1);
    });

    const [first, second] = linked.accessors;
    expect(first).not.toBe(second);
    expect(second()).toBe(arr);
  });

  it("unsubscribes on unmount", () => {
    const arr = MarkedArray.create<number>([]);
    renderLinked(arr);
    expect(subscriberCount(arr)).toBe(1);
    cleanup();
    expect(subscriberCount(arr)).toBe(0);
  });

  it("switching objects subscribes to the new one and drops the old one", () => {
    const first = MarkedArray.create<number>([]);
    const second = MarkedArray.create<number>([]);
    const linked = renderLinked(first);

    linked.rerender(second);
    expect(subscriberCount(first)).toBe(0);
    expect(subscriberCount(second)).toBe(1);

    const renders = linked.renders;
    act(() => {
      first.push(1);
    });
    expect(linked.renders).toBe(renders);
    act(() => {
      second.push(1);
    });
    expect(linked.renders).toBe(renders + 1);
  });
});

describe("useLinkAsState", () => {
  /** renders a component using useLinkAsState, recording what it saw */
  function renderAsState<T>(value: MarkedValue<T>) {
    const result = {
      renders: 0,
      values: [] as T[],
      setter: null as null | ((next: T | ((prev: T) => T)) => void),
    };
    function AsState() {
      result.renders++;
      const [current, setCurrent] = useLinkAsState(value);
      result.values.push(current);
      result.setter = setCurrent;
      return null;
    }
    render(<AsState />);
    return result;
  }

  it("returns the current value and re-renders when it's set from outside", () => {
    const value = MarkedValue.create(1);
    const state = renderAsState(value);

    act(() => value.set(2));

    expect(state.values).toEqual([1, 2]);
  });

  it("the setter sets the value, directly or from the previous one", () => {
    const value = MarkedValue.create(1);
    const state = renderAsState(value);

    act(() => state.setter!(5));
    expect(value.get()).toBe(5);

    act(() => state.setter!((prev) => prev * 10));
    expect(value.get()).toBe(50);
    expect(state.values.at(-1)).toBe(50);
  });

  it("doesn't re-render for a change nested inside the value", () => {
    const inner = MarkedArray.create<number>([]);
    const value = MarkedValue.create(inner);
    const state = renderAsState(value);

    act(() => {
      inner.push(1);
    });

    expect(state.renders).toBe(1);
  });

  it("unsubscribes on unmount", () => {
    const value = MarkedValue.create(1);
    renderAsState(value);
    expect(subscriberCount(value)).toBe(1);
    cleanup();
    expect(subscriberCount(value)).toBe(0);
  });
});

it("both hooks render on the server", () => {
  const arr = MarkedArray.create([1, 2]);
  const value = MarkedValue.create("hi");
  function Page() {
    const items = useLink(arr);
    const [text] = useLinkAsState(value);
    return (
      <p>
        {text}: {items().length}
      </p>
    );
  }
  expect(renderToString(<Page />)).toBe("<p>hi<!-- -->: <!-- -->2</p>");
});
