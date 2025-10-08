import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, UserPlus, Building2, CreditCard, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Activation() {
  const [loading, setLoading] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activationDetails, setActivationDetails] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleActivation = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Not authenticated");

      // Call activation function
      const { data, error } = await supabase.functions.invoke('ops-activate-account', {
        body: {
          userId: user.id,
          organizationName: "Apex Business Systems",
          plan: "enterprise",
          role: "admin"
        }
      });

      if (error) throw error;

      setActivationDetails(data);
      setActivated(true);
      
      toast({
        title: "Account Activated",
        description: `Successfully activated account for ${data.organization.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Activation Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Account Activation</h1>
          <p className="text-muted-foreground mt-2">
            Activate your TradeLine 24/7 account with organization setup
          </p>
        </div>

        {!activated ? (
          <Card>
            <CardHeader>
              <CardTitle>Activate My Account</CardTitle>
              <CardDescription>
                This will create your organization, assign your role, and activate your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Organization Setup</p>
                    <p className="text-sm text-muted-foreground">
                      Create "Apex Business Systems" organization
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Admin Role Assignment</p>
                    <p className="text-sm text-muted-foreground">
                      Grant full administrative privileges
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Enterprise Plan</p>
                    <p className="text-sm text-muted-foreground">
                      Activate enterprise features and limits
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <UserPlus className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">User Status</p>
                    <p className="text-sm text-muted-foreground">
                      Set account status to active
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleActivation}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? "Activating..." : "Activate My Account"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <div className="space-y-3">
                <p className="font-semibold text-green-900 dark:text-green-100">
                  Account Successfully Activated
                </p>
                <div className="grid gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Organization:</span>
                    <span className="font-medium">{activationDetails?.organization?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plan:</span>
                    <span className="font-medium capitalize">{activationDetails?.user?.plan}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Role:</span>
                    <span className="font-medium capitalize">{activationDetails?.user?.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Activated:</span>
                    <span className="font-medium">
                      {new Date(activationDetails?.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={() => navigate('/dashboard')}>
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/ops/voice')}>
                    Configure Voice Settings
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}