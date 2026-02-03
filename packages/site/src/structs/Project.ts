import {
  array,
  arrayOf,
  InitFunctions,
  JSONOfAuto,
  ReplaceFunctions,
  SArray,
  set,
  SSchemaArray,
  SSet,
  SString,
  string,
  Structured,
} from "../../../structured-state/src";
import { Subbable } from "../../../structured-state/src/state/Subbable";
import { AudioTrack } from "./AudioTrack";

type Marker = readonly [number, string];

type AutoProject = {
  name: SString;
  tracks: SSchemaArray<AudioTrack>;
  randomNumbers: SSet<number>;
  markers: SArray<Marker>;
  solodTracks: SSet<AudioTrack>;
};

type X = JSONOfAuto<AutoProject>["solodTracks"];

export class Project extends Structured<AutoProject, typeof Project> {
  readonly randomNumbers: SSet<number>;

  _changed(target: Subbable, self: Subbable) {
    // console.log("FOOO", target, self);
  }

  constructor(
    readonly name: SString,
    readonly tracks: SSchemaArray<AudioTrack>,
    readonly markers: SArray<Marker>,
    readonly solodTracks: SSet<AudioTrack>,
  ) {
    super();

    // TODO: it's bc it's unintialized.
    // [["foo", 3]] // why does this print as unknown when empty?
    // NOTE: we don't initialize this, it's always a new set
    this.randomNumbers = set();
  }

  override autoSimplify() {
    return {
      name: this.name,
      tracks: this.tracks,
      solodTracks: this.solodTracks,
      randomNumbers: this.randomNumbers,
      markers: this.markers,
    };
  }

  // TODO: I should make replae only care about non-knowables. All knowables get auto-set.
  override replace(
    json: JSONOfAuto<AutoProject>,
    replace: ReplaceFunctions,
  ): void {
    replace.string(json.name, this.name);
    replace.schemaArray(json.tracks, this.tracks);
    replace.set(json.randomNumbers, this.randomNumbers);
    replace.array(json.markers, this.markers);
  }

  static construct(auto: JSONOfAuto<AutoProject>, init: InitFunctions) {
    // TODO: asnync constructors
    return Structured.create(
      Project,
      init.string(auto.name),
      init.schemaArray(auto.tracks, [AudioTrack]),
      init.array<Marker>(auto.markers),
      init.set<AudioTrack>(auto.solodTracks, AudioTrack),
    );
  }

  static of(name: string, tracks: AudioTrack[], markers: Marker[]) {
    return Structured.create(
      Project,
      string(name),
      arrayOf([AudioTrack], tracks),
      array(markers),
      set(),
    );
  }

  addTrack(name: string) {
    const track = AudioTrack.of(name, []);
    this.tracks.push(track);
  }

  clear() {
    while (this.tracks.pop());
  }
}
