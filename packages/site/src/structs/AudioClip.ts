import { Structured } from "../../../structured-state/src";
import { time, TimelineT } from "./TimelineT";

export type SClip = {
  timelineStart: number;
  timelineLength: number;
};

export class AudioClip extends Structured<SClip, typeof AudioClip> {
  readonly timelineStart: TimelineT;
  readonly timelineLength: TimelineT;

  constructor(timelineStart: number, timelineLength: number) {
    super();
    this.timelineStart = time(timelineStart, "pulses");
    this.timelineLength = time(timelineLength, "pulses");
  }

  override serialize(): SClip {
    return {
      timelineStart: this.timelineStart.t,
      timelineLength: this.timelineLength.t,
    };
  }
  override replace(json: SClip): void {
    this.timelineStart.set(json.timelineStart, "pulses");
    this.timelineLength.set(json.timelineLength, "pulses");
  }

  static construct(json: SClip): AudioClip {
    return Structured.create(
      AudioClip,
      json.timelineStart,
      json.timelineLength
    );
  }
}
