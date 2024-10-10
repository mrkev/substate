import { Structured } from "../../../structured-state/src";
import { Serialized } from "../../../structured-state/src/serialization";
import { initializeStructured } from "../../../structured-state/src/serialization.initialize";
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
  timelineStart: Extract<Serialized, { $$: "structured" }>;
  timelineLength: Extract<Serialized, { $$: "structured" }>;
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
      time(timelineStart, "pulses"),
      time(timelineLength, "pulses")
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
      initializeStructured(auto.timelineStart, TimelineT as any),
      initializeStructured(auto.timelineLength, TimelineT as any)
    );
  }

  override replace(json: SClip): void {
    this.timelineStart.set(json.timelineStart, "pulses");
    this.timelineLength.set(json.timelineLength, "pulses");
  }

  static construct(json: SClip): AudioClip {
    return AudioClip.of(json.timelineStart, json.timelineLength);
  }
}
