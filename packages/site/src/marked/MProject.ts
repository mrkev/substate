import {
  MarkedArray,
  MarkedSet,
  MarkedSubbable,
  MarkedValue,
  mArray,
  mSet,
  mValue,
  SubbableMark,
} from "../../../subbable-state/index";

type Marker = readonly [number, string];

export class MProject implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();

  readonly randomNumbers: MarkedSet<number>;

  constructor(
    public readonly name: MarkedValue<string>,
    readonly tracks: MarkedArray<MAudioTrack>,
    readonly markers: MarkedArray<Marker>,
    readonly solodTracks: MarkedSet<MAudioTrack>
  ) {
    console.log("CONSTRUCTING MProject");
    this.$$mark.register(this, [name, tracks, markers, solodTracks]);

    // TODO: it's bc it's unintialized.
    // [["foo", 3]] // why does this print as unknown when empty?
    // NOTE: we don't initialize this, it's always a new set
    this.randomNumbers = mSet();
    console.log("CONSTRUCTED MProject");
  }

  static of(name: string, tracks: MAudioTrack[], markers: Marker[]) {
    return new MProject(mValue(name), mArray(tracks), mArray(markers), mSet());
  }

  addTrack(name: string) {
    const track = MAudioTrack.of(name, []);
    this.tracks.push(track);
  }

  clear() {
    while (this.tracks.pop());
  }
}

export class MAudioTrack implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();

  constructor(
    public readonly name: MarkedValue<string>,
    public readonly clips: MarkedArray<MAudioClip>
  ) {
    console.log("CONSTRUCTING MAudioTrack");
    this.$$mark.register(this, [name]);
    console.log("CONSTRUCTED MAudioTrack");
  }

  static of(name: string, clips: MAudioClip[]) {
    return new MAudioTrack(mValue(name), mArray(clips));
  }
}

export class MAudioClip implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();

  constructor(
    //
    readonly timelineStart: MTime,
    readonly timelineLength: MTime
  ) {
    console.log("CONSTRUCTING MAudioClip");
    this.$$mark.register(this, [timelineStart, timelineLength]);
    console.log("CONSTRUCTED MAudioClip");
  }

  static of(timelineStart: number, timelineLength: number) {
    return new MAudioClip(
      time(timelineStart, "seconds"),
      time(timelineLength, "seconds")
    );
  }
}

type TimeUnit = "pulses" | "seconds" | "bars";

export class MTime implements MarkedSubbable {
  readonly $$mark = SubbableMark.create();

  constructor(
    // time and unit
    public t: number,
    public u: TimeUnit
  ) {
    console.log("CONSTRUCTING MTime");
    this.$$mark.register(this);
    console.log("CONSTRUCTED MTime");
  }

  public set(t: number, u?: TimeUnit) {
    this.$$mark.mutate(this, () => {
      this.t = Math.max(t, 0);
      if (u != null) {
        this.u = u;
      }
    });
  }
}

export function time(t: number, u: "pulses" | "seconds") {
  return new MTime(t, u);
}
