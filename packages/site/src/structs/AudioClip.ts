import {
  init,
  JSONOfAuto,
  replace,
  S,
  Structured,
} from "../../../structured-state/src";
import { time, TimelineT } from "./TimelineT";

export type SClip = {
  timelineStart: number;
  timelineLength: number;
};

type AutoAudioClip = {
  timelineStart: TimelineT;
  timelineLength: TimelineT;
};

type AudioClipRaw = {
  timelineStart: S["structured"];
  timelineLength: S["structured"];
};

export class AudioClip extends Structured<
  SClip,
  AutoAudioClip,
  typeof AudioClip
> {
  constructor(
    readonly timelineStart: TimelineT,
    readonly timelineLength: TimelineT
  ) {
    super();
  }

  static of(timelineStart: number, timelineLength: number) {
    return Structured.create(
      AudioClip,
      time(timelineStart, "seconds"),
      time(timelineLength, "seconds")
    );
  }

  override serialize(): SClip {
    return {
      timelineStart: this.timelineStart.t,
      timelineLength: this.timelineLength.t,
    };
  }

  override autoSimplify(): AutoAudioClip {
    return {
      timelineStart: this.timelineStart,
      timelineLength: this.timelineLength,
    };
  }

  // experimental
  static autoConstruct(auto: AudioClipRaw): AudioClip {
    return Structured.create(
      AudioClip,
      init.structured(auto.timelineStart, TimelineT),
      init.structured(auto.timelineLength, TimelineT)
    );
  }

  override replace(auto: JSONOfAuto<AutoAudioClip>): void {
    replace.structured(auto.timelineStart, this.timelineStart);
    replace.structured(auto.timelineLength, this.timelineLength);
  }

  static construct(json: SClip, auto: JSONOfAuto<AutoAudioClip>): AudioClip {
    return Structured.create(
      AudioClip,
      init.structured(auto.timelineStart, TimelineT),
      init.structured(auto.timelineLength, TimelineT)
    );
  }
}
