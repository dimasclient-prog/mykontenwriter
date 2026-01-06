import { useState, useMemo } from 'react';
import { Sparkles, Loader2, Search, ArrowUpDown, Filter, FileText, Plus, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export type KeywordType = 'short-tail' | 'long-tail' | 'lsi' | 'transactional';

export interface GeneratedKeyword {
  keyword: string;
  type: KeywordType;
  hasArticle?: boolean;
}

interface KeywordIdeasManagerProps {
  generatedKeywords: GeneratedKeyword[];
  onKeywordsGenerated: (keywords: GeneratedKeyword[]) => void;
  existingArticleTitles: string[];
  language: string;
  projectKeywords: string[];
  onAddToProjectKeywords: (keywords: string[]) => void;
  onCreateArticles: (keywords: string[]) => void;
}

const TYPE_LABELS: Record<KeywordType, string> = {
  'short-tail': 'Short Tail',
  'long-tail': 'Long Tail',
  'lsi': 'LSI',
  'transactional': 'Transactional',
};

const TYPE_COLORS: Record<KeywordType, string> = {
  'short-tail': 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  'long-tail': 'bg-green-500/20 text-green-700 border-green-500/30',
  'lsi': 'bg-purple-500/20 text-purple-700 border-purple-500/30',
  'transactional': 'bg-orange-500/20 text-orange-700 border-orange-500/30',
};

export function KeywordIdeasManager({
  generatedKeywords,
  onKeywordsGenerated,
  existingArticleTitles,
  language,
  projectKeywords,
  onAddToProjectKeywords,
  onCreateArticles,
}: KeywordIdeasManagerProps) {
  const [seedKeyword, setSeedKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<KeywordType | 'all'>('all');
  const [articleFilter, setArticleFilter] = useState<'all' | 'with-article' | 'without-article'>('all');
  const [sortBy, setSortBy] = useState<'keyword' | 'type'>('keyword');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(new Set());

  // Check if keyword has article by matching against article titles
  const keywordsWithArticleStatus = useMemo(() => {
    return generatedKeywords.map(kw => ({
      ...kw,
      hasArticle: existingArticleTitles.some(title => 
        title.toLowerCase().includes(kw.keyword.toLowerCase()) ||
        kw.keyword.toLowerCase().includes(title.toLowerCase())
      ),
      isInProject: projectKeywords.some(pk => 
        pk.toLowerCase() === kw.keyword.toLowerCase()
      ),
    }));
  }, [generatedKeywords, existingArticleTitles, projectKeywords]);

  // Filter and sort keywords
  const filteredKeywords = useMemo(() => {
    let filtered = keywordsWithArticleStatus;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(kw => 
        kw.keyword.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(kw => kw.type === typeFilter);
    }

    // Article filter
    if (articleFilter === 'with-article') {
      filtered = filtered.filter(kw => kw.hasArticle);
    } else if (articleFilter === 'without-article') {
      filtered = filtered.filter(kw => !kw.hasArticle);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'keyword') {
        comparison = a.keyword.localeCompare(b.keyword);
      } else {
        comparison = a.type.localeCompare(b.type);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [keywordsWithArticleStatus, searchQuery, typeFilter, articleFilter, sortBy, sortOrder]);

  // Stats by type
  const stats = useMemo(() => {
    const counts = {
      total: generatedKeywords.length,
      'short-tail': 0,
      'long-tail': 0,
      'lsi': 0,
      'transactional': 0,
      withArticle: 0,
    };
    
    keywordsWithArticleStatus.forEach(kw => {
      counts[kw.type]++;
      if (kw.hasArticle) counts.withArticle++;
    });

    return counts;
  }, [generatedKeywords, keywordsWithArticleStatus]);

  const handleGenerate = async () => {
    if (!seedKeyword.trim()) {
      toast.error('Please enter a seed keyword/topic');
      return;
    }

    setIsGenerating(true);
    setSelectedKeywords(new Set()); // Clear selection when generating new keywords

    try {
      const { data, error } = await supabase.functions.invoke('generate-keywords', {
        body: {
          seedKeyword: seedKeyword.trim(),
          language,
        },
      });

      if (error) {
        console.error('Keyword generation error:', error);
        toast.error(error.message || 'Failed to generate keywords');
        return;
      }

      if (data?.keywords && Array.isArray(data.keywords)) {
        onKeywordsGenerated(data.keywords);
        toast.success(`Generated ${data.keywords.length} keyword ideas!`);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (err) {
      console.error('Keyword generation error:', err);
      toast.error('Failed to generate keywords');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleSort = (column: 'keyword' | 'type') => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const toggleKeywordSelection = (keyword: string) => {
    setSelectedKeywords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyword)) {
        newSet.delete(keyword);
      } else {
        newSet.add(keyword);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedKeywords.size === filteredKeywords.length && filteredKeywords.length > 0) {
      // Deselect all
      setSelectedKeywords(new Set());
    } else {
      // Select all filtered keywords
      setSelectedKeywords(new Set(filteredKeywords.map(kw => kw.keyword)));
    }
  };

  const isAllSelected = filteredKeywords.length > 0 && selectedKeywords.size === filteredKeywords.length;
  const isSomeSelected = selectedKeywords.size > 0 && selectedKeywords.size < filteredKeywords.length;

  const handleAddToProjectKeywords = () => {
    if (selectedKeywords.size === 0) {
      toast.error('Please select at least one keyword');
      return;
    }

    const keywordsToAdd = Array.from(selectedKeywords).filter(
      kw => !projectKeywords.some(pk => pk.toLowerCase() === kw.toLowerCase())
    );

    if (keywordsToAdd.length === 0) {
      toast.info('All selected keywords are already in project keywords');
      return;
    }

    onAddToProjectKeywords(keywordsToAdd);
    toast.success(`Added ${keywordsToAdd.length} keywords to project`);
    setSelectedKeywords(new Set());
  };

  const handleCreateArticles = () => {
    if (selectedKeywords.size === 0) {
      toast.error('Please select at least one keyword');
      return;
    }

    onCreateArticles(Array.from(selectedKeywords));
  };

  return (
    <div className="space-y-6">
      {/* Seed Keyword Input */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Generate Keyword Ideas
          </CardTitle>
          <CardDescription>
            Enter a seed keyword or topic to generate 100 keyword ideas across 4 types
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="seedKeyword">Seed Keyword / Topic</Label>
              <Input
                id="seedKeyword"
                value={seedKeyword}
                onChange={(e) => setSeedKeyword(e.target.value)}
                placeholder="e.g., digital marketing, coffee shop, web development..."
                onKeyDown={(e) => e.key === 'Enter' && !isGenerating && handleGenerate()}
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !seedKeyword.trim()}
                className="gap-2"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                Generate From Topic
              </Button>
            </div>
          </div>
          
          {/* Type descriptions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={TYPE_COLORS['short-tail']}>Short Tail</Badge>
              <span>1-2 words</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={TYPE_COLORS['long-tail']}>Long Tail</Badge>
              <span>3+ words</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={TYPE_COLORS['lsi']}>LSI</Badge>
              <span>Related terms</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className={TYPE_COLORS['transactional']}>Transactional</Badge>
              <span>Buyer intent</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      {generatedKeywords.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Keyword Ideas ({stats.total})</CardTitle>
                <CardDescription className="flex flex-wrap gap-2 mt-1">
                  <span>Short Tail: {stats['short-tail']}</span>
                  <span>•</span>
                  <span>Long Tail: {stats['long-tail']}</span>
                  <span>•</span>
                  <span>LSI: {stats['lsi']}</span>
                  <span>•</span>
                  <span>Transactional: {stats['transactional']}</span>
                  <span>•</span>
                  <span className="text-success">With Article: {stats.withArticle}</span>
                </CardDescription>
              </div>
              
              {/* Action buttons */}
              {selectedKeywords.size > 0 && (
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddToProjectKeywords}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add to Keywords ({selectedKeywords.size})
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleCreateArticles}
                    className="gap-2"
                  >
                    <Lightbulb className="w-4 h-4" />
                    Create Articles ({selectedKeywords.size})
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search keywords..."
                    className="pl-9"
                  />
                </div>
              </div>
              <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as KeywordType | 'all')}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="short-tail">Short Tail</SelectItem>
                  <SelectItem value="long-tail">Long Tail</SelectItem>
                  <SelectItem value="lsi">LSI</SelectItem>
                  <SelectItem value="transactional">Transactional</SelectItem>
                </SelectContent>
              </Select>
              <Select value={articleFilter} onValueChange={(v) => setArticleFilter(v as typeof articleFilter)}>
                <SelectTrigger className="w-[180px]">
                  <FileText className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Article Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Keywords</SelectItem>
                  <SelectItem value="with-article">With Article</SelectItem>
                  <SelectItem value="without-article">Without Article</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        ref={(ref) => {
                          if (ref) {
                            (ref as HTMLButtonElement).dataset.state = isSomeSelected ? 'indeterminate' : isAllSelected ? 'checked' : 'unchecked';
                          }
                        }}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead className="w-[50px]">#</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleSort('keyword')}
                    >
                      <div className="flex items-center gap-2">
                        Keyword
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted/50 w-[140px]"
                      onClick={() => toggleSort('type')}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        <ArrowUpDown className="w-4 h-4" />
                      </div>
                    </TableHead>
                    <TableHead className="w-[120px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKeywords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No keywords found matching your filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKeywords.map((kw, index) => (
                      <TableRow 
                        key={`${kw.keyword}-${index}`}
                        className={selectedKeywords.has(kw.keyword) ? 'bg-primary/5' : ''}
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedKeywords.has(kw.keyword)}
                            onCheckedChange={() => toggleKeywordSelection(kw.keyword)}
                            aria-label={`Select ${kw.keyword}`}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {kw.keyword}
                            {kw.isInProject && (
                              <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                                In Project
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={TYPE_COLORS[kw.type]}>
                            {TYPE_LABELS[kw.type]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {kw.hasArticle ? (
                            <Badge className="bg-success/20 text-success border-success/30">
                              Created
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Not yet
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Showing {filteredKeywords.length} of {stats.total} keywords</span>
              {selectedKeywords.size > 0 && (
                <span className="text-primary font-medium">{selectedKeywords.size} selected</span>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
