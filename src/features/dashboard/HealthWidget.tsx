import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Phone, 
  Mail, 
  Database, 
  FileText,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HealthStatus {
  telephony: 'green' | 'yellow' | 'red';
  email: 'green' | 'yellow' | 'red';
  database: 'green' | 'yellow' | 'red';
  digest: 'green' | 'yellow' | 'red';
}

interface HealthData {
  telephony: {
    status: 'green' | 'yellow' | 'red';
    message: string;
    link?: string;
  };
  email: {
    status: 'green' | 'yellow' | 'red';
    message: string;
    link?: string;
  };
  database: {
    status: 'green' | 'yellow' | 'red';
    message: string;
    link?: string;
  };
  digest: {
    status: 'green' | 'yellow' | 'red';
    message: string;
    link?: string;
  };
}

export default function HealthWidget() {
  const [healthData, setHealthData] = useState<HealthData>({
    telephony: { status: 'green', message: 'All systems operational' },
    email: { status: 'green', message: 'All systems operational' },
    database: { status: 'green', message: 'All systems operational' },
    digest: { status: 'green', message: 'All systems operational' },
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        // TODO: Replace with actual health check endpoints
        // Mock data for now
        setTimeout(() => {
          setHealthData({
            telephony: {
              status: 'green',
              message: 'Twilio webhooks responding (200s today)',
              link: '/status'
            },
            email: {
              status: 'green', 
              message: 'Resend success rate: 98.7%',
              link: '/status'
            },
            database: {
              status: 'green',
              message: 'Database status: OK',
              link: '/status'
            },
            digest: {
              status: 'yellow',
              message: 'Last digest sent: 2h ago',
              link: '/internal/digest'
            }
          });
          setLoading(false);
        }, 300);
      } catch (error) {
        console.error('Health check failed:', error);
        setLoading(false);
      }
    };

    checkHealth();
    
    // Refresh every 5 minutes
    const interval = setInterval(checkHealth, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: 'green' | 'yellow' | 'red') => {
    switch (status) {
      case 'green':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'yellow':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'red':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'green' | 'yellow' | 'red') => {
    const variants = {
      green: 'default',
      yellow: 'secondary', 
      red: 'destructive'
    } as const;
    
    return (
      <Badge variant={variants[status]} className="text-xs">
        {status === 'green' ? 'Healthy' : status === 'yellow' ? 'Warning' : 'Error'}
      </Badge>
    );
  };

  const HealthItem = ({ 
    icon: Icon, 
    title, 
    data 
  }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    data: { status: 'green' | 'yellow' | 'red'; message: string; link?: string };
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
            <div className="flex items-center space-x-3">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{title}</span>
              {getStatusIcon(data.status)}
            </div>
            <div className="flex items-center space-x-2">
              {getStatusBadge(data.status)}
              {data.link && <ExternalLink className="h-3 w-3 text-muted-foreground" />}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{data.message}</p>
          {data.link && <p className="text-xs text-muted-foreground">Click to view details</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const handleHealthItemClick = (link?: string) => {
    if (link) {
      window.open(link, '_blank');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">System Health</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <div onClick={() => handleHealthItemClick(healthData.telephony.link)}>
              <HealthItem 
                icon={Phone} 
                title="Telephony" 
                data={healthData.telephony}
              />
            </div>
            <div onClick={() => handleHealthItemClick(healthData.email.link)}>
              <HealthItem 
                icon={Mail} 
                title="Email" 
                data={healthData.email}
              />
            </div>
            <div onClick={() => handleHealthItemClick(healthData.database.link)}>
              <HealthItem 
                icon={Database} 
                title="Database" 
                data={healthData.database}
              />
            </div>
            <div onClick={() => handleHealthItemClick(healthData.digest.link)}>
              <HealthItem 
                icon={FileText} 
                title="Digest" 
                data={healthData.digest}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}