import React from "react";
import { createRoot } from "react-dom/client";
import AppRouter from "./router";

const root = document.getElementById("root")!;
createRoot(root).render(<React.StrictMode><AppRouter /></React.StrictMode>);
