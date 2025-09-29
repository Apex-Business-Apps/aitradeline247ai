import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { wireSpaRouter } from "./lib/klaviyo";

createRoot(document.getElementById("root")!).render(<App />);

// Wire SPA router tracking after app mounts
wireSpaRouter(() => location.pathname);
