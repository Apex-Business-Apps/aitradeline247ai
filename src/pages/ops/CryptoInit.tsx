import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Lock, Shield, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

interface ProvisionResult {
  success: boolean;
  action: string;
  timestamp: string;
  result: {
    status: string;
    env: string;
    fp: string;
    action?: string;
    version?: number;
  };
}

export default function CryptoInit() {
  const [passphrase, setPassphrase] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ProvisionResult[]>([]);

  const handleUnlock = () => {
    if (!passphrase.trim()) {
      toast.error("Please enter a passphrase");
      return;
    }
    setIsUnlocked(true);
    toast.success("Interface unlocked");
  };

  const handleProvision = async (action: "provision" | "idempotency-check") => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ops-init-encryption-key', {
        body: { passphrase, action }
      });

      if (error) throw error;

      const newResult: ProvisionResult = data;
      setResults(prev => [newResult, ...prev].slice(0, 2));
      
      toast.success(`${action === "provision" ? "Provisioned" : "Verified"} successfully`);
    } catch (error) {
      console.error('Provision error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to provision key');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Encryption Key Initialization</h1>
            <p className="text-muted-foreground">Internal operations tool for key provisioning</p>
          </div>
        </div>

        {!isUnlocked ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Authentication Required
              </CardTitle>
              <CardDescription>
                Enter the OPS_INIT_PASSPHRASE to access key provisioning controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Enter passphrase"
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              />
              <Button onClick={handleUnlock} className="w-full">
                Unlock Interface
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Provision Encryption Key</CardTitle>
                <CardDescription>
                  Server-side provisioning using SUPABASE_SERVICE_ROLE_KEY and STAGING_ENC_KEY_B64
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    All operations use server-side edge functions. Service role key never exposed to client.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleProvision("provision")}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Processing..." : "Provision Key (Staging)"}
                  </Button>
                  <Button
                    onClick={() => handleProvision("idempotency-check")}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    Re-run (Idempotency Check)
                  </Button>
                </div>
              </CardContent>
            </Card>

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Evidence Panel</CardTitle>
                  <CardDescription>Last 2 responses (for copy/paste)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {results.map((result, idx) => (
                    <div key={idx} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.result.status === "ok" || result.result.status === "noop" ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="font-semibold">
                            {result.action} - {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="bg-muted p-3 rounded font-mono text-sm space-y-1">
                        <div>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          <span className="font-semibold">{result.result.status}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Environment:</span>{" "}
                          <span>{result.result.env}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Masked Fingerprint:</span>{" "}
                          <span className="font-semibold">{result.result.fp}</span>
                        </div>
                        {result.result.action && (
                          <div>
                            <span className="text-muted-foreground">Action:</span>{" "}
                            <span>{result.result.action}</span>
                          </div>
                        )}
                        {result.result.version && (
                          <div>
                            <span className="text-muted-foreground">Version:</span>{" "}
                            <span>{result.result.version}</span>
                          </div>
                        )}
                      </div>

                      <details className="text-sm">
                        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                          Full JSON Response
                        </summary>
                        <pre className="mt-2 bg-muted p-3 rounded overflow-auto text-xs">
                          {JSON.stringify(result, null, 2)}
                        </pre>
                      </details>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}
