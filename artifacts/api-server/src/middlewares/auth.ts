import { type Request, type Response, type NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";

export interface AuthRequest extends Request {
  userId?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization header" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    req.userId = data.user.id;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token verification failed" });
  }
}

export async function requireActive(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { db, membersTable } = await import("@workspace/db");
    const { eq } = await import("drizzle-orm");
    const [member] = await db
      .select({ status: membersTable.status })
      .from(membersTable)
      .where(eq(membersTable.id, req.userId));
    if (!member) {
      res.status(403).json({ error: "Member not found" });
      return;
    }
    if (member.status !== "active") {
      res.status(403).json({ error: `Account is ${member.status}` });
      return;
    }
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Auth check failed: ${msg}` });
  }
}

export async function requireManagement(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  try {
    const { db, membersTable } = await import("@workspace/db");
    const { eq } = await import("drizzle-orm");
    const [member] = await db
      .select({ role: membersTable.role })
      .from(membersTable)
      .where(eq(membersTable.id, req.userId));
    if (!member || !["OWNER", "MANAGEMENT"].includes(member.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Permission check failed: ${msg}` });
  }
}
