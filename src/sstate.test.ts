import * as s from "./sstate";
import { pushHistory } from "./sstate.history";
import { beforeEach, describe, expect, it } from "vitest";

export class BusLine extends s.Struct<BusLine> {
  readonly distance = s.number();
  readonly stops = s.number();
  readonly buses = s.array([Bus]);

  addBus(name: string) {
    const lion = s.create(Bus, { name });
    this.buses.push(lion);
  }

  clear() {
    pushHistory(() => {
      while (this.buses.pop()) {}
    });
  }
}

export class Bus extends s.Struct<Bus> {
  readonly name = s.string();
}

let busLine = s.create(BusLine, {
  distance: 0,
  stops: 0,
  buses: [s.create(Bus, { name: "hello" })],
});

beforeEach(() => {
  busLine = s.create(BusLine, {
    distance: 0,
    stops: 0,
    buses: [s.create(Bus, { name: "hello" })],
  });
});

describe("sstate", () => {});
