import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const WEBHOOK_URLS = {
  voiceUrl: "https://api.tradeline247ai.com/functions/v1/voice-answer",
  voiceStatus: "https://api.tradeline247ai.com/functions/v1/voice-status",
  smsUrl: "https://api.tradeline247ai.com/functions/v1/webcomms-sms-reply",
  smsStatus: "https://api.tradeline247ai.com/functions/v1/webcomms-sms-status"
};

export default function NumberOnboard() {
  const { user } = useAuth();
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [connectedData, setConnectedData] = useState<{ number: string; sid: string } | null>(null);

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
      console.log("🔄 Attaching number:", e164);
      
      const { data, error } = await supabase.functions.invoke("ops-twilio-attach-number", {
        body: { number_e164: e164 }
      });

      console.log("📥 Response:", { data, error });

      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Attach failed");

      setConnectedData({ number: e164, sid: data.phone_sid });
      setMsg({ ok: true, text: `✅ Connected: ${e164} (SID ${data.phone_sid})` });
      setNumber("");
      
      console.log("✅ Successfully attached number");
    } catch (err: any) {
      console.error("❌ Attach error:", err);
      setMsg({ ok: false, text: err.message || String(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-xl mx-auto py-10">
      {user && (
        <Link 
          to="/dashboard" 
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      )}
      
      <h1 className="text-2xl font-semibold mb-2">Number Onboarding</h1>
      <p className="text-muted-foreground mb-6">
        Enter your business number. We'll connect calls & texts to TradeLine 24/7.
      </p>

      {msg && !connectedData && (
        <Alert variant={msg.ok ? "default" : "destructive"} className="mb-4">
          <AlertDescription>{msg.text}</AlertDescription>
        </Alert>
      )}

      {connectedData && (
        <Card className="mb-6 border-green-500/50 bg-green-50/50 dark:bg-green-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              Connected Successfully
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Number</Label>
              <p className="font-mono text-sm font-semibold">{connectedData.number}</p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">PhoneNumber SID</Label>
              <p className="font-mono text-sm font-semibold">{connectedData.sid}</p>
            </div>
            <div className="pt-2 border-t">
              <Label className="text-xs text-muted-foreground mb-2 block">Webhooks updated.</Label>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Voice URL (POST):</span>
                  <p className="font-mono text-[10px] break-all">{WEBHOOK_URLS.voiceUrl}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Voice Status (POST):</span>
                  <p className="font-mono text-[10px] break-all">{WEBHOOK_URLS.voiceStatus}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SMS URL (POST):</span>
                  <p className="font-mono text-[10px] break-all">{WEBHOOK_URLS.smsUrl}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">SMS Status (POST):</span>
                  <p className="font-mono text-[10px] break-all">{WEBHOOK_URLS.smsStatus}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleAttach} className="space-y-4">
        <div>
          <Label htmlFor="number">Client Number (E.164)</Label>
          <Input
            id="number"
            name="number"
            required
            placeholder="+1587XXXXXXX"
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
