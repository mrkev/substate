import { init, S, Structured } from "../../../structured-state/src";
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

export class AudioClip extends Structured<SClip, typeof AudioClip> {
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
      init.structured(auto.timelineStart, TimelineT as any),
      init.structured(auto.timelineLength, TimelineT as any)
    );
  }

  override replace(json: SClip): void {
    this.timelineStart.set(json.timelineStart, "seconds");
    this.timelineLength.set(json.timelineLength, "seconds");
  }

  static construct(json: SClip): AudioClip {
    return AudioClip.of(json.timelineStart, json.timelineLength);
  }
}
