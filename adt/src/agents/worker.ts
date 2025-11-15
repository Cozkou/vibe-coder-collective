import { resolve } from "node:path";
import { readMasterDocument, updateTaskStatus } from "../utils/documentStore.js";
import { PATCH_WORKSPACE_ROOT } from "../utils/constants.js";
import { TaskDefinition } from "../types.js";
import { applyAtomicPatch, FilePatch } from "../utils/patch.js";
import { callGeminiJson, callGeminiText } from "../utils/llm.js";

export interface WorkerInput {
  task: TaskDefinition;
  patches?: Array<
    FilePatch & {
      relative?: string;
    }
  >;
}

export interface WorkerOutput {
  taskId: string;
  status: "done";
  appliedFiles: string[];
  summary?: string;
}

export async function workerAgent(
  input: WorkerInput,
): Promise<WorkerOutput> {
  let patchSet = input.patches;
  if (!patchSet?.length) {
    const generated = await generatePatchesFromLLM(input.task);
    patchSet = generated ?? [];
  }

  const applied: string[] = [];
  for (const patch of patchSet ?? []) {
    const filePath = patch.relative
      ? resolve(PATCH_WORKSPACE_ROOT, patch.relative)
      : patch.file;
    await applyAtomicPatch({ ...patch, file: filePath });
    applied.push(filePath);
  }

  const doc = await readMasterDocument();
  if (doc) {
    await updateTaskStatus(doc, input.task.id, "done");
  }

  const summary =
    (await callGeminiText(
      `You are the Worker agent. Summarize the changes made for task "${input.task.title}". Files touched: ${applied.join(
        ", ",
      )}. Instructions: ${input.task.description}`,
    )) ?? undefined;

  return {
    taskId: input.task.id,
    status: "done",
    appliedFiles: applied,
    summary,
  };
}

async function generatePatchesFromLLM(
  task: TaskDefinition,
): Promise<FilePatch[] | null> {
  const response = await callGeminiJson<{
    patches: Array<{
      relative?: string;
      file?: string;
      before: string;
      after: string;
    }>;
  }>(
    `You are the Worker agent inside a collaborative vibe-coding IDE. Generate concise atomic patches in JSON with the shape { "patches": [{ "relative": "path/to/file.tsx", "before": "old text", "after": "new text" }] }.
Task title: ${task.title}
Task description: ${task.description}
Only modify files that already exist or should exist within the repo (src/, README.md, etc.). Ensure 'before' text matches current content, or include the exact placeholder you're replacing.`,
  );

  if (!response?.patches?.length) {
    return null;
  }

  return response.patches.map((patch) => ({
    file: patch.file ?? (patch.relative ? resolve(PATCH_WORKSPACE_ROOT, patch.relative) : ""),
    relative: patch.relative,
    before: patch.before,
    after: patch.after,
  }));
}

export default workerAgent;

