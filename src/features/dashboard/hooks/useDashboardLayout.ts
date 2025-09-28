import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayout {
  components: {
    kpiRibbon: { visible: boolean; order: number };
    healthWidget: { visible: boolean; order: number };
    callSummary: { visible: boolean; order: number };
    recentActivity: { visible: boolean; order: number };
    quickActions: { visible: boolean; order: number };
  };
  gridLayout: 'default' | 'compact' | 'wide';
}

const defaultLayout: DashboardLayout = {
  components: {
    kpiRibbon: { visible: true, order: 1 },
    healthWidget: { visible: true, order: 2 },
    callSummary: { visible: true, order: 3 },
    recentActivity: { visible: true, order: 4 },
    quickActions: { visible: true, order: 5 },
  },
  gridLayout: 'default'
};

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(defaultLayout);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDefaultLayout();
  }, []);

  const loadDefaultLayout = async () => {
    try {
      // Check for user's default layout in localStorage first
      const defaultViewId = localStorage.getItem('defaultView_dashboard');
      
      if (defaultViewId) {
        const { data, error } = await supabase
          .from('user_views')
          .select('payload')
          .eq('id', defaultViewId)
          .single();

        if (!error && data?.payload) {
          const payload = data.payload as Partial<DashboardLayout>;
          setLayout({ ...defaultLayout, ...payload });
        }
      }
    } catch (error) {
      console.error('Failed to load default layout:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveLayoutByName = async (name: string) => {
    try {
      const { error } = await supabase
        .from('user_views')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id!,
          name,
          kind: 'dashboard',
          payload: layout as any
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Failed to save layout:', error);
      return false;
    }
  };

  const loadLayoutByName = async (viewId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_views')
        .select('payload')
        .eq('id', viewId)
        .single();

      if (error) throw error;
      
      if (data?.payload) {
        const payload = data.payload as Partial<DashboardLayout>;
        setLayout({ ...defaultLayout, ...payload });
        return true;
      }
    } catch (error) {
      console.error('Failed to load layout:', error);
    }
    return false;
  };

  const updateLayout = (newLayout: Partial<DashboardLayout>) => {
    setLayout(prev => ({ ...prev, ...newLayout }));
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
  };

  const toggleComponent = (component: keyof DashboardLayout['components']) => {
    setLayout(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component]: {
          ...prev.components[component],
          visible: !prev.components[component].visible
        }
      }
    }));
  };

  const reorderComponent = (component: keyof DashboardLayout['components'], newOrder: number) => {
    setLayout(prev => ({
      ...prev,
      components: {
        ...prev.components,
        [component]: {
          ...prev.components[component],
          order: newOrder
        }
      }
    }));
  };

  const changeGridLayout = (gridLayout: DashboardLayout['gridLayout']) => {
    setLayout(prev => ({ ...prev, gridLayout }));
  };

  return {
    layout,
    loading,
    updateLayout,
    resetLayout,
    toggleComponent,
    reorderComponent,
    changeGridLayout,
    saveLayoutByName,
    loadLayoutByName,
    getCurrentLayout: () => layout
  };
}