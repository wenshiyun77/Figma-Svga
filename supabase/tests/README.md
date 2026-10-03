# Admin lifetime usage and ranking

`node --test supabase/tests/admin-user-usage.test.mjs` verifies the Edge API and external admin cards. `node --test cache-bridge/admin/src/*.test.mjs supabase/tests/*.test.mjs` runs the existing admin regressions too.

Apply `supabase/migrations/20261003034529_admin_lifetime_usage_and_pag.sql` before deploying `plugin-control`, then run `supabase/tests/admin-user-usage.sql` against Postgres. Its transaction rolls back all fixtures and the PAG event. It asserts all-date aggregation, counts above signed 32-bit, the six export formats, zero-usage users, global competition ranks, stable ties/pages, search, day/online filters and service-only ACLs.

The existing `admin-users` action accepts `sort: "default" | "opens" | "exports"`. It returns `totalOpenCount`, `totalExportCount`, `openRank`, `exportRank` and today's `pagExportCount` on each user. Existing counter fields remain for the requested Beijing day; `otherExportCount` now includes PAG. `svga_admin_user_usage_page` aggregates stored daily rows in Postgres, then computes ranks across all users before filters and pagination. Equal totals share rank with gaps (1,1,3); tied list items sort by user number and Figma ID. Zero activity reports totals 0 with the corresponding global rank.

Totals mean **all recorded history**, not pre-telemetry activity. Successful export totals sum SVGA, WebP, GIF, Lottie, WebM and PAG. Older PAG exports cannot be recovered because they were not previously tracked. New successful PAG events increment `pag_export_count`; plugin analytics must send `pag_export` only after successful output. Export failures do not increment counters. Opens preserve the deployed semantics: explicit plugin opens plus one automatic daily open on the first heartbeat when that day has no recorded open; subsequent heartbeats do not inflate usage.

The lifetime RPC is `SECURITY INVOKER`, with empty search path and EXECUTE restricted to service_role. The Edge admin route still validates the authenticated user's email against `wenshiyun77@gmail.com`. No raw events or user-wide histories are fetched by the browser. PRO/day filters use SQL EXISTS rather than capped ID lists. Search uses literal substrings and exact #number matches.

Deployment order: migration → Edge → immutable admin release and entrypoint. Release `20261003-v16` keeps PRO controls, materials and growth chart behavior while adding compact lifetime metrics, global ranks and opens/exports leaderboards. Both first and subsequent pages send sort; in-flight pages are discarded when filter/sort changes.
