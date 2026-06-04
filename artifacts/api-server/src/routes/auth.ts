import { Router, type IRouter } from "express";
import { db, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../middlewares/auth";
import { supabaseAdmin } from "../lib/supabase";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/auth/me", requireAuth, async (req: AuthRequest, res): Promise<void> => {
  const userId = req.userId!;
  let [member] = await db.select().from(membersTable).where(eq(membersTable.id, userId));

  if (!member) {
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (!userData.user) {
      res.status(401).json({ error: "User not found" });
      return;
    }
    const meta = userData.user.user_metadata ?? {};
    const codmUsername = (meta.codmUsername as string) ?? (meta.codm_username as string) ?? "Unknown";
    const displayName = (meta.displayName as string) ?? (meta.display_name as string) ?? `S²十${codmUsername}`;
    const whatsappNumber = (meta.whatsappNumber as string) ?? (meta.whatsapp_number as string) ?? null;
    const email = userData.user.email ?? "";

    const [created] = await db.insert(membersTable).values({
      id: userId,
      email,
      codmUsername,
      displayName,
      whatsappNumber,
      role: "NEW_MEMBER",
      status: "pending",
    }).returning();
    member = created;
  }

  res.json({
    ...member,
    lastSeen: member.lastSeen?.toISOString() ?? null,
    createdAt: member.createdAt.toISOString(),
  });
});

// Signup endpoint — creates Supabase user (no email confirmation required)
// then immediately inserts member row with status=pending
router.post("/auth/signup", async (req, res): Promise<void> => {
  const { email, password, codmUsername, whatsappNumber } = req.body as {
    email: string;
    password: string;
    codmUsername: string;
    whatsappNumber: string;
  };

  if (!email || !password || !codmUsername || !whatsappNumber) {
    res.status(400).json({ error: "email, password, codmUsername and whatsappNumber are required" });
    return;
  }

  const cleanUsername = codmUsername.replace(/^S²十/i, "").trim();
  if (!cleanUsername) {
    res.status(400).json({ error: "codmUsername cannot be empty" });
    return;
  }
  const displayName = `S²十${cleanUsername}`;

  // Check if email already exists
  const existingByEmail = await db.select({ id: membersTable.id })
    .from(membersTable)
    .where(eq(membersTable.email, email.toLowerCase().trim()))
    .limit(1);

  if (existingByEmail.length > 0) {
    res.status(409).json({ error: "An account with this email already exists." });
    return;
  }

  // Create Supabase auth user — email_confirm: false skips verification email
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      codmUsername: cleanUsername,
      displayName,
      whatsappNumber: whatsappNumber.trim(),
    },
  });

  if (authError || !authData.user) {
    logger.error({ err: authError }, "Supabase createUser failed");
    const msg = authError?.message ?? "Account creation failed";
    const lower = msg.toLowerCase();
    let friendly = msg;
    if (lower.includes("email") && lower.includes("exist")) {
      friendly = "An account with this email already exists.";
    } else if (lower.includes("rate") || lower.includes("limit")) {
      friendly = "Too many signups right now. Please try again in a few minutes.";
    } else if (lower.includes("password")) {
      friendly = "Password is too weak. Use at least 8 characters.";
    } else if (lower.includes("invalid") && lower.includes("email")) {
      friendly = "Invalid email address.";
    }
    res.status(400).json({ error: friendly });
    return;
  }

  const userId = authData.user.id;

  // Insert member record immediately with status=pending
  try {
    const [existing] = await db.select({ id: membersTable.id })
      .from(membersTable)
      .where(eq(membersTable.id, userId))
      .limit(1);

    if (!existing) {
      await db.insert(membersTable).values({
        id: userId,
        email: email.trim().toLowerCase(),
        codmUsername: cleanUsername,
        displayName,
        whatsappNumber: whatsappNumber.trim(),
        role: "NEW_MEMBER",
        status: "pending",
      });
    }
  } catch (dbErr) {
    logger.error({ err: dbErr }, "Failed to insert member record after signup");
    // Don't fail the signup — the member will be created on /auth/me
  }

  res.status(201).json({ message: "Application submitted successfully. Management will review your request." });
});

export default router;
