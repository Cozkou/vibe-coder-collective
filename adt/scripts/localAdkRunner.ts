#!/usr/bin/env ts-node
/**
 * Minimal local orchestrator harness that simulates the Google ADK runtime.
 * Instead of registering agents with Google ADT, this script wires the
 * existing orchestrator + agents directly, feeding sample events.
 *
 * Usage:
 *   npx tsx adt/scripts/localAdkRunner.ts --project demo-project
 *   npx tsx adt/scripts/localAdkRunner.ts --command "Add approval banner"
 *
 * Flags:
 *   --project <id>            Project identifier (default: demo-project)
 *   --spec <path>            Spec document path (default: demo spec)
 *   --command "<text>"        NLP command to send after seeding project
 *   --approve <proposalId>    Mark a proposal as approved
 */

import { randomUUID } from "node:crypto";
import { basename, resolve } from "node:path";
import { orchestrator } from "../src/pipelines/orchestrator.js";
import { NLPCommand } from "../src/types.js";

interface CliOptions {
  projectId: string;
  specPath: string;
  nlpCommand?: string;
  approve?: string;
  featureId?: string;
  featureInstructions?: string;
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    projectId: "demo-project",
    specPath: resolve(
      process.cwd(),
      "adt/document-store/specs/demo-vibe-project.md",
    ),
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--project" && argv[i + 1]) {
      options.projectId = argv[i + 1];
      i += 1;
    } else if (arg === "--spec" && argv[i + 1]) {
      options.specPath = resolve(process.cwd(), argv[i + 1]);
      i += 1;
    } else if (arg === "--command" && argv[i + 1]) {
      options.nlpCommand = argv[i + 1];
      i += 1;
    } else if (arg === "--approve" && argv[i + 1]) {
      options.approve = argv[i + 1];
      i += 1;
    } else if (arg === "--feature" && argv[i + 1]) {
      options.featureId = argv[i + 1];
      i += 1;
    } else if (arg === "--feature-instructions" && argv[i + 1]) {
      options.featureInstructions = argv[i + 1];
      i += 1;
    }
  }

  return options;
}

async function seedProject(opts: CliOptions) {
  console.log(
    `📄 Seeding project '${opts.projectId}' with spec ${basename(opts.specPath)}`,
  );
  await orchestrator.handleDocumentUpload({
    projectId: opts.projectId,
    documentPath: opts.specPath,
    uploadedBy: "local-user",
  });
}

async function runCommand(projectId: string, text: string) {
  const command: NLPCommand = {
    command_id: randomUUID(),
    raw_text: text,
    issued_by: "local-user",
    issued_at: new Date().toISOString(),
  };

  console.log(`🧠 Sending NLP command: "${text}"`);
  const decision = await orchestrator.handleNLPCommand(command);
  console.dir(decision, { depth: 4 });
}

async function approveProposal(proposalId: string) {
  console.log(`✅ Approving proposal ${proposalId}`);
  await orchestrator.handleProposalDecision({
    proposalId,
    status: "approved",
    decided_by: "local-approver",
  });
}

async function executeFeature(
  featureId: string,
  instructions?: string,
) {
  console.log(`⚙️ Executing feature ${featureId}`);
  await orchestrator.handleFeatureRun({
    featureId,
    issuedBy: "local-user",
    instructions,
  });
}

async function main() {
  const opts = parseArgs(process.argv);
  await seedProject(opts);

  if (opts.nlpCommand) {
    await runCommand(opts.projectId, opts.nlpCommand);
  }

  if (opts.approve) {
    await approveProposal(opts.approve);
  }

  if (opts.featureId) {
    await executeFeature(opts.featureId, opts.featureInstructions);
  }

  console.log("📘 Master document updated at adt/document-store/master-document.json");
}

main().catch((error) => {
  console.error("Local ADK runner failed", error);
  process.exit(1);
});

