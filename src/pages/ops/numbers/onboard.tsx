import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

export default function NumberOnboard() {
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handleAttach = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const e164 = number.trim();
    if (!/^\+\d{8,15}$/.test(e164)) {
      setMsg({ ok: false, text: "Enter a valid E.164 number, e.g., +15877428885" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ops-twilio-attach-number", {
        body: { number_e164: e164 }
      });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Attach failed");

      setMsg({ ok: true, text: `✅ Connected: ${e164} (SID ${data.sid})` });
      setNumber("");
    } catch (err: any) {
      setMsg({ ok: false, text: `Attach error: ${err.message || err}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-xl mx-auto py-10">
      <h1 className="text-2xl font-semibold mb-2">Number Onboarding</h1>
      <p className="text-muted-foreground mb-6">
        Enter your business number. We'll connect calls & texts to TradeLine 24/7.
      </p>

      {msg && (
        <Alert variant={msg.ok ? "default" : "destructive"} className="mb-4">
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleAttach} className="space-y-4">
        <div>
          <Label htmlFor="number">Your Number (E.164)</Label>
          <Input
            id="number"
            name="number"
            required
            placeholder="+1 587-742-8885"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            disabled={loading}
            className="font-mono"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading || !number}>
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Attaching…
            </>
          ) : (
            "Attach Number"
          )}
        </Button>
      </form>
    </div>
  );
}
