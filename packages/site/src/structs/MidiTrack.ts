import * as s from "../../../structured-state/src/index";

export type Note = readonly [s: number, e: number];
export type Effect = readonly [name: string, value: number];

class Track extends s.Struct<Track> {
  // public name: string = "untitled track";
  public counter: number;

  constructor(props: s.StructProps<Track, { counter: number }>) {
    super(props);
    this.counter = props.counter;
  }
}

export class MidiTrack extends Track {
  public readonly name = s.string();

  public tupleArr = s.array<Note>([
    [1, 1],
    [1, 2],
  ]);

  addNote(note: Note) {
    this.tupleArr.push(note);
  }
}
