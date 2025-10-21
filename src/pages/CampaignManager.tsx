import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Users, Send, Bell, FileDown, CheckCircle, ShieldAlert } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';

const CAMPAIGN_ID = 'c0000000-0000-0000-0000-000000000001';

export default function CampaignManager() {
  const navigate = useNavigate();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});

  // Security: Check admin access
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-4xl flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Show access denied for non-admins
  if (!isAdmin()) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            <strong>Access Denied:</strong> This page requires administrator privileges. 
            Campaign management operations can only be performed by admins due to security requirements.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const executeStep = async (step: string, functionName: string, payload: any) => {
    setLoading(step);
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: payload
      });

      if (error) throw error;

      setResults(prev => ({ ...prev, [step]: data }));
      toast({
        title: `✅ ${step} Complete`,
        description: JSON.stringify(data, null, 2).substring(0, 200),
      });
    } catch (error: any) {
      toast({
        title: `❌ ${step} Failed`,
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(null);
    }
  };

  const step1_ImportLeads = async () => {
    // Read the CSV file
    const csvContent = await fetch('/warm_contacts_outreach.csv').then(r => r.text());
    
    await executeStep('Import Leads', 'ops-leads-import', {
      csv_content: csvContent,
      list_name: 'Warm Leads — Imported'
    });
  };

  const step2_CreateSegment = async () => {
    await executeStep('Create Segment', 'ops-segment-warm50', {
      campaign_id: CAMPAIGN_ID,
      segment_size: 50,
      seed_emails: ['test@tradeline247.com']
    });
  };

  const step3_SendEmails = async () => {
    await executeStep('Send Emails', 'ops-send-warm50', {
      campaign_id: CAMPAIGN_ID,
      max_sends: 50,
      throttle_per_minute: 30
    });
  };

  const step4_EnableFollowups = async () => {
    await executeStep('Enable Follow-ups', 'ops-followups-enable', {
      campaign_id: CAMPAIGN_ID,
      day3_enabled: true,
      day7_enabled: true
    });
  };

  const step5_GenerateReport = async () => {
    await executeStep('Generate Report', 'ops-report-export', {
      campaign_id: CAMPAIGN_ID
    });
  };

  const executeAll = async () => {
    await step1_ImportLeads();
    await step2_CreateSegment();
    await step3_SendEmails();
    await step4_EnableFollowups();
    await step5_GenerateReport();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🚀 Campaign Manager</h1>
        <p className="text-muted-foreground">Relaunch — Canada Campaign Workflow</p>
      </div>

      <Alert className="mb-6">
        <AlertDescription>
          <strong>Campaign ID:</strong> {CAMPAIGN_ID}<br />
          <strong>Status:</strong> Ready to execute
        </AlertDescription>
      </Alert>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quick Execute</CardTitle>
          <CardDescription>Run all steps in sequence automatically</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={executeAll} 
            disabled={loading !== null}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running: {loading}...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Execute Complete Workflow
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Step 1: Import Leads
            </CardTitle>
            <CardDescription>Import CSV and create "Warm Leads — Imported" list</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={step1_ImportLeads} 
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === 'Import Leads' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Importing...</>
              ) : (
                'Import Leads'
              )}
            </Button>
            {results['Import Leads'] && (
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(results['Import Leads'], null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Step 2: Create Segment
            </CardTitle>
            <CardDescription>Create Warm-50 segment with first 50 contacts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={step2_CreateSegment} 
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === 'Create Segment' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
              ) : (
                'Create Segment'
              )}
            </Button>
            {results['Create Segment'] && (
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(results['Create Segment'], null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Step 3: Send Emails
            </CardTitle>
            <CardDescription>Send 50 emails with throttling (≤30/min)</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={step3_SendEmails} 
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === 'Send Emails' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : (
                'Send Emails'
              )}
            </Button>
            {results['Send Emails'] && (
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(results['Send Emails'], null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Step 4: Enable Follow-ups
            </CardTitle>
            <CardDescription>Schedule Day 3 & 7 follow-ups at 09:15 Vancouver time</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={step4_EnableFollowups} 
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === 'Enable Follow-ups' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enabling...</>
              ) : (
                'Enable Follow-ups'
              )}
            </Button>
            {results['Enable Follow-ups'] && (
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(results['Enable Follow-ups'], null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Step 5: Generate Report
            </CardTitle>
            <CardDescription>Export summary and CSV</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={step5_GenerateReport} 
              disabled={loading !== null}
              variant="outline"
              className="w-full"
            >
              {loading === 'Generate Report' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
              ) : (
                'Generate Report'
              )}
            </Button>
            {results['Generate Report'] && (
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                {JSON.stringify(results['Generate Report'], null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

