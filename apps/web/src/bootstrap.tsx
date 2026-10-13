import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Wzq from "./ui/Wzq";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Wzq />
  </StrictMode>,
);
