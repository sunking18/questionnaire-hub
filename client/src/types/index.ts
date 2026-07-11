// User
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: string;
  createdAt?: string;
}

// Questionnaire
export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  type: 'radio' | 'checkbox' | 'text' | 'textarea' | 'matrix' | 'rating' | 'dropdown';
  title: string;
  required: boolean;
  options?: QuestionOption[];
  dimension?: string;
  scoreRange?: { min: number; max: number };
  reverseScore?: boolean;
}

export interface Questionnaire {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'paused' | 'closed';
  settings: Record<string, any>;
  theme: Record<string, any>;
  questions: Question[];
  fillCount: number;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  sourceScaleId?: string;
  reportConfigs?: ReportConfig | null;
  _count?: { responses: number };
}

// Scale
export interface Scale {
  id: string;
  name: string;
  nameEn?: string;
  abbreviation?: string;
  category: string;
  description?: string;
  questions: Question[];
  dimensions: any[];
  cronbachAlpha?: number;
  author?: string;
  year?: number;
  source?: string;
  questionCount?: number;
}

// Response
export interface Response {
  id: string;
  questionnaireId: string;
  respondentId?: string;
  answers: Record<string, any>;
  score: Record<string, any>;
  totalScore?: number;
  severityLevel?: string;
  duration?: number;
  createdAt: string;
  questionnaire?: { title: string };
  report?: { id: string; severityLevel: string; status: string };
}

// Report
export interface ScoringRule {
  id: string;
  name: string;
  min: number;
  max: number;
  color: string;
  systemPrompt: string;
  userPrompt?: string;
}

export interface ReportConfig {
  id: string;
  questionnaireId: string;
  enabled: boolean;
  reportTitle?: string;
  reportStyle: string;
  aiModel: string;
  showOnSubmit: boolean;
  allowDownload: boolean;
  scoringRules: ScoringRule[];
}

export interface Report {
  id: string;
  questionnaireId: string;
  responseId: string;
  totalScore: number;
  severityLevel: string;
  matchedRuleId?: string;
  aiModel: string;
  aiContent?: string;
  aiHtml?: string;
  tokensUsed: number;
  generationTime: number;
  status: string;
  createdAt: string;
  questionnaire?: { title: string; questions: Question[] };
  response?: Response;
}

// Distribution
export interface Distribution {
  id: string;
  questionnaireId: string;
  channelType: string;
  shareCode: string;
  shareUrl?: string;
  qrCodeUrl?: string;
  fillCount: number;
  maxFills?: number;
  createdAt: string;
}

// Statistics
export interface DimensionStat {
  dimension: string;
  itemCount: number;
  avgScore: number;
  stddev: number;
  maxPossibleScore: number;
}

export interface QuestionStat {
  questionId: string;
  title: string;
  type: string;
  avgScore: number;
  stddev: number;
  median: number;
  mode: number;
  optionDistribution: Record<string, number>;
}

export interface StatisticsData {
  totalResponses: number;
  avgTotalScore: number | null;
  medianTotalScore: number | null;
  stddevTotalScore: number | null;
  minTotalScore: number | null;
  maxTotalScore: number | null;
  severityDistribution: Record<string, number>;
  scoreDistribution: { range: string; min: number; max: number; count: number }[];
  dimensionStats: DimensionStat[];
  questionStats: QuestionStat[];
}

// Aggregate Analysis
export interface Alert {
  level: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
}

export interface AggregateAnalysis {
  id: string;
  questionnaireId: string;
  totalResponses: number;
  avgTotalScore: number;
  medianTotalScore: number;
  stddevTotalScore: number;
  dimensionAvg: Record<string, number>;
  severityDist: Record<string, number>;
  scoreDist: { range: string; min: number; max: number; count: number }[];
  analysisContent?: string;
  analysisHtml?: string;
  alerts: Alert[];
  tokensUsed: number;
}

// Pagination
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
  message?: string;
}
