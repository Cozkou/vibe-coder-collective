import { randomUUID } from "node:crypto";
import { orchestrator } from "../src/pipelines/orchestrator.js";

export type ProposalDecision = "approved" | "rejected";

export async function onProposalDecision(
  proposalId: string,
  status: ProposalDecision,
  decidedBy: string,
) {
  await orchestrator.handleProposalDecision({
    proposalId,
    status,
    decided_by: decidedBy,
  });
}

export async function onNlpCommand(text: string, issuedBy: string) {
  await orchestrator.handleNLPCommand({
    command_id: randomUUID(),
    raw_text: text,
    issued_by: issuedBy,
    issued_at: new Date().toISOString(),
  });
}

export async function onFeatureExecute(
  featureId: string,
  issuedBy: string,
  instructions?: string,
) {
  await orchestrator.handleFeatureRun({
    featureId,
    issuedBy,
    instructions,
  });
}

