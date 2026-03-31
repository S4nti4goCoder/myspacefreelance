export type ProjectStatus =
  | "todo"
  | "progress"
  | "review"
  | "done"
  | "cancelled"
  | "archived";
export type TaskStatus = "todo" | "progress" | "review" | "done";
export type UserRole = "freelancer" | "client" | "collaborator";
export type QuoteStatus =
  | "draft"
  | "sent"
  | "accepted"
  | "rejected"
  | "archived";
export type DiscountType = "percentage" | "fixed";

export type CollaboratorModule =
  | "projects"
  | "tasks"
  | "documents"
  | "attachments"
  | "payments"
  | "quotes"
  | "services"
  | "clients"
  | "comments"
  | "reports";

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string | null;
  notes: string | null;
  password_changed: boolean;
  created_at: string;
  nit: string | null;
  address: string | null;
  city: string | null;
  website: string | null;
  logo_url: string | null;
  apply_iva: boolean;
  apply_retefuente: boolean;
  apply_reteica: boolean;
  iva_rate: number;
  retefuente_rate: number;
  reteica_rate: number;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  status: ProjectStatus;
  budget: number | null;
  progress: number;
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

export interface QuoteItem {
  id: string;
  quote_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  order_index: number;
}

export interface Quote {
  id: string;
  user_id: string;
  project_id: string | null;
  quote_number: string;
  status: QuoteStatus;
  valid_days: number;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  client_is_company: boolean;
  client_company: string | null;
  client_nit: string | null;
  apply_iva: boolean;
  apply_retefuente: boolean;
  apply_reteica: boolean;
  iva_rate: number;
  retefuente_rate: number;
  reteica_rate: number;
  discount_type: DiscountType;
  discount_value: number;
  terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: Omit<QuoteItem, "quote_id">[];
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  price: number;
  category: string | null;
  created_at: string;
}

export interface CollaboratorPermission {
  id: string;
  collaborator_id: string;
  module: CollaboratorModule;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
}

export interface Collaborator {
  id: string;
  collaborator_id: string;
  owner_id: string;
  created_at: string;
  profile?: Profile;
  permissions?: CollaboratorPermission[];
  projects?: Project[];
}

export type NotificationType =
  | "comment"
  | "payment"
  | "task"
  | "project"
  | "quote"
  | "system";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  project_id: string | null;
  created_at: string;
}

// Mapa de permisos indexado por módulo para acceso rápido
export type PermissionsMap = Partial<
  Record<CollaboratorModule, CollaboratorPermission>
>;
