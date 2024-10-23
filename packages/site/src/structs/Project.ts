import {
  arrayOf,
  DeserializeFunc,
  init,
  JSONOfAuto,
  replace,
  set,
  SSchemaArray,
  SSet,
  SString,
  string,
  Structured,
} from "../../../structured-state/src";
import { Serialized } from "../../../structured-state/src/serialization";
import { AudioTrack } from "./AudioTrack";

type SerializedProject = Readonly<{
  name: string;
  tracks?: Extract<Serialized, { $$: "arr-schema" }>; // todo this is not working for some reason:
  // clips?: ApplySerialization<s.SSchemaArray<MidiClip>>;
}>;

type AutoProject = {
  name: SString;
  tracks: SSchemaArray<AudioTrack>;
  randomNumbers: SSet<number>;
};

export class Project extends Structured<
  SerializedProject,
  AutoProject,
  typeof Project
> {
  // readonly tracks: SSchemaArray<MidiTrack>;
  // readonly effects: SArray<Effect>;

  readonly randomNumbers: SSet<number>;

  constructor(
    readonly name: SString,
    readonly tracks: SSchemaArray<AudioTrack>
  ) {
    super();

    // this.tracks = arrayOf([MidiTrack], clips);
    // this.effects = array<Effect>();
    // [["foo", 3]] // why does this print as unknown when empty?
    // TODO: it's bc it's unintialized
    this.randomNumbers = set();
  }

  override autoSimplify() {
    return {
      name: this.name,
      tracks: this.tracks,
      randomNumbers: this.randomNumbers,
    };
  }

  override serialize() {
    // TODO: HOW TO SERIALIZE CLIPS
    return { name: this.name.get() } as const;
  }

  override replace(json: JSONOfAuto<AutoProject>): void {
    replace.string(json.name, this.name);
    // TODO: I should make replae only care about non-knowables. All knowables get auto-set.
    // this.clips._setRaw(json.clips)
  }

  static construct(
    auto: JSONOfAuto<AutoProject>,
    deserializeWithSchema: DeserializeFunc
  ) {
    // TODO: asnync constructs
    return Structured.create(
      Project,
      init.string(auto.name),
      init.schemaArray(auto.tracks, [AudioTrack as any])
    );
  }

  static of(name: string, tracks: AudioTrack[]) {
    return Structured.create(
      Project,
      string(name),
      arrayOf([AudioTrack as any], tracks)
    );
  }

  addTrack(name: string) {
    const track = Structured.create(
      AudioTrack,
      string("untitled track"),
      arrayOf([AudioTrack as any], [])
    );
    this.tracks.push(track);
  }

  clear() {
    while (this.tracks.pop()) {}
  }
}
