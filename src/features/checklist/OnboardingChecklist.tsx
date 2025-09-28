import { CheckCircle, Circle, ExternalLink, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { useChecklist } from "./useChecklist";

export default function OnboardingChecklist() {
  const { items, progress, isComplete, loading } = useChecklist();

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If complete, show compact success badge
  if (isComplete) {
    return (
      <Card className="mb-6 border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">
                Setup Complete
              </span>
              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                Ready
              </Badge>
            </div>
            <span className="text-sm text-green-600 dark:text-green-400">
              All systems operational
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const ChecklistItem = ({ 
    item, 
    linkTo, 
    external = false 
  }: { 
    item: typeof items[0]; 
    linkTo: string; 
    external?: boolean; 
  }) => {
    const IconComponent = item.completed ? CheckCircle : Circle;
    const iconColor = item.completed ? "text-green-600" : "text-muted-foreground";

    const content = (
      <div className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
        item.completed 
          ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800" 
          : "bg-muted/50 hover:bg-muted"
      }`}>
        <div className="flex items-center space-x-3">
          <IconComponent className={`h-4 w-4 ${iconColor}`} />
          <div>
            <div className="font-medium text-sm">{item.title}</div>
            <div className="text-xs text-muted-foreground">{item.description}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {item.completed && (
            <Badge variant="secondary" className="text-xs">Complete</Badge>
          )}
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </div>
      </div>
    );

    if (external) {
      return (
        <a href={linkTo} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      );
    }

    return (
      <Link to={linkTo} className="block">
        {content}
      </Link>
    );
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Getting Started</CardTitle>
          <Badge variant="outline">{Math.round(progress)}% Complete</Badge>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      <CardContent className="space-y-3">
        <ChecklistItem 
          item={items[0]} 
          linkTo="/settings" 
        />
        <ChecklistItem 
          item={items[1]} 
          linkTo="/settings" 
        />
        <ChecklistItem 
          item={items[2]} 
          linkTo="/settings" 
        />
        <ChecklistItem 
          item={items[3]} 
          linkTo="/settings" 
        />
        <ChecklistItem 
          item={items[4]} 
          linkTo="/subscribe" 
        />

        {progress < 100 && (
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground text-center">
              Complete all steps to unlock full functionality
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}