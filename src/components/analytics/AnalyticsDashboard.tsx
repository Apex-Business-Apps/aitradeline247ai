import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, MousePointer, Target } from "lucide-react";

interface AnalyticsProps {
  pageViews?: number;
  conversions?: number;
  conversionRate?: number;
  leadScore?: number;
  abTestResults?: {
    test: string;
    variant: string;
    conversions: number;
    visits: number;
  }[];
}

export const AnalyticsDashboard: React.FC<AnalyticsProps> = ({
  pageViews = 1247,
  conversions = 23,
  conversionRate = 1.8,
  leadScore = 78,
  abTestResults = [
    { test: 'hero_cta_test', variant: 'A', conversions: 12, visits: 650 },
    { test: 'hero_cta_test', variant: 'B', conversions: 11, visits: 597 }
  ]
}) => {
  const metrics = [
    {
      title: "Page Views",
      value: pageViews.toLocaleString(),
      change: "+12.3%",
      icon: Users,
      color: "blue"
    },
    {
      title: "Conversions",
      value: conversions.toString(),
      change: "+23.1%", 
      icon: Target,
      color: "green"
    },
    {
      title: "Conversion Rate",
      value: `${conversionRate}%`,
      change: "+0.4%",
      icon: TrendingUp,
      color: "orange"
    },
    {
      title: "Avg Lead Score",
      value: `${leadScore}/100`,
      change: "+5.2%",
      icon: MousePointer,
      color: "purple"
    }
  ];

  const getVariantPerformance = (variant: any) => {
    const rate = ((variant.conversions / variant.visits) * 100).toFixed(1);
    return `${rate}%`;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="relative overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metric.value}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">{metric.change}</span> from last period
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* A/B Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            A/B Test Performance
          </CardTitle>
          <CardDescription>
            Current test: Hero CTA variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {abTestResults.map((variant, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant={variant.variant === 'A' ? 'default' : 'secondary'}>
                    Variant {variant.variant}
                  </Badge>
                  <div>
                    <p className="font-medium">
                      {variant.variant === 'A' ? 'Grow Now' : 'Start Free Trial'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {variant.visits} visits • {variant.conversions} conversions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">{getVariantPerformance(variant)}</p>
                  <p className="text-sm text-muted-foreground">conversion rate</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Test Insights:</p>
            <ul className="text-sm space-y-1">
              <li>• Both variants performing similarly (~1.8-1.9% conversion)</li>
              <li>• "Grow Now" (A) slightly ahead with more emotional appeal</li>
              <li>• Recommend running test for 2 more weeks for statistical significance</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Lead Scoring Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Lead Quality Analysis
          </CardTitle>
          <CardDescription>
            Automated lead scoring breakdown
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-red-600">8</div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-xs">Score: 70-100</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">12</div>
              <p className="text-sm text-muted-foreground">Medium Priority</p>
              <p className="text-xs">Score: 40-69</p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">3</div>
              <p className="text-sm text-muted-foreground">Low Priority</p>
              <p className="text-xs">Score: 0-39</p>
            </div>
          </div>
          
          <div className="mt-4 space-y-2 text-sm">
            <p className="font-medium">Top scoring factors this week:</p>
            <ul className="text-muted-foreground space-y-1">
              <li>• Business email domains (+25 points)</li>
              <li>• Detailed inquiry notes (+15-30 points)</li>
              <li>• Enterprise company indicators (+15 points)</li>
              <li>• Urgency keywords detected (+20 points)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
