export type AnnouncementCategory =
  | 'Examination'
  | 'Enrollment'
  | 'Submission Deadline'
  | 'Academic Requirement'
  | 'Event / Seminar'
  | 'General Notice'
  | 'Other';

export type PriorityLevel = 'High' | 'Medium' | 'Low';

export type AppPage = 'dashboard' | 'upload' | 'processing' | 'review' | 'manage';

export interface ImportantDateItem {
  id: string;
  label: string;
  rawText: string;
  normalizedDate: string | null;
  time: string | null;
}

export interface DeadlineItem {
  id: string;
  task: string;
  rawText: string;
  dueDate: string | null;
  dueTime: string | null;
  isCompleted: boolean;
}

export interface ActionItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Announcement {
  id: string;
  title: string;
  originalText: string | null;
  category: AnnouncementCategory;
  shortSummary: string;
  targetAudience: string | null;
  importantDates: ImportantDateItem[];
  deadlines: DeadlineItem[];
  requiredActions: ActionItem[];
  requiredDocuments: string[];
  priority: PriorityLevel;
  uncertainOrMissingInfo: string[];
  imageUrl: string | null;
  imageName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementDraft {
  editingId?: string;
  title: string;
  originalText: string;
  category: AnnouncementCategory;
  shortSummary: string;
  targetAudience: string;
  importantDates: ImportantDateItem[];
  deadlines: DeadlineItem[];
  requiredActions: ActionItem[];
  requiredDocuments: string[];
  priority: PriorityLevel;
  uncertainOrMissingInfo: string[];
  imageUrl: string | null;
  imageName: string | null;
}

export interface SampleUploadPreset {
  id: string;
  label: string;
  subtitle: string;
  imageUrl: string;
  imageName: string;
  fileSizeLabel: string;
  draft: AnnouncementDraft;
}

export interface UploadedImageState {
  imageUrl: string;
  imageName: string;
  fileSizeBytes: number;
  dimensionsLabel: string | null;
  presetId: string | null;
}
