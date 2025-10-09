import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Phone, CheckCircle2 } from "lucide-react";
import { z } from "zod";

const phoneSchema = z.object({
  number_e164: z.string()
    .trim()
    .regex(/^\+[1-9]\d{1,14}$/, "Must be valid E.164 format (e.g., +15551234567)")
});

export default function NumberOnboard() {
  const [numberE164, setNumberE164] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate input
    const validation = phoneSchema.safeParse({ number_e164: numberE164 });
    if (!validation.success) {
      toast({
        title: "Invalid Number",
        description: validation.error.errors[0].message,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const { data, error } = await supabase.functions.invoke('ops-twilio-attach-number', {
        body: { number_e164: numberE164 }
      });

      if (error) throw error;

      if (data?.ok && data?.sid) {
        setSuccess(true);
        toast({
          title: "✅ Connected",
          description: `Number ${numberE164} successfully attached (SID: ${data.sid})`
        });
      } else {
        throw new Error("Failed to attach number");
      }
    } catch (error: any) {
      console.error("Attach number error:", error);
      toast({
        title: "Attachment Failed",
        description: error.message || "Could not attach number to Twilio",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/ops')}
          className="mb-6"
        >
          ← Back to Ops
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Attach Existing Twilio Number
            </CardTitle>
            <CardDescription>
              Connect your existing Twilio phone number to TradeLine 24/7 webhooks
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                <h3 className="text-xl font-semibold mb-2">✅ Connected</h3>
                <p className="text-muted-foreground mb-6">
                  Your number is now configured with TradeLine 24/7 webhooks
                </p>
                <div className="space-y-2 text-sm text-left bg-muted p-4 rounded-lg w-full">
                  <p className="font-medium">Configured URLs:</p>
                  <p className="text-xs opacity-80">• Voice: /voice-answer</p>
                  <p className="text-xs opacity-80">• Voice Status: /voice-status</p>
                  <p className="text-xs opacity-80">• SMS: /webcomms-sms-reply</p>
                  <p className="text-xs opacity-80">• SMS Status: /webcomms-sms-status</p>
                </div>
                <Button 
                  onClick={() => {
                    setSuccess(false);
                    setNumberE164("");
                  }}
                  variant="outline"
                  className="mt-6"
                >
                  Attach Another Number
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="number">Your Number (E.164)</Label>
                  <Input
                    id="number"
                    type="text"
                    placeholder="+15551234567"
                    value={numberE164}
                    onChange={(e) => setNumberE164(e.target.value)}
                    required
                    disabled={loading}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter your existing Twilio number in E.164 format (e.g., +15551234567)
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">What this does:</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Updates your Twilio number configuration</li>
                    <li>• Sets Voice URL to handle incoming calls</li>
                    <li>• Sets SMS URL to handle text messages</li>
                    <li>• Enables status callbacks for tracking</li>
                  </ul>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !numberE164}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Attaching...
                    </>
                  ) : (
                    "Attach Number"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
