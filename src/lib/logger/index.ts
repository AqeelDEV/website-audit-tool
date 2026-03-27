/**
 * Prompt Logging System
 *
 * Provides full AI transparency by persisting every prompt/response cycle.
 * - Local development: writes JSON files to the logs/ directory
 * - Vercel (serverless): uses an in-memory Map as fallback since the
 *   filesystem is read-only. In-memory logs reset on cold starts — acceptable
 *   for a demo but not for production use.
 */

import { promises as fs } from "fs";
import path from "path";
import { PromptLog } from "@/types";

const IS_VERCEL = !!process.env.VERCEL;
const LOGS_DIR = path.join(process.cwd(), "logs");

// In-memory fallback for serverless environments
const memoryStore = new Map<string, PromptLog>();

// --------------- File-based storage (local dev) ---------------

async function ensureLogsDir(): Promise<void> {
  await fs.mkdir(LOGS_DIR, { recursive: true });
}

async function saveToFile(log: PromptLog): Promise<void> {
  await ensureLogsDir();
  const filePath = path.join(LOGS_DIR, `${log.id}.json`);
  await fs.writeFile(filePath, JSON.stringify(log, null, 2), "utf-8");
}

async function getAllFromFiles(): Promise<PromptLog[]> {
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

async function getByIdFromFile(id: string): Promise<PromptLog | null> {
  const filePath = path.join(LOGS_DIR, `${id}.json`);
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return JSON.parse(content) as PromptLog;
  } catch {
    return null;
  }
}

// --------------- In-memory storage (Vercel) ---------------

function saveToMemory(log: PromptLog): void {
  memoryStore.set(log.id, log);
}

function getAllFromMemory(): PromptLog[] {
  const logs = Array.from(memoryStore.values());
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return logs;
}

function getByIdFromMemory(id: string): PromptLog | null {
  return memoryStore.get(id) ?? null;
}

// --------------- Public API ---------------

export async function savePromptLog(log: PromptLog): Promise<void> {
  if (IS_VERCEL) {
    saveToMemory(log);
  } else {
    await saveToFile(log);
  }
}

export async function getAllPromptLogs(): Promise<PromptLog[]> {
  if (IS_VERCEL) {
    return getAllFromMemory();
  }
  return getAllFromFiles();
}

export async function getPromptLogById(id: string): Promise<PromptLog | null> {
  if (IS_VERCEL) {
    return getByIdFromMemory(id);
  }
  return getByIdFromFile(id);
}
