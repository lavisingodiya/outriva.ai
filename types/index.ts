import { Length, ApplicationStatus, LinkedInMessageType, EmailMessageType, TabType } from '@prisma/client';

export type { Length, ApplicationStatus, LinkedInMessageType, EmailMessageType, TabType };

export interface User {
  id: string;
  email: string;
  openaiApiKey?: string | null;
  anthropicApiKey?: string | null;
  geminiApiKey?: string | null;
  defaultResumeId?: string | null;
  defaultLlmModel?: string | null;
  defaultLength: Length;
  autoSaveCoverLetters: boolean;
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl: string;
  content: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomPrompt {
  id: string;
  userId: string;
  name: string;
  content: string;
  tabType: TabType;
  createdAt: Date;
  updatedAt: Date;
}

export interface CoverLetter {
  id: string;
  userId: string;
  resumeId?: string | null;
  companyName?: string | null;
  positionTitle?: string | null;
  jobDescription?: string | null;
  companyDescription?: string | null;
  content: string;
  length: Length;
  llmModel?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkedInMessage {
  id: string;
  userId: string;
  resumeId?: string | null;
  recipientName?: string | null;
  linkedinUrl: string;
  positionTitle: string;
  companyName: string;
  messageContent: string;
  messageType: LinkedInMessageType;
  parentMessageId?: string | null;
  jobDescription?: string | null;
  companyDescription?: string | null;
  length: Length;
  llmModel?: string | null;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailMessage {
  id: string;
  userId: string;
  resumeId?: string | null;
  recipientEmail: string;
  recipientName?: string | null;
  positionTitle: string;
  companyName: string;
  subjectLine: string;
  messageContent: string;
  messageType: EmailMessageType;
  parentMessageId?: string | null;
  jobDescription?: string | null;
  companyDescription?: string | null;
  length: Length;
  llmModel?: string | null;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}
