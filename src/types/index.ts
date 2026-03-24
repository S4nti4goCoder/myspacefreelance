export type ProjectStatus =
  | "todo"
  | "progress"
  | "review"
  | "done"
  | "cancelled";
export type TaskStatus = "todo" | "progress" | "review" | "done";
export type UserRole = "freelancer" | "client";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  notes: string | null;
  password_changed: boolean;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  profile_client_id: string | null;
  name: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  status: ProjectStatus;
  budget: number | null;
  progress: number;
  share_token: string;
  tags: string[];
  created_at: string;
  client?: Profile | null;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: TaskStatus;
  order_index: number;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Attachment {
  id: string;
  project_id: string;
  document_id: string | null;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size: number | null;
  created_at: string;
}

export interface Payment {
  id: string;
  project_id: string;
  amount: number;
  payment_date: string;
  method: string | null;
  notes: string | null;
  created_at: string;
}

export interface Comment {
  id: string;
  project_id: string;
  author: string;
  message: string;
  is_from_client: boolean;
  created_at: string;
}

export interface ProjectClient {
  id: string;
  project_id: string;
  client_id: string;
  created_at: string;
  profile?: Profile;
  project?: Project;
}
