import { useEffect, useState } from "react";
import { Dashboard, DemoSpotlight } from "@/features/dashboard";
import { demoSteps } from "@/features/dashboard/DemoScript";

export default function DemoDashboard() {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [playing, setPlaying] = useState(true);
  const speed = Number(new URLSearchParams(location.search).get("speed") || "1");
  const loop = new URLSearchParams(location.search).get("loop") === "1";

  useEffect(() => {
    if (!playing) return;
    const step = demoSteps[i];
    if (!step) { 
      if (loop) { 
        setI(0); 
      } 
      return; 
    }
    const el = document.querySelector(step.target) as HTMLElement | null;
    setRect(el ? el.getBoundingClientRect() : null);
    const t = setTimeout(() => setI((v) => v + 1), (step.wait ?? 1000) / speed);
    return () => clearTimeout(t);
  }, [i, playing, speed, loop]);

  return (
    <div className="relative">
      <Dashboard demoMode />
      <DemoSpotlight rect={rect} />
      <div className="fixed bottom-4 right-4 z-50 flex gap-2">
        <button 
          className="rounded-md px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black" 
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <a 
          className="rounded-md px-3 py-1.5 bg-neutral-200 dark:bg-neutral-800" 
          href="/"
        >
          Back
        </a>
      </div>
    </div>
  );
}