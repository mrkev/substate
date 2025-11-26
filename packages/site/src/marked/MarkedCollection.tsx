import React from "react";
import { useLink } from "../../../subbable-state";
import { MarkedSubbable } from "../../../subbable-state/lib/SubbableMark";
import { TxtButton } from "../ls/TxtButton";
import { TAB_SIZE, Header } from "./MarkedSetTest";

export function MarkedCollection<T>({
  set,
  pad,

  showUnknowns,
  handleAdd,
  handleClear,
  handleDelete,
  renderValue,
  getLen,
  delimiters: [open, close],
}: {
  delimiters: [string, string];
  set: Iterable<T> & MarkedSubbable;
  pad: number;
  showUnknowns: boolean;
  handleAdd?: () => void;
  handleClear?: () => void;
  handleDelete?: (value: T) => void;
  getLen?: (elem: Iterable<T> & MarkedSubbable) => number;
  renderValue: (v: T, pad: number, showUnknowns?: boolean) => React.ReactNode;
}) {
  const lset = useLink(set);
  const result = [];

  let i = 0;
  for (const value of lset()) {
    const baseline = pad + TAB_SIZE;
    result.push(
      <br key={`br-${i}`} />,
      " ".repeat(baseline),
      <React.Fragment key={`elem-${i}`}>
        {renderValue(value, baseline, showUnknowns)}
      </React.Fragment>,
      " ",
      handleDelete && (
        <TxtButton
          title="shift"
          onClick={() => handleDelete(value)}
          children="del."
        />
      )
    );
    i++;
  }

  if (result.length > -1) {
    result.push(<br key={`brend`} />, " ".repeat(pad));
  }

  return (
    <>
      <Header obj={lset()} /> {open}
      <br />
      {" ".repeat(TAB_SIZE - 1)}
      {handleAdd && (
        <TxtButton
          title="add"
          onClick={handleAdd}
          className="bg-transparent"
          children=" + "
        />
      )}
      {getLen && <span className="text-gray-500">(len. {getLen(lset())})</span>}
      {result}
      {close}{" "}
      {handleClear && (
        <TxtButton title="clear" onClick={handleClear}>
          clear
        </TxtButton>
      )}
    </>
  );
}
