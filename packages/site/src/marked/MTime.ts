import { MarkedSubbable, SubbableMark } from "@mrkev/marked-subbable";
import {
  MarkedSerializable,
  SerializationMark,
} from "@mrkev/marked-serializable";

type TimeUnit = "pulses" | "seconds" | "bars";

export class MTime
  implements MarkedSubbable, MarkedSerializable<typeof serialization_mtime>
{
  readonly $$mark = SubbableMark.create();
  readonly $$serialization = serialization_mtime;

  constructor(
    // time and unit
    public t: number,
    public u: TimeUnit
  ) {
    this.$$mark.register(this);
  }

  static of(t: number, u: TimeUnit) {
    return new MTime(t, u);
  }

  public set(t: number, u?: TimeUnit) {
    this.$$mark.mutate(this, () => {
      this.t = Math.max(t, 0);
      if (u != null) {
        this.u = u;
      }
    });
  }
}

/////////////////// Serialization

type TimeS = { t: number; u: TimeUnit };

export const serialization_mtime: SerializationMark<TimeS, MTime> =
  SerializationMark.create({
    kind: "mtime",
    construct({ t, u }) {
      return MTime.of(t, u);
    },
    simplify(mtime) {
      return { t: mtime.t, u: mtime.u };
    },
  });
