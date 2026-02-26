# FoundAndLost (CampusTrace)

Next.js + Prisma based campus lost-and-found system with map, matching, chat, claims, admin insights, and Vercel-friendly AI signals.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (see section below).

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run app:

```bash
npm run dev
```

## Environment Variables

Minimum required:

- `DATABASE_URL`
- `DIRECT_URL`
- `JWT_SECRET`
- `NEXT_PUBLIC_CAMPUS_CENTER_LAT`
- `NEXT_PUBLIC_CAMPUS_CENTER_LNG`
- `NEXT_PUBLIC_CAMPUS_RADIUS_METERS`

Recommended for production uploads:

- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Optional for smarter NLP matching (Vercel-safe external API):

- `OPENAI_API_KEY`
- `OPENAI_EMBEDDING_MODEL` (optional, default: `text-embedding-3-small`)
- `ENABLE_SEMANTIC_MATCHING` (set to `true` to enable OpenAI semantic scoring)

Optional auth restriction config:

- `ALLOWED_EMAIL_DOMAIN` (default: `college.edu`)
- `NEXT_PUBLIC_APP_URL` (optional, recommended in production for QR scan redirects)

## AI Matching Behavior (Vercel Compatible)

No heavy local ML dependencies are used.

- Image matching uses Cloudinary perceptual hash (`phash`) similarity when available.
- Smart description matching uses OpenAI embeddings only if both `OPENAI_API_KEY` and `ENABLE_SEMANTIC_MATCHING=true` are set.
- If AI env vars are missing, the app gracefully falls back to deterministic heuristic matching.

## QR Integration (Laptops, Bottles, Bags)

- QR is auto-generated when posting categories: Laptop, Bottle, or Bag.
- Owners can open item QR from profile and share/print it.
- Scanning QR triggers instant owner notification (`QR Scan Alert`) and redirects scanner to login.
- In-app scanner page: `/scan` (camera scan with manual token/link fallback).

### MVP Recommended Mode

- Keep `ENABLE_SEMANTIC_MATCHING` unset (or `false`) for fastest, lowest-cost posting flow.
- Use heuristic + image-hash matching as the default MVP behavior.

## Deploy on Vercel

1. Import this repository into Vercel.
2. Add all required environment variables in Vercel Project Settings.
3. Set build command to:

```bash
npm run vercel-build
```

4. Run database migration (if schema changes exist):

```bash
npx prisma migrate deploy
```

If you are not using migration files yet, run this once from your trusted environment:

```bash
npx prisma db push
```

5. Deploy.

### Notes for Prisma on Vercel

- Keep `DATABASE_URL` and `DIRECT_URL` set to your production Postgres instance.
- `prisma generate` runs during build via the project scripts and Next.js build pipeline.

## Validation Commands

```bash
npm run lint
npm test
```
