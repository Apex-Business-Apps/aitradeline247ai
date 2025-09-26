import React from "react";

export default function TelephonyQA(){
  const [rows,setRows]=React.useState<any[]>([]);
  
  async function fetchLogs(){
    try {
      const r = await fetch("/voice/status/peek",{ headers:{ "X-Admin-Key": "admin" } });
      setRows(r.ok ? await r.json() : []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setRows([]);
    }
  }
  
  return (
    <div style={{maxWidth:720,margin:"4rem auto",padding:"1rem"}}>
      <h1>Twilio Live Test</h1>
      <button onClick={fetchLogs}>Refresh Logs</button>
      <ul style={{listStyle:"none",padding:0,marginTop:12}}>
        {rows.map((x,i)=>(
          <li key={i} style={{padding:"8px 0",borderBottom:"1px solid #eee"}}>
            <code>{x.ts}</code> — <strong>{x.CallStatus}</strong> — {x.From} → {x.To} — {x.CallSid}
          </li>
        ))}
      </ul>
      <p>Place a call to <strong>+1-587-742-8885</strong>; expect ring-through to <strong>+1-431-990-0222</strong>. Refresh to see status.</p>
    </div>
  );
}