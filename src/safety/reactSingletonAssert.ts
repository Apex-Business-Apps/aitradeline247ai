import * as React from "react";
import * as ReactDOM from "react-dom";

type ReactInternals = {
  ReactCurrentDispatcher?: unknown;
};

type ReactLike = {
  version?: string;
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: ReactInternals;
};

type ReactDomLike = {
  version?: string;
  __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED?: ReactInternals;
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

function safeResolve(specifier: string): string {
  const fallback = specifier;

  const resolver = (import.meta as unknown as { resolve?: (id: string) => string }).resolve;
  if (typeof resolver === "function") {
    try {
      return resolver(specifier);
    } catch (error) {
      console.warn(`[JUBEE:SAFETY] Failed to resolve ${specifier}:`, error);
    }
  }

  try {
    const url = new URL(specifier, import.meta.url);
    return url.href;
  } catch {
    return fallback;
  }
}

export function assertSingleReactInstance(): void {
  const react = React as ReactLike;
  const reactDom = ReactDOM as ReactDomLike;

  const version = react?.version ?? "unknown";
  const reactPath = safeResolve("react");
  const reactDomPath = safeResolve("react-dom");

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

  console.info(
    `%c[JUBEE:SAFETY]%c React singleton check passed ✓ (v${version})`,
    "color:#0ea5e9;font-weight:600",
    "color:inherit",
    { reactPath, reactDomPath }
  );
}
