import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import FiltersBar from "./FiltersBar";
import Row from "./Row";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare } from "lucide-react";

interface CallRecord {
  id: string;
  time: string;
  caller: string;
  transcriptSnippet: string;
  status: 'unread' | 'assigned' | 'resolved';
  assignee?: string;
}

export default function CallInbox() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Extract filters from URL
  const query = searchParams.get('query') || '';
  const status = searchParams.get('status') || '';
  const assignee = searchParams.get('assignee') || '';
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';

  useEffect(() => {
    const fetchCalls = async () => {
      setLoading(true);
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/inbox?query=${query}&status=${status}&assignee=${assignee}&from=${fromDate}&to=${toDate}`);
        
        // Mock data
        setTimeout(() => {
          const mockCalls: CallRecord[] = [
            {
              id: '1',
              time: '2 minutes ago',
              caller: '+1 (555) 123-4567',
              transcriptSnippet: 'Hi, I\'m calling about pricing for your services...',
              status: 'unread'
            },
            {
              id: '2', 
              time: '15 minutes ago',
              caller: '+1 (555) 987-6543',
              transcriptSnippet: 'I need help with my account setup and billing...',
              status: 'assigned',
              assignee: 'me'
            },
            {
              id: '3',
              time: '1 hour ago',
              caller: '+1 (555) 555-5555',
              transcriptSnippet: 'When are you open? I tried calling yesterday...',
              status: 'resolved'
            }
          ];
          setCalls(mockCalls);
          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to fetch calls:', error);
        setLoading(false);
      }
    };

    fetchCalls();
  }, [query, status, assignee, fromDate, toDate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      
      if (e.key === 'r' || e.key === 'R') {
        handleBulkResolve();
      } else if (e.key === 'a' || e.key === 'A') {
        handleBulkAssign();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedRows]);

  const handleRowAction = async (id: string, action: 'callback' | 'resolve' | 'assign' | 'email') => {
    try {
      // TODO: Implement actual API calls
      switch (action) {
        case 'resolve':
          // await fetch(`/api/inbox/${id}/resolve`, { method: 'POST' });
          setCalls(prev => prev.map(call => 
            call.id === id ? { ...call, status: 'resolved' as const } : call
          ));
          break;
        case 'assign':
          // await fetch(`/api/inbox/${id}/assign`, { method: 'POST' });
          setCalls(prev => prev.map(call => 
            call.id === id ? { ...call, status: 'assigned' as const, assignee: 'me' } : call
          ));
          break;
        // Handle other actions
      }
    } catch (error) {
      console.error('Failed to perform action:', error);
    }
  };

  const handleBulkResolve = () => {
    if (selectedRows.size === 0) return;
    
    selectedRows.forEach(id => handleRowAction(id, 'resolve'));
    setSelectedRows(new Set());
  };

  const handleBulkAssign = () => {
    if (selectedRows.size === 0) return;
    
    selectedRows.forEach(id => handleRowAction(id, 'assign'));
    setSelectedRows(new Set());
  };

  const toggleRowSelection = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
  };

  const EmptyState = () => (
    <Card className="p-8 text-center">
      <CardContent>
        <div className="flex flex-col items-center space-y-4">
          <MessageSquare className="h-12 w-12 text-muted-foreground" />
          <div>
            <h3 className="text-lg font-medium">No calls yet</h3>
            <p className="text-muted-foreground mt-1">
              Calls will appear here once you receive them. Try placing a test call to get started.
            </p>
          </div>
          <Button className="flex items-center space-x-2">
            <Phone className="h-4 w-4" />
            <span>Place Test Call</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Call Inbox</h1>
        {selectedRows.size > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {selectedRows.size} selected
            </span>
            <Button size="sm" onClick={handleBulkResolve}>
              Resolve (R)
            </Button>
            <Button size="sm" variant="outline" onClick={handleBulkAssign}>
              Assign to me (A)
            </Button>
          </div>
        )}
      </div>

      <FiltersBar />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : calls.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {calls.map((call) => (
            <Row
              key={call.id}
              call={call}
              isSelected={selectedRows.has(call.id)}
              onSelect={() => toggleRowSelection(call.id)}
              onAction={(action) => handleRowAction(call.id, action)}
            />
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground text-center">
        Keyboard shortcuts: R = Resolve selected, A = Assign to me
      </div>
    </div>
  );
}