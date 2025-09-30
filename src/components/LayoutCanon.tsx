// LOVABLE-GUARD: mount-only; no UI.
import { useEffect, useRef } from "react";
import { startLayoutCanon } from "../lib/layoutCanon";

let canonInitialized = false;

export default function LayoutCanon() {
  const hasRun = useRef(false);
  
  useEffect(() => { 
    if (!hasRun.current && !canonInitialized) {
      hasRun.current = true;
      canonInitialized = true;
      startLayoutCanon();
    }
  }, []);
  return null;
}