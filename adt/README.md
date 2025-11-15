# Google ADT Multi-Agent System

This directory contains a production-ready Google Agent Development Toolkit (ADT) skeleton for the vibe-coder collective. The system enables non-coders to issue natural-language commands while multiple agents coordinate parsing, approvals, coding, and documentation.

## Layout

- `agents/` – ADT manifest files for the five required agents.
- `pipelines/` – Orchestrator pipeline definition describing channel routing and concurrency gates.
- `document-store/` – Persistent JSON master document (single source of truth).
- `src/`
  - `agents/` – Behavior entrypoints for each ADT agent.
  - `pipelines/orchestrator.ts` – Central flow controller that connects all agents.
  - `utils/` – Shared types, constants, document store helpers, and patch utilities.
- `ui/approvalHooks.ts` – Example React-friendly hooks that trigger proposal approvals and NLP commands against the pipeline.
- `tsconfig.json` – Standalone compiler config for the ADT code.

## Data & Document Store

`src/utils/documentStore.ts` wraps filesystem persistence for the master document (`document-store/master-document.json`). Each helper ensures atomic writes, activity logging, and ergonomic methods for recording proposals, tasks, and feature updates. The document updater agent consumes this store so every state change is captured in one location.

## Agents & Responsibilities

1. **Document Splitter** – Parses the uploaded specification exactly once, generates the base app definition plus initial features, and seeds the document store.
2. **Coordinator** – Receives NLP commands, classifies them (modify/implement/propose), and emits atomic tasks with concurrency-aware metadata.
3. **Worker** – Applies atomic file patches via `applyAtomicPatch` to guarantee diff safety and marks tasks as complete.
4. **Feature Proposal Manager** – Tracks new feature proposals, enforces approval gates, and upgrades approved proposals into actionable features.
5. **Document Updater** – Applies final document mutations and logs, guaranteeing the shared doc is always the single source of truth.

All agent manifests reference their TypeScript entrypoints so they can run under the ADT runtime (Node 18).

## Orchestrator Flow

`pipelines/orchestrator.pipeline.json` wires the channels:

1. `document_uploaded` → Document Splitter → Document Updater
2. `nlp_command_received` → Coordinator → (Proposal Manager **or** Worker)
3. Worker completions → Document Updater
4. UI approvals → Proposal Manager → Document Updater

`src/pipelines/orchestrator.ts` exposes programmatic helpers (`handleDocumentUpload`, `handleNLPCommand`, `handleProposalDecision`) to mirror the same routing in local dev or integration tests.

## Using the Hooks

Import helpers from `ui/approvalHooks.ts` inside the React UI to connect buttons or command palettes. Example:

```ts
import { onNlpCommand, onProposalDecision, onFeatureExecute } from "@/adt/ui/approvalHooks";

await onNlpCommand("Add analytics dashboard", "valencia@team");
await onProposalDecision(proposalId, "approved", currentUser.email);
await onFeatureExecute("feature_2", currentUser.email, "Implement approved design");
```

The hooks call into the orchestrator, which in turn triggers Coordinator or Feature Proposal Manager as required.

## Local Development

1. `npm install` (once).
2. `npx tsx adt/scripts/localAdkRunner.ts --command "Add login page"` to simulate the full google-adk workflow locally (no Google ADT required). This script seeds the demo spec, routes NLP commands, and writes results to `document-store/master-document.json`. After the document is split, the orchestrator automatically fires a base-scaffold task so the Worker vibe-codes the initial app immediately.
3. For deeper integration testing, call `npx tsx adt/src/index.ts` and issue events programmatically (see `ui/approvalHooks.ts` for examples).
4. Only when you need the hosted service, compile + register the manifests using the REST helper below.

### Gemini / google.genai Bridge

All five agents call Gemini through the Kaggle-style `google.genai` SDK via `adt/scripts/invoke_gemini.py`.

1. `pip install google-genai`
2. Set `GOOGLE_API_KEY` (or `GEMINI_API_KEY`) before running the agents.
3. Optional: set `PYTHON_BIN` if your Python executable is not `python`.
4. Agents automatically spawn the bridge script to interpret specs, classify commands, enrich proposals, summarize patches, and narrate document updates.

Deploy the ADT manifests (`agents/*.agent.json` and `pipelines/orchestrator.pipeline.json`) into your Google ADT project when ready.

### Registering Agents via REST helper

1. `pip install google-auth google-auth-httplib2`
2. `gcloud auth application-default login`
3. Set env vars:
   - `GOOGLE_PROJECT_ID`
   - optional `ADT_LOCATION`
4. Run `python adt/scripts/register_agents.py` to POST your manifests to the ADT REST API using the Application Default Credentials token.

### Local google-adk Runner

- `npx tsx adt/scripts/localAdkRunner.ts --project demo --command "Add approval queue"`
- Optional flags:
  - `--spec <path>` to point at a different spec document
  - `--approve <proposalId>` to simulate manual proposal approvals
  - `--feature <featureId>` (optionally `--feature-instructions "<text>"`) to trigger a feature’s Worker pipeline directly (mirrors the new `onFeatureExecute` hook for UI clicks)
- Inspect `adt/document-store/master-document.json` and the console output to verify each agent executed exactly as it would under the Google ADK runtime, but entirely on your local machine. When no manual patch is provided, the Worker now asks Gemini to synthesize atomic diffs automatically, so features (and the base scaffold) are “vibe coded” as soon as they’re triggered.

