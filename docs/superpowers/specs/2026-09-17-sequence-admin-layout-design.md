# Sequence Admin + Plugin Layout Redesign

## Goal
Improve official sequence-material administration, synchronize category order into the plugin, add per-material usage counts, and restructure the plugin layout so canvas metadata and sequence parameters no longer waste central or right-panel space.

## Confirmed requirements

### Official material cards in web admin
- Move the lock action to the top-right of each official-material preview card.
- Use the same lock icon language as the plugin: unlocked = gray; locked = gold border/background/icon.
- Remove the bottom text lock/unlock button.
- On the material-name row, place a right-aligned usage count such as `使用 123`.
- Usage count means successful clicks that actually add that official material to the canvas; failed adds do not count.

### Category tabs
- Add a fixed virtual category `全部` at the first position in both admin and plugin.
- `全部` is not stored as a database category, cannot be renamed, cannot be dragged, and always displays every categorized and uncategorized official material.
- Existing categories remain database rows using stable `category_id` references.
- Add an edit icon immediately to the right of the add-category control.
- Normal mode: clicking a category filters the list.
- Edit mode: category labels can be renamed inline and dragged to reorder.
- Category names are 1–8 characters after trimming. Chinese, English letters, numbers, and ordinary display characters are allowed; names may not be empty.
- Renaming a category automatically updates all material displays because materials reference category IDs rather than category text.
- Reordering submits the full category order in one backend request after drop, then persists normalized `sort_order` values.
- Plugin official-category order must exactly follow backend order, prefixed by fixed `全部`.
- Metadata/category-order changes must not force already cached original sequence frames to re-download.

### Official material usage statistics
- Add a dedicated per-official-material usage-event path rather than overloading the current global `sequence_import` count.
- Plugin sends the event only after the material has been successfully added to the canvas.
- Event includes an idempotency event ID so network retries cannot double count.
- Backend validates that the referenced official sequence exists.
- Store detailed events for deduplication/audit and expose an aggregated usage count with each official sequence in the admin response.
- The existing global `sequence_import` user metric remains unchanged.

### Plugin left panel and center stage
- Move canvas name, layer count, canvas dimensions, Save Config, Reuse Config, and Clear Config into the current-layer-material panel.
- Place a compact purple re-sync icon immediately after the canvas name.
- Show layer count and canvas dimensions on the next compact metadata line.
- Put Save Config / Reuse Config / Clear Config on the following line with reduced button height.
- Preserve existing button IDs and behavior; only change placement and compact styling.
- Remove the current 54px center `stage-toolbar`; the canvas/stage begins immediately below the global title bar.

### Sequence-parameter bar
- Move all sequence animation parameters out of the right-side sequence-material panel.
- Create a new compact parameter region immediately above the bottom canvas toolbar shown in the reference screenshot.
- The region is visible only when a sequence-frame layer is selected; otherwise it occupies no height.
- Preserve all existing parameter element IDs and behaviors.
- At maximum plugin width, all sequence parameters fit on one row.
- At narrower widths the controls wrap responsively with minimal height.
- The right-side sequence material list must keep the same vertical start position regardless of whether a sequence layer is selected.

## Data model and API design

### Category ordering
Use existing `svga_official_sequence_categories.sort_order`.

Add an admin-only backend action:
- `admin-sequence-category-reorder`
- input: `ids: string[]`
- validates each UUID, rejects duplicates, requires the provided set to match current stored categories, then writes normalized sort orders `10, 20, 30, ...` in one database function/transaction.

Category create/update enforces the 8-character limit server-side.

### Usage events
Create table `svga_official_sequence_usage_events`:
- `event_id uuid primary key`
- `sequence_set_id uuid not null references svga_official_sequence_sets(id) on delete cascade`
- `figma_user_id text not null`
- `created_at timestamptz not null default now()`

Indexes:
- `(sequence_set_id)` for aggregation
- `(created_at)` for operational inspection

Add RPC `record_svga_official_sequence_usage(p_event_id uuid, p_sequence_set_id uuid, p_figma_user_id text)` using an idempotent insert (`on conflict do nothing`) after validating the sequence exists.

Add public plugin action:
- `official-sequence-use`
- requires normalized plugin user payload and a valid sequence-set UUID + event UUID.
- records/refreshes the user metadata via existing usage path with no global event increment, then records the material event.

Admin `admin-sequences` response includes `usageCount` for each official sequence. Public `official-sequences` does not need usage counts.

## UI behavior

### Admin category edit mode
- Header sequence: `全部`, existing categories, `+`, edit-icon.
- Entering edit mode gives editable category chips a drag handle affordance and inline input on activation.
- Enter confirms rename; Escape cancels rename; blur commits a valid changed value.
- Dragging reorders only real categories; `全部`, add, and edit controls are fixed.
- Filtering remains disabled for drag gestures while in edit mode to avoid accidental tab switches.

### Admin lock control
- Absolute-position icon button in the preview top-right.
- Accessible label/title switches between `锁定素材` and `解除锁定`.
- Existing `admin-sequence-update` endpoint remains the source of truth.

### Plugin category tabs
- Render `全部` before server categories.
- Filtering by `全部` returns all official sequences including rows with missing/unknown category IDs.
- Categories retain backend sort order exactly.

## Error handling
- Invalid category name (>8 or empty) is rejected both client-side and server-side with visible toast/error copy.
- Failed reorder leaves local order unchanged or reloads authoritative server state.
- Usage-event failures are non-blocking after a successful canvas add: user action remains successful and the plugin may log a short result-only message without exposing backend implementation details.
- Duplicate usage-event IDs are treated as success without increasing the count.

## Testing
- Database tests: 8-character category enforcement, transactional reorder, usage-event idempotency and per-sequence aggregation.
- Edge Function tests/static checks: new actions, validation, `usageCount` returned only where needed.
- Admin UI regression: fixed `全部`, edit control, inline rename max length 8, drag reorder request, top-right lock button, usage count in title row.
- Plugin UI regression: no center `stage-toolbar`, canvas summary moved into left material region, re-sync icon next to canvas name, compact config buttons, sequence parameters outside right material panel and above bottom toolbar, right sequence list stable.
- Plugin behavior regression: official category order mirrors backend; `全部` includes all; successful official add emits exactly one idempotent usage event.
- Existing build/tests remain green.

## Delivery
- Keep manifest ID `1648649590830419001` unchanged.
- Deploy Supabase migration and `plugin-control` new version.
- Deploy GitHub Pages admin.
- Produce a fresh installable plugin ZIP after verification.
