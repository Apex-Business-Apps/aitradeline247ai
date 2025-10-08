import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Settings, Zap, Clock, MessageSquare, Shield, ChevronRight, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  const [presets, setPresets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [panicMode, setPanicMode] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
    loadPresets();
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
        system_prompt: '',
        amd_enable: true,
        ringback_tone: 'default',
        max_ring_reroutes: 3,
        fail_open: false,
        business_name: 'Apex Business Systems',
        human_number_e164: '+14319900222',
        active_preset_id: null
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

  const loadPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('voice_presets')
        .select('*')
        .order('id');

      if (error) throw error;
      setPresets(data || []);
    } catch (error: any) {
      console.error('Failed to load presets:', error);
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

  const applyPreset = async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    // Resolve tokens in the prompt
    const resolvedPrompt = resolveTokens(preset.system_prompt);

    await saveConfig({ 
      system_prompt: resolvedPrompt,
      active_preset_id: presetId,
      llm_max_reply_seconds: preset.max_reply_seconds,
      llm_speaking_rate: preset.speaking_rate,
      llm_voice: preset.voice
    });

    toast({
      title: "Preset Applied",
      description: `${preset.label} preset is now active`,
    });
  };

  const resolveTokens = (text: string) => {
    return text
      .replace(/\{BusinessName\}/g, config?.business_name || 'Apex Business Systems')
      .replace(/\{HumanNumberE164\}/g, config?.human_number_e164 || '+14319900222');
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
          {/* Tokens Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preset Tokens
              </CardTitle>
              <CardDescription>
                These tokens are replaced in all preset prompts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input
                  value={config?.business_name || ''}
                  onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
                  onBlur={() => saveConfig({ business_name: config?.business_name })}
                  placeholder="Apex Business Systems"
                />
                <p className="text-xs text-muted-foreground">Token: {'{BusinessName}'}</p>
              </div>

              <div className="space-y-2">
                <Label>Human Number (E.164)</Label>
                <Input
                  value={config?.human_number_e164 || ''}
                  onChange={(e) => setConfig({ ...config, human_number_e164: e.target.value })}
                  onBlur={() => saveConfig({ human_number_e164: config?.human_number_e164 })}
                  placeholder="+14319900222"
                />
                <p className="text-xs text-muted-foreground">Token: {'{HumanNumberE164}'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Presets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Prompt Presets
              </CardTitle>
              <CardDescription>
                One-click configurations with token replacement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {presets.map((preset) => {
                const isActive = config?.active_preset_id === preset.id;
                const resolvedPrompt = resolveTokens(preset.system_prompt);
                
                return (
                  <Card key={preset.id} className={isActive ? "border-primary" : ""}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{preset.label}</CardTitle>
                          {isActive && (
                            <Badge variant="default" className="gap-1">
                              <Check className="w-3 h-3" />
                              Active
                            </Badge>
                          )}
                        </div>
                        <Button
                          size="sm"
                          onClick={() => applyPreset(preset.id)}
                          disabled={saving || isActive}
                        >
                          {isActive ? "Applied" : "Apply"}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        <strong>Preview (with tokens resolved):</strong>
                      </div>
                      <div className="text-xs bg-muted p-3 rounded-md font-mono whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {resolvedPrompt.substring(0, 300)}
                        {resolvedPrompt.length > 300 && '...'}
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                        <span>Voice: {preset.voice}</span>
                        <span>Rate: {preset.speaking_rate}x</span>
                        <span>Max: {preset.max_reply_seconds}s</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </CardContent>
          </Card>

          {/* Global Rules */}
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Global Rules (applied to all presets):</strong>
              <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                <li>Stop recording if caller declines consent; continue with minimal notes</li>
                <li>Silence ≥6s: brief nudge once; on second silence, bridge to human</li>
                <li>Low confidence on ≥2 fields → offer transfer</li>
                <li>Email transcript with subject: [Call Transcript] CallerID YYYY-MM-DD HH:mm TZ</li>
              </ul>
            </AlertDescription>
          </Alert>
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