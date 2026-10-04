import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "db.json");

export type VoterRecord = {
  id: number;
  name: string;
  token: string;
  hasVoted: boolean;
  createdAt: string;
};

export type VoteRecord = {
  voterId: number;
  entries: { countryId: number; points: number }[];
  createdAt: string;
};

export type Settings = {
  voterThreshold: number;
  isFinalized: boolean;
  isRevealed: boolean;
  // Real-world finishing order once the actual contest airs: country IDs
  // from 1st place to last. Null until the host enters it.
  actualRanking: number[] | null;
};

export type DB = {
  nextVoterId: number;
  voters: VoterRecord[];
  votes: VoteRecord[];
  settings: Settings;
};

function defaultDB(): DB {
  return {
    nextVoterId: 1,
    voters: [],
    votes: [],
    settings: { voterThreshold: 0, isFinalized: false, isRevealed: false, actualRanking: null },
  };
}

async function readDB(): Promise<DB> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    const db = JSON.parse(raw) as DB;
    // Older data files predate actualRanking; backfill so callers don't
    // have to special-case `undefined` vs `null`.
    db.settings.actualRanking ??= null;
    return db;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return defaultDB();
    }
    throw err;
  }
}

async function writeDB(db: DB): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmpFile = path.join(DATA_DIR, `.db.${process.pid}.${Date.now()}.tmp`);
  await fs.writeFile(tmpFile, JSON.stringify(db, null, 2), "utf-8");
  await fs.rename(tmpFile, DATA_FILE);
}

// All mutations go through this single in-process queue so concurrent
// requests (e.g. two people voting at once) never interleave their
// read-modify-write cycle and corrupt the file. This only serializes
// writes within one Node process — the app must run as a single
// long-lived process, not spread across serverless instances.
let queue: Promise<unknown> = Promise.resolve();

export function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDB();
    const value = await fn(db);
    await writeDB(db);
    return value;
  });
  queue = run.catch(() => {});
  return run;
}

export async function getDB(): Promise<DB> {
  return readDB();
}

export function newToken(): string {
  return crypto.randomUUID();
}
