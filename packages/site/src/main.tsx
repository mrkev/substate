import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Route, Routes } from "react-router-dom";
import { App } from "./App.tsx";
import { Layout, PageRoute } from "./Layout.tsx";
import { LinkableStateNested } from "./ls/LinkableStateNestedPage.tsx";
import { LinkableStateTest } from "./ls/LinkableStatePage.tsx";
import { MarkedStateTest } from "./marked/page.tsx";
import { MarkedProjectTest } from "./marked/MarkedProjectTest.tsx";

const routes: PageRoute[] = [
  {
    path: "/",
    group: "structured-state",
    label: "project",
    description:
      "Struct-based Project → Tracks → Clips. Undo/redo with recordHistory, dirty tracking, serialize/construct, and the history stack.",
    element: <App />,
  },
  {
    path: "/ls",
    group: "linked-state",
    label: "basic",
    description:
      "One tester per primitive. Headers read (kind: id.hash); the hash bumps on every mutation, including nested ones.",
    element: <LinkableStateTest />,
  },
  {
    path: "/ls2",
    group: "linked-state",
    label: "nested",
    description:
      "A map of arrays, and a todo list: the summary uses useLink(list, true) to hear nested changes, the list itself only shallow ones. 'shared 1' and 'shared 2' are the same LinkableValue.",
    element: <LinkableStateNested />,
  },
  {
    path: "/marked",
    group: "marked",
    label: "basic",
    description: "marked-subbable: a MarkedArray, and a MarkedSet of MarkedSets.",
    element: <MarkedStateTest />,
  },
  {
    path: "/marked2",
    group: "marked",
    label: "project",
    description:
      "The same project model on marked-subbable + marked-serializable. The history stack is experimental: undo only logs what it would revert.",
    element: <MarkedProjectTest />,
  },
];

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter
    // basename="/substate"
    >
      <Routes>
        <Route element={<Layout routes={routes} />}>
          {routes.map((route) => (
            <Route key={route.path} path={route.path} element={route.element} />
          ))}
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>,
);
