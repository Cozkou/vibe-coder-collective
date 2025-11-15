import { spawn } from "node:child_process";
import { resolve } from "node:path";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";
const PYTHON_BIN = process.env.PYTHON_BIN ?? "python";
const LLM_SCRIPT =
  process.env.GEMINI_BRIDGE_SCRIPT ??
  resolve(process.cwd(), "adt/scripts/invoke_gemini.py");

export function isGeminiEnabled() {
  return Boolean(process.env.GOOGLE_API_KEY ?? process.env.GEMINI_API_KEY);
}

function runGeminiBridge(prompt: string): Promise<string> {
  return new Promise((resolvePromise, reject) => {
    const proc = spawn(PYTHON_BIN, [LLM_SCRIPT, "--model", GEMINI_MODEL], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    let output = "";
    proc.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    proc.on("error", reject);
    proc.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Gemini bridge exited with code ${code}`));
      } else {
        resolvePromise(output.trim());
      }
    });

    proc.stdin.write(prompt);
    proc.stdin.end();
  });
}

export async function callGeminiText(prompt: string): Promise<string | null> {
  if (!isGeminiEnabled()) return null;
  try {
    const text = await runGeminiBridge(prompt);
    return text || null;
  } catch (error) {
    console.warn("Gemini text call failed", error);
    return null;
  }
}

export async function callGeminiJson<T>(prompt: string): Promise<T | null> {
  const text = await callGeminiText(prompt);
  if (!text) return null;
  try {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    const json = start >= 0 ? text.slice(start, end + 1) : text;
    return JSON.parse(json) as T;
  } catch (error) {
    console.warn("Failed to parse Gemini JSON payload", error);
    return null;
  }
}

