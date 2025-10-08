import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Settings, Zap, Clock, MessageSquare, Shield, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const SYSTEM_PROMPTS = {
  "after_hours": "You are a professional after-hours answering service. Be courteous, take detailed messages, and assure callers their message will be delivered first thing in the morning.",
  "overflow": "You are handling overflow calls during busy periods. Be efficient, capture key information, and either schedule a callback or route to the next available representative.",
  "commercial": "You are a business receptionist for a commercial service company. Be professional, technical when needed, and focus on qualifying leads and scheduling appointments.",
  "residential": "You are a friendly customer service representative for residential services. Be warm, patient, and focus on understanding the customer's needs and booking appointments."
};

const VOICES = [
  { value: "alloy", label: "Alloy (Neutral)" },
  { value: "echo", label: "Echo (Male)" },
  { value: "fable", label: "Fable (British Male)" },
  { value: "onyx", label: "Onyx (Deep Male)" },
  { value: "nova", label: "Nova (Female)" },
  { value: "shimmer", label: "Shimmer (Warm Female)" },
];

export default function VoiceSettings() {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [panicMode, setPanicMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      setConfig(data || {
        pickup_mode: 'immediate',
        rings_before_pickup: 2,
        llm_enabled: true,
        llm_voice: 'alloy',
        llm_speaking_rate: 1.0,
        llm_max_reply_seconds: 15,
        system_prompt: SYSTEM_PROMPTS.commercial,
        amd_enable: true,
        ringback_tone: 'default',
        max_ring_reroutes: 3,
        fail_open: false
      });
      
      setPanicMode(data?.pickup_mode === 'never' && !data?.llm_enabled);
    } catch (error: any) {
      toast({
        title: "Failed to load config",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (updates: any) => {
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('ops-voice-config-update', {
        body: { ...config, ...updates }
      });

      if (error) throw error;

      setConfig({ ...config, ...updates });
      
      toast({
        title: "Settings Saved",
        description: "Voice configuration updated successfully"
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

  const handlePanicMode = async () => {
    const newPanicState = !panicMode;
    setPanicMode(newPanicState);
    
    await saveConfig({
      pickup_mode: 'never',
      llm_enabled: false
    });

    toast({
      title: newPanicState ? "🚨 Panic Mode Activated" : "Panic Mode Deactivated",
      description: newPanicState 
        ? "All calls will be bridged directly. No LLM processing."
        : "Voice AI settings restored",
      variant: newPanicState ? "destructive" : "default"
    });
  };

  const applyPreset = (preset: keyof typeof SYSTEM_PROMPTS) => {
    saveConfig({ system_prompt: SYSTEM_PROMPTS[preset] });
  };

  if (loading) {
    return <div className="container max-w-6xl py-8">Loading...</div>;
  }

  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voice Settings</h1>
          <p className="text-muted-foreground mt-2">
            Configure AI voice assistant and call handling
          </p>
        </div>
        
        <Button
          variant={panicMode ? "default" : "destructive"}
          size="lg"
          onClick={handlePanicMode}
          className="gap-2"
        >
          <AlertTriangle className="w-5 h-5" />
          {panicMode ? "Exit Panic Mode" : "🚨 Panic: Bridge All Calls"}
        </Button>
      </div>

      {panicMode && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Panic Mode Active:</strong> All calls are being bridged directly to {config?.ring_target || '+14319900222'}. 
            LLM processing is disabled.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Settings</TabsTrigger>
          <TabsTrigger value="presets">Quick Presets</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          {/* Pickup Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pickup Mode
              </CardTitle>
              <CardDescription>
                When should the AI answer incoming calls?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <Select
                  value={config?.pickup_mode}
                  onValueChange={(value) => saveConfig({ pickup_mode: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="immediate">Immediate (AI answers right away)</SelectItem>
                    <SelectItem value="after_rings">After N Rings (try human first)</SelectItem>
                    <SelectItem value="never">Never (bridge only)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {config?.pickup_mode === 'after_rings' && (
                <div className="space-y-2">
                  <Label>Rings Before Pickup: {config?.rings_before_pickup}</Label>
                  <Slider
                    value={[config?.rings_before_pickup || 2]}
                    onValueChange={([value]) => saveConfig({ rings_before_pickup: value })}
                    min={1}
                    max={6}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    ~{(config?.rings_before_pickup || 2) * 5} seconds
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice & Speech */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Voice & Speech
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable LLM Voice</Label>
                <Switch
                  checked={config?.llm_enabled}
                  onCheckedChange={(checked) => saveConfig({ llm_enabled: checked })}
                />
              </div>

              {config?.llm_enabled && (
                <>
                  <div className="space-y-2">
                    <Label>Voice</Label>
                    <Select
                      value={config?.llm_voice}
                      onValueChange={(value) => saveConfig({ llm_voice: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VOICES.map(voice => (
                          <SelectItem key={voice.value} value={voice.value}>
                            {voice.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Speaking Rate: {config?.llm_speaking_rate?.toFixed(1)}x</Label>
                    <Slider
                      value={[config?.llm_speaking_rate || 1.0]}
                      onValueChange={([value]) => saveConfig({ llm_speaking_rate: value })}
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Max Reply Length: {config?.llm_max_reply_seconds}s</Label>
                    <Slider
                      value={[config?.llm_max_reply_seconds || 15]}
                      onValueChange={([value]) => saveConfig({ llm_max_reply_seconds: value })}
                      min={5}
                      max={30}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* System Prompt */}
          <Card>
            <CardHeader>
              <CardTitle>System Prompt</CardTitle>
              <CardDescription>
                Instructions for how the AI should behave
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={config?.system_prompt || ''}
                onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                onBlur={() => saveConfig({ system_prompt: config?.system_prompt })}
                rows={6}
                className="font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Quick Presets
              </CardTitle>
              <CardDescription>
                One-click system prompt configurations for common scenarios
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {Object.entries(SYSTEM_PROMPTS).map(([key, prompt]) => (
                <Button
                  key={key}
                  variant="outline"
                  className="justify-start h-auto py-4"
                  onClick={() => applyPreset(key as keyof typeof SYSTEM_PROMPTS)}
                >
                  <div className="text-left">
                    <div className="font-semibold capitalize">{key.replace('_', ' ')}</div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {prompt}
                    </div>
                  </div>
                </Button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Advanced Settings:</strong> These options affect low-level call handling behavior. 
              Only modify if you understand the implications.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>AMD & Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Enable AMD (Answering Machine Detection)</Label>
                  <p className="text-xs text-muted-foreground">Detect voicemail and skip</p>
                </div>
                <Switch
                  checked={config?.amd_enable}
                  onCheckedChange={(checked) => saveConfig({ amd_enable: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ring Behavior</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ring Target (E.164)</Label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  value={config?.ring_target || ''}
                  onChange={(e) => setConfig({ ...config, ring_target: e.target.value })}
                  onBlur={() => saveConfig({ ring_target: config?.ring_target })}
                  placeholder="+14319900222"
                />
              </div>

              <div className="space-y-2">
                <Label>Max Ring Reroutes: {config?.max_ring_reroutes}</Label>
                <Slider
                  value={[config?.max_ring_reroutes || 3]}
                  onValueChange={([value]) => saveConfig({ max_ring_reroutes: value })}
                  min={1}
                  max={10}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label>Ringback Tone</Label>
                <Select
                  value={config?.ringback_tone}
                  onValueChange={(value) => saveConfig({ ringback_tone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="us">US Standard</SelectItem>
                    <SelectItem value="uk">UK Standard</SelectItem>
                    <SelectItem value="silence">Silence</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Failure Handling</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Fail Open</Label>
                  <p className="text-xs text-muted-foreground">
                    If AI fails, connect the call anyway
                  </p>
                </div>
                <Switch
                  checked={config?.fail_open}
                  onCheckedChange={(checked) => saveConfig({ fail_open: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}