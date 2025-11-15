import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { MASTER_DOCUMENT_PATH, DEFAULT_ACTOR } from "./constants.js";
import {
  ActivityLogEntry,
  FeatureDefinition,
  MasterDocument,
  ProposalDefinition,
  TaskDefinition,
} from "../types.js";

async function ensureDirectory(path: string) {
  const dir = path.split("/").slice(0, -1).join("/");
  if (!dir) return;
  await fs.mkdir(dir, { recursive: true });
}

export async function readMasterDocument(): Promise<MasterDocument | null> {
  try {
    const raw = await fs.readFile(MASTER_DOCUMENT_PATH, "utf-8");
    return JSON.parse(raw) as MasterDocument;
  } catch (error) {
    return null;
  }
}

export async function writeMasterDocument(doc: MasterDocument): Promise<void> {
  await ensureDirectory(MASTER_DOCUMENT_PATH);
  const serialized = JSON.stringify(
    { ...doc, updated_at: new Date().toISOString() },
    null,
    2,
  );
  await fs.writeFile(MASTER_DOCUMENT_PATH, serialized, "utf-8");
}

export async function appendLog(
  doc: MasterDocument,
  entry: Omit<ActivityLogEntry, "id" | "timestamp" | "actor"> & {
    actor?: string;
  },
): Promise<MasterDocument> {
  const enriched: ActivityLogEntry = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    actor: entry.actor ?? DEFAULT_ACTOR,
    type: entry.type,
    payload: entry.payload,
  };

  const next: MasterDocument = {
    ...doc,
    activity_log: [...doc.activity_log, enriched],
  };

  await writeMasterDocument(next);
  return next;
}

export async function recordTask(
  doc: MasterDocument,
  task: TaskDefinition,
): Promise<MasterDocument> {
  const existingIndex = doc.tasks.findIndex((t) => t.id === task.id);
  const nextTasks =
    existingIndex >= 0
      ? doc.tasks.map((t, idx) => (idx === existingIndex ? task : t))
      : [...doc.tasks, task];

  const nextDoc: MasterDocument = { ...doc, tasks: nextTasks };
  await appendLog(nextDoc, {
    type: "task_created",
    payload: { taskId: task.id, featureId: task.feature_id },
  });
  return nextDoc;
}

export async function updateTaskStatus(
  doc: MasterDocument,
  taskId: string,
  status: TaskDefinition["status"],
): Promise<MasterDocument> {
  const nextDoc: MasterDocument = {
    ...doc,
    tasks: doc.tasks.map((task) =>
      task.id === taskId ? { ...task, status, updated_at: new Date().toISOString() } : task,
    ),
  };

  await appendLog(nextDoc, {
    type: status === "done" ? "task_completed" : "task_created",
    payload: { taskId, status },
  });
  return nextDoc;
}

export async function recordProposal(
  doc: MasterDocument,
  proposal: ProposalDefinition,
): Promise<MasterDocument> {
  const nextDoc: MasterDocument = {
    ...doc,
    proposals: [
      ...doc.proposals.filter((p) => p.id !== proposal.id),
      proposal,
    ],
  };
  await appendLog(nextDoc, {
    type: "proposal_created",
    payload: { proposalId: proposal.id, status: proposal.status },
  });
  return nextDoc;
}

export async function upsertFeature(
  doc: MasterDocument,
  feature: FeatureDefinition,
): Promise<MasterDocument> {
  const nextDoc: MasterDocument = {
    ...doc,
    features: [
      ...doc.features.filter((f) => f.id !== feature.id),
      feature,
    ],
  };

  await appendLog(nextDoc, {
    type: "feature_status_changed",
    payload: { featureId: feature.id, status: feature.status },
  });

  return nextDoc;
}

