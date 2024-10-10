import { Structured } from "../../../structured-state/src";

export type TimeUnit = "pulses" | "seconds" | "bars";
export type STimelineT = Readonly<{ t: number; u: TimeUnit }>;
type AutoTimelineT = STimelineT;

export class TimelineT extends Structured<STimelineT, typeof TimelineT> {
  constructor(
    // time and unit
    public t: number,
    public u: TimeUnit
  ) {
    super();
  }

  override serialize(): STimelineT {
    return { t: this.t, u: this.u };
  }

  override autoSimplify() {
    return { t: this.t, u: this.u };
  }

  // experimental
  static autoConstruct(serialized: AutoTimelineT): TimelineT {
    return Structured.create(TimelineT, serialized.t, serialized.u);
  }

  override replace({ t, u }: STimelineT): void {
    console.log("replace", t, u);
    this.t = t;
    this.u = u;
    console.log("t is now", this.t, this._id, this._id);
  }

  static construct({ t, u }: STimelineT): TimelineT {
    return Structured.create(TimelineT, t, u);
  }

  public set(t: number, u?: TimeUnit) {
    this.featuredMutation(() => {
      this.t = t;
      if (u != null) {
        this.u = u;
      }
    });
  }
}

export function time(t: number, u: "pulses" | "seconds"): TimelineT {
  return Structured.create(TimelineT, t, u);
}
