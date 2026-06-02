import { type Request, type Response, type NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  userId?: string;
  memberRole?: string;
  memberStatus?: string;
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing authorization token" });
    return;
  }
  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.userId = data.user.id;
  next();
}

export async function requireActive(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, req.userId));
  if (!member) {
    res.status(403).json({ error: "Member not found" });
    return;
  }
  if (member.status !== "active") {
    res.status(403).json({ error: "Account not yet approved" });
    return;
  }
  req.memberRole = member.role;
  req.memberStatus = member.status;
  next();
}

export async function requireManagement(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.memberRole || !["OWNER", "MANAGEMENT"].includes(req.memberRole)) {
    res.status(403).json({ error: "Management access required" });
    return;
  }
  next();
}

export async function requireOwner(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (req.memberRole !== "OWNER") {
    res.status(403).json({ error: "Owner access required" });
    return;
  }
  next();
}
