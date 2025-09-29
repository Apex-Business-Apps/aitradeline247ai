import FeaturesGrid from "../ui/FeaturesGrid";
import HowItWorks from "../ui/HowItWorks";

export default function Home() {
  return (
    <main className="min-h-screen">
      <section data-node="start" className="py-16 text-center">
        <h1>TradeLine 24/7 — Your 24/7 Ai Receptionist!</h1>
        <p>Never miss a call. Work while you sleep.</p>
        <p><a href="/contact" className="underline">Get a callback</a></p>
      </section>
      <section data-node="grid" className="py-12"><FeaturesGrid /></section>
      <section data-node="ron" className="py-12 bg-neutral-50"><HowItWorks /></section>
    </main>
  );
}