export default function Home(){
  return (
    <section className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-semibold">
          TradeLine 24/7 — Your 24/7 Ai Receptionist!
        </h1>
        <p className="text-lg md:text-xl">
          Never miss a call. Work while you sleep.
        </p>
        <div className="flex justify-center">
          <a href="/#cta" className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 border text-base"
             style={{backgroundColor:"var(--brand-orange)"}}>
            Get a callback
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mt-16">
        <Feature title="After-hours capture" text="Catch calls 24/7; instant email transcripts." />
        <Feature title="Consent & compliance" text="Clear disclosures with opt-out path." />
        <Feature title="Bilingual (EN/FR)" text="Switch scripts automatically or via keypad." />
        <Feature title="PWA install" text="Install as an app; fast offline shell." />
      </div>
    </section>
  );
}
function Feature({title, text}:{title:string;text:string}){
  return (
    <div className="p-6 rounded-2xl border shadow-sm">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="opacity-80">{text}</p>
    </div>
  );
}