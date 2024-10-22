import {
  arrayOf,
  init,
  JSONOfAuto,
  replace,
  SSchemaArray,
  SString,
  string,
  Structured,
} from "../../../structured-state/src";
import { AudioClip, SClip } from "./AudioClip";

export type SAudioTrack = {
  kind: "AudioTrack";
  name: string;
  clips: Array<SClip>;
};

export type AutoAudioTrack = {
  name: SString;
  clips: SSchemaArray<AudioClip>;
};

export class AudioTrack extends Structured<
  SAudioTrack,
  AutoAudioTrack,
  typeof AudioTrack
> {
  constructor(
    public readonly name: SString,
    public readonly clips: SSchemaArray<AudioClip>
  ) {
    super();
  }

  override serialize(): SAudioTrack {
    return {
      kind: "AudioTrack",
      name: this.name.get(),
      clips: this.clips._getRaw().map((clip) => clip.serialize()),
    };
  }

  override autoSimplify(): AutoAudioTrack {
    return {
      name: this.name,
      clips: this.clips,
    };
  }

  override replace(auto: JSONOfAuto<AutoAudioTrack>): void {
    replace.string(auto.name, this.name);
    replace.schemaArray(auto.clips, this.clips);
  }

  static of(name: string, clips: AudioClip[]) {
    return Structured.create(
      AudioTrack,
      string(name),
      arrayOf([AudioClip as any], clips)
    );
  }

  static construct(
    json: SAudioTrack,
    auto: JSONOfAuto<AutoAudioTrack>
  ): AudioTrack {
    // const { name, clips } = json;
    // this.name = string(name);
    // this.clips = arrayOf([AudioClip as any], clips);

    return Structured.create(
      AudioTrack,
      init.string(auto.name),
      init.schemaArray(auto.clips, [AudioClip as any])
    );
  }
}
