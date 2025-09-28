import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { MessageBubble } from './MessageBubble';
import { ConsentBadge } from './ConsentBadge';
import type { SessionDetail } from '../lib/types';
import { fetchSessionDetail, resendInitial, cancelSession, manageConsent } from '../lib/api';

interface SessionDetailDrawerProps {
  sessionId: string | null;
  onClose: () => void;
  onAction: () => void;
}

export function SessionDetailDrawer({ sessionId, onClose, onAction }: SessionDetailDrawerProps) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadSessionDetail();
    }
  }, [sessionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (sessionId) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [sessionId, onClose]);

  const loadSessionDetail = async () => {
    if (!sessionId) return;
    
    setLoading(true);
    try {
      const data = await fetchSessionDetail(sessionId);
      setDetail(data);
    } catch (error) {
      console.error('Failed to load session detail:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResendInitial = async () => {
    if (!sessionId) return;
    
    setActionLoading('resend');
    try {
      await resendInitial(sessionId);
      onAction();
      loadSessionDetail();
    } catch (error) {
      console.error('Failed to resend initial:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSession = async () => {
    if (!sessionId) return;
    
    setActionLoading('cancel');
    try {
      await cancelSession(sessionId);
      onAction();
      loadSessionDetail();
    } catch (error) {
      console.error('Failed to cancel session:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleConsentAction = async (channel: 'sms' | 'whatsapp', action: 'opt_in' | 'opt_out') => {
    if (!detail) return;
    
    setActionLoading(`consent-${channel}-${action}`);
    try {
      await manageConsent({
        e164: detail.session.e164,
        action,
        channel
      });
      onAction();
      loadSessionDetail();
    } catch (error) {
      console.error('Failed to manage consent:', error);
    } finally {
      setActionLoading(null);
    }
  };

  if (!sessionId) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-2xl bg-background border-l z-50 overflow-hidden flex flex-col"
        data-testid="drawer"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Session Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px]"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close drawer</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue="timeline" className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="session">Session</TabsTrigger>
                <TabsTrigger value="controls">Controls</TabsTrigger>
              </TabsList>

              <TabsContent value="timeline" className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{detail.session.e164}</span>
                    <Badge variant="outline">{detail.session.channel}</Badge>
                    <Badge variant="secondary">{detail.session.state}</Badge>
                  </div>
                  
                  {detail.messages.length > 0 ? (
                    <div className="space-y-2">
                      {detail.messages.map((message, index) => (
                        <MessageBubble key={index} message={message} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground py-8">
                      No messages yet
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="session" className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Session Data</h3>
                    <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
{JSON.stringify(detail.session, null, 2)}
                    </pre>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Consent Status</h3>
                    <div className="flex gap-2">
                      <ConsentBadge channel="sms" consent={detail.consent.sms} />
                      <ConsentBadge channel="whatsapp" consent={detail.consent.whatsapp} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="controls" className="flex-1 overflow-y-auto p-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-3">Session Actions</h3>
                    <div className="space-y-2">
                      <Button
                        onClick={handleResendInitial}
                        disabled={!!actionLoading}
                        className="w-full min-h-[44px]"
                        data-testid="action-resend-initial"
                      >
                        {actionLoading === 'resend' ? 'Resending...' : 'Resend Initial Message'}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancelSession}
                        disabled={!!actionLoading}
                        className="w-full min-h-[44px]"
                        data-testid="action-cancel"
                      >
                        {actionLoading === 'cancel' ? 'Cancelling...' : 'Cancel Session'}
                      </Button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-3">Consent Management</h3>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">SMS</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConsentAction('sms', 'opt_in')}
                            disabled={!!actionLoading}
                            className="min-h-[44px]"
                          >
                            Opt In
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConsentAction('sms', 'opt_out')}
                            disabled={!!actionLoading}
                            className="min-h-[44px]"
                            data-testid="action-consent-optout"
                          >
                            Opt Out
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium mb-2">WhatsApp</h4>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConsentAction('whatsapp', 'opt_in')}
                            disabled={!!actionLoading}
                            className="min-h-[44px]"
                          >
                            Opt In
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleConsentAction('whatsapp', 'opt_out')}
                            disabled={!!actionLoading}
                            className="min-h-[44px]"
                          >
                            Opt Out
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-muted-foreground">Failed to load session</div>
          </div>
        )}
      </div>
    </>
  );
}