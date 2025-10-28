import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { App } from "./App.tsx";
import { LinkedState } from "./ls/LinkedState.tsx";
import "react-json-pretty/themes/monikai.css";
import "react-json-view-lite/dist/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/ls" element={<LinkedState />} />
    </Routes>
  </BrowserRouter>
  // </React.StrictMode>
);
