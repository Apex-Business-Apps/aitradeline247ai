export default function HowItWorks(){
  const steps = [
    { n:"1", t:"Caller rings", d:"We answer instantly after hours (or overflow)." },
    { n:"2", t:"Consent", d:"Brief disclosure; opt-out available." },
    { n:"3", t:"Bridge", d:"We connect to your business line (answerOnBridge)." },
    { n:"4", t:"Transcript", d:"Email-only transcript to your inbox." }
  ];
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s)=>(<li key={s.n} className="p-4 rounded-2xl border"><strong>{s.n}. {s.t}</strong><div>{s.d}</div></li>))}
    </ol>
  );
}