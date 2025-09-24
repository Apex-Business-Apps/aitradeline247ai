import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Kpi } from '@/types/dashboard';

interface KpiCardProps {
  kpi: Kpi;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  ariaLabel: string;
  trend?: string;
  badge?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  kpi,
  title,
  subtitle,
  icon: Icon,
  color,
  bgColor,
  ariaLabel,
  trend,
  badge
}) => {
  const formatValue = (value: number, currency?: string): string => {
    if (currency) {
      return `$${value.toLocaleString()}`;
    }
    if (kpi.id === 'answerRate') {
      return `${value}%`;
    }
    return value.toString();
  };

  return (
    <Card 
      className="relative overflow-hidden border-0"
      style={{ 
        boxShadow: 'var(--premium-shadow-subtle)',
        background: 'linear-gradient(135deg, hsl(var(--card) / 0.95) 0%, hsl(var(--card) / 0.9) 100%)'
      }}
      role="article"
      aria-label={ariaLabel}
    >
      <CardContent className="p-3">
        {/* Icon and trend/badge row */}
        <div className="flex items-start justify-between mb-2">
          <div className={`p-1.5 rounded-md ${bgColor}`}>
            <Icon className={`h-3 w-3 ${color}`} />
          </div>
          {trend && (
            <div className="text-xs text-green-600 dark:text-green-400 font-medium">
              {trend}
            </div>
          )}
          {badge && (
            <div className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
              {badge}
            </div>
          )}
        </div>
        
        {/* Main value */}
        <div className="space-y-1">
          <div className="text-xl font-bold text-foreground">
            {formatValue(kpi.value, kpi.currency)}
          </div>
          <p className="text-xs text-muted-foreground font-medium">
            {title}
          </p>
          <p className="text-xs text-muted-foreground/70">
            {subtitle}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};