---
name: SOLOS+ Stack & Auth
description: Tech stack, auth flow, and key access patterns for SOLOS+ ESPORTZ
---

## Stack
- React + Vite (artifacts/solosplus, path `/`)
- Express 5 API (artifacts/api-server, path `/api`)
- Drizzle ORM + Replit Postgres (lib/db)
- Supabase auth (JWT Bearer tokens)
- TanStack Query, wouter, Tailwind, shadcn/ui

## Auth
- **Supabase auth**: members log in via Supabase, frontend passes `Bearer <token>` to API
- **Owner Panel** at `/owner`: password-only, hardcoded password is `"terrorist"`, sent as `x-mgmt-password` header
- **Management** at `/management`: Supabase auth required
- `requireAuth` middleware validates Supabase JWT on API routes
- `requireManagement` middleware checks role is OWNER or MANAGEMENT

## Key Routes
- `POST /api/mgmt/*` — management endpoints, require x-mgmt-password header
- `POST /api/upload` — image upload to Supabase Storage, accepts x-mgmt-password OR Bearer
- `PATCH /api/members/profile` — member self-update (Bearer auth)

**Why:** Owner Panel is separate from member management for security isolation.
