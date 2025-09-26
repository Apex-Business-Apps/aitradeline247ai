import { useEffect } from "react";
import { startHeroDuoCanon } from "../lib/heroDuoCanon";

export default function HeroDuoCanon(){
  useEffect(() => { startHeroDuoCanon(); }, []);
  return null;
}