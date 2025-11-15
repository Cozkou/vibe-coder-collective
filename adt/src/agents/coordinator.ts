import { randomUUID } from "node:crypto";
import { appendLog, readMasterDocument, recordTask } from "../utils/documentStore.js";
import {
  CoordinatorDecision,
  FeatureDefinition,
  NLPCommand,
  ProposalDefinition,
  TaskDefinition,
} from "../types.js";
import { callGeminiJson } from "../utils/llm.js";

export interface CoordinatorInput {
  command: NLPCommand;
}

export interface CoordinatorOutput {
  decision: CoordinatorDecision;
  tasks?: TaskDefinition[];
}

function pickFeature(
  docFeatures: FeatureDefinition[],
  command: NLPCommand,
  targetTitle?: string | null,
): FeatureDefinition | null {
  if (targetTitle) {
    const normalized = targetTitle.toLowerCase();
    const match =
      docFeatures.find(
        (feature) => feature.title.toLowerCase() === normalized,
      ) ??
      docFeatures.find((feature) =>
        normalized.includes(feature.title.toLowerCase()),
      );
    if (match) return match;
  }

  const text = command.raw_text.toLowerCase();
  return (
    docFeatures.find((feature) =>
      text.includes(feature.title.toLowerCase()),
    ) ?? null
  );
}

function createTask(feature: FeatureDefinition, command: NLPCommand) {
  const createdAt = new Date().toISOString();
  const task: TaskDefinition = {
    id: randomUUID(),
    feature_id: feature.id,
    title: `Implement: ${command.raw_text.slice(0, 60)}`,
    description: command.raw_text,
    status: "pending",
    files: [],
    assignee: command.issued_by,
    created_at: createdAt,
    updated_at: createdAt,
  };
  return task;
}

export async function coordinatorAgent(
  input: CoordinatorInput,
): Promise<CoordinatorOutput> {
  const doc = await readMasterDocument();
  if (!doc) {
    throw new Error("Master document missing. Run Document Splitter first.");
  }

  const interpretation =
    (await callGeminiJson<{
      action: "modify_existing" | "implement_approved" | "new_proposal";
      feature_title?: string;
      instructions?: string;
      proposal_title?: string;
      proposal_description?: string;
    }>(
      `You are the Coordinator agent. Known features:\n${doc.features
        .map((f) => `- ${f.title}: ${f.description}`)
        .join("\n")}\nCommand: ${
        input.command.raw_text
      }\nReturn JSON with keys action, feature_title, instructions, proposal_title, proposal_description.`,
    )) ?? null;

  const feature = pickFeature(
    doc.features,
    input.command,
    interpretation?.feature_title,
  );

  if (!feature) {
    const proposal: ProposalDefinition = {
      id: randomUUID(),
      type: "new_feature",
      title:
        interpretation?.proposal_title ?? input.command.raw_text,
      description:
        interpretation?.proposal_description ?? input.command.raw_text,
      created_by: input.command.issued_by,
      status: "awaiting_approval",
    };

    return {
      decision: {
        command: input.command,
        action: { type: "new_proposal", proposal },
      },
    };
  }

  if (feature.status === "awaiting_approval") {
    return {
      decision: {
        command: input.command,
        action: {
          type: "implement_approved",
          feature_id: feature.id,
          instructions:
            "Feature is awaiting approval. Worker tasks deferred.",
        },
      },
    };
  }

  const task = createTask(feature, input.command);
  const updatedDoc = await recordTask(doc, task);
  await appendLog(updatedDoc, {
    type: "feature_status_changed",
    payload: { featureId: feature.id, taskId: task.id },
    actor: input.command.issued_by,
  });

  return {
    decision: {
      command: input.command,
      action: {
        type:
          feature.status === "approved"
            ? "implement_approved"
            : "modify_existing",
        feature_id: feature.id,
        instructions:
          interpretation?.instructions ?? input.command.raw_text,
      },
    },
    tasks: [task],
  };
}

export default coordinatorAgent;

