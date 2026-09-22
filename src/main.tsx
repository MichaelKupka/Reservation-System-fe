import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/dm-sans";
import "@fontsource/bebas-neue/latin-ext-400.css";
import "@fontsource/bebas-neue/latin-400.css";
import App from "./app/App";
import "./app/styles/index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
