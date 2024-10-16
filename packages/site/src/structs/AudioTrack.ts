import {
  arrayOf,
  PrimitiveKind,
  SSchemaArray,
  SString,
  string,
  Structured,
  StructuredKind,
} from "../../../structured-state/src";
import { AudioClip, SClip } from "./AudioClip";

export type SAudioTrack = {
  kind: "AudioTrack";
  name: string;
  clips: Array<SClip>;
};

export class AudioTrack extends Structured<SAudioTrack, typeof AudioTrack> {
  public readonly name: SString;
  public readonly clips: SSchemaArray<AudioClip>;

  constructor(name: string, clips: AudioClip[]) {
    super();
    this.name = string(name);
    this.clips = arrayOf([AudioClip as any], clips);
  }

  override serialize(): SAudioTrack {
    return {
      kind: "AudioTrack",
      name: this.name.get(),
      clips: this.clips._getRaw().map((clip) => clip.serialize()),
    };
  }

  override autoSimplify(): Record<string, StructuredKind | PrimitiveKind> {
    return {
      name: this.name,
      clips: this.clips,
    };
  }

  override replace(json: SAudioTrack): void {
    throw new Error("Method not implemented.");
  }

  static construct(json: SAudioTrack): AudioTrack {
    const { name, clips } = json;
    return Structured.create(
      AudioTrack,
      name,
      clips.map((clip) => AudioClip.construct(clip))
    );
  }
}
