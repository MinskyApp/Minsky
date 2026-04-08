// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'admin' | 'editor' | 'viewer'

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'done'

export type KanbanColumn = 'todo' | 'in_progress' | 'in_review' | 'done'

// ─── Database Row Types ───────────────────────────────────────────────────────

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export interface Task {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  kanban_column: KanbanColumn
  assignee_id: string | null
  due_date: string | null
  created_by: string | null
  created_at: string
}

export interface Channel {
  id: string
  name: string
  description: string | null
  created_at: string
}

export interface Message {
  id: string
  channel_id: string
  sender_id: string | null
  content: string
  file_url: string | null
  created_at: string
}

export interface Asset {
  id: string
  name: string
  storage_path: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

// ─── Joined / View Types ─────────────────────────────────────────────────────

export interface TaskWithAssignee extends Task {
  assignee: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

export interface MessageWithSender extends Message {
  sender: Pick<Profile, 'id' | 'full_name' | 'avatar_url'> | null
}

export interface AssetWithUploader extends Asset {
  uploader: Pick<Profile, 'id' | 'full_name'> | null
}

// ─── Server Action State ─────────────────────────────────────────────────────

export interface ActionState {
  error?: string
  success?: string
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavItem {
  label: string
  href: string
  icon: string
}
