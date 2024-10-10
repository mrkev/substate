import {
  arrayOf,
  SSchemaArray,
  Structured,
} from "../../../structured-state/src";
import { AudioClip, SClip } from "./AudioClip";

export type SAudioTrack = {
  kind: "AudioTrack";
  clips: Array<SClip>;
};

class AudioTrack extends Structured<SAudioTrack, typeof AudioTrack> {
  public readonly clips: SSchemaArray<AudioClip>;

  constructor(clips: AudioClip[]) {
    super();
    this.clips = arrayOf([AudioClip as any], clips);
  }

  override serialize(): SAudioTrack {
    return {
      kind: "AudioTrack",
      clips: this.clips._getRaw().map((clip) => clip.serialize()),
    };
  }
  override replace(json: SAudioTrack): void {
    throw new Error("Method not implemented.");
  }

  static construct(json: SAudioTrack): AudioTrack {
    const { clips: sClips } = json;
    const clips = sClips.map((clip) => AudioClip.construct(clip));
    return Structured.create(AudioTrack, clips);
  }
}
