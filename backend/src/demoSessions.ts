import { randomBytes } from "node:crypto";

export type DemoSession = {
  token: string;
  userId: number;
  role: string;
  createdAt: number;
  lastSeenAt: number;
};

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_SESSIONS = 2_000;

const sessions = new Map<string, DemoSession>();

function pruneSessions(now = Date.now()) {
  for (const [token, session] of sessions) {
    if (now - session.lastSeenAt > SESSION_TTL_MS) sessions.delete(token);
  }
  if (sessions.size <= MAX_SESSIONS) return;
  const oldest = [...sessions.entries()]
    .sort((a, b) => a[1].lastSeenAt - b[1].lastSeenAt)
    .slice(0, sessions.size - MAX_SESSIONS);
  for (const [token] of oldest) sessions.delete(token);
}

export function createDemoSession(userId: number, role: string): DemoSession {
  pruneSessions();
  const now = Date.now();
  const token = randomBytes(32).toString("base64url");
  const session: DemoSession = {
    token,
    userId,
    role,
    createdAt: now,
    lastSeenAt: now,
  };
  sessions.set(token, session);
  return session;
}

export function revokeDemoSession(token: string | null | undefined) {
  if (!token) return;
  sessions.delete(token);
}

export function resolveDemoSession(token: string | null | undefined): DemoSession | null {
  if (!token) return null;
  pruneSessions();
  const session = sessions.get(token);
  if (!session) return null;
  session.lastSeenAt = Date.now();
  return session;
}
