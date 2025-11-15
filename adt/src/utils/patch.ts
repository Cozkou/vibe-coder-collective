import { promises as fs } from "node:fs";
import { dirname } from "node:path";

export interface FilePatch {
  file: string;
  before: string;
  after: string;
}

export async function applyAtomicPatch(patch: FilePatch) {
  const absolutePath = patch.file;
  let existing = "";
  try {
    existing = await fs.readFile(absolutePath, "utf-8");
  } catch (error: any) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }

  let updated: string;
  if (!existing) {
    // brand new file -> ignore "before" content and write the suggested body
    updated = patch.after;
  } else if (!patch.before) {
    updated = existing + "\n" + patch.after;
  } else if (existing.includes(patch.before)) {
    updated = existing.replace(patch.before, patch.after);
  } else {
    throw new Error(
      `Patch validation failed for ${absolutePath}. Context not found.`,
    );
  }

  await fs.mkdir(dirname(absolutePath), { recursive: true });
  await fs.writeFile(absolutePath, updated, "utf-8");
}

