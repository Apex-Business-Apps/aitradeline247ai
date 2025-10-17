import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Phone, Clock, User, MessageSquare, Download, Search, Filter, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import QuickActions from "@/components/calls/QuickActions";

export default function CallLogs() {
  const [calls, setCalls] = useState<any[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<any[]>([]);
  const [selectedCall, setSelectedCall] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const { toast } = useToast();

  const loadCalls = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setCalls(data || []);
    } catch (error: any) {
      toast({
        title: "Failed to load calls",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCalls();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('call_logs_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'call_logs'
      }, () => {
        loadCalls();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadCalls]);

  useEffect(() => {
    let filtered = [...calls];

    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.from_e164.includes(searchTerm) ||
        call.to_e164.includes(searchTerm) ||
        call.call_sid.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(call => call.status === statusFilter);
    }

    if (modeFilter !== 'all') {
      filtered = filtered.filter(call => call.mode === modeFilter);
    }

    setFilteredCalls(filtered);
  }, [calls, searchTerm, statusFilter, modeFilter]);

  const exportCalls = () => {
    const csv = [
      ['Call SID', 'From', 'To', 'Started', 'Duration', 'Status', 'Mode'].join(','),
      ...filteredCalls.map(call => [
        call.call_sid,
        call.from_e164,
        call.to_e164,
        new Date(call.started_at).toISOString(),
        call.duration_sec || '0',
        call.status,
        call.mode || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `call-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'busy': return 'bg-yellow-500';
      case 'no-answer': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div className="container max-w-7xl py-8">Loading...</div>;
  }

  return (
    <div className="container max-w-7xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Call Logs</h1>
          <p className="text-muted-foreground mt-2">
            View and manage all incoming call records
          </p>
        </div>
        <Button onClick={exportCalls} variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by number or SID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="busy">Busy</SelectItem>
                <SelectItem value="no-answer">No Answer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modeFilter} onValueChange={setModeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="llm">LLM</SelectItem>
                <SelectItem value="bridge">Bridge</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Call List */}
      <div className="grid gap-4">
        {filteredCalls.map((call) => (
          <Card
            key={call.id}
            className="cursor-pointer hover:bg-accent/50 transition-colors"
            onClick={() => setSelectedCall(call)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className={`w-2 h-12 rounded ${getStatusColor(call.status)}`} />
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="font-mono font-medium">{call.from_e164}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="font-mono">{call.to_e164}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(call.started_at), { addSuffix: true })}
                      </span>
                      {call.duration_sec && (
                        <span>{Math.floor(call.duration_sec / 60)}m {call.duration_sec % 60}s</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {call.mode && (
                    <Badge variant="outline">
                      {call.mode === 'llm' ? '🤖 LLM' : '📞 Bridge'}
                    </Badge>
                  )}
                  {call.handoff && (
                    <Badge variant="outline" className="bg-orange-50">
                      Handoff
                    </Badge>
                  )}
                  <Badge variant="secondary">{call.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredCalls.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No calls found matching your filters
            </CardContent>
          </Card>
        )}
      </div>

      {/* Call Details Drawer */}
      <Sheet open={!!selectedCall} onOpenChange={() => setSelectedCall(null)}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          {selectedCall && (
            <>
              <SheetHeader>
                <SheetTitle>Call Details</SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Call Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Call Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Call SID:</span>
                      <span className="font-mono text-xs">{selectedCall.call_sid}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">From:</span>
                      <span className="font-mono">{selectedCall.from_e164}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">To:</span>
                      <span className="font-mono">{selectedCall.to_e164}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="secondary">{selectedCall.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Duration:</span>
                      <span>
                        {selectedCall.duration_sec
                          ? `${Math.floor(selectedCall.duration_sec / 60)}m ${selectedCall.duration_sec % 60}s`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-muted-foreground">Mode:</span>
                      <Badge variant="outline">
                        {selectedCall.mode === 'llm' ? '🤖 LLM' : '📞 Bridge'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Recording */}
                {selectedCall.recording_url && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        Recording
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <audio controls className="w-full">
                        <source src={selectedCall.recording_url} />
                      </audio>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => window.open(selectedCall.recording_url, '_blank')}
                      >
                        Open in New Tab
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Transcript */}
                {selectedCall.transcript && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Transcript
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{selectedCall.transcript}</p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Captured Fields */}
                {selectedCall.captured_fields && Object.keys(selectedCall.captured_fields).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Captured Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {Object.entries(selectedCall.captured_fields).slice(0, 5).map(([key, value]: any) => (
                          <div key={key} className="grid grid-cols-2 gap-2">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:
                            </span>
                            <span className="font-medium">{value}</span>
                          </div>
                        ))}
                        {selectedCall.capture_completeness !== undefined && (
                          <div className="pt-2 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-muted-foreground">Completeness:</span>
                              <Badge variant="outline">{selectedCall.capture_completeness}%</Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Summary */}
                {selectedCall.summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{selectedCall.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <QuickActions call={selectedCall} />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}