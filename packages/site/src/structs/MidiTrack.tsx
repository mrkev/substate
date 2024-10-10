import React, { useEffect, useState } from "react";
import * as s from "../../../structured-state/src/index";
import { Notes, Project } from "../App";
import { recordHistory } from "../../../structured-state/src/sstate.history";
import {
  useContainer,
  usePrimitive,
} from "../../../structured-state/src/index";

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

export const TrackM = React.memo(function TrackMImpl({
  track: clip,
  project,
}: {
  track: MidiTrack;
  project: Project;
}) {
  const [name, setName] = usePrimitive(clip.name);
  const [edit, setEdit] = useState(name);

  useContainer(clip);

  useEffect(() => {
    setEdit(name);
  }, [name]);

  function commitEdit() {
    if (edit !== name) {
      recordHistory("set name", () => {
        setName(edit);
      });
    }
  }

  return (
    <fieldset>
      <legend>
        {clip.constructor.name}{" "}
        <input
          type="text"
          value={edit ?? ""}
          placeholder="name"
          onChange={(e) => setEdit(e.target.value)}
          onBlur={() => commitEdit()}
          style={{ width: "10ch" }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              commitEdit();
            }
          }}
        />{" "}
        <input
          type="button"
          value={"x"}
          onClick={() =>
            recordHistory("remove clip", () => {
              project.tracks.remove(clip);
            })
          }
        ></input>
      </legend>

      {clip.counter}

      <input
        type="button"
        value={"+"}
        onClick={() =>
          recordHistory("increase counter", () => {
            clip.featuredMutation(() => {
              clip.counter += 1;
            });
          })
        }
      ></input>
      <Notes notes={clip.tupleArr} />
    </fieldset>
  );
});
