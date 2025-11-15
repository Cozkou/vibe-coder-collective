import { orchestrator } from "./pipelines/orchestrator.js";
import { PIPELINE_CHANNELS } from "./utils/constants.js";
import { NLPCommand } from "./types.js";

type EventPayload =
  | {
      type: "document_uploaded";
      projectId: string;
      documentPath: string;
      uploadedBy: string;
    }
  | {
      type: "nlp_command_received";
      command: NLPCommand;
    }
  | {
      type: "proposal_decided";
      proposalId: string;
      status: "approved" | "rejected";
      decided_by: string;
    };

export async function handleEvent(event: EventPayload) {
  if (event.type === PIPELINE_CHANNELS.documentUploaded) {
    return orchestrator.handleDocumentUpload({
      projectId: event.projectId,
      documentPath: event.documentPath,
      uploadedBy: event.uploadedBy,
    });
  }

  if (event.type === PIPELINE_CHANNELS.commandReceived) {
    return orchestrator.handleNLPCommand(event.command);
  }

  if (event.type === PIPELINE_CHANNELS.proposalDecision) {
    return orchestrator.handleProposalDecision({
      proposalId: event.proposalId,
      status: event.status,
      decided_by: event.decided_by,
    });
  }

  const exhaustive: never = event;
  throw new Error(`Unhandled event type ${(exhaustive as { type: string }).type}`);
}

export default handleEvent;

