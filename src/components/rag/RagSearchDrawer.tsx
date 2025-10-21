import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useRagSearch } from '@/hooks/useRagSearch';
import { useToast } from '@/hooks/use-toast';

interface RagSearchDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RagSearchDrawer({ open, onOpenChange }: RagSearchDrawerProps) {
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(8);
  const [sourceType, setSourceType] = useState<string>('all');
  const [isMobile, setIsMobile] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { isLoading, searchResults, answerData, search, getAnswer, reset } = useRagSearch();
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (open) {
      const startTime = Date.now();
      // Log open event (no PII)
      console.log('[RAG] drawer_opened', { timestamp: startTime });
      
      return () => {
        const duration = Date.now() - startTime;
        console.log('[RAG] drawer_closed', { duration });
      };
    }
  }, [open]);

  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!value.trim()) {
      reset();
      return;
    }

    debounceRef.current = setTimeout(() => {
      const filters = sourceType !== 'all' ? { source_type: sourceType } : undefined;
      search(value, topK, filters);
    }, 250);
  }, [topK, sourceType, search, reset]);

  const handleAskForAnswer = useCallback(() => {
    if (!query.trim()) return;
    
    const startTime = Date.now();
    const filters = sourceType !== 'all' ? { source_type: sourceType } : undefined;
    
    getAnswer(query, topK, filters).then(() => {
      const latency = Date.now() - startTime;
      console.log('[RAG] answer_requested', { latency });
    });
  }, [query, topK, sourceType, getAnswer]);

  const scrollToResult = useCallback((index: number) => {
    const element = document.querySelector(`[data-result-index="${index}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setTimeout(() => {
      setQuery('');
      reset();
    }, 300);
  }, [onOpenChange, reset]);

  const content = (
    <div 
      ref={containerRef} 
      className="flex flex-col h-full space-y-4" 
      data-qa="rag-drawer"
    >
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Ask or search…"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            className="pl-9 pr-10"
            aria-label="Search query"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => handleQueryChange('')}
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          <Select value={topK.toString()} onValueChange={(v) => setTopK(Number(v))}>
            <SelectTrigger className="w-32" aria-label="Number of results">
              <SelectValue placeholder="Top K" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4">Top 4</SelectItem>
              <SelectItem value="8">Top 8</SelectItem>
              <SelectItem value="12">Top 12</SelectItem>
              <SelectItem value="20">Top 20</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sourceType} onValueChange={setSourceType}>
            <SelectTrigger className="flex-1" aria-label="Filter by source type">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All sources</SelectItem>
              <SelectItem value="transcript">Transcripts</SelectItem>
              <SelectItem value="email">Emails</SelectItem>
              <SelectItem value="doc">Documents</SelectItem>
              <SelectItem value="faq">FAQs</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {query && (
          <Button 
            onClick={handleAskForAnswer} 
            disabled={isLoading}
            className="w-full"
            aria-label="Get AI answer"
          >
            Ask for answer
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8" data-qa="rag-loading">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {answerData && answerData.mode === 'snippets_only' && (
          <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
            Low confidence — showing best matches.
          </div>
        )}

        {answerData && answerData.mode === 'full_answer' && answerData.answer_draft && (
          <div className="p-4 bg-accent/50 rounded-lg space-y-2">
            <h3 className="font-semibold text-sm">Answer</h3>
            <div className="text-sm whitespace-pre-wrap">
              {answerData.answer_draft.split(/\[(\d+)\]/).map((part, idx) => {
                const citationNum = parseInt(part);
                if (!isNaN(citationNum) && answerData.citations) {
                  const citation = answerData.citations.find(c => c.index === citationNum);
                  return (
                    <button
                      key={idx}
                      onClick={() => scrollToResult(citationNum - 1)}
                      className="text-primary font-medium hover:underline"
                      aria-label={`View citation ${citationNum}`}
                    >
                      [{citationNum}]
                    </button>
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </div>
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-2" data-qa="rag-results" role="list">
            {searchResults.map((hit, index) => (
              <div
                key={index}
                data-result-index={index}
                className="p-3 border rounded-lg space-y-2 hover:bg-accent/50 transition-colors"
                role="listitem"
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {hit.metadata.source_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {hit.score.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm line-clamp-2">{hit.content}</p>
                {hit.metadata.uri && (
                  <a
                    href={hit.metadata.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Open
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && query && searchResults.length === 0 && !answerData && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No results found. Try a different query.
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>Search</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 overflow-hidden flex flex-col flex-1">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 sm:max-w-96">
        <SheetHeader>
          <SheetTitle>Search</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          {content}
        </div>
      </SheetContent>
    </Sheet>
  );
}

