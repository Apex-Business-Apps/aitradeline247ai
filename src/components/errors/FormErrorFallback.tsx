import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Phone, Mail, MessageCircle } from 'lucide-react';

interface FormErrorFallbackProps {
  error?: string;
  onRetry?: () => void;
}

export const FormErrorFallback = ({ error, onRetry }: FormErrorFallbackProps) => {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription className="space-y-4 mt-2">
        <p>
          {error || "We couldn't process your request. Please try again or contact us directly."}
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
            <a href="tel:+14319900222">
              <Phone className="w-4 h-4 mr-2" />
              Call: +1-431-990-0222
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            className="flex-1"
          >
            <a href="mailto:hello@tradeline247ai.com">
              <Mail className="w-4 h-4 mr-2" />
              Email Us
            </a>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground pt-2">
          We're here to help! Our support team typically responds within 2 hours during business hours.
        </p>
      </AlertDescription>
    </Alert>
  );
};
