/**
 * Prompt Logging System
 *
 * Provides full AI transparency by persisting every prompt/response cycle
 * as a JSON file in the logs/ directory. Each log captures the system prompt,
 * user prompt, structured input, raw model output, parsed output, and token usage.
 */

import { promises as fs } from "fs";
import path from "path";
import { PromptLog } from "@/types";

const LOGS_DIR = path.join(process.cwd(), "logs");

/**
 * Ensures the logs directory exists.
 */
async function ensureLogsDir(): Promise<void> {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

/**
 * Saves a prompt log entry to disk as {id}.json.
 */
export async function savePromptLog(log: PromptLog): Promise<void> {
  await ensureLogsDir();
  const filePath = path.join(LOGS_DIR, `${log.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(log, null, 2), "utf-8");
}

/**
 * Retrieves all prompt logs, sorted by timestamp descending (newest first).
 */
export async function getAllPromptLogs(): Promise<PromptLog[]> {
  await ensureLogsDir();

  let files: string[];
  try {
    files = await fs.readdir(LOGS_DIR);
  } catch {
    return [];
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));
  const logs: PromptLog[] = [];

  for (const file of jsonFiles) {
    try {
      const content = await fs.readFile(path.join(LOGS_DIR, file), "utf-8");
      logs.push(JSON.parse(content) as PromptLog);
    } catch {
      // Skip malformed log files
    }
  }

  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return logs;
}

/**
 * Retrieves a single prompt log by its ID.
 * @returns The matching prompt log, or null if not found
 */
export async function getPromptLogById(id: string): Promise<PromptLog | null> {
  const filePath = path.join(LOGS_DIR, `${id}.json`);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as PromptLog;
  } catch {
    return null;
  }
}
