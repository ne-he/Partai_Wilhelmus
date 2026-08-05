# Partai Wilhelmus

A shared to-do app for one family. Every member has a private task board, plus a common
family board where tasks get assigned, commented on, and closed together.

Built because a group chat is a bad task tracker: things scroll away, nobody knows who owns
what, and there is no record of what actually got done.

**Live:** https://partai-wilhelmus.vercel.app

## Features

**Personal board**
- Three status columns with drag and drop reordering
- Queue management for tasks that are not started yet
- Daily auto reset through a scheduled job

**Family board**
- Drag a member onto a task to assign it
- Threaded comments per task, updating live through Supabase Realtime
- Emoji reactions
- Edit and delete with role based access control

**Notifications**
- In app toasts for assignment, comment, and completion events
- Browser push through the Web Push API using VAPID
- Deadline reminder one day ahead, sent by cron

**Other**
- Spectate mode to view another member's board read only
- Summary page with a translation endpoint
- Page transitions with Framer Motion

## Stack

| Layer | Tool |
| --- | --- |
| Framework | Next.js 16, App Router |
| UI | React 19, Tailwind CSS 4 |
| Database and auth | Supabase, with Realtime |
| Drag and drop | dnd-kit |
| Motion | Framer Motion |
| Tests | Vitest, Testing Library, fast-check |
| Hosting | Vercel |

## Structure

```
app/
  personal/          private task board
  family/            shared board with assignment
  spectate/[user]/   read only view of a member
  summary/           weekly summary
  settings/
  api/
    cron/daily-reset/
    cron/deadline-reminder/
    translate/
Lib/hooks/           data hooks
components/
supabase/            edge functions
__tests__/
```

## Setup

**1. Install and configure**

```bash
npm install
```

Create `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
```

Generate the VAPID pair with:

```bash
npx web-push generate-vapid-keys
```

**2. Run the database migrations**

Open the Supabase SQL editor and run, in order: `supabase-setup.sql`,
`supabase-migrations-v4.sql`, `supabase-migrations-v8.sql`, then `supabase-rls-fix.sql`.

**3. Deploy the edge functions**

```bash
supabase functions deploy send-push-notification
supabase functions deploy deadline-reminder
```

**4. Start**

```bash
npm run dev
```

## Testing

```bash
npm test
```

Property based tests use fast-check, mostly around task ordering and status transitions.

## Cron jobs

`vercel.json` registers two jobs. The daily reset runs at 17:00 UTC, which is midnight in
Jakarta. The deadline reminder runs at 00:00 UTC. Both check `CRON_SECRET` before doing
anything.
