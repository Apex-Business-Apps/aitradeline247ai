import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Calendar, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

export default function FiltersBar() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  // Get current filter values from URL
  const query = searchParams.get('query') || '';
  const status = searchParams.get('status') || '';
  const assignee = searchParams.get('assignee') || '';

  const updateFilter = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleQuickDateFilter = (period: 'today' | '7d' | 'custom') => {
    const newParams = new URLSearchParams(searchParams);
    
    if (period === 'today') {
      const today = new Date().toISOString().split('T')[0];
      newParams.set('from', today);
      newParams.set('to', today);
    } else if (period === '7d') {
      const today = new Date();
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      newParams.set('from', weekAgo.toISOString().split('T')[0]);
      newParams.set('to', today.toISOString().split('T')[0]);
    } else {
      newParams.delete('from');
      newParams.delete('to');
    }
    
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
    setDateRange({});
  };

  const hasActiveFilters = query || status || assignee || searchParams.get('from');

  return (
    <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
      {/* Search */}
      <div className="flex-1 min-w-[200px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by phone or email..."
            value={query}
            onChange={(e) => updateFilter('query', e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Status Filter */}
      <Select value={status} onValueChange={(value) => updateFilter('status', value)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Status</SelectItem>
          <SelectItem value="unread">Unread</SelectItem>
          <SelectItem value="assigned">Assigned</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>

      {/* Assignee Filter */}
      <Select value={assignee} onValueChange={(value) => updateFilter('assignee', value)}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Assignee" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All</SelectItem>
          <SelectItem value="me">Assigned to me</SelectItem>
          <SelectItem value="unassigned">Unassigned</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Range Quick Filters */}
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickDateFilter('today')}
          className={searchParams.get('from') === new Date().toISOString().split('T')[0] ? 'bg-primary text-primary-foreground' : ''}
        >
          Today
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleQuickDateFilter('7d')}
        >
          7 Days
        </Button>
        
        {/* Custom Date Range */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 space-y-2">
              <div className="text-sm font-medium">Date Range</div>
              <div className="flex space-x-2">
                <div>
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input
                    type="date"
                    value={searchParams.get('from') || ''}
                    onChange={(e) => updateFilter('from', e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input
                    type="date"
                    value={searchParams.get('to') || ''}
                    onChange={(e) => updateFilter('to', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearAllFilters}>
          <Filter className="h-4 w-4 mr-1" />
          Clear filters
        </Button>
      )}
    </div>
  );
}