"""
Small bridge script that proxies prompts from Node to Google Gemini
using the google.genai SDK (same as the Kaggle Day 2B notebook).

Usage:
  python adt/scripts/invoke_gemini.py --model gemini-1.5-flash
  (prompt is read from stdin, response is printed to stdout)
"""

from __future__ import annotations

import argparse
import json
import os
import sys

from google import genai


def main() -> None:
  parser = argparse.ArgumentParser()
  parser.add_argument("--model", default="gemini-1.5-flash")
  args = parser.parse_args()

  api_key = (
      os.environ.get("GOOGLE_API_KEY")
      or os.environ.get("GEMINI_API_KEY")
  )
  if not api_key:
    print("Missing GOOGLE_API_KEY or GEMINI_API_KEY", file=sys.stderr)
    sys.exit(1)

  prompt = sys.stdin.read().strip()
  if not prompt:
    print("Prompt required", file=sys.stderr)
    sys.exit(1)

  client = genai.Client(api_key=api_key)
  response = client.models.generate_content(
      model=args.model,
      contents=[{"role": "user", "parts": [{"text": prompt}]}],
  )

  candidates = getattr(response, "candidates", None) or []
  if not candidates or not getattr(candidates[0], "content", None):
    print("")
    return

  parts = getattr(candidates[0].content, "parts", None) or []
  text_parts = [part.text for part in parts if getattr(part, "text", "")]
  text = "\n".join(text_parts).strip()
  print(text)


if __name__ == "__main__":
  try:
    main()
  except Exception as exc:
    print(json.dumps({"error": str(exc)}))
    raise

