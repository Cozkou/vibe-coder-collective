export type FeatureStatus =
  | "pending"
  | "in_progress"
  | "awaiting_approval"
  | "approved"
  | "rejected"
  | "completed";

export interface BaseAppDefinition {
  summary: string;
  architecture: string[];
  tech_stack: string[];
  key_routes: string[];
}

export interface FeatureDefinition {
  id: string;
  title: string;
  description: string;
  status: FeatureStatus;
  owner?: string;
  tags?: string[];
  files?: string[];
}

export interface TaskDefinition {
  id: string;
  feature_id: string;
  title: string;
  description: string;
  status: "pending" | "running" | "blocked" | "done";
  files: string[];
  assignee?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
}

export interface ProposalDefinition {
  id: string;
  type: "new_feature";
  title: string;
  description: string;
  created_by: string;
  status: "awaiting_approval" | "approved" | "rejected";
  decided_by?: string;
  decided_at?: string;
}

export interface MasterDocument {
  project_id: string;
  source_document_path: string;
  base_app: BaseAppDefinition;
  features: FeatureDefinition[];
  proposals: ProposalDefinition[];
  tasks: TaskDefinition[];
  activity_log: ActivityLogEntry[];
  updated_at: string;
}

export interface ActivityLogEntry {
  id: string;
  type:
    | "document_split"
    | "proposal_created"
    | "proposal_updated"
    | "task_created"
    | "task_completed"
    | "feature_status_changed";
  payload: Record<string, unknown>;
  timestamp: string;
  actor: string;
}

export interface NLPCommand {
  command_id: string;
  raw_text: string;
  issued_by: string;
  issued_at: string;
}

export interface CoordinatorDecision {
  command: NLPCommand;
  action:
    | {
        type: "modify_existing";
        feature_id: string;
        instructions: string;
      }
    | {
        type: "implement_approved";
        feature_id: string;
        instructions: string;
      }
    | {
        type: "new_proposal";
        proposal: ProposalDefinition;
      };
}

