export function detectUrgent(t){ return /\b(emergency|urgent|asap|immediately)\b/i.test(t||""); }
export function classifyOutcome(t){
  if (!t) return "unknown";
  if (/\b(quote|estimate|book|new project|new client)\b/i.test(t)) return "lead";
  if (/\b(support|issue|problem|warranty|fix)\b/i.test(t)) return "support";
  if (/\b(spam|telemarketer|robocall)\b/i.test(t)) return "spam";
  return "unknown";
}