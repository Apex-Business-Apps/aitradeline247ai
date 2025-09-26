import React from "react";
export default function SEOQA(){
  const [rows,setRows] = React.useState<{name:string;ok:boolean;note?:string}[]>([]);
  async function run(){
    const R: any[] = [];
    const html = await (await fetch("/", {cache:"no-store"})).text();
    const canon = /<link[^>]+rel="canonical"[^>]+href="https:\/\/www\.tradeline247ai\.com\/[^"]*"/i.test(html);
    const desc  = /<meta[^>]+name="description"[^>]+content="[^"]+"/i.test(html);
    const og    = /property="og:title"|property="og:description"/i.test(html);
    const tw    = /name="twitter:card"/i.test(html);
    const ld    = /application\/ld\+json/i.test(html);
    R.push({name:"Canonical present", ok: canon});
    R.push({name:"Meta description present", ok: desc});
    R.push({name:"OG tags present", ok: og});
    R.push({name:"Twitter card present", ok: tw});
    R.push({name:"JSON-LD present", ok: ld});
    setRows(R);
  }
  const pass = rows.length>0 && rows.every(r=>r.ok);
  return (<div style={{maxWidth:760,margin:"4rem auto",padding:"1rem"}}>
    <h1>SEO QA</h1>
    <button onClick={run}>Run Checks</button>
    <ul style={{listStyle:"none",padding:0,marginTop:12}}>
      {rows.map((r,i)=>(<li key={i} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:"1px solid #eee"}}>
        <span>{r.name}</span><strong style={{color:r.ok?"green":"crimson"}}>{r.ok?"PASS":"FAIL"}</strong>
      </li>))}
    </ul>
    {rows.length>0 && <p><strong>Overall:</strong> <span style={{color:pass?"green":"crimson"}}>{pass?"PASS":"FAIL"}</span></p>}
  </div>);
}