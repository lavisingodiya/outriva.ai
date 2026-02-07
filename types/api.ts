// API Request and Response Types

export interface ApiError {
  error: string;
  details?: string;
  code?: string;
}

export interface ApiSuccess<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

// Email Generation
export interface EmailGenerationRequest {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resume?: string;
  customPrompt?: string;
}

export interface EmailGenerationResponse {
  subject: string;
  body: string;
}

// LinkedIn Generation
export interface LinkedInGenerationRequest {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resume?: string;
  customPrompt?: string;
}

export interface LinkedInGenerationResponse {
  content: string;
}

// Cover Letter Generation
export interface CoverLetterGenerationRequest {
  jobTitle: string;
  company: string;
  jobDescription: string;
  resume?: string;
  customPrompt?: string;
}

export interface CoverLetterGenerationResponse {
  content: string;
}

// API Key Management
export interface ApiKeyUpdateRequest {
  provider: 'openai' | 'anthropic';
  apiKey?: string;
}

export interface ApiKeyStatusResponse {
  hasOpenAI: boolean;
  hasAnthropic: boolean;
}

// User Management (Admin)
export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}

export interface UserListResponse {
  users: UserWithStats[];
  total: number;
  page: number;
  limit: number;
}

export interface UserWithStats {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  _count: {
    emails: number;
    linkedinPosts: number;
    coverLetters: number;
    resumes: number;
  };
}

// Analytics (Admin)
export interface AnalyticsResponse {
  totalUsers: number;
  totalEmails: number;
  totalLinkedInPosts: number;
  totalCoverLetters: number;
  totalResumes: number;
  mostActiveUsers: Array<{
    id: string;
    email: string;
    name: string | null;
    totalGenerations: number;
  }>;
  dailyStats: Array<{
    date: string;
    emails: number;
    linkedinPosts: number;
    coverLetters: number;
  }>;
}

// Resume Management
export interface ResumeUploadRequest {
  file: File;
  title: string;
}

export interface ResumeResponse {
  id: string;
  title: string;
  fileName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// Custom Prompts
export interface CustomPrompt {
  id: string;
  userId: string;
  type: 'email' | 'linkedin' | 'coverLetter';
  name: string;
  prompt: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomPromptRequest {
  type: 'email' | 'linkedin' | 'coverLetter';
  name: string;
  prompt: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalEmails: number;
  totalLinkedInPosts: number;
  totalCoverLetters: number;
  totalResumes: number;
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: 'email' | 'linkedin' | 'coverLetter';
  company: string;
  jobTitle: string;
  createdAt: Date;
}
