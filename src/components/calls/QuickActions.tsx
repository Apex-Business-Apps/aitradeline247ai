import { Button } from "@/components/ui/button";
import { Phone, MessageSquare, Mail, User, Calendar, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface QuickActionsProps {
  call: {
    from_e164: string;
    captured_fields?: any;
    transcript?: string;
  };
}

export default function QuickActions({ call }: QuickActionsProps) {
  const handleCallBack = () => {
    window.location.href = `tel:${call.from_e164}`;
  };

  const handleSMS = () => {
    const message = encodeURIComponent('Thank you for calling TradeLine 24/7. How can we assist you further?');
    window.location.href = `sms:${call.from_e164}?body=${message}`;
  };

  const handleEmail = () => {
    const subject = encodeURIComponent('TradeLine 24/7 - Call Follow-up');
    const body = encodeURIComponent(`Hi,\n\nThank you for your recent call to TradeLine 24/7.\n\n${call.transcript || ''}`);
    const email = call.captured_fields?.email || '';
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const handleSaveContact = () => {
    const name = call.captured_fields?.name || 'Unknown';
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;TYPE=CELL:${call.from_e164}
${call.captured_fields?.email ? `EMAIL:${call.captured_fields.email}` : ''}
END:VCARD`;
    
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/\s+/g, '_')}.vcf`;
    a.click();
  };

  const handleAddToCalendar = () => {
    const date = call.captured_fields?.preferred_date || new Date().toISOString();
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${date.replace(/[-:]/g, '')}
SUMMARY:TradeLine 24/7 - Follow-up
DESCRIPTION:${call.transcript || ''}
END:VEVENT
END:VCALENDAR`;
    
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'event.ics';
    a.click();
  };

  const handleOpenMap = () => {
    const address = call.captured_fields?.address || '';
    if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleCallBack}
          >
            <Phone className="w-4 h-4" />
            Call Back
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSMS}
          >
            <MessageSquare className="w-4 h-4" />
            Text
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleEmail}
            disabled={!call.captured_fields?.email}
          >
            <Mail className="w-4 h-4" />
            Email
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleSaveContact}
          >
            <User className="w-4 h-4" />
            Save
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleAddToCalendar}
          >
            <Calendar className="w-4 h-4" />
            Calendar
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleOpenMap}
            disabled={!call.captured_fields?.address}
          >
            <MapPin className="w-4 h-4" />
            Map
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
