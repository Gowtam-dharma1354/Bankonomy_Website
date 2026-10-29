# Bankonomy — NISM Banking & Economy Club

Vite + React + TypeScript competition site backed by Supabase (Postgres, Realtime, RPC, pg_cron). Teams compete across three rounds; a single admin dashboard monitors everything live.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and fill in:

   - `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` — used by the browser client.
   - `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` — used only by `npm run build:content` to upsert the answer key. Never expose the service role key via `VITE_` variables.

3. **Database**

   Apply `supabase/migrations/001_init.sql` in the Supabase SQL editor (or via CLI). For an existing installation, also apply subsequent numbered SQL files in `supabase/migrations/` in order.

   - Enable **pg_cron** in the dashboard if the extension block fails on first run, then re-run the cron schedule section.
   - Create an admin Auth user in Supabase, then insert their UUID into `admin_users`:

     ```sql
     INSERT INTO admin_users (user_id) VALUES ('YOUR_AUTH_USER_UUID');
     ```

4. **Question content**

   - Edit TypeScript files under `content/` (placeholders are marked `[PLACEHOLDER]`).
   - Validate: `npm run validate:content`
   - Build client JSON + sync answer key: `npm run build:content`

   `dev` and `build` run `build:content` automatically.

5. **Run**

   ```bash
   npm run dev
   ```

   - Teams: `/login` with team code (registered in admin).
   - Admin: `/admin/login` then `/admin`.
   - Projector: `/live-standings` (admin session required).

## Answer key safety

- `content/` lives outside `src` and is **never** imported by the Vite client.
- The client loads `src/generated/round*.json` only (no `correctOption` fields).
- Scoring uses Postgres RPCs reading the private `answer_key` table.
- RLS on `answer_key` denies all direct access.

### Test RLS from the browser console

With the app loaded, using the anon key (same as the client):

```js
const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
const sb = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
const { data, error } = await sb.from('answer_key').select('*');
console.log({ data, error }); // expect empty data and/or permission error
```

RPC login should work without table access:

```js
const { data, error } = await sb.rpc('login_with_code', { p_code: 'TESTCODE' });
console.log({ data, error });
```

## Timeout rule (all rounds)

When a round timer reaches **zero**, the server auto-finalises the round (pg_cron every 15 seconds, plus client refresh). **Every unanswered question scores 0 with no penalty**, including Round 3 Option 2 (high leverage). Wrong answers already submitted keep their server-computed scores.

Round 2 awards **10 points per correct answer** and 0 points for an incorrect answer. Apply `supabase/migrations/005_round2_scoring.sql` to update the server-side scoring function and recalculate existing Round 2 scores.

Round 1 awards **5 points per correct answer** and 0 points for an incorrect answer. Its existing 5-point speed bonus is unchanged. Apply `supabase/migrations/006_round1_scoring.sql` to update the server-side scoring function and recalculate existing Round 1 base scores.

Apply `supabase/migrations/007_fullscreen_exit_standings.sql` to expose fullscreen-exit counts in the Round 2, Round 3, and overall admin standings.

## Config assumptions (easy to change)

| Constant | Location | Default |
|----------|----------|---------|
| Violation badge threshold | `src/config/constants.ts` | `3` |
| Round 3 duration (minutes) | `src/config/constants.ts` | `25` (must match SQL) |
| Tiebreaker order | `supabase/migrations/001_init.sql` views | total ↓, time ↑, tab switches ↑ |

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run validate:content` | Counts, unique IDs, 4 options, valid `correctOption` |
| `npm run build:content` | Writes `src/generated/*.json`, upserts `answer_key` |

## Event flow

1. Admin registers teams → team code shown once.
2. Team logs in → lobby (fullscreen required).
3. Admin sets round to **active** → team re-enters code on `/round/N/start`.
4. Timers and scoring are **server-side**; refresh does not reset timers.
