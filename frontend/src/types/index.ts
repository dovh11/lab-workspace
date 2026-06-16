// ─────────────────────────────────────────────
// Core entity types mirroring backend schemas
// ─────────────────────────────────────────────

export type SystemRole = "Manager" | "Researcher" | "Intern";
export type ProjectStatus = "Active" | "Archived" | "Completed" | "On Hold";
export type RoleInProject = "Lead" | "Contributor" | "Reviewer";
export type DocType = "LaTeX" | "Word" | "Script" | "Dataset" | "PDF" | "Other";
export type RSVPStatus = "Attending" | "Declined" | "Maybe" | "Pending";
export type ExperimentStatus = "running" | "completed" | "failed";

export interface UserPublic {
  user_id: number;
  username: string;
  full_name: string;
  system_role: SystemRole;
}

export interface User extends UserPublic {
  email: string;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ProjectMember {
  id: number;
  user_id: number;
  role_in_project: RoleInProject;
  joined_at: string;
  user: UserPublic;
}

export interface Project {
  project_id: number;
  title: string;
  description: string | null;
  status: ProjectStatus;
  created_by: number | null;
  creator: UserPublic | null;
  created_at: string;
  updated_at: string | null;
  members: ProjectMember[];
}

export interface ProjectListItem {
  project_id: number;
  title: string;
  description: string | null;
  status: ProjectStatus;
  created_at: string;
  member_count: number;
}

export interface DocumentVersion {
  version_id: number;
  document_id: number;
  version_number: number;
  commit_message: string | null;
  file_path: string | null;
  file_size: number | null;
  uploaded_by: number | null;
  uploader: UserPublic | null;
  created_at: string;
}

export interface Document {
  document_id: number;
  project_id: number;
  title: string;
  doc_type: DocType;
  description: string | null;
  created_by: number | null;
  creator: UserPublic | null;
  created_at: string;
  updated_at: string | null;
  latest_version: DocumentVersion | null;
  version_count: number;
}

export interface MetricsEntry {
  epoch?: number;
  step?: number;
  loss?: number;
  val_loss?: number;
  accuracy?: number;
  val_accuracy?: number;
  [key: string]: number | undefined;
}

export interface AIExperiment {
  experiment_id: number;
  project_id: number;
  experiment_name: string;
  description: string | null;
  framework: string | null;
  hyperparameters: Record<string, unknown> | null;
  metrics_log: MetricsEntry[] | null;
  model_weight_path: string | null;
  status: ExperimentStatus | null;
  created_by: number | null;
  creator: UserPublic | null;
  created_at: string;
  updated_at: string | null;
}

export interface JournalClubAttendee {
  id: number;
  user_id: number;
  rsvp_status: RSVPStatus;
  responded_at: string | null;
  user: UserPublic;
}

export interface JournalClub {
  club_id: number;
  title: string;
  topic: string | null;
  meeting_time: string;
  location_or_link: string | null;
  paper_reference: string | null;
  paper_pdf_url: string | null;
  notes: string | null;
  host_id: number | null;
  host: UserPublic | null;
  attendees: JournalClubAttendee[];
  created_at: string;
}

// ─────────────────────────────────────────────
// API Error type
// ─────────────────────────────────────────────
export interface ApiError {
  detail: string | Array<{ loc: string[]; msg: string; type: string }>;
}
