import { promises as fs } from "node:fs";
import { randomUUID } from "node:crypto";
import { appendLog, writeMasterDocument } from "../utils/documentStore.js";
import { MASTER_DOCUMENT_PATH } from "../utils/constants.js";
import {
  FeatureDefinition,
  MasterDocument,
  BaseAppDefinition,
} from "../types.js";
import { callGeminiJson, isGeminiEnabled } from "../utils/llm.js";

export interface DocumentSplitterInput {
  projectId: string;
  documentPath: string;
  uploadedBy: string;
}

async function inferStructureWithGemini(source: string, chunks: string[]) {
  if (!isGeminiEnabled()) return null;
  const instructions = `
You are the Document Splitter agent. Read the following specification and output strict JSON:
{
  "base_app": {
    "summary": "...",
    "architecture": ["..."],
    "tech_stack": ["..."],
    "key_routes": ["..."]
  },
  "features": [
    { "title": "...", "description": "...", "tags": ["..."] }
  ]
}
Use concise wording and include at least 3 features. Input:
${source}
`;

  const response = await callGeminiJson<{
    base_app: BaseAppDefinition;
    features: Array<Omit<FeatureDefinition, "id" | "status">>;
  }>(instructions);

  if (!response) return null;

  const features: FeatureDefinition[] = response.features.map((feature, idx) => ({
    id: `feature_${idx + 1}`,
    status: "pending",
    ...feature,
  }));

  return {
    base_app: response.base_app,
    features,
  };
}

function inferBaseAppFallback(chunks: string[]): BaseAppDefinition {
  const summary = chunks[0] ?? "No summary found";
  const architecture = chunks
    .filter((chunk) => /architecture|stack/i.test(chunk))
    .map((chunk) => chunk.trim());
  const tech_stack = Array.from(
    new Set(
      chunks
        .join(" ")
        .match(
          /(React|Next\.js|Vue|Angular|Supabase|Firebase|Postgres|Node|Python|Go)/gi,
        ) ?? [],
    ),
  );
  const key_routes = chunks
    .filter((line) => line.startsWith("/") || line.startsWith("GET"))
    .map((line) => line.trim());

  return {
    summary,
    architecture: architecture.length ? architecture : [summary],
    tech_stack,
    key_routes,
  };
}

function inferFeaturesFallback(lines: string[]): FeatureDefinition[] {
  const features: FeatureDefinition[] = [];
  let counter = 1;
  for (const line of lines) {
    const match = line.match(/^-+\s*(.+)/);
    if (match) {
      features.push({
        id: `feature_${counter}`,
        title: match[1].trim(),
        description: match[1].trim(),
        status: "pending",
      });
      counter += 1;
    }
  }

  if (!features.length) {
    features.push({
      id: "feature_1",
      title: "Initial feature",
      description: "Placeholder extracted feature.",
      status: "pending",
    });
  }

  return features;
}

export async function documentSplitterAgent(
  input: DocumentSplitterInput,
) {
  const source = await fs.readFile(input.documentPath, "utf-8");
  const chunks = source.split(/\n\s*\n/).map((chunk) => chunk.trim());
  const lines = source.split("\n").map((line) => line.trim());

  const llmStructure = await inferStructureWithGemini(source, chunks);
  const base_app =
    llmStructure?.base_app ?? inferBaseAppFallback(chunks);
  const features =
    llmStructure?.features ?? inferFeaturesFallback(lines);

  const master: MasterDocument = {
    project_id: input.projectId,
    source_document_path: input.documentPath,
    base_app,
    features,
    proposals: [],
    tasks: [],
    activity_log: [],
    updated_at: new Date().toISOString(),
  };

  await writeMasterDocument(master);
  await appendLog(master, {
    type: "document_split",
    payload: {
      projectId: input.projectId,
      featureCount: features.length,
      storagePath: MASTER_DOCUMENT_PATH,
    },
    actor: input.uploadedBy,
  });

  return master;
}

export default documentSplitterAgent;

