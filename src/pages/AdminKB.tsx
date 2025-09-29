import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface KBStats {
  org_id: string;
  doc_count: number;
  kb_version: number;
  last_updated: string;
}

export default function AdminKB() {
  const [kbStats, setKbStats] = useState<KBStats[]>([]);
  const [selectedOrg, setSelectedOrg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [reembedding, setReembedding] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchKBStats();
  }, []);

  const fetchKBStats = async () => {
    try {
      const { data, error } = await supabase
        .from('kb_versions')
        .select('org_id, version, updated_at')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const statsPromises = data?.map(async (version) => {
        const { count } = await supabase
          .from('kb_documents')
          .select('*', { count: 'exact', head: true })
          .eq('org_id', version.org_id);

        return {
          org_id: version.org_id,
          doc_count: count || 0,
          kb_version: version.version,
          last_updated: version.updated_at
        };
      }) || [];

      const stats = await Promise.all(statsPromises);
      setKbStats(stats);
    } catch (error) {
      console.error('Error fetching KB stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch knowledge base statistics',
        variant: 'destructive'
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedOrg) {
      toast({
        title: 'Error',
        description: 'Please select an organization and file',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      
      const { error } = await supabase
        .from('kb_documents')
        .insert({
          org_id: selectedOrg,
          title: file.name,
          text: text,
          checksum: await generateChecksum(text)
        });

      if (error) throw error;

      // Increment KB version
      await supabase.rpc('increment_kb_version', { target_org_id: selectedOrg });

      toast({
        title: 'Success',
        description: 'Document uploaded successfully'
      });
      
      fetchKBStats();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUrlAdd = async () => {
    if (!urlInput.trim() || !selectedOrg) {
      toast({
        title: 'Error',
        description: 'Please enter a URL and select an organization',
        variant: 'destructive'
      });
      return;
    }

    try {
      // This would typically fetch content from the URL
      // For now, we'll just store the URL as a placeholder
      const { error } = await supabase
        .from('kb_documents')
        .insert({
          org_id: selectedOrg,
          title: `URL: ${urlInput}`,
          url: urlInput,
          text: `Content from ${urlInput}`, // Placeholder
          checksum: await generateChecksum(urlInput)
        });

      if (error) throw error;

      await supabase.rpc('increment_kb_version', { target_org_id: selectedOrg });

      toast({
        title: 'Success',
        description: 'URL added successfully'
      });
      
      setUrlInput('');
      fetchKBStats();
    } catch (error) {
      console.error('Error adding URL:', error);
      toast({
        title: 'Error',
        description: 'Failed to add URL',
        variant: 'destructive'
      });
    }
  };

  const handleReembed = async (orgId: string) => {
    setReembedding(true);
    try {
      const { error } = await supabase.functions.invoke('batch-embeddings', {
        body: { org_id: orgId }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Re-embedding job started'
      });
      
      fetchKBStats();
    } catch (error) {
      console.error('Error triggering re-embed:', error);
      toast({
        title: 'Error',
        description: 'Failed to start re-embedding',
        variant: 'destructive'
      });
    } finally {
      setReembedding(false);
    }
  };

  const generateChecksum = async (content: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Base Administration</h1>
        <Button onClick={fetchKBStats} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Organization Selection */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Organization Selection</h2>
        <div className="space-y-2">
          <Label htmlFor="org-select">Select Organization</Label>
          <Input
            id="org-select"
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            placeholder="Enter organization ID"
          />
        </div>
      </Card>

      {/* Upload Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Add Documents</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Upload File</Label>
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={uploading || !selectedOrg}
              accept=".txt,.md,.json"
            />
          </div>
          
          <div className="flex space-x-2">
            <Input
              placeholder="Enter URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              disabled={!selectedOrg}
            />
            <Button onClick={handleUrlAdd} disabled={!selectedOrg}>
              Add URL
            </Button>
          </div>
        </div>
      </Card>

      {/* KB Statistics */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Knowledge Base Statistics</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Organization</th>
                <th className="text-left p-2">Documents</th>
                <th className="text-left p-2">KB Version</th>
                <th className="text-left p-2">Last Updated</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {kbStats.map((stat) => (
                <tr key={stat.org_id} className="border-b">
                  <td className="p-2 font-mono text-sm">{stat.org_id}</td>
                  <td className="p-2">{stat.doc_count}</td>
                  <td className="p-2">{stat.kb_version}</td>
                  <td className="p-2">{new Date(stat.last_updated).toLocaleString()}</td>
                  <td className="p-2">
                    <Button
                      size="sm"
                      onClick={() => handleReembed(stat.org_id)}
                      disabled={reembedding}
                    >
                      Re-embed
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}