import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Phone, Mail, MessageCircle } from 'lucide-react';
import { PUBLIC_HELPLINE_E164, PUBLIC_HELPLINE_DISPLAY, PUBLIC_EMAIL } from "@/config/public";

interface FormErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
}

export const FormErrorFallback = ({ error, onRetry }: FormErrorFallbackProps) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Oops!</AlertTitle>
      <AlertDescription className="space-y-4 mt-2">
        <p>
          {error || "That didn't work. Try again or just give us a call."}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="flex-1"
            >
              Try Again
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex-1"
          >
            <a href={`tel:${PUBLIC_HELPLINE_E164}`}>
              <Phone className="w-4 h-4 mr-2" />
              Call: {PUBLIC_HELPLINE_DISPLAY}
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex-1"
          >
            <a href={`mailto:${PUBLIC_EMAIL}`}>
              <Mail className="w-4 h-4 mr-2" />
              Email Us
            </a>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground pt-2">
          We're here to help. Usually get back within 2 hours.
        </p>
      </AlertDescription>
    </Alert>
  );
};

