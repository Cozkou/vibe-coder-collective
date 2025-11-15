export const MASTER_DOCUMENT_PATH =
  process.env.ADT_MASTER_DOC ??
  "adt/document-store/master-document.json";

export const PATCH_WORKSPACE_ROOT =
  process.env.ADT_WORKSPACE_ROOT ?? process.cwd();

export const DEFAULT_ACTOR = "adt-system";

export const PIPELINE_CHANNELS = {
  documentUploaded: "document_uploaded",
  commandReceived: "nlp_command_received",
  taskComplete: "task_completed",
  proposalDecision: "proposal_decided",
} as const;

