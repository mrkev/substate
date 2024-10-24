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
import { AudioClip } from "./AudioClip";

export type AutoAudioTrack = {
  name: SString;
  clips: SSchemaArray<AudioClip>;
};

export class AudioTrack extends Structured<AutoAudioTrack, typeof AudioTrack> {
  constructor(
    public readonly name: SString,
    public readonly clips: SSchemaArray<AudioClip>
  ) {
    super();
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
      arrayOf([AudioClip], clips)
    );
  }

  static construct(auto: JSONOfAuto<AutoAudioTrack>): AudioTrack {
    // const { name, clips } = json;
    // this.name = string(name);
    // this.clips = arrayOf([AudioClip], clips);

    return Structured.create(
      AudioTrack,
      init.string(auto.name),
      init.schemaArray(auto.clips, [AudioClip])
    );
  }
}
