import React from "react";

type Row = { name: string; ok: boolean; note?: string };
const paths = {
  home: "/", health: "/healthz", ready: "/readyz",
  robots: "/robots.txt", sitemap: "/sitemap.xml", manifest: "/manifest.webmanifest"
};

async function check(): Promise<Row[]> {
  const rows: Row[] = [];
  const ok = (r: Response) => r && r.ok;
  try {
    rows.push({ name:"GET /", ok: ok(await fetch(paths.home, {cache:"no-store"})) });
    rows.push({ name:"/healthz", ok: ok(await fetch(paths.health)) });
    rows.push({ name:"/readyz", ok: ok(await fetch(paths.ready)) });
    const robots = await (await fetch(paths.robots)).text();
    rows.push({ name:"robots has sitemap", ok: /sitemap\.xml/i.test(robots) });
    const sitemap = await (await fetch(paths.sitemap)).text();
    rows.push({ name:"sitemap host ok", ok: /https:\/\/www\.tradeline247ai\.com\//i.test(sitemap) });
    const manifest = await (await fetch(paths.manifest)).text();
    rows.push({ name:"manifest display=standalone", ok: /"display"\s*:\s*"standalone"/i.test(manifest) });
    const html = await (await fetch(paths.home, {cache:"no-store"})).text();
    rows.push({ name:"GA4 present", ok: /G-5KPE9X0NDM/.test(html) });
    rows.push({ name:"Klaviyo present", ok: /static\.klaviyo\.com\/onsite\/js\/Te837r/.test(html) });
  } catch (e:any) {
    rows.push({ name:"Runner error", ok:false, note:String(e?.message||e) });
  }
  return rows;
}

export default function Dashboard(){
  const [rows,setRows] = React.useState<Row[]>([]);
  const pass = rows.length>0 && rows.every(r=>r.ok);
  return (
    <div style={{maxWidth:780, margin:"4rem auto", padding:"1rem"}}>
      <h1>Ops Dashboard</h1>
      <button onClick={()=>check().then(setRows)} style={{padding:"8px 12px", borderRadius:8}}>Run Checks</button>
      <ul style={{listStyle:"none", padding:0, marginTop:12}}>
        {rows.map((r,i)=>(
          <li key={i} style={{display:"flex", justifyContent:"space-between", padding:"6px 0", borderBottom:"1px solid #eee"}}>
            <span>{r.name}{r.note?` — ${r.note}`:""}</span>
            <strong style={{color:r.ok?"green":"crimson"}}>{r.ok?"PASS":"FAIL"}</strong>
          </li>
        ))}
      </ul>
      {rows.length>0 && <p><strong>Overall:</strong> <span style={{color:pass?"green":"crimson"}}>{pass?"PASS":"FAIL"}</span></p>}
      <p style={{opacity:.7, fontSize:13, marginTop:8}}>CI monitors every 5m; synthetic call runs daily and on-demand (see GitHub → Actions).</p>
    </div>
  );
}