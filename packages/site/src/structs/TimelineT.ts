import { Structured } from "../../../structured-state/src";

type TimeUnit = "pulses" | "seconds" | "bars";
type AutoTimelineT = Readonly<{ t: number; u: TimeUnit }>;

export class TimelineT extends Structured<AutoTimelineT, typeof TimelineT> {
  constructor(
    // time and unit
    public t: number,
    public u: TimeUnit
  ) {
    super();
  }

  override autoSimplify() {
    return { t: this.t, u: this.u };
  }

  override replace({ t, u }: AutoTimelineT): void {
    this.t = t;
    this.u = u;
  }

  static construct(auto: AutoTimelineT): TimelineT {
    return Structured.create(TimelineT, auto.t, auto.u);
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
