# DentistryExplained RLS impact map — 2026-09-21

**Status:** Analysis only. **No SQL applied. No app behavior changed** except this file.  
**Project:** `dtknwhzmomyalyixgnmr` (DentistryExplained)  
**Draft under review:** `uploads/DRAFT-supabase-rls-fixes-20260921.sql` Dentistry P0/P1 sections  
**Live advisors re-checked:** 2026-09-21 (same 5 funcs × anon/authenticated, 6 RLS-off tables, 3 security-definer views, 4 no-policy tables)

Verdict key:

| Label | Meaning |
|-------|---------|
| **Safe** | Apply as drafted (or stricter). App does not call this as `anon`/`authenticated`, or lockdown is the intended product behavior. |
| **Needs policy first** | Enabling RLS / flipping the view to invoker without a matching policy will empty or 500 a live path. |
| **Do not touch yet** | Draft revoke/lockdown hits a Clerk-JWT caller. Switch that caller to `service_role` (or add a policy) before applying. |

---

## Executive recommendation

Do **not** apply the Dentistry block of the draft as a single shot.

1. **Safe now (revoke):** `cancel_scheduled_publication`, `get_user_dashboard_layout`, `publish_scheduled_articles` — and revoke **`PUBLIC` as well as `anon`/`authenticated`**. Keep `service_role`.
2. **Do not revoke yet:** `update_setting`, `log_verification_activity` — both are invoked by the Next.js app through the Clerk JWT client, not `supabaseAdmin`.
3. **Needs SELECT (and write) policies before `ENABLE RLS`:** `glossary_terms`, `email_template_versions`. `search_queries` if you want click/query tracking to keep working.
4. **Safe to lock down with no policies:** `content_analytics`, `subcategories`. `search_suggestions` is low-risk lockdown today (0 rows; only a tertiary invoker-RPC source).
5. **Views:** do **not** set `security_invoker=true` on `glossary_term_stats` until `glossary_terms` has a public `SELECT` policy. `search_trends` is unused by the app. `user_quiz_stats` needs an auth-mapping check first.
6. **Do not add policies to the 4 no-policy tables in this change.** They are already locked down. Public related-article cards and admin revision table reads are **already empty/failing** via PostgREST.

The draft’s `REVOKE … FROM anon, authenticated` is **incomplete**: live ACLs still include `PUBLIC` (`=X/postgres`). After that revoke, `anon`/`authenticated` would still inherit `EXECUTE` from `PUBLIC`.

---

## 1. How the app talks to Supabase

There is **no** `@supabase/ssr` cookie client. Four factories exist.

| Factory | File | Key | JWT | Postgres role |
|---------|------|-----|-----|----------------|
| `supabase` | `lib/supabase.ts` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | none | **`anon`** |
| `supabaseAdmin` | `lib/supabase.ts` | `SUPABASE_SERVICE_ROLE_KEY` | none | **`service_role`** (bypasses RLS) |
| `createServerSupabaseClient` / `createRouteSupabaseClient` | `lib/supabase-auth.ts` | anon key | Clerk `getToken({ template: 'supabase' })` as `Authorization` | **`authenticated` if the JWT `role` claim is `authenticated`; otherwise fallback `anon`** |
| `useSupabaseClient` / `supabasePublic` | `lib/supabase-client.ts` | anon key | Clerk token on the hook; none on `supabasePublic` | same as above / **`anon`** |

`withAuth` / `withOptionalAuth` (`lib/api-middleware.ts`) always attach `createServerSupabaseClient()`, not `supabaseAdmin`. Clerk is checked in Next.js; the database role is still whatever PostgREST sees on that JWT.

Documented Clerk template (`docs/CLERK_JWT_SETUP.md`) sets `email`, `user_metadata`, and `metadata.role` (admin/editor). It does **not** show `"role": "authenticated"` / `"aud": "authenticated"`. If the live Clerk template also omits PostgREST `role`, many “logged-in” API calls actually run as **`anon`**. `createServerSupabaseClient` already falls back to a bare anon client when the template is missing.

Browser `useSupabaseClient` is unused except as an export. `supabasePublic` is only used for Realtime presence (`components/article/realtime-presence.tsx`), not these tables.

**Implication for revoke-from-anon-first:** it is safe only for RPCs the app never calls. It is **not** automatically safe for `update_setting` / `log_verification_activity`, because those callers are Clerk-JWT (or anon-fallback) clients.

---

## 2. P0 SECURITY DEFINER RPCs

Live ACL on all five (2026-09-21):

```
{=X/postgres, postgres=X/postgres, anon=X/postgres, authenticated=X/postgres, service_role=X/postgres}
```

`=X/postgres` is **PUBLIC EXECUTE**. Draft must add `REVOKE EXECUTE ON FUNCTION … FROM PUBLIC;` or the advisor will stay red.

### 2.1 `cancel_scheduled_publication(uuid)` — **Safe**

| | |
|--|--|
| Live | `SECURITY DEFINER`, no caller check; cancels any pending schedule and clears `articles.scheduled_*` |
| App callers | **None.** Grep finds only the migration. |
| What the app does instead | `DELETE`/`POST` `/api/admin/articles/[id]/schedule` updates `scheduled_articles` + `articles` via `createServerSupabaseClient` |

```188:196:app/api/admin/articles/[id]/schedule/route.ts
    const { error } = await supabase
      .from('scheduled_articles')
      .update({ 
        status: 'cancelled', 
        updated_at: new Date().toISOString() 
      })
      .eq('article_id', params.id)
      .in('status', ['pending', 'processing'])
```

**Revoke order:** `PUBLIC` → `anon` → `authenticated`. Keep `service_role`. No cron/app RPC to migrate.

---

### 2.2 `get_user_dashboard_layout(uuid)` — **Safe**

| | |
|--|--|
| Live | `SECURITY DEFINER`; returns any user’s default/latest layout by `p_user_id` (IDOR if called) |
| App callers | **None.** Layout API comment: “use direct query instead of RPC” |

```43:49:app/api/admin/dashboard/layout/route.ts
    // Get user's dashboard layout - use direct query instead of RPC
    const { data, error } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('user_id', userProfile.id)
      .eq('is_default', true)
      .single()
```

**Revoke order:** same as 2.1. Table already has RLS.

---

### 2.3 `publish_scheduled_articles()` — **Safe** (revoke API roles only)

| | |
|--|--|
| Live | `SECURITY DEFINER`; publishes every due draft. Callable today by `anon` via `/rest/v1/rpc/publish_scheduled_articles` |
| Migration grant | `service_role` only — PUBLIC/default grants were never revoked |
| App / cron callers | **None.** `todo.md` still says “create cron job”. No `vercel.json` cron. No `app/api/cron/**`. |

**Revoke order:** `PUBLIC` → `anon` → `authenticated`. **Keep `service_role`.** After revoke, only a future service-role cron (or SQL editor) can publish. That matches the original migration intent. It does not create a new outage: nothing calls this today.

---

### 2.4 `log_verification_activity(uuid, varchar, jsonb)` — **Do not touch yet**

| | |
|--|--|
| Live | `SECURITY DEFINER`; resolves `profiles.id` via `clerk_user_id()` then inserts `verification_activity_log` |
| Role of callers | **Clerk JWT client** (`createServerSupabaseClient` / `withAuth`), never `supabaseAdmin` |

Call sites:

| File | Awaited? | If RPC fails |
|------|----------|--------------|
| `app/api/professional/verification/route.ts` POST/PUT | fire-and-forget | verification still succeeds; log lost |
| `app/api/professional/verification/upload/route.ts` | fire-and-forget | upload still succeeds |
| `app/api/professional/verification/document/[documentId]/route.ts` | awaited, error ignored | document action still returns |
| `app/api/admin/verifications/[verificationId]/review/route.ts` | awaited, error ignored | approve/reject still proceeds |

```117:122:app/api/professional/verification/route.ts
  supabase.rpc('log_verification_activity', {
    p_verification_id: verification.id,
    p_action: 'submitted',
    p_details: { gdc_number: gdcValidation.formatted }
  })
```

**Break if draft applied as written:** audit rows stop. User-facing verification/review likely still 200.  
**Safe slice:** revoke `PUBLIC` + `anon` only **after** confirming the Clerk JWT `role` is `authenticated`.  
**Before revoking `authenticated`:** point these five calls at `supabaseAdmin`, or keep `GRANT EXECUTE TO authenticated`.

---

### 2.5 `update_setting(varchar, jsonb)` — **Do not touch yet**

Live body (differs from repo migration `20250706_create_settings_table.sql`):

```sql
-- LIVE: no admin check, upsert any key
INSERT INTO settings (key, value, category, updated_at)
VALUES (p_key, p_value, SPLIT_PART(p_key, '.', 1), now())
ON CONFLICT (key) DO UPDATE SET value = p_value, updated_at = now();
```

Anyone who can `EXECUTE` (today: **anon**) can change site settings. That is the real P0. The function is still the **only** write path for the admin UI.

| Caller | Client | Role |
|--------|--------|------|
| `PUT` / `POST` `/api/admin/settings` | `createServerSupabaseClient()` | Clerk JWT / anon fallback |
| `GET` settings for runtime | `lib/settings.ts` → **`supabaseAdmin`** | service_role (reads table, not this RPC) |

```120:125:app/api/admin/settings/route.ts
    const { data, error } = await supabase
      .rpc('update_setting', {
        p_key: key,
        p_value: value
      })
```

**Break if draft applied as written:** Admin Settings save returns 500 (`permission denied for function update_setting`). Runtime reads keep working via `supabaseAdmin` + cache until someone needs to change a value.

**Safe path:**

1. Change PUT/POST `/api/admin/settings` to `supabaseAdmin` (or table `upsert` after the existing Next.js admin check).
2. Then `REVOKE EXECUTE … FROM PUBLIC, anon, authenticated`.
3. Keep `service_role`.

Do **not** revoke `authenticated` (or `anon`, if JWT role is missing) before step 1.

---

## 3. P0/P1 tables with RLS off

Live grants: `anon`/`authenticated` have **SELECT+INSERT+UPDATE+DELETE** on all six (table privileges). `ENABLE RLS` with zero policies = PostgREST returns `[]` / 0 rows and writes no-op or RLS violation. `service_role` still full access.

Live row counts (2026-09-21): all six are **0 rows**. Impact below is “when the app is used as written,” not “today’s empty prod snapshot.”

### 3.1 `glossary_terms` — **Needs policy first**

Public and admin both read/write this table through the Clerk/anon client. `search_content` and `get_search_suggestions` are **SECURITY INVOKER** and `SELECT` this table, so RLS applies inside those RPCs too.

| Surface | Client | What breaks with RLS + no policy |
|---------|--------|----------------------------------|
| `app/glossary/page.tsx` | `createServerSupabaseClient` | DB empty → page falls back to hardcoded `fallbackTerms` (degraded, not 500) |
| `GET /api/glossary` | same | `{ terms: [] }` or 500 |
| `GET /api/glossary/search` | `withOptionalAuth` | empty / fallback search empty |
| `GET /api/glossary/term-of-day` | same | **500** (`Failed to get term count` when `count` is 0) |
| `GET /api/glossary/trending` | same | term details empty |
| `POST /api/glossary/track` | same | “Term not found”; search-not-found logging may still insert into `glossary_interactions` |
| `GET /api/glossary/quiz` join | same | `glossary_terms (...)` embed empty |
| `GET /api/search` → `search_content` | invoker RPC | glossary hits disappear; articles/practices still work if those tables’ policies allow |
| `GET /api/search/suggestions` | invoker RPC | glossary suggestion branch empty |
| `app/admin/glossary/page.tsx` + `/api/admin/glossary/**` | Clerk JWT | admin list/create/update/enhance all fail or empty |
| `scripts/migrate-glossary-terms.ts` | **service_role** | **unaffected** |

**Required before `ENABLE RLS`:**

- `SELECT` to `anon`, `authenticated` (public catalog).
- `INSERT`/`UPDATE`/`DELETE` for admins (Clerk `clerk_user_id()` + `profiles.role = 'admin'`), **or** move admin writes to `supabaseAdmin`.

Draft’s commented `catalog_select_anon_authenticated` is the minimum to keep the public glossary. It is **not** enough for admin writes.

---

### 3.2 `search_queries` — **Needs policy first** (or accept tracking loss)

| Surface | Op | Blocking? |
|---------|----|-----------|
| `GET /api/search` | `INSERT` (only if `context.userId` and cache miss) | no — search still returns |
| `POST /api/search` (click) | `UPDATE` latest row | **yes** — 500 on click tracking |

No other `.from('search_queries')`. Search results themselves use `search_content`, not this table.

**If lockdown is OK:** `ENABLE RLS` with no policies is **Safe** for search UX; lose analytics.  
**If tracking must stay:** add `INSERT`/`UPDATE` for the calling role (and decide owner: Clerk `sub` vs `profiles.id` — the insert currently stores `context.userId` = Clerk id).

---

### 3.3 `search_suggestions` — **Safe** (lockdown) / optional SELECT later

No app `.from('search_suggestions')`. Only `get_search_suggestions` (invoker) reads it as the third `UNION` after article titles and `glossary_terms`. Live **0 rows**.

`ENABLE RLS` with no policy: autocomplete still returns article (+ glossary, if that table still has SELECT).  
Add a public `SELECT` only if you start seeding this table.

---

### 3.4 `subcategories` — **Safe**

Live table (`id, name, slug, category_id, description, order_index, …`) was created by remote migration `20250716105234_create_subcategories_table` — **not present in this repo’s `supabase/migrations/`**. **0 rows.** No `from('subcategories')` and no `subcategory` identifier in app TS/TSX.

Public category pages read **child `categories`** via `parent_id`:

```61:66:app/categories/[slug]/page.tsx
  const { data: subcategories } = await supabase
    .from('categories')
    .select('id, name, slug, description, icon')
    .eq('parent_id', category.id)
    .order('display_order')
```

`categories` already has RLS + `Public can view categories`. Locking `subcategories` does **not** break nav.

---

### 3.5 `content_analytics` — **Safe**

Created in `20250703234646_initial_schema.sql`. Typed in `types/database.ts`. **No runtime `.from('content_analytics')`.** Admin analytics uses other RPCs (`get_daily_article_views`, etc.). Enable RLS, no policies.

---

### 3.6 `email_template_versions` — **Needs policy first**

Remote history: dropped in `20250709020020_update_email_templates_structure`, recreated in `20250710121528_create_email_template_versions` **without RLS** (repo still has the older `20250706` file that *did* enable RLS + admin policy).

| Surface | Client |
|---------|--------|
| `GET /api/admin/email-templates/[id]` | `withAuth` → Clerk JWT; `select *` versions |
| `PUT` same route | `update` latest version `change_notes` |

```62:67:app/api/admin/email-templates/[id]/route.ts
    const { data: versions, error: versionsError } = await supabase
      .from('email_template_versions')
      .select('*')
      .eq('template_id', id)
      .order('version_number', { ascending: false })
```

`ENABLE RLS` with no policy: version history empty; `versionsError` → 500. Parent `email_templates` already has admin RLS via `auth.jwt() ->> 'sub'`. Mirror those policies (or use `supabaseAdmin`) **before** enabling RLS.

Trigger `create_email_template_version` (owner) may still insert on template update; PostgREST reads would still fail without `SELECT`.

---

## 4. Views (`security_invoker = true`)

Live `reloptions` are empty → default **security definer** (owner, bypasses caller RLS). PG 17.4 supports the draft’s `ALTER VIEW … SET (security_invoker = true)`.

### 4.1 `glossary_term_stats` — **Needs policy first**

```sql
FROM glossary_terms gt
LEFT JOIN glossary_interactions gi ON gt.id = gi.term_id
```

| Reader | Client |
|--------|--------|
| `app/admin/glossary/page.tsx` | Clerk JWT |
| `GET /api/glossary/analytics` | Clerk JWT |

After invoker:

- `glossary_terms` with RLS + no policy → **0 rows** (admin glossary stats + analytics most-viewed die).
- `glossary_interactions` already has RLS. Policies use `auth.uid() = user_id` / `profiles.id = auth.uid()`. Clerk `sub` is `user_xxx`, not `profiles.id`, so **even today’s interaction policies are a poor fit**. Definer currently hides that. Invoker will start enforcing it (admins may lose “all interactions” unless `auth.uid()` happens to equal `profiles.id`).

**Apply after** a public/admin `SELECT` on `glossary_terms` and a Clerk-aware policy on `glossary_interactions` (or keep this view definer until then).

---

### 4.2 `user_quiz_stats` — **Needs policy / auth review first**

```sql
FROM glossary_quiz_results GROUP BY user_id
```

Readers: `GET /api/glossary/quiz`, `GET /api/glossary/analytics` (personal block).  
Underlying table **already has RLS**. Invoker is the correct end state **if** `auth.uid()` matches stored `user_id`. Quiz `INSERT` uses Clerk `userId` as `user_id`. Policies compare `auth.uid() = user_id`. That only works if the JWT `sub` is that same string **and** `auth.uid()` accepts it (Clerk ids are not UUIDs; `auth.uid()` is `uuid`-typed in stock Supabase).

**Risk:** invoker makes the view return empty for everyone even though the table has policies. Verify one authenticated quiz GET before flipping. Do not block on this for the unused-RPC revokes.

---

### 4.3 `search_trends` — **Safe**

Reads `web_searches` (RLS on; user/admin `SELECT` via `auth.uid()` / `clerk_id`). **No app `.from('search_trends')`.** Trending UI uses `get_trending_searches` → matview `trending_searches`.

Invoker: anon loses definer bypass (good). Authenticated/admin see whatever `web_searches` policies allow. App unchanged.

---

## 5. Four tables with RLS and no policies (already locked)

Advisors (unchanged): `article_content_blocks`, `article_revisions`, `content_blocks`, `related_articles`.

Live: RLS on, **zero policies**, `anon`/`authenticated` still have table-level GRANT ALL (RLS denies every row).

| Table | App usage | Today with no policy | Draft |
|-------|-----------|----------------------|-------|
| `related_articles` | Public article page `app/[category]/[slug]/page.tsx` | Related cards **already empty** | Leave lockdown **or** add public `SELECT` as a **separate** fix |
| `article_revisions` | Admin versions UI + `lib/article-revisions.ts` **direct table** (not only `save_article_revision`) | List/insert via JWT **already denied**. `save_article_revision` is DEFINER and may still write | Do not “fix” by accident; adding `auth.uid() = profiles.id` policies will **not** match Clerk |
| `content_blocks` | no `.from()` | unused | leave |
| `article_content_blocks` | no `.from()` | unused | leave |

**Do not touch yet** in the P0 draft. Public related articles are a product bug **already**, not a regression from this SQL.

Repo `20250706_enhance_article_revisions.sql` *does* create revision policies using `profiles.id = auth.uid()` — those policies are **not live** (advisor + `pg_policy` empty). Do not assume the repo file is applied.

---

## 6. Safe revoke / apply order

```
1. REVOKE EXECUTE ON FUNCTION
     cancel_scheduled_publication(uuid),
     get_user_dashboard_layout(uuid),
     publish_scheduled_articles()
   FROM PUBLIC, anon, authenticated;
   -- keep service_role

2. App change (separate PR): admin settings + verification audit → supabaseAdmin
   then REVOKE update_setting(varchar, jsonb)
        and log_verification_activity(uuid, varchar, jsonb)
        FROM PUBLIC, anon, authenticated;

3. CREATE POLICY public SELECT on glossary_terms
   CREATE POLICY admin ALL on glossary_terms (Clerk clerk_user_id)
   then ENABLE RLS on glossary_terms;

4. CREATE POLICY admin SELECT/UPDATE on email_template_versions
   then ENABLE RLS;

5. ENABLE RLS (no policies) on content_analytics, subcategories
   optional: search_suggestions (empty)

6. search_queries: policy for insert/update OR accept tracking loss, then ENABLE RLS

7. ALTER VIEW search_trends SET (security_invoker = true);          -- Safe
   ALTER VIEW glossary_term_stats … only after step 3
   ALTER VIEW user_quiz_stats … only after a Clerk/auth.uid() probe
```

**Do not** `ENABLE RLS` on `glossary_terms` in the same transaction as “no policies.” That **would** break public glossary/search (and admin glossary), including invoker RPCs `search_content` / `get_search_suggestions`.

---

## 7. Scorecard (draft item → verdict)

| Draft item | Verdict | Why |
|------------|---------|-----|
| Revoke `cancel_scheduled_publication` from anon+authenticated | **Safe** | Unused; also revoke `PUBLIC` |
| Revoke `get_user_dashboard_layout` | **Safe** | Unused RPC; also revoke `PUBLIC` |
| Revoke `publish_scheduled_articles` | **Safe** | No app/cron; keep `service_role`; also revoke `PUBLIC` |
| Revoke `log_verification_activity` | **Do not touch yet** | Clerk-JWT callers; logs die if both roles revoked |
| Revoke `update_setting` | **Do not touch yet** | Admin Settings RPC; live func has **no** admin check (security hole + only write path) |
| ENABLE RLS `content_analytics` | **Safe** | No app readers |
| ENABLE RLS `search_queries` | **Needs policy first** | Else click-tracking 500; search GET still works |
| ENABLE RLS `search_suggestions` | **Safe** | Unused table / 0 rows |
| ENABLE RLS `glossary_terms` | **Needs policy first** | Public glossary + search + admin CRUD |
| ENABLE RLS `subcategories` | **Safe** | Unused; nav uses `categories.parent_id` |
| ENABLE RLS `email_template_versions` | **Needs policy first** | Admin version history |
| `glossary_term_stats` invoker | **Needs policy first** | Depends on `glossary_terms` (+ Clerk-aware interactions) |
| `user_quiz_stats` invoker | **Needs policy / auth review first** | `auth.uid()` vs Clerk `user_xxx` |
| `search_trends` invoker | **Safe** | Unused view |
| Touch 4 no-policy article tables | **Do not touch yet** | Already locked; related articles already empty |

---

## 8. What this pass did / did not do

- Read-only: codebase grep, `get_advisors`, `list_tables`, `list_migrations`, `SELECT` on `pg_proc` / `pg_class` / `pg_policy` / `information_schema`.
- **No** `apply_migration`, **no** DDL/DML, **no** grant changes.
- Live content is sparse (0 rows on the six RLS-off tables). Treat empty counts as “no current data leak volume,” not “feature unused.”

---

*Generated 2026-09-21. Approval required before any database change.*
