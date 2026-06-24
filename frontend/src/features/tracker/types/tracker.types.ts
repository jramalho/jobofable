export type ApplicationStatus =
  | 'saved'
  | 'applied'
  | 'recruiter_screen'
  | 'technical_interview'
  | 'assignment'
  | 'final_interview'
  | 'offer'
  | 'rejected'
  | 'ghosted'
  | 'withdrawn';

export type FollowUpStatus = 'pending' | 'completed' | 'dismissed';
export type GeneratedDocumentType = 'resume' | 'coverLetter';

export interface Company {
  id: string;
  name: string;
  normalizedName: string;
  website: string | null;
  domain: string | null;
  country: string | null;
  timezone: string | null;
  notes: string | null;
  blacklistedReason: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { applications: number; contacts: number };
}

export interface AnalysisSummary {
  id: string;
  companyName: string | null;
  jobTitle: string | null;
  matchScore: number | null;
  createdAt: string;
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  type: string;
  notes: string | null;
  occurredAt: string;
  createdAt: string;
}

export interface Contact {
  id: string;
  companyId: string | null;
  applicationId: string | null;
  name: string;
  role: string | null;
  email: string | null;
  linkedInUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FollowUpTask {
  id: string;
  applicationId: string;
  title: string;
  dueAt: string;
  completedAt: string | null;
  status: FollowUpStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedDocumentMeta {
  id: string;
  type: GeneratedDocumentType;
  title: string | null;
  candidateName: string | null;
  companyName: string | null;
  jobTitle: string | null;
  createdAt: string;
}

export interface ApplicationCounts {
  documents: number;
  followUpTasks: number;
  events: number;
  contacts: number;
}

/** Scalar columns shared by list items and the full detail. */
export interface ApplicationFields {
  id: string;
  companyId: string | null;
  analysisId: string | null;
  jobTitle: string;
  jobUrl: string | null;
  source: string | null;
  status: ApplicationStatus;
  appliedAt: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  contractType: string | null;
  remoteType: string | null;
  jobDescription: string | null;
  matchScore: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationListItem extends ApplicationFields {
  company: Company | null;
  analysis: AnalysisSummary | null;
  documentsCount: number;
  counts: ApplicationCounts;
  nextFollowUp: FollowUpTask | null;
}

export interface ApplicationDetail extends ApplicationListItem {
  events: ApplicationEvent[];
  contacts: Contact[];
  followUpTasks: FollowUpTask[];
  documents: GeneratedDocumentMeta[];
}

/** Body for create/update of an application (all optional except jobTitle on create). */
export interface ApplicationInput {
  companyName?: string;
  jobTitle?: string;
  jobUrl?: string;
  source?: string;
  status?: ApplicationStatus;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  contractType?: string;
  remoteType?: string;
  jobDescription?: string;
  notes?: string;
  analysisId?: string;
}

export interface ContactInput {
  name: string;
  role?: string;
  email?: string;
  linkedInUrl?: string;
  notes?: string;
}

export interface FollowUpInput {
  title: string;
  dueAt: string;
  status?: FollowUpStatus;
}

export interface EventInput {
  type: string;
  notes?: string;
  occurredAt?: string;
}

export interface DuplicateCheckArgs {
  companyName?: string;
  jobTitle?: string;
  jobUrl?: string;
  jobDescription?: string;
}

export interface DuplicateApplicationMatch {
  id: string;
  companyName: string | null;
  jobTitle: string;
  status: ApplicationStatus;
  appliedAt: string | null;
  jobUrl: string | null;
  matchReason: string;
}

export interface DuplicateCheckResult {
  possibleDuplicateCompany: boolean;
  possibleDuplicateApplications: DuplicateApplicationMatch[];
}

export interface JobListing {
  id: string;
  source: string;
  title: string;
  company: string;
  url: string;
  location: string | null;
  remote: boolean;
  tags: string[];
  description: string;
  salary: string | null;
  postedAt: string | null;
}

export interface JobSearchArgs {
  keywords: string[];
  remoteOnly?: boolean;
  limit?: number;
}

export interface JobSearchResponse {
  jobs: JobListing[];
  totalFound: number;
  alreadyTracked: number;
  sources: string[];
}
