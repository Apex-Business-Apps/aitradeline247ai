import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function AdminKB() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Base Administration</h1>
      </div>

      <Card className="p-6">
        <div className="flex items-center space-x-3 text-orange-600">
          <AlertTriangle className="h-6 w-6" />
          <h2 className="text-lg font-semibold">Knowledge Base Not Available</h2>
        </div>
        <p className="mt-3 text-muted-foreground">
          The Knowledge Base feature is currently not configured for this application. 
          Please contact your system administrator to set up the required database tables and functions.
        </p>
        <div className="mt-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </Card>
    </div>
  );
}
