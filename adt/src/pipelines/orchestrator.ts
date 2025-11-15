import { randomUUID } from "node:crypto";
import documentSplitterAgent from "../agents/documentSplitter.js";
import coordinatorAgent from "../agents/coordinator.js";
import workerAgent from "../agents/worker.js";
import featureProposalManagerAgent from "../agents/featureProposalManager.js";
import documentUpdaterAgent from "../agents/documentUpdater.js";
import { MasterDocument, NLPCommand, TaskDefinition } from "../types.js";
import { FilePatch } from "../utils/patch.js";
import { readMasterDocument } from "../utils/documentStore.js";

export class OrchestratorPipeline {
  async handleDocumentUpload(payload: {
    projectId: string;
    documentPath: string;
    uploadedBy: string;
  }) {
    const master = await documentSplitterAgent(payload);
    await documentUpdaterAgent({
      log: {
        type: "document_split",
        payload: { projectId: payload.projectId, features: master.features.length },
        actor: payload.uploadedBy,
      },
    });
    await this.bootstrapBaseApplication(master, payload.uploadedBy);
    return master;
  }

  async handleNLPCommand(command: NLPCommand) {
    const decision = await coordinatorAgent({ command });

    if (decision.decision.action.type === "new_proposal") {
      await featureProposalManagerAgent({
        proposal: decision.decision.action.proposal,
      });
      await documentUpdaterAgent({
        log: {
          type: "proposal_created",
          payload: { proposalId: decision.decision.action.proposal.id },
          actor: command.issued_by,
        },
      });
      return decision;
    }

    if (decision.tasks?.length) {
      await this.dispatchTasks(decision.tasks);
    }

    return decision;
  }

  private async bootstrapBaseApplication(master: MasterDocument, actor: string) {
    if (!master.base_app.summary) return;
    await this.handleFeatureRun({
      featureId: master.features[0]?.id ?? "feature_base",
      issuedBy: actor,
      instructions: [
        "Build the base vibe-coding application scaffolding according to the uploaded specification.",
        `Summary: ${master.base_app.summary}`,
        `Architecture: ${master.base_app.architecture.join(", ")}`,
        `Tech Stack: ${master.base_app.tech_stack.join(", ")}`,
        `Key Routes: ${master.base_app.key_routes.join(", ")}`,
      ].join("\n"),
    });
  }

  async dispatchTasks(tasks: TaskDefinition[]) {
    for (const task of tasks) {
      const patches = task.metadata?.patches as FilePatch[] | undefined;
      await workerAgent({
        task,
        patches,
      });
    }
  }

  async handleProposalDecision(payload: {
    proposalId: string;
    status: "approved" | "rejected";
    decided_by: string;
  }) {
    await featureProposalManagerAgent({
      proposal: {
        id: payload.proposalId,
        type: "new_feature",
        title: payload.proposalId,
        description: "",
        created_by: payload.decided_by,
        status: "awaiting_approval",
      },
      decision: { status: payload.status, decided_by: payload.decided_by },
    });

    await documentUpdaterAgent({
      log: {
        type: "proposal_updated",
        payload: { proposalId: payload.proposalId, status: payload.status },
        actor: payload.decided_by,
      },
    });
  }

  async handleFeatureRun(payload: {
    featureId: string;
    issuedBy: string;
    instructions?: string;
  }) {
    const doc = await readMasterDocument();
    if (!doc) {
      throw new Error("Master document missing. Cannot execute feature.");
    }
    const feature = doc.features.find((f) => f.id === payload.featureId);
    if (!feature) {
      throw new Error(`Feature ${payload.featureId} not found.`);
    }

    const extra =
      payload.instructions && payload.instructions.trim().length
        ? `\nAdditional instructions:\n${payload.instructions}`
        : "";

    const command: NLPCommand = {
      command_id: randomUUID(),
      raw_text: `Implement feature "${feature.title}" described as: ${feature.description}.${extra}`,
      issued_by: payload.issuedBy,
      issued_at: new Date().toISOString(),
    };

    return this.handleNLPCommand(command);
  }
}

export const orchestrator = new OrchestratorPipeline();

