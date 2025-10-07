import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';

export const WinsSection: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
          Recent Wins
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Strong performance this week
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Your AI receptionist is delivering results
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Check your KPIs above for detailed metrics
          </p>
        </div>
      </CardContent>
    </Card>
  );
};