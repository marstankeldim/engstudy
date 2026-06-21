# EngStudy

An AI-powered study platform for engineering students. Upload course materials (PDFs) and get AI-generated quizzes, flashcards with spaced repetition, study guides, and a RAG-grounded AI tutor.

## Tech Stack

- **Next.js 16** (App Router) · React 19 · TypeScript
- **Tailwind CSS v4** · shadcn/ui (Base UI)
- **PostgreSQL + pgvector** · Prisma 7 (pg driver adapter)
- **Clerk** authentication
- **OpenAI** (GPT-4o + text-embedding-3-small)
- **UploadThing** file storage
- Deploys to **Vercel**

## Features

| Feature | Description |
|---|---|
| Documents | Upload PDFs → text extraction → chunk → embed (pgvector) |
| Quizzes | AI-generated MCQ / true-false / short-answer; timed; server-graded |
| Flashcards | AI-generated decks with **SM-2 spaced repetition** |
| Study Guides | Summaries, formula sheets, exam reviews, key takeaways (Markdown) |
| AI Tutor | **RAG-grounded streaming chat** over your materials |
| Progress | Study sessions and quiz attempts logged for analytics |

---

## Local Development

### 1. Install dependencies

```bash
npm install
```

### 2. Provision a Postgres database with pgvector

The AI Tutor's retrieval requires the `pgvector` extension. The easiest option is
[Neon](https://neon.tech) (free tier includes pgvector). Create a project and copy the
connection string.

### 3. Configure environment

```bash
cp .env.example .env.local
```

Fill in every value. See [Service setup](#service-setup) below for where each key comes from.

> **Note:** Prisma reads `DATABASE_URL` from `.env` (via `prisma.config.ts`). Either also
> put `DATABASE_URL` in `.env`, or export it in your shell when running `db:*` scripts.

### 4. Set up the database schema

```bash
npm run db:setup
```

This runs `prisma db push` (creates tables + the `vector` extension) and then creates the
HNSW vector index used by the tutor.

### 5. Run

```bash
npm run dev
```

Open http://localhost:3000.

---

## Service setup

### Clerk (auth)
1. Create an app at [dashboard.clerk.com](https://dashboard.clerk.com).
2. Copy the **Publishable key** and **Secret key** into `.env.local`.
3. Create a **Webhook**: endpoint `https://YOUR_DOMAIN/api/webhooks/clerk`, events
   `user.created`, `user.updated`, `user.deleted`. Copy the **Signing secret** into
   `CLERK_WEBHOOK_SECRET`. (The app also lazily creates a user row on first request, so
   the webhook is mainly for keeping profile data in sync.)

### OpenAI
Create a key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys) and
add billing. Used for generation, embeddings, and the tutor.

### UploadThing
Create an app at [uploadthing.com](https://uploadthing.com/dashboard) and copy the
**Token** into `UPLOADTHING_TOKEN`.

---

## Deploying to Vercel

1. **Push this repo to GitHub** (create a repo, then `git remote add origin … && git push -u origin main`).
2. **Import** the repo at [vercel.com/new](https://vercel.com/new).
3. **Add environment variables** (from your `.env.local`) in the Vercel project settings.
   Set `NEXT_PUBLIC_APP_URL` to your production URL.
4. **Database**: point `DATABASE_URL` at your production Postgres. Run the one-time schema
   setup against it from your machine:
   ```bash
   DATABASE_URL="<prod-url>" npm run db:setup
   ```
5. **Deploy.** The build runs `prisma generate && next build` automatically.
6. **Update Clerk** webhook + allowed origins to your production domain.

### Notes
- **Plan/limits:** Document processing and AI generation routes set `maxDuration` up to
  300s. Vercel's Hobby plan caps function duration (≈60s) — use the **Pro** plan (or
  Fluid Compute) for large PDFs and big generations.
- **Scanned PDFs:** image-only PDFs have no extractable text and will be marked `FAILED`.
  OCR is a planned enhancement.

---

## Project structure

```
src/
  app/
    (auth)/            Clerk sign-in / sign-up
    (dashboard)/       Protected app: dashboard, courses, and per-course tools
    api/               Route handlers (courses, documents, quizzes, flashcards,
                       study-guides, tutor, study-sessions, webhooks, uploadthing)
  components/          UI: layout, courses, documents, quizzes, flashcards,
                       study-guides, tutor, shared, ui (shadcn)
  lib/                 prisma, openai, embeddings, ai-context, quiz, flashcards,
                       study-guide, sm2, pdf, documents, auth, validations
  generated/prisma/    Prisma client (generated; gitignored)
prisma/
  schema.prisma        Data model
  sql/vector-index.sql HNSW index for embeddings
```
