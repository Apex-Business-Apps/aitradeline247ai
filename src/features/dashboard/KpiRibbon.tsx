import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Users, Clock, Mail } from "lucide-react";

interface KpiData {
  calls: number;
  bridged_percent: number;
  avg_callback_min: number;
  email_deliverability: number;
}

export default function KpiRibbon() {
  const [todayData, setTodayData] = useState<KpiData>({
    calls: 0,
    bridged_percent: 0,
    avg_callback_min: 0,
    email_deliverability: 0,
  });

  const [weekData, setWeekData] = useState<KpiData>({
    calls: 0,
    bridged_percent: 0,
    avg_callback_min: 0,
    email_deliverability: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // TODO: Replace with actual API endpoint
        // const todayResponse = await fetch('/api/metrics/summary?range=today');
        // const weekResponse = await fetch('/api/metrics/summary?range=7d');
        
        // Mock data for now
        setTimeout(() => {
          setTodayData({
            calls: 12,
            bridged_percent: 85.5,
            avg_callback_min: 3.2,
            email_deliverability: 98.7,
          });

          setWeekData({
            calls: 89,
            bridged_percent: 82.1,
            avg_callback_min: 4.1,
            email_deliverability: 97.9,
          });

          setLoading(false);
        }, 500);
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  const KpiCard = ({ icon: Icon, title, value, suffix, data }: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: keyof KpiData;
    suffix: string;
    data: KpiData;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? "..." : `${data[value]}${suffix}`}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="w-full">
      <Tabs defaultValue="today" className="w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Key Metrics</h2>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard 
              icon={Phone} 
              title="Calls" 
              value="calls" 
              suffix="" 
              data={todayData} 
            />
            <KpiCard 
              icon={Users} 
              title="Bridged %" 
              value="bridged_percent" 
              suffix="%" 
              data={todayData} 
            />
            <KpiCard 
              icon={Clock} 
              title="Avg Callback" 
              value="avg_callback_min" 
              suffix="min" 
              data={todayData} 
            />
            <KpiCard 
              icon={Mail} 
              title="Email Deliverability" 
              value="email_deliverability" 
              suffix="%" 
              data={todayData} 
            />
          </div>
        </TabsContent>

        <TabsContent value="7d">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard 
              icon={Phone} 
              title="Calls" 
              value="calls" 
              suffix="" 
              data={weekData} 
            />
            <KpiCard 
              icon={Users} 
              title="Bridged %" 
              value="bridged_percent" 
              suffix="%" 
              data={weekData} 
            />
            <KpiCard 
              icon={Clock} 
              title="Avg Callback" 
              value="avg_callback_min" 
              suffix="min" 
              data={weekData} 
            />
            <KpiCard 
              icon={Mail} 
              title="Email Deliverability" 
              value="email_deliverability" 
              suffix="%" 
              data={weekData} 
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}