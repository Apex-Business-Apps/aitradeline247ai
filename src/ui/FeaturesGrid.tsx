export default function FeaturesGrid(){
  const items = [
    { h:"After-hours capture", p:"Catch calls 24/7; instant email transcripts." },
    { h:"Consent & compliance", p:"Clear disclosures with opt-out path." },
    { h:"Bilingual (EN/FR)", p:"Switch scripts automatically or via keypad." },
    { h:"PWA install", p:"Install as an app; fast offline shell." }
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((x,i)=>(<div key={i} className="p-4 rounded-2xl shadow"><h3>{x.h}</h3><p>{x.p}</p></div>))}
    </div>
  );
}