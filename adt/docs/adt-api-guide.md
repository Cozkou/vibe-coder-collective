# Google ADT API & SDK Integration Guide

Use this document when you want to drive the ADT system via REST or a client SDK (e.g., `google-genai`, `google-adk`). The repo’s TypeScript agents are framework-agnostic, so you can call them from any orchestrator that publishes ADT events.

## 1. REST API Calls

ADT exposes resources similar to:

- `projects.locations.agents`
- `projects.locations.pipelines`
- `projects.locations.channels`
- `projects.locations.events`

### Example: Create an Agent via REST

```http
POST https://agentapi.googleapis.com/v1/projects/<PROJECT_ID>/locations/<LOCATION>/agents
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "agentId": "document-splitter",
  "displayName": "Document Splitter",
  "config": {
    "runtime": {
      "language": "NODEJS",
      "entryPoint": "dist/adt/src/agents/documentSplitter.js",
      "artifactUri": "gs://my-adt-artifacts/adt-dist.zip"
    },
    "capabilities": ["FILE_READ", "MEMORY_WRITE"],
    "inputSchema": { ... },
    "outputSchema": { ... },
    "triggers": [{
      "channel": "document_uploaded"
    }]
  }
}
```

**Steps**
1. Obtain an OAuth 2.0 access token with the ADT scopes (e.g., `https://www.googleapis.com/auth/cloud-platform`).
2. Replace `<PROJECT_ID>` / `<LOCATION>` with your deployment values.
3. Point `artifactUri` to a Cloud Storage object containing the compiled JS bundle.

### Example: Send an Event

```http
POST https://agentapi.googleapis.com/v1/projects/<PROJECT>/locations/<LOCATION>/events
Authorization: Bearer <ACCESS_TOKEN>
Content-Type: application/json

{
  "channel": "nlp_command_received",
  "payload": {
    "command": {
      "command_id": "cmd_123",
      "raw_text": "Add login form",
      "issued_by": "valencia",
      "issued_at": "2025-11-15T22:05:00Z"
    }
  }
}
```

This pushes directly into the pipeline channel that the Coordinator agent listens to.

## 2. Using a Client SDK (`@google-genai`, `google.adk`)

Google’s early SDKs wrap the same REST endpoints. Typical usage:

```ts
import { ADTClient } from "@google/adk";

const client = new ADTClient({
  projectId: process.env.GOOGLE_PROJECT_ID!,
  location: "us-central1",
});

await client.agents.create({
  agentId: "coordinator",
  displayName: "Coordinator",
  config: JSON.parse(
    await fs.promises.readFile(
      "adt/agents/coordinator.agent.json",
      "utf-8",
    ),
  ),
});
```

The SDK usually mirrors REST field names, so you can load the same JSON manifests and send them directly.

### Event Publishing via SDK

```ts
await client.events.publish({
  channel: "proposal_decision",
  payload: {
    proposalId: "feature_7",
    status: "approved",
    decided_by: "product-lead@team",
  },
});
```

## 3. Authentication Notes

- Use a service account with the ADT IAM roles supplied by Google.
- For local testing, `gcloud auth application-default login` plus `GOOGLE_APPLICATION_CREDENTIALS` works with the SDKs.

## 4. Mapping Repo Files → API Payloads

| Repo File | REST/SDK Field |
|-----------|----------------|
| `adt/agents/*.agent.json` | `config` body in `agents.create` |
| `adt/pipelines/orchestrator.pipeline.json` | `pipelines.create` payload |
| `adt/document-store/specs/demo-vibe-project.md` | `documentPath` in `document_uploaded` events |
| `adt/ui/approvalHooks.ts` | Sample for constructing `events.publish` payloads |

## 5. Suggested Workflow

1. Build artifacts: `npx tsc -p adt/tsconfig.json`
2. Upload to GCS: `gsutil cp dist/adt.zip gs://my-adt-artifacts/`
3. Run `python adt/scripts/register_agents.py` (uses REST + ADC token).
4. Verify agents/pipeline in the ADT console.
5. Publish `document_uploaded` event with the demo spec path.
6. Use SDK helpers to publish `nlp_command_received` and `proposal_decision` events for demos.

This guide should help you drive the system entirely via REST or an SDK without waiting for a `gcloud adt` surface.

## 6. Local google-adk Runner

If you want to stay entirely local (no ADT endpoints), run:

```bash
npx tsx adt/scripts/localAdkRunner.ts --command "Add proposal workflow"
```

This script wires the orchestrator + agents directly, seeding the demo spec, issuing commands, and updating the master document just like the hosted service would.

### Gemini Bridge

- Install `google-genai` and set `GOOGLE_API_KEY`.
- Agents invoke `adt/scripts/invoke_gemini.py`, which mirrors the Kaggle Day 2B example (`from google import genai`).
- Set `PYTHON_BIN` or `GEMINI_BRIDGE_SCRIPT` if you need custom paths.
- The Worker agent now requests patches from Gemini automatically whenever none are provided, so UI clicks or approved features immediately translate into vibe-coded diffs.

