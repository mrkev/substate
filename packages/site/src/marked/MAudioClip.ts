import {
  MarkedSerializable,
  SerializationMark,
} from "@mrkev/marked-serializable";
import { MarkedSubbable, SubbableMark } from "@mrkev/marked-subbable";
import { MTime } from "./MTime";

export class MAudioClip
  implements
    MarkedSubbable,
    MarkedSerializable<typeof serialization_maudioclip>
{
  readonly $$mark = SubbableMark.create();
  readonly $$serialization = serialization_maudioclip;

  constructor(
    //
    readonly timelineStart: MTime,
    readonly timelineLength: MTime
  ) {
    this.$$mark.register(this, [timelineStart, timelineLength]);
  }

  static of(timelineStart: number, timelineLength: number) {
    return new MAudioClip(
      MTime.of(timelineStart, "seconds"),
      MTime.of(timelineLength, "seconds")
    );
  }
}

///////////////////// Serialization

type DAudioClip = {
  timelineStart: MTime;
  timelineLength: MTime;
};

export const serialization_maudioclip: SerializationMark<
  DAudioClip,
  MAudioClip
> = SerializationMark.create({
  kind: "maudioclip",
  construct({ timelineStart, timelineLength }: DAudioClip) {
    return new MAudioClip(timelineStart, timelineLength);
  },
  simplify(mtime: MAudioClip) {
    return {
      timelineStart: mtime.timelineStart,
      timelineLength: mtime.timelineLength,
    };
  },
});
