import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, UserPlus, PhoneCall, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActionsCard: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      label: 'View Calls',
      icon: Phone,
      onClick: () => navigate('/call-center'),
      variant: 'default' as const
    },
    {
      label: 'Add Number',
      icon: PhoneCall,
      onClick: () => navigate('/ops/number-onboarding'),
      variant: 'outline' as const
    },
    {
      label: 'Invite Staff',
      icon: UserPlus,
      onClick: () => {
        // TODO: Open invite modal
        console.log('Invite staff modal');
      },
      variant: 'outline' as const
    },
    {
      label: 'Integrations',
      icon: LinkIcon,
      onClick: () => navigate('/integrations'),
      variant: 'outline' as const
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.label}
              variant={action.variant}
              onClick={action.onClick}
              className="w-full justify-start gap-2"
            >
              <Icon className="h-4 w-4" />
              {action.label}
            </Button>
          );
        })}
      </CardContent>
    </Card>
  );
};
