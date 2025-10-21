import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Mail, User, Calendar, MapPin, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const phoneApps = [
  {
    id: 'dialer',
    title: 'Phone Dialer',
    description: 'Make calls directly from your device',
    icon: Phone,
    action: (number: string) => `tel:${number}`,
    defaultNumber: '+14319900222',
    color: 'text-green-600'
  },
  {
    id: 'sms',
    title: 'Messages',
    description: 'Send text messages',
    icon: MessageSquare,
    action: (number: string) => `sms:${number}`,
    defaultNumber: '+14319900222',
    color: 'text-blue-600'
  },
  {
    id: 'email',
    title: 'Email',
    description: 'Compose an email',
    icon: Mail,
    action: (email: string) => `mailto:${email}`,
    defaultNumber: 'support@tradeline247.ai',
    color: 'text-purple-600'
  },
  {
    id: 'contacts',
    title: 'Contacts',
    description: 'Download contact card',
    icon: User,
    action: () => '/api/vcard/download',
    color: 'text-orange-600'
  },
  {
    id: 'calendar',
    title: 'Calendar',
    description: 'Add to calendar',
    icon: Calendar,
    action: () => '/api/calendar/event',
    color: 'text-indigo-600'
  },
  {
    id: 'maps',
    title: 'Maps',
    description: 'Get directions',
    icon: MapPin,
    action: (coords: string) => `geo:${coords}`,
    defaultNumber: '51.0447,-114.0719', // Calgary coordinates
    color: 'text-red-600'
  }
];

export default function PhoneApps() {
  const { toast } = useToast();

  const handleAppAction = (app: typeof phoneApps[0]) => {
    try {
      const url = app.action(app.defaultNumber || '');
      
      if (app.id === 'contacts' || app.id === 'calendar') {
        toast({
          title: "Feature Coming Soon",
          description: `${app.title} integration will be available soon`
        });
        return;
      }

      window.location.href = url;
      
      toast({
        title: `Opening ${app.title}`,
        description: `Launching ${app.title} app...`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to open ${app.title}`,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Phone Apps</h1>
          <p className="text-muted-foreground mt-2">
            Quick access to native phone apps and integrations
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {phoneApps.map((app) => {
            const Icon = app.icon;
            return (
              <Card
                key={app.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => handleAppAction(app)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className={`p-3 bg-muted rounded-lg w-fit group-hover:scale-110 transition-transform ${app.color}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-lg">{app.title}</CardTitle>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardDescription>{app.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {app.defaultNumber && (
                    <p className="text-sm text-muted-foreground font-mono">
                      {app.defaultNumber}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-base">About Phone Apps</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              These integrations use native device protocols to launch your phone's built-in apps.
              They work best on mobile devices and tablets.
            </p>
            <p>
              For desktop users, apps like Email and Maps will open in your default applications.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
