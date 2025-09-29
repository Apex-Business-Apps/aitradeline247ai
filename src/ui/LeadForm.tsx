import { useState } from "react";

export default function LeadForm(){
  const [status, setStatus] = useState<"idle"|"ok"|"err">("idle");
  async function onSubmit(e: React.FormEvent<HTMLFormElement>){
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    try{
      const r = await fetch("/api/lead", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(body) });
      setStatus(r.ok ? "ok" : "err");
    }catch{ setStatus("err"); }
  }
  return (
    <form method="post" action="/api/lead" onSubmit={onSubmit} className="grid gap-3 max-w-md">
      <label> Name <input name="name" required autoComplete="name" /></label>
      <label> Email <input name="email" type="email" required autoComplete="email" /></label>
      <label> Phone <input name="phone" type="tel" autoComplete="tel" /></label>
      <label> Message <textarea name="message" rows={4} /></label>
      <button type="submit" className="rounded-2xl p-3 shadow">Request callback</button>
      {status==="ok" && <p role="status" className="text-green-700">Thanks — we'll reach out shortly.</p>}
      {status==="err" && <p role="status" className="text-red-700">Please try again.</p>}
    </form>
  );
}