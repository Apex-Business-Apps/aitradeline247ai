export function redact(text=""){
  let hits=0, out=text;
  out = out.replace(/\b(?:\d[ -]?){13,19}\b/g, ()=>{hits++; return "****-****-****-****";});
  out = out.replace(/\b\d{3}[- ]?\d{3}[- ]?\d{3}\b/g, ()=>{hits++; return "***-***-***";});
  out = out.replace(/\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b/gi, ()=>{hits++; return "****IBAN****";});
  out = out.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, ()=>{hits++; return "***@***";});
  return { text: out, hits };
}