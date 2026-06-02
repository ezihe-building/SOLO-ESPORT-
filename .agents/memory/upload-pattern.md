---
name: Upload Pattern
description: How image uploads work in SOLOS+ — base64 to /api/upload endpoint
---

## Flow
1. Frontend reads file as base64 via FileReader
2. POST to `/api/upload` with `{ base64, filename, bucket }`
3. Server decodes base64, uploads to Supabase Storage using service role key
4. Server auto-creates bucket (public) if it doesn't exist
5. Returns `{ url: publicUrl }`

## Auth
- Owner Panel: `x-mgmt-password: terrorist` header
- Member profile: `Authorization: Bearer <token>` header

## Required Env Vars (server-side)
- `SUPABASE_URL` (or `VITE_SUPABASE_URL` as fallback)
- `SUPABASE_SERVICE_ROLE_KEY`

## Buckets used
- `announcements`, `events`, `scrims`, `gallery`, `feed`, `profiles`

## FileUploadBtn Component
Inline component in OwnerPanel.tsx — takes `pwd`, `bucket`, `onUrl` props.
Profile.tsx uses a separate inline upload function with Bearer token.

**Why:** Server-side upload avoids Supabase Storage RLS complexity; service role bypasses all policies.
