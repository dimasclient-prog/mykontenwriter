export interface CoreTopic {
  topic: string;
  description: string;
  confidence: string;
  entities: string[];
}

export interface TopicItem {
  topic: string;
  semanticRole: string;
  intentType: string;
  relationship: string;
  priority: 'high' | 'medium' | 'low';
}

export interface TopicalExpansionGroup {
  category: 'foundational' | 'supporting' | 'comparative' | 'advanced';
  label: string;
  description: string;
  topics: TopicItem[];
}

export interface SemanticNode {
  id: string;
  topic: string;
  parentId: string | null;
  relatedIds: string[];
  relationshipType: string;
  layer: number;
}

export interface URLStructureItem {
  suggestedUrl: string;
  topic: string;
  intentStage: string;
  notes: string;
}

export interface CoverageGap {
  area: string;
  description: string;
  suggestedOrder: number;
  type: 'missing' | 'weak' | 'opportunity';
}

export interface TopicalCoverageAnalysis {
  id: string;
  projectId: string;
  coreTopic: CoreTopic;
  topicalExpansion: TopicalExpansionGroup[];
  semanticNetwork: SemanticNode[];
  urlStructure: URLStructureItem[];
  coverageGaps: CoverageGap[];
  websiteUrl: string;
  createdAt: Date;
}
