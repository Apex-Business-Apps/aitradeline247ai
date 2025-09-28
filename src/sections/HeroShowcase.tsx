import VideoHero from "@/components/VideoHero";
import { DEMO_WEBM, DEMO_MP4, DEMO_VTT, DEMO_POSTER } from "@/lib/media";

export default function HeroShowcase() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-5">
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight">
            Your 24/7 AI Receptionist
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-300">
            Capture every lead. Email-only transcripts. Instant call-backs.
          </p>
          <div className="flex gap-3">
            <a 
              href="/subscribe" 
              className="rounded-lg px-5 py-3 text-sm font-medium bg-black text-white dark:bg-white dark:text-black hover:opacity-90 transition-opacity"
            >
              Start free
            </a>
            <a 
              href="#how-it-works" 
              className="rounded-lg px-5 py-3 text-sm font-medium bg-neutral-200 dark:bg-neutral-800 hover:opacity-90 transition-opacity"
            >
              See how it works
            </a>
          </div>
        </div>
        <div className="max-w-md lg:max-w-none lg:ml-auto">
          <VideoHero 
            webm={DEMO_WEBM} 
            mp4={DEMO_MP4} 
            vtt={DEMO_VTT} 
            poster={DEMO_POSTER}
          />
        </div>
      </div>
    </section>
  );
}