# Sequence Admin + Plugin Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver synchronized official-sequence category editing/order, per-material successful-use statistics, admin card lock/usage UI, and the requested plugin layout reorganization without changing the existing plugin manifest ID.

**Architecture:** Keep the existing category/set tables and plugin-control API. Extend Supabase with one transactional category-reorder RPC and one idempotent official-sequence usage event table/RPC, then expose minimal new Edge Function actions. Update the web admin to consume those fields/actions and update `src/ui.html` to keep category metadata separate from cached frame payloads, relocate existing controls without changing their IDs, and emit use events only after successful canvas insertion.

**Tech Stack:** Figma Plugin HTML/JS, Supabase Postgres/RPC, Supabase Edge Functions (Deno + supabase-js), GitHub Pages admin HTML/CSS/ESM, Node.js >=20 regression scripts.

**Spec:** `docs/superpowers/specs/2026-09-17-sequence-admin-layout-design.md`

## Global Constraints

- Plugin manifest ID remains `1648649590830419001`.
- Fixed virtual category `全部` is first, not persisted, not editable, and not draggable.
- Real category names are trimmed and limited to 1–8 characters.
- Category ordering is authoritative in backend `sort_order` and is mirrored by the plugin.
- Existing cached sequence frames must not be invalidated solely by category metadata/order changes.
- Usage count increments only after an official material is successfully added to the canvas.
- Usage submission must be idempotent by event UUID.
- Sequence parameter controls keep their existing element IDs and behavior.
- Existing Save/Reuse/Clear config and resync handlers keep their existing IDs/behavior.

---

### Task 1: Add database support for category reorder and official-material use events

**Files:**
- Create: `supabase/migrations/20260917_sequence_admin_usage.sql`
- Test: `scripts/check-sequence-admin-v1.mjs`

**Interfaces:**
- Produces RPC `reorder_svga_official_sequence_categories(p_ids uuid[])`.
- Produces RPC `record_svga_official_sequence_usage(p_event_id uuid, p_sequence_set_id uuid, p_figma_user_id text)`.
- Produces table `svga_official_sequence_usage_events(event_id, sequence_set_id, figma_user_id, created_at)`.

- [ ] **Step 1: Write failing static regression checks**

Create checks that require the migration to contain the usage-event table, PK event ID, FK to official sets, both indexes, transactional reorder RPC, dedupe insert, and normalized sort orders `10 * ordinality`.

- [ ] **Step 2: Run the check and verify RED**

Run: `node scripts/check-sequence-admin-v1.mjs`
Expected: FAIL because migration/RPCs do not exist.

- [ ] **Step 3: Write migration**

Implement the table/indexes and SECURITY DEFINER RPCs with `set search_path = public`. Reorder RPC rejects null/duplicate/mismatched category lists and updates all category sort orders atomically. Usage RPC verifies the sequence exists and inserts `ON CONFLICT (event_id) DO NOTHING`.

- [ ] **Step 4: Apply migration to Supabase and verify behavior**

Verify category list round-trip order, event idempotency (same UUID twice -> count +1 only), and per-sequence aggregation.

- [ ] **Step 5: Re-run static checks**

Expected: PASS.

### Task 2: Extend plugin-control for 8-char categories, reorder, usage events, and usageCount

**Files:**
- Modify deployed Supabase Edge Function: `plugin-control/index.ts`
- Test: `scripts/check-sequence-admin-v1.mjs`

**Interfaces:**
- Consumes DB RPCs from Task 1.
- Produces action `admin-sequence-category-reorder` with `{ids:string[]}`.
- Produces action `official-sequence-use` with `{user, sequenceSetId, eventId}`.
- Admin `admin-sequences` response includes `usageCount:number` on each sequence.

- [ ] **Step 1: Extend failing checks**

Require `OFFICIAL_SEQUENCE_CATEGORY_MAX_NAME = 8`, both new actions, UUID validation, RPC calls, and admin-only usage aggregation.

- [ ] **Step 2: Verify RED against current v25 source**

Expected: FAIL for missing actions/counts and 40-char category max.

- [ ] **Step 3: Implement minimal Edge Function changes**

Set max name 8. Add `reorderOfficialSequenceCategories`. Add `recordOfficialSequenceUse`. Extend `officialSequenceSets(includeDisabled, includeUsageCounts=false)` and only fetch/group usage events when admin asks. Route public `official-sequence-use` and admin reorder actions.

- [ ] **Step 4: Deploy new plugin-control version**

Keep `verify_jwt:false` because the current function already uses custom auth and plugin public actions.

- [ ] **Step 5: Verify live function source/version and smoke-query DB counts**

Expected: active new version, new routes present, current official materials still returned.

### Task 3: Rebuild official-material admin category/edit/lock/usage UI

**Files:**
- Modify: `cache-bridge/admin/src/main-v2.mjs`
- Modify: `cache-bridge/admin/src/styles-v2.css`
- Modify or extend: `cache-bridge/admin/src/material-density-v4.css`
- Test: `cache-bridge/admin/src/admin-ui-v5.test.mjs`

**Interfaces:**
- Consumes `admin-sequences.categories[].sortOrder` and `sequences[].usageCount`.
- Calls `admin-sequence-category-update`, `admin-sequence-category-reorder`, and existing `admin-sequence-update`.

- [ ] **Step 1: Write failing admin UI assertions**

Require fixed `全部`, category filter state, add + edit icon controls, `maxlength=8`, drag/drop reorder request, preview top-right lock icon with locked/unlocked state classes, removal of bottom text lock button, and `使用 N` aligned in title row.

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test cache-bridge/admin/src/admin-ui-v5.test.mjs`
Expected: FAIL for missing new controls.

- [ ] **Step 3: Implement admin state and rendering**

Add `officialCategoryFilter='all'` and edit-state variables. Filter list only in render. `全部` includes categorized and uncategorized sets. Create `category-toolbar`, fixed controls, editable/draggable category chips, safe optimistic drag with server reload on failure.

- [ ] **Step 4: Implement lock icon and usage title row**

Render lock button over preview top-right; gray unlocked and gold locked. Keep existing enable/rename/delete actions. Render `使用 ${usageCount}` to the right of material name.

- [ ] **Step 5: Run admin tests**

Expected: PASS.

### Task 4: Synchronize plugin official categories and successful-use tracking

**Files:**
- Modify: `src/ui.html`
- Test: `scripts/check-sequence-admin-v1.mjs`

**Interfaces:**
- Consumes public `official-sequences` categories in backend order.
- Calls public `official-sequence-use` after a successful official sequence add with `crypto.randomUUID()`/fallback UUID.

- [ ] **Step 1: Add failing plugin checks**

Require fixed `全部`, backend category order preservation, category filter using category IDs, category metadata excluded from frame-content cache version invalidation, and the official-use request after successful insertion.

- [ ] **Step 2: Verify RED**

Run: `node scripts/check-sequence-admin-v1.mjs`
Expected: FAIL for missing fixed-all/use-event behavior.

- [ ] **Step 3: Implement category metadata/order**

Store server categories separately from sequence frame cache. Render official tabs as `全部` plus categories in response order. Unknown/empty category IDs remain visible in `全部` only.

- [ ] **Step 4: Implement successful-add event**

After the canvas/project mutation succeeds for an official set, send one non-blocking `official-sequence-use` request with event UUID and current plugin-user payload. Do not send for previews, locked items, failed downloads, or failed adds.

- [ ] **Step 5: Run checks**

Expected: PASS.

### Task 5: Move canvas summary/config controls into the left current-material panel and remove center toolbar

**Files:**
- Modify: `src/ui.html`
- Test: `scripts/check-sequence-admin-v1.mjs`

**Interfaces:**
- Preserves IDs `canvasNameValue`, `canvasLayerValue`, `canvasSizeValue` and existing resync/save/reuse/clear IDs discovered in source.

- [ ] **Step 1: Add failing layout assertions**

Require no center `.stage-toolbar` markup; require canvas summary inside left current-material region; resync icon adjacent to canvas name; config buttons underneath metadata with compact class.

- [ ] **Step 2: Verify RED**

Expected: FAIL.

- [ ] **Step 3: Move existing DOM controls without changing handlers/IDs**

Keep all existing control IDs so current JS listeners continue to work. Add compact CSS, purple icon treatment for resync, and let `.stage` start directly below topbar.

- [ ] **Step 4: Run checks**

Expected: PASS.

### Task 6: Move sequence parameters above bottom canvas toolbar and keep right list stable

**Files:**
- Modify: `src/ui.html`
- Test: `scripts/check-sequence-admin-v1.mjs`

**Interfaces:**
- Preserves `sequenceLayerControls` and all existing sequence parameter input IDs.
- Existing `renderSequenceLayerControls()` continues to control visibility/value binding.

- [ ] **Step 1: Add failing structure/responsive checks**

Require `sequenceLayerControls` outside `motionSequencePanel`, within stage area directly before the bottom tool row, hidden when no sequence selection, CSS grid auto-flow/auto-fit that fits all controls in one row at maximum width, and sequence grid no longer moves when controls appear.

- [ ] **Step 2: Verify RED**

Expected: FAIL.

- [ ] **Step 3: Relocate parameter DOM and compact CSS**

Move only the control block, not IDs or listener code. Remove the old sequence title/empty-control vertical space from the right panel, leaving the official/personal material controls and sequence grid fixed.

- [ ] **Step 4: Run checks**

Expected: PASS.

### Task 7: Full regression, branch review, merge, deploy Pages, and package plugin

**Files:**
- Verify: `manifest.json`, `src/main.js`, `src/ui.html`, admin files, migration, Edge Function source
- Create artifact: `/mnt/data/Figma-SVGA-Editor-v0.8.30-sequence-admin-layout.zip`

**Interfaces:**
- Produces verified production DB + Edge Function + GitHub Pages admin + install ZIP.

- [ ] **Step 1: Run project checks**

Run: `npm run check`
Run: `node scripts/check-sequence-admin-v1.mjs`
Run: `node --test cache-bridge/admin/src/admin-ui-v5.test.mjs`
Expected: all PASS.

- [ ] **Step 2: Verify manifest ID**

Assert manifest id equals `1648649590830419001`.

- [ ] **Step 3: Review branch diff against spec**

Check every requirement in the spec is represented and no unrelated refactor slipped in.

- [ ] **Step 4: Merge validated branch to main**

Use fast-forward/PR merge only after checks pass.

- [ ] **Step 5: Verify GitHub Pages deployment**

Wait for Pages workflow success and fetch live admin entry/resources to confirm new code is actually served.

- [ ] **Step 6: Verify Supabase production**

Confirm migration objects exist and plugin-control new version is ACTIVE.

- [ ] **Step 7: Build ZIP**

Package `manifest.json`, `src/main.js`, `src/ui.html`, and required publish assets according to the existing plugin package structure. Verify ZIP entries and SHA-256.

- [ ] **Step 8: Final completion report**

Report deployed components, tests, Edge Function version, Pages status, ZIP size/SHA-256, and provide the install ZIP link.
