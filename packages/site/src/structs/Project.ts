import {
  DeserializeFunc,
  SArray,
  set,
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

export class Project extends Structured<SerializedProject, typeof Project> {
  readonly name: SString;
  // readonly tracks: SSchemaArray<MidiTrack>;
  // readonly effects: SArray<Effect>;
  readonly tracks: SArray<AudioTrack>;
  readonly randomNumbers: SSet<number>;

  constructor(name: string, tracks?: AudioTrack[]) {
    super();
    this.tracks = SArray.create(tracks);

    this.name = string(name);
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

  override replace(json: SerializedProject): void {
    this.name.set(json.name);
    // TODO: I should make replae only care about non-knowables. All knowables get auto-set.
    // this.clips._setRaw(json.clips)
  }

  static construct(
    json: SerializedProject,
    deserializeWithSchema: DeserializeFunc
  ) {
    // TODO: asnync constructs
    const tracks = json.tracks != null ? [] : undefined;
    return Structured.create(Project, json.name, tracks);
  }

  addTrack(name: string) {
    const track = Structured.create(AudioTrack, "untitled track", []);
    this.tracks.push(track);
  }

  clear() {
    while (this.tracks.pop()) {}
  }
}
