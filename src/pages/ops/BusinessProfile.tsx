import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Clock, MessageSquare, Users, AlertCircle } from "lucide-react";

export default function BusinessProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setProfile(data || {
        business_name: '',
        industry: '',
        timezone: 'America/Edmonton',
        service_area: '',
        hours: { monday: '9AM-5PM', tuesday: '9AM-5PM', wednesday: '9AM-5PM', thursday: '9AM-5PM', friday: '9AM-5PM' },
        booking_rules: { min_notice_hours: 24, max_advance_days: 30 },
        brand_voice: {
          formality: 'professional',
          tone: 'friendly',
          tempo: 'moderate',
          dont_say: ['maybe', 'I think', 'possibly'],
          do_say: ['absolutely', 'I\'ll help you with that', 'let me check']
        },
        faq: [],
        escalation: { urgent_keywords: ['emergency', 'urgent', 'asap'], transfer_number: '' },
        compliance: { consent_script_version: 'v1' }
      });
    } catch (error: any) {
      toast({
        title: "Failed to load profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('business_profiles')
        .upsert(profile);

      if (error) throw error;

      toast({
        title: "Profile Saved",
        description: "Business profile updated successfully"
      });
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container max-w-6xl py-8">Loading...</div>;
  }

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Business Profile</h1>
          <p className="text-muted-foreground mt-2">
            Configure your business details for AI voice assistant
          </p>
        </div>
        
        <Button onClick={saveProfile} disabled={saving} size="lg">
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>

      <Tabs defaultValue="basics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basics">Basics</TabsTrigger>
          <TabsTrigger value="voice">Brand Voice</TabsTrigger>
          <TabsTrigger value="booking">Booking</TabsTrigger>
          <TabsTrigger value="escalation">Escalation</TabsTrigger>
        </TabsList>

        <TabsContent value="basics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Business Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  <Input
                    value={profile?.business_name || ''}
                    onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                    placeholder="Apex Business Systems"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Industry</Label>
                  <Input
                    value={profile?.industry || ''}
                    onChange={(e) => setProfile({ ...profile, industry: e.target.value })}
                    placeholder="Professional Services"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={profile?.timezone}
                    onValueChange={(value) => setProfile({ ...profile, timezone: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Edmonton">Mountain Time (Edmonton)</SelectItem>
                      <SelectItem value="America/Toronto">Eastern Time (Toronto)</SelectItem>
                      <SelectItem value="America/Vancouver">Pacific Time (Vancouver)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Service Area</Label>
                  <Input
                    value={profile?.service_area || ''}
                    onChange={(e) => setProfile({ ...profile, service_area: e.target.value })}
                    placeholder="Greater Edmonton Area"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Business Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(profile?.hours || {}, null, 2)}
                onChange={(e) => {
                  try {
                    setProfile({ ...profile, hours: JSON.parse(e.target.value) });
                  } catch {}
                }}
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Brand Voice & Tone
              </CardTitle>
              <CardDescription>
                Configure how the AI represents your brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Formality</Label>
                  <Select
                    value={profile?.brand_voice?.formality}
                    onValueChange={(value) => setProfile({ 
                      ...profile, 
                      brand_voice: { ...profile.brand_voice, formality: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Tone</Label>
                  <Select
                    value={profile?.brand_voice?.tone}
                    onValueChange={(value) => setProfile({ 
                      ...profile, 
                      brand_voice: { ...profile.brand_voice, tone: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="neutral">Neutral</SelectItem>
                      <SelectItem value="authoritative">Authoritative</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Speaking Tempo</Label>
                  <Select
                    value={profile?.brand_voice?.tempo}
                    onValueChange={(value) => setProfile({ 
                      ...profile, 
                      brand_voice: { ...profile.brand_voice, tempo: value }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="slow">Slow & Deliberate</SelectItem>
                      <SelectItem value="moderate">Moderate</SelectItem>
                      <SelectItem value="fast">Fast & Energetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Phrases to AVOID (comma-separated)</Label>
                <Input
                  value={profile?.brand_voice?.dont_say?.join(', ') || ''}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    brand_voice: { 
                      ...profile.brand_voice, 
                      dont_say: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="maybe, I think, possibly"
                />
              </div>

              <div className="space-y-2">
                <Label>Phrases to USE (comma-separated)</Label>
                <Input
                  value={profile?.brand_voice?.do_say?.join(', ') || ''}
                  onChange={(e) => setProfile({ 
                    ...profile, 
                    brand_voice: { 
                      ...profile.brand_voice, 
                      do_say: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                    }
                  })}
                  placeholder="absolutely, I'll help you with that, let me check"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="booking" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(profile?.booking_rules || {}, null, 2)}
                onChange={(e) => {
                  try {
                    setProfile({ ...profile, booking_rules: JSON.parse(e.target.value) });
                  } catch {}
                }}
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="escalation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Escalation Rules
              </CardTitle>
              <CardDescription>
                When to transfer calls to a human
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={JSON.stringify(profile?.escalation || {}, null, 2)}
                onChange={(e) => {
                  try {
                    setProfile({ ...profile, escalation: JSON.parse(e.target.value) });
                  } catch {}
                }}
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
