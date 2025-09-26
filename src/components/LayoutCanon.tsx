// LOVABLE-GUARD: mount-only; no UI.
import { useEffect } from "react";
import { startLayoutCanon } from "../lib/layoutCanon";

export default function LayoutCanon() {
  useEffect(() => { startLayoutCanon(); }, []);
  return null;
}