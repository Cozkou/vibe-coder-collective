import { readMasterDocument, recordProposal, upsertFeature } from "../utils/documentStore.js";
import {
  FeatureDefinition,
  ProposalDefinition,
} from "../types.js";
import { callGeminiJson } from "../utils/llm.js";

export interface ProposalManagerInput {
  proposal: ProposalDefinition;
  decision?:
    | {
        status: "approved" | "rejected";
        decided_by: string;
      }
    | null;
}

export interface ProposalManagerOutput {
  proposal: ProposalDefinition;
  newFeature?: FeatureDefinition;
}

export async function featureProposalManagerAgent(
  input: ProposalManagerInput,
): Promise<ProposalManagerOutput> {
  const doc = await readMasterDocument();
  if (!doc) {
    throw new Error("Master document missing. Cannot record proposal.");
  }

  const enrichment =
    (await callGeminiJson<{
      refined_title?: string;
      refined_description?: string;
      tags?: string[];
    }>(
      `You are the Feature Proposal Manager. Improve this proposal if needed and return JSON with refined_title, refined_description, tags.\nProposal: ${input.proposal.title}\nDescription: ${input.proposal.description}`,
    )) ?? null;

  const proposal: ProposalDefinition = {
    ...input.proposal,
    status: input.decision?.status ?? "awaiting_approval",
    decided_by: input.decision ? input.decision.decided_by : undefined,
    decided_at: input.decision ? new Date().toISOString() : undefined,
    title: enrichment?.refined_title ?? input.proposal.title,
    description:
      enrichment?.refined_description ?? input.proposal.description,
  };

  const updatedDoc = await recordProposal(doc, proposal);

  if (proposal.status !== "approved") {
    return { proposal };
  }

  const feature: FeatureDefinition = {
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    status: "approved",
    tags: enrichment?.tags,
  };

  await upsertFeature(updatedDoc, feature);

  return {
    proposal,
    newFeature: feature,
  };
}

export default featureProposalManagerAgent;

