import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface RagSearchFilters {
  source_type?: string;
  date_from?: string;
  date_to?: string;
}

interface RagSearchHit {
  score: number;
  metadata: {
    source_type: string;
    uri: string;
    [key: string]: any;
  };
  content: string;
}

interface RagAnswerCitation {
  index: number;
  source_type: string;
  uri: string;
}

interface RagAnswerResponse {
  mode: 'full_answer' | 'snippets_only';
  answer_draft?: string;
  citations?: RagAnswerCitation[];
  confidence?: 'high' | 'medium' | 'low';
  hits: RagSearchHit[];
}

export function useRagSearch() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<RagSearchHit[]>([]);
  const [answerData, setAnswerData] = useState<RagAnswerResponse | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const search = useCallback(async (
    query: string,
    topK: number = 8,
    filters?: RagSearchFilters
  ) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('rag-search', {
        body: {
          query_text: query,
          top_k: Math.min(topK, 20),
          filters
        }
      });

      if (error) {
        if (error.message?.includes('401')) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to search.',
            variant: 'destructive'
          });
          return;
        }
        if (error.message?.includes('429')) {
          toast({
            title: 'Rate limit exceeded',
            description: 'Please try again in a moment.',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      setSearchResults(data?.hits || []);
      setAnswerData(null);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
        toast({
          title: 'Search failed',
          description: 'Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const getAnswer = useCallback(async (
    query: string,
    topK: number = 8,
    filters?: RagSearchFilters
  ) => {
    if (!query.trim()) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('rag-answer', {
        body: {
          query_text: query,
          top_k: Math.min(topK, 20),
          filters
        }
      });

      if (error) {
        if (error.message?.includes('401')) {
          toast({
            title: 'Authentication required',
            description: 'Please sign in to get answers.',
            variant: 'destructive'
          });
          return;
        }
        if (error.message?.includes('429')) {
          toast({
            title: 'Rate limit exceeded',
            description: 'Please try again in a moment.',
            variant: 'destructive'
          });
          return;
        }
        throw error;
      }

      setAnswerData(data);
      setSearchResults(data?.hits || []);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Answer error:', err);
        toast({
          title: 'Failed to get answer',
          description: 'Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSearchResults([]);
    setAnswerData(null);
    setIsLoading(false);
  }, []);

  return {
    isLoading,
    searchResults,
    answerData,
    search,
    getAnswer,
    reset
  };
}
