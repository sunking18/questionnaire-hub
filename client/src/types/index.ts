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

export interface MatrixRow {
  id: string;
  label: string;
}

export interface MatrixColumn {
  id: string;
  label: string;
}

export interface ScaleConfig {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  type: 'number' | 'star' | 'heart' | 'emoji' | 'slider';
}

export interface Question {
  id: string;
  type: 'radio' | 'checkbox' | 'dropdown' | 'sort' | 'file' | 'text' | 'textarea' | 'number' | 'date' | 'rating' | 'scale' | 'matrix' | 'nps' | 'slider' | 'page' | 'paragraph' | 'section' | 'name' | 'idcard' | 'age' | 'gender' | 'education' | 'ethnicity' | 'marriage' | 'country' | 'province' | 'region' | 'email' | 'phone' | 'phoneVerify' | 'birthday' | 'time' | 'occupation' | 'university' | 'industry' | 'password' | 'address' | 'device' | 'cityLevel' | 'company';
  title: string;
  required: boolean;
  placeholder?: string;
  description?: string;
  options?: QuestionOption[];
  matrixRows?: MatrixRow[];
  matrixColumns?: MatrixColumn[];
  dimension?: string;
  scaleConfig?: ScaleConfig;
  scoreRange?: { min: number; max: number };
  reverseScore?: boolean;
  displayLogic?: Record<string, any>;
  personalInfoType?: string;
}

export interface CoverSettings {
  enabled: boolean;
  title: string;
  description?: string;
  coverImage?: string;
  mobileCoverImage?: string;
  startTime?: string;
  endTime?: string;
  submitButtonText: string;
  showProgress: boolean;
  showTimer: boolean;
}

// Structured questionnaire settings (stored in the `settings` JSON field)
export interface QuestionnaireSettings {
  // Basic settings
  timeControl?: {
    enabled?: boolean;
    startTime?: string;
    endTime?: string;
  };
  password?: {
    enabled?: boolean;
    value?: string;
  };
  language?: string;
  // After submit display
  afterSubmit?: {
    type?: 'thanks' | 'redirect' | 'conditional' | 'custom';
    thanksMessage?: string;
    redirectUrl?: string;
    customResult?: boolean;
    enableCoupon?: boolean;
  };
  // Answer limit
  answerLimit?: {
    deviceControl?: boolean;
    ipLimit?: boolean;
    wechatOnly?: boolean;
    enableMaxResponses?: boolean;
    maxResponses?: number;
  };
  // Submit control
  submitControl?: {
    allowResume?: boolean;
    allowPreview?: boolean;
    allowViewAfterSubmit?: boolean;
    enableCaptcha?: boolean;
    hideSourceInfo?: boolean;
  };
  // Share & query
  share?: {
    allowCopy?: boolean;
    allowSearchEngine?: boolean;
    dataShare?: boolean;
    externalQuery?: boolean;
  };
  // Other
  other?: {
    displaySettings?: boolean;
    dataPush?: boolean;
    saveContacts?: boolean;
  };
}

export interface QuestionnaireTheme {
  themeId?: string;
  primaryColor?: string;
  background?: {
    type?: 'color' | 'image' | 'gradient';
    color?: string;
    image?: string;
    gradient?: string;
  };
  cover?: {
    enabled?: boolean;
    title?: string;
    description?: string;
    image?: string;
  };
  header?: {
    enabled?: boolean;
    logo?: string;
    text?: string;
    align?: 'left' | 'center' | 'right';
  };
  footer?: {
    enabled?: boolean;
    text?: string;
    align?: 'left' | 'center' | 'right';
  };
  textStyle?: {
    fontFamily?: string;
    fontSize?: 'small' | 'normal' | 'large';
    titleColor?: string;
    textColor?: string;
  };
  display?: {
    showQuestionNumber?: boolean;
    showProgress?: boolean;
    showTimer?: boolean;
    showRequiredMark?: boolean;
    compactMode?: boolean;
  };
}

export interface Questionnaire {
  id: string;
  userId: string;
  title: string;
  description?: string;
  type: 'survey' | 'ai-interview';
  coverImage?: string;
  coverSettings?: CoverSettings;
  status: 'draft' | 'published' | 'paused' | 'closed';
  settings: QuestionnaireSettings;
  theme: QuestionnaireTheme;
  questions: Question[];
  fillCount: number;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  isStarred?: boolean;
  sourceScaleId?: string;
  sourceTemplateId?: string;
  reportConfigs?: ReportConfig[] | null;
  notificationConfig?: NotificationConfig | null;
  _count?: { responses: number };
}

// Notification
export interface NotificationConfig {
  id?: string;
  questionnaireId?: string;
  wechatEnabled?: boolean;
  wechatOpenId?: string;
  emailEnabled?: boolean;
  emailAddresses?: string;
  useCustomEmailServer?: boolean;
  wecomEnabled?: boolean;
  wecomWebhook?: string;
  dingtalkEnabled?: boolean;
  dingtalkWebhook?: string;
  feishuEnabled?: boolean;
  feishuWebhook?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Template
export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags: string[];
  coverImage?: string;
  questions: Question[];
  settings: Record<string, any>;
  isPublic: boolean;
  fillCount: number;
  createdAt: string;
  updatedAt: string;
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
  severity?: string;
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
