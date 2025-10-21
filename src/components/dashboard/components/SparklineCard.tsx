import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SparklineData {
  value: number;
  label: string;
}

interface SparklineCardProps {
  title: string;
  data: SparklineData[];
  currentValue: string;
  trend: string;
  trendType: 'positive' | 'negative' | 'neutral';
  className?: string;
}

export const SparklineCard: React.FC<SparklineCardProps> = ({
  title,
  data,
  currentValue,
  trend,
  trendType,
  className = ""
}) => {
  // Generate simple SVG sparkline
  const generateSparklinePath = (points: SparklineData[]): string => {
    if (points.length < 2) return '';
    
    const width = 100;
    const height = 30;
    const maxValue = Math.max(...points.map(p => p.value));
    const minValue = Math.min(...points.map(p => p.value));
    const range = maxValue - minValue || 1;
    
    const pathData = points.map((point, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((point.value - minValue) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    
    return pathData;
  };

  const trendColor = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400', 
    neutral: 'text-muted-foreground'
  }[trendType];

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="text-2xl font-bold">{currentValue}</div>
          <div className={`text-xs font-medium ${trendColor}`}>
            {trend}
          </div>
        </div>
        
        {/* Sparkline SVG */}
        <div className="h-8 w-full">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 100 30"
            className="text-primary"
            preserveAspectRatio="none"
          >
            <path
              d={generateSparklinePath(data)}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              opacity="0.8"
            />
          </svg>
        </div>
        
        {/* Fallback table for no-JS */}
        <noscript>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">Period</th>
                <th className="text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(-5).map((point, index) => (
                <tr key={index}>
                  <td>{point.label}</td>
                  <td className="text-right">{point.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </noscript>
      </CardContent>
    </Card>
  );
};
