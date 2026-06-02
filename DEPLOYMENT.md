# SOLOS+ ESPORTZ — Deployment Guide

## Architecture

- **Frontend** (Vite + React) → deployed as static site on Render or Vercel
- **API Server** (Express 5) → deployed as web service on Render
- **Database** → PostgreSQL (Supabase or Render Postgres)
- **Storage** → Supabase Storage (for images)

---

## Environment Variables

### API Server (required)
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (from Supabase dashboard → Settings → API) |
| `SESSION_SECRET` | Random secret string for session signing |
| `PORT` | Port to listen on (Render sets this automatically) |
| `NODE_ENV` | Set to `production` |

### Frontend (Vite, build-time)
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Same as `SUPABASE_URL` above |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon (public) key |

---

## Supabase Storage Setup

After deploying, the API server will auto-create storage buckets when images are first uploaded. Buckets created:
- `announcements` — announcement images
- `events` — event banners
- `scrims` — scrim images and result screenshots
- `gallery` — media gallery
- `feed` — feed post images
- `profiles` — member profile pictures

If auto-creation fails, create them manually in Supabase dashboard → Storage → New Bucket (set to **Public**).

---

## Render Deployment Steps

### Option A — API + Separate Static Site (Recommended)

#### 1. Deploy API Server
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo
3. Settings:
   - **Build Command**: `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/db run push && pnpm --filter @workspace/api-server run build`
   - **Start Command**: `pnpm --filter @workspace/api-server run start`
   - **Environment**: Node
4. Add all API Server environment variables from the table above
5. Deploy

#### 2. Deploy Frontend
1. New → Static Site
2. Connect same repo
3. Settings:
   - **Build Command**: `npm install -g pnpm && pnpm install --frozen-lockfile && pnpm --filter @workspace/solosplus run build`
   - **Publish Directory**: `artifacts/solosplus/dist`
4. Add frontend environment variables
5. Add redirect rule: `/* → /index.html` (200 rewrite for SPA routing)
6. Deploy

#### 3. Configure API URL
After deploying the API, update the frontend's Vite config or add:
```
VITE_API_URL=https://your-api.onrender.com
```

---

### Option B — Single Service (API serves frontend)

Add to `artifacts/api-server/src/app.ts` after building:
```ts
import { fileURLToPath } from "url";
import path from "path";
import { existsSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(__dirname, "../../solosplus/dist");
if (existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}
```

Build command:
```
pnpm install && pnpm --filter @workspace/solosplus run build && pnpm --filter @workspace/api-server run build
```

---

## Database Migration

Run once on first deploy (included in build command):
```bash
pnpm --filter @workspace/db run push
```

This applies all schema changes to the production database.

---

## Files Changed Summary

### Database Schema (new columns)
- `announcements`: `image_url`, `link_url`, `link_label`
- `scrims`: `image_url`, `link_url`, `link_label`, `result_image_url`
- `events`: `link_url`, `link_label`

### New Routes
- `POST /api/upload` — image upload to Supabase Storage

### Updated Routes
- `POST/PATCH /api/mgmt/announcements` — now accepts image/link fields
- `POST/PATCH /api/mgmt/events` — now accepts link fields
- `POST/PATCH /api/mgmt/scrims` — now accepts image/link fields
- `POST /api/mgmt/scrims/:id/result` — now accepts result screenshot URL

### Frontend Pages Changed
- `OwnerPanel.tsx` — 10 tabs (added Scrims), file upload, link fields, announcement edit
- `Profile.tsx` — file upload for avatar, rename display name
- `Events.tsx` — link button display
- `Landing.tsx` — WhatsApp + TikTok buttons
- `Dashboard.tsx` — WhatsApp + TikTok quick links
