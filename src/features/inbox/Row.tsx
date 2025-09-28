import { Phone, Mail, Check, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

interface CallRecord {
  id: string;
  time: string;
  caller: string;
  transcriptSnippet: string;
  status: 'unread' | 'assigned' | 'resolved';
  assignee?: string;
}

interface RowProps {
  call: CallRecord;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: 'callback' | 'resolve' | 'assign' | 'email') => void;
}

export default function Row({ call, isSelected, onSelect, onAction }: RowProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'unread':
        return <Badge variant="destructive">Unread</Badge>;
      case 'assigned':
        return <Badge variant="secondary">Assigned</Badge>;
      case 'resolved':
        return <Badge variant="default">Resolved</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCaller = (caller: string) => {
    // Format phone number or email
    if (caller.includes('@')) {
      return caller;
    }
    // Simple phone formatting
    return caller;
  };

  return (
    <Card className={`transition-colors hover:bg-muted/50 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-center space-x-4">
          {/* Checkbox */}
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="mt-1"
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-sm">{formatCaller(call.caller)}</span>
                  <span className="text-xs text-muted-foreground">{call.time}</span>
                  {getStatusBadge(call.status)}
                  {call.assignee && (
                    <Badge variant="outline" className="text-xs">
                      {call.assignee}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {call.transcriptSnippet}
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-1 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction('callback')}
                  className="h-8 px-2"
                >
                  <Phone className="h-3 w-3 mr-1" />
                  Call Back
                </Button>
                
                {call.status !== 'resolved' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction('resolve')}
                    className="h-8 px-2"
                  >
                    <Check className="h-3 w-3 mr-1" />
                    Resolve
                  </Button>
                )}
                
                {call.status !== 'assigned' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction('assign')}
                    className="h-8 px-2"
                  >
                    <UserPlus className="h-3 w-3 mr-1" />
                    Assign
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction('email')}
                  className="h-8 px-2"
                >
                  <Mail className="h-3 w-3 mr-1" />
                  Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}