import { createRequire } from "module";

type ReactModule = typeof import("react");
type ReactDomModule = typeof import("react-dom");

declare global {
  interface Window {
    __JUBEE_REACT_DETAILS__?: {
      version: string;
      reactPath: string;
      reactDomPath: string;
      schedulerPath?: string;
      dispatcherMatch: boolean;
      timestamp: string;
    };
  }
}

const require = createRequire(import.meta.url);
let hasAsserted = false;

export function assertSingleReactInstance(): void {
  if (hasAsserted) {
    return;
  }
  hasAsserted = true;

  const react: ReactModule = require("react");
  const reactDom: ReactDomModule = require("react-dom");
  const version = typeof react.version === "string" ? react.version : "unknown";
  const reactPath = require.resolve("react");
  const reactDomPath = require.resolve("react-dom");
  let schedulerPath: string | undefined;

  try {
    schedulerPath = require.resolve("scheduler");
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[JUBEE:SAFETY] scheduler package not resolved", error);
    }
  }

  const reactInternals = (react as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  const reactDomInternals = (reactDom as any)?.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
  const dispatcher = reactInternals?.ReactCurrentDispatcher?.current;
  const domDispatcher = reactDomInternals?.ReactCurrentDispatcher?.current;

  const dispatcherMatch = dispatcher === domDispatcher || !dispatcher || !domDispatcher;

  if (import.meta.env.DEV && dispatcher && domDispatcher && dispatcher !== domDispatcher) {
    const details = {
      version,
      reactPath,
      reactDomPath,
      schedulerPath,
      dispatcherMismatch: true,
    };
    console.error("[JUBEE:SAFETY] React dispatcher mismatch", details);
    throw new Error(
      `[JUBEE:SAFETY] React dispatcher mismatch detected. react@${version} => ${reactPath}; react-dom => ${reactDomPath}`
    );
  }

  const details = {
    version,
    reactPath,
    reactDomPath,
    schedulerPath,
    dispatcherMatch,
    timestamp: new Date().toISOString(),
  };

  window.__JUBEE_REACT_DETAILS__ = details;

  console.info(`[JUBEE:SAFETY] React singleton check passed ✓ (v${version})`, details);
}
