import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Lock, Shield, CheckCircle2, XCircle, Search } from "lucide-react";
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

interface Gate1Result {
  gate_status: string;
  timestamp: string;
  env: string;
  checks: {
    key_in_app_config: {
      pass: boolean;
      count: number;
      version?: number;
      error?: string;
    };
    accessor_function: {
      service_role_access: boolean;
      key_present: boolean;
      error?: string;
    };
    audit_trail: {
      entries_found: number;
      latest_entries?: Array<{
        action: string;
        user_role: string;
        version: number;
        masked_fp: string;
        env: string;
        timestamp: string;
      }>;
      error?: string;
    };
  };
}

export default function CryptoInit() {
  const [passphrase, setPassphrase] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ProvisionResult[]>([]);
  const [gate1Result, setGate1Result] = useState<Gate1Result | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

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

  const handleVerifyGate1 = async () => {
    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('ops-verify-gate1', {
        body: { passphrase }
      });

      if (error) throw error;

      setGate1Result(data);
      
      if (data.gate_status === "PASS") {
        toast.success("Gate-1 checks PASSED");
      } else {
        toast.error("Gate-1 checks FAILED");
      }
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to verify');
    } finally {
      setIsVerifying(false);
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Gate-1 Verification
                </CardTitle>
                <CardDescription>
                  Run comprehensive checks: key presence, accessor permissions, audit trail
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleVerifyGate1}
                  disabled={isVerifying}
                  variant="outline"
                  className="w-full"
                >
                  {isVerifying ? "Verifying..." : "Run Gate-1 Checks"}
                </Button>

                {gate1Result && (
                  <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {gate1Result.gate_status === "PASS" ? (
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        ) : (
                          <XCircle className="h-6 w-6 text-red-500" />
                        )}
                        <div>
                          <span className="font-bold text-lg">Gate-1 Status: </span>
                          <Badge variant={gate1Result.gate_status === "PASS" ? "default" : "destructive"}>
                            {gate1Result.gate_status}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard(JSON.stringify(gate1Result, null, 2))}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="border-l-4 border-l-primary pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          {gate1Result.checks.key_in_app_config.pass ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-semibold">Key in app_config</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Count: {gate1Result.checks.key_in_app_config.count}</div>
                          {gate1Result.checks.key_in_app_config.version && (
                            <div>Version: {gate1Result.checks.key_in_app_config.version}</div>
                          )}
                          {gate1Result.checks.key_in_app_config.error && (
                            <div className="text-red-500">Error: {gate1Result.checks.key_in_app_config.error}</div>
                          )}
                        </div>
                      </div>

                      <div className="border-l-4 border-l-primary pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          {gate1Result.checks.accessor_function.service_role_access ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-semibold">Accessor Function</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Service Role Access: {gate1Result.checks.accessor_function.service_role_access ? "✓" : "✗"}</div>
                          <div>Key Present: {gate1Result.checks.accessor_function.key_present ? "✓" : "✗"}</div>
                          {gate1Result.checks.accessor_function.error && (
                            <div className="text-red-500">Error: {gate1Result.checks.accessor_function.error}</div>
                          )}
                        </div>
                      </div>

                      <div className="border-l-4 border-l-primary pl-3">
                        <div className="flex items-center gap-2 mb-1">
                          {gate1Result.checks.audit_trail.entries_found > 0 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="font-semibold">Audit Trail</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <div>Entries Found: {gate1Result.checks.audit_trail.entries_found}</div>
                          {gate1Result.checks.audit_trail.latest_entries && gate1Result.checks.audit_trail.latest_entries.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {gate1Result.checks.audit_trail.latest_entries.map((entry, idx) => (
                                <div key={idx} className="bg-muted p-2 rounded text-xs">
                                  <div><span className="font-semibold">Action:</span> {entry.action}</div>
                                  <div><span className="font-semibold">Masked FP:</span> {entry.masked_fp}</div>
                                  <div><span className="font-semibold">Version:</span> {entry.version}</div>
                                  <div><span className="font-semibold">Env:</span> {entry.env}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Timestamp: {new Date(gate1Result.timestamp).toLocaleString()} | Env: {gate1Result.env}
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
