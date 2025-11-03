import React from "react";
import ReactDOM from "react-dom/client";
import "react-json-pretty/themes/monikai.css";
import "react-json-view-lite/dist/index.css";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import { App } from "./App.tsx";
import { LinkedStateTest } from "./ls/LinkedState.tsx";
import { LinkedStateTest2 } from "./ls/LinkedState2.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route
          element={
            <div className="flex flex-col gap-2">
              {/* <header>My Application Header</header> */}
              <nav className="flex flex-row gap-2 justify-center">
                <a href="/">structured-state</a>
                <a href="/ls">linked-state (simple)</a>
                <a href="/ls2">linked-state (complex)</a>
              </nav>
              <main>
                <Outlet /> {/* Renders the content of the nested route */}
              </main>
              {/* <footer>My Application Footer</footer> */}
            </div>
          }
        >
          {/* Parent route with the layout */}
          <Route path="/" element={<App />} />
          <Route path="/ls" element={<LinkedStateTest />} />
          <Route path="/ls2" element={<LinkedStateTest2 />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
