import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, FileText, Search, Upload } from "lucide-react";

export default function AdminKnowledgeBase() {
  const [isIngesting, setIsIngesting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    title: "",
    source_type: "faq" as "faq" | "service" | "policy" | "pricing" | "custom",
    content: "",
  });

  const handleIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsIngesting(true);

    try {
      // Get current user's organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { data: membership } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        toast.error("No organization found");
        return;
      }

      const { data, error } = await supabase.functions.invoke("kb-ingest", {
        body: {
          ...formData,
          organization_id: membership.org_id,
        },
      });

      if (error) throw error;

      toast.success(`Knowledge ingested! ${data.chunks_created} chunks created with ${data.embeddings_created} embeddings`);
      
      // Reset form
      setFormData({
        title: "",
        source_type: "faq",
        content: "",
      });
    } catch (error: any) {
      console.error("Ingest error:", error);
      toast.error(error.message || "Failed to ingest knowledge");
    } finally {
      setIsIngesting(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in");
        return;
      }

      const { data: membership } = await supabase
        .from("organization_members")
        .select("org_id")
        .eq("user_id", user.id)
        .single();

      if (!membership) {
        toast.error("No organization found");
        return;
      }

      const { data, error } = await supabase.functions.invoke("kb-search", {
        body: {
          query: searchQuery,
          organization_id: membership.org_id,
          match_count: 6,
          match_threshold: 0.7,
        },
      });

      if (error) throw error;

      setSearchResults(data.results || []);
      toast.success(`Found ${data.count} relevant chunks`);
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(error.message || "Failed to search knowledge base");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Knowledge Base Management</h1>
        <p className="text-muted-foreground">
          Ingest FAQ, services, policies, and pricing info for RAG-powered AI responses
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Ingest Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Ingest Content
            </CardTitle>
            <CardDescription>
              Add new content to the knowledge base. It will be chunked and embedded automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIngest} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., 'Service Hours FAQ'"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="source_type">Type</Label>
                <Select
                  value={formData.source_type}
                  onValueChange={(value: any) => setFormData({ ...formData, source_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="faq">FAQ</SelectItem>
                    <SelectItem value="service">Service</SelectItem>
                    <SelectItem value="policy">Policy</SelectItem>
                    <SelectItem value="pricing">Pricing</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Paste your content here. Use paragraphs for natural chunking."
                  rows={12}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Content will be automatically chunked into ~500 character segments
                </p>
              </div>

              <Button type="submit" disabled={isIngesting} className="w-full">
                {isIngesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingesting...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Ingest Content
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Search/Test Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Test Search
            </CardTitle>
            <CardDescription>
              Search the knowledge base to test retrieval quality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="search">Search Query</Label>
                <Input
                  id="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g., 'What are your business hours?'"
                  required
                />
              </div>

              <Button type="submit" disabled={isSearching} className="w-full">
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Search Knowledge Base
                  </>
                )}
              </Button>
            </form>

            {/* Results */}
            <div className="space-y-4">
              {searchResults.map((result, index) => (
                <Card key={result.chunk_id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-sm">{result.source_title}</h4>
                        <p className="text-xs text-muted-foreground">
                          {result.source_type} • Similarity: {(result.similarity * 100).toFixed(1)}%
                        </p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                        #{index + 1}
                      </span>
                    </div>
                    <p className="text-sm mt-2 leading-relaxed">{result.chunk_text}</p>
                  </CardContent>
                </Card>
              ))}
              
              {searchResults.length === 0 && searchQuery && !isSearching && (
                <p className="text-center text-muted-foreground py-8">
                  No results found. Try a different query or ingest more content.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
