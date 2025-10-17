import { createRequire } from "module";

const require = createRequire(import.meta.url);

type ReactLike = {
  version?: string;
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: {
    ReactCurrentDispatcher?: unknown;
  };
};

type ReactDomLike = {
  version?: string;
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: {
    ReactCurrentDispatcher?: unknown;
  };
};

type ReactDiagnostics = {
  version: string;
  reactPath: string;
  reactDomPath: string;
  timestamp: string;
};

declare global {
  interface Window {
    __JUBEE_REACT_DETAILS__?: ReactDiagnostics;
  }
}

export function assertSingleReactInstance(): void {
  const react = require("react") as ReactLike;
  const reactDom = require("react-dom") as ReactDomLike;

  const reactPath = require.resolve("react");
  const reactDomPath = require.resolve("react-dom");
  const version = react?.version ?? "unknown";

  const dispatcher = react?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher;
  const domDispatcher = reactDom?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?.ReactCurrentDispatcher;

  if (import.meta.env.DEV && dispatcher && domDispatcher && dispatcher !== domDispatcher) {
    const message = [
      "[JUBEE:SAFETY] React dispatcher mismatch detected.",
      `react@${version} -> ${reactPath}`,
      `react-dom -> ${reactDomPath}`,
    ].join(" \n");
    throw new Error(message);
  }

  const details: ReactDiagnostics = {
    version,
    reactPath,
    reactDomPath,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    window.__JUBEE_REACT_DETAILS__ = details;
  }

  console.info(`%c[JUBEE:SAFETY]%c React singleton check passed ✓ (v${version})`, "color:#0ea5e9;font-weight:600", "color:inherit");
}
