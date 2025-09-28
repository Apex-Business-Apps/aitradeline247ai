import { useState, useEffect } from "react";
import { Plus, Star, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavedView {
  id: string;
  name: string;
  kind: string;
  payload: any;
  created_at: string;
}

interface SavedViewsProps {
  kind: 'inbox' | 'dashboard';
  currentState?: any;
  onLoadView?: (payload: any) => void;
}

export default function SavedViews({ kind, currentState, onLoadView }: SavedViewsProps) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [viewName, setViewName] = useState('');
  const [defaultView, setDefaultView] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSavedViews();
    loadDefaultView();
  }, [kind]);

  const loadSavedViews = async () => {
    try {
      const { data, error } = await supabase
        .from('user_views')
        .select('*')
        .eq('kind', kind)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setViews((data || []) as SavedView[]);
    } catch (error) {
      console.error('Failed to load saved views:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultView = () => {
    const defaultViewId = localStorage.getItem(`defaultView_${kind}`);
    setDefaultView(defaultViewId);
  };

  const saveCurrentView = async () => {
    if (!viewName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('user_views')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id!,
          name: viewName.trim(),
          kind,
          payload: currentState || {}
        })
        .select()
        .single();

      if (error) throw error;

      setViews(prev => [data as SavedView, ...prev]);
      setViewName('');
      setShowSaveDialog(false);
      
      toast({
        title: "View saved",
        description: `"${data.name}" has been saved.`,
      });
    } catch (error) {
      console.error('Failed to save view:', error);
      toast({
        title: "Error",
        description: "Failed to save view. Please try again.",
        variant: "destructive",
      });
    }
  };

  const loadView = (view: SavedView) => {
    if (onLoadView) {
      onLoadView(view.payload);
      toast({
        title: "View loaded",
        description: `"${view.name}" has been applied.`,
      });
    }
  };

  const setAsDefault = async (viewId: string) => {
    localStorage.setItem(`defaultView_${kind}`, viewId);
    setDefaultView(viewId);
    
    toast({
      title: "Default view set",
      description: "This view will be loaded automatically.",
    });
  };

  const deleteView = async (viewId: string) => {
    try {
      const { error } = await supabase
        .from('user_views')
        .delete()
        .eq('id', viewId);

      if (error) throw error;

      setViews(prev => prev.filter(v => v.id !== viewId));
      
      if (defaultView === viewId) {
        localStorage.removeItem(`defaultView_${kind}`);
        setDefaultView(null);
      }

      toast({
        title: "View deleted",
        description: "The view has been removed.",
      });
    } catch (error) {
      console.error('Failed to delete view:', error);
      toast({
        title: "Error",
        description: "Failed to delete view. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Save Current View */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="h-3 w-3 mr-1" />
            Save View
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current {kind === 'dashboard' ? 'Layout' : 'Filters'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter view name..."
              value={viewName}
              onChange={(e) => setViewName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && saveCurrentView()}
            />
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={saveCurrentView} disabled={!viewName.trim()}>
                Save View
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Saved Views List */}
      {loading ? (
        <Badge variant="outline">Loading...</Badge>
      ) : views.length === 0 ? (
        <span className="text-xs text-muted-foreground">No saved views</span>
      ) : (
        views.map((view) => (
          <DropdownMenu key={view.id}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="relative"
              >
                {view.name}
                {defaultView === view.id && (
                  <Star className="h-3 w-3 ml-1 text-yellow-500 fill-current" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => loadView(view)}>
                <Edit2 className="h-3 w-3 mr-2" />
                Load View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setAsDefault(view.id)}>
                <Star className="h-3 w-3 mr-2" />
                Set as Default
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => deleteView(view.id)}
                className="text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ))
      )}
    </div>
  );
}