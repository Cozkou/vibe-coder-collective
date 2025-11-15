import { readMasterDocument, writeMasterDocument, appendLog } from "../utils/documentStore.js";
import { ActivityLogEntry, MasterDocument } from "../types.js";
import { callGeminiText } from "../utils/llm.js";

type UpdaterPath = "base_app" | "features" | "proposals" | "tasks";

export interface DocumentUpdateOperation {
  path: UpdaterPath;
  value: MasterDocument[UpdaterPath];
}

export interface DocumentUpdaterInput {
  operations?: DocumentUpdateOperation[];
  log?:
    | {
        type: ActivityLogEntry["type"];
        payload: Record<string, unknown>;
        actor?: string;
      }
    | null;
}

export interface DocumentUpdaterOutput {
  updated: boolean;
}

export async function documentUpdaterAgent(
  input: DocumentUpdaterInput,
): Promise<DocumentUpdaterOutput> {
  const doc = await readMasterDocument();
  if (!doc) {
    throw new Error("Master document missing. Cannot update.");
  }

  let next: MasterDocument = doc;

  if (input.operations) {
    for (const op of input.operations) {
      next = { ...next, [op.path]: op.value } as MasterDocument;
    }
    await writeMasterDocument(next);
  }

  if (input.log) {
    const summary =
      (await callGeminiText(
        `Summarize this project event in one sentence.\nType: ${input.log.type}\nPayload: ${JSON.stringify(input.log.payload)}`,
      )) ?? undefined;
    await appendLog(next, {
      ...input.log,
      payload: summary
        ? { ...input.log.payload, summary }
        : input.log.payload,
    });
  }

  return { updated: Boolean(input.operations?.length || input.log) };
}

export default documentUpdaterAgent;

