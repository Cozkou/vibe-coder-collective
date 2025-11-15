"""
Utility script to register Google ADT agents/pipelines via the REST API.

The google-genai preview SDK exposes agent_dev only for whitelisted users,
so this script uses Application Default Credentials + requests instead.

Prerequisites:
pip install google-auth google-auth-httplib2 google-auth-oauthlib
gcloud auth application-default login
set GOOGLE_PROJECT_ID=<gcp-project>
set ADT_LOCATION=us-central1

Run:
python adt/scripts/register_agents.py
"""

from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Iterable

import google.auth
from google.auth.transport.requests import AuthorizedSession

PROJECT_ID = os.environ.get("GOOGLE_PROJECT_ID")
LOCATION = os.environ.get("ADT_LOCATION", "us-central1")

if not PROJECT_ID:
  raise SystemExit("Missing GOOGLE_PROJECT_ID. Set the env var before running.")

BASE = Path(__file__).resolve().parents[1]
AGENT_DIR = BASE / "agents"
PIPELINE_PATH = BASE / "pipelines" / "orchestrator.pipeline.json"

credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
session = AuthorizedSession(credentials)
BASE_URL = f"https://agentapi.googleapis.com/v1/projects/{PROJECT_ID}/locations/{LOCATION}"


def create_agent(agent_id: str, manifest: Path) -> None:
  payload = json.loads(manifest.read_text())
  url = f"{BASE_URL}/agents?agentId={agent_id}"
  response = session.post(url, json=payload)
  if response.status_code >= 400:
    raise RuntimeError(
        f"Failed to register agent {agent_id}: {response.status_code} {response.text}"
    )
  print(f"Registered agent {agent_id}")


def create_pipeline(pipeline_id: str, pipeline_path: Path) -> None:
  payload = json.loads(pipeline_path.read_text())
  url = f"{BASE_URL}/pipelines?pipelineId={pipeline_id}"
  response = session.post(url, json=payload)
  if response.status_code >= 400:
    raise RuntimeError(
        f"Failed to register pipeline {pipeline_id}: {response.status_code} {response.text}"
    )
  print(f"Registered pipeline {pipeline_id}")


def main() -> None:
  agents: Iterable[tuple[str, Path]] = [
      ("document_splitter", AGENT_DIR / "document-splitter.agent.json"),
      ("coordinator", AGENT_DIR / "coordinator.agent.json"),
      ("worker", AGENT_DIR / "worker.agent.json"),
      (
          "feature_proposal_manager",
          AGENT_DIR / "feature-proposal-manager.agent.json",
      ),
      ("document_updater", AGENT_DIR / "document-updater.agent.json"),
  ]

  for agent_id, manifest in agents:
    create_agent(agent_id, manifest)

  create_pipeline("vibe_orchestrator", PIPELINE_PATH)


if __name__ == "__main__":
  main()

