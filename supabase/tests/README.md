# Admin lifetime usage and ranking

`node --test supabase/tests/admin-user-usage.test.mjs` verifies the Edge API and external admin cards. `node --test cache-bridge/admin/src/*.test.mjs supabase/tests/*.test.mjs` runs the existing admin regressions too.

Apply `supabase/migrations/20261003034529_admin_lifetime_usage_and_pag.sql` before deploying `plugin-control`, then run `supabase/tests/admin-user-usage.sql` against Postgres. Its transaction rolls back all fixtures and the PAG event. It asserts all-date aggregation, counts above signed 32-bit, the six export formats, zero-usage users, global competition ranks, stable ties/pages, search, day/online filters and service-only ACLs.

The existing `admin-users` action accepts `sort: "default" | "opens" | "exports"`. It returns `totalOpenCount`, `totalExportCount`, `openRank`, `exportRank` and today's `pagExportCount` on each user. Existing counter fields remain for the requested Beijing day; `otherExportCount` now includes PAG. `svga_admin_user_usage_page` aggregates stored daily rows in Postgres, then computes ranks across all users before filters and pagination. Equal totals share rank with gaps (1,1,3); tied list items sort by user number and Figma ID. Zero activity reports totals 0 with the corresponding global rank.

Totals mean **all recorded history**, not pre-telemetry activity. Successful export totals sum SVGA, WebP, GIF, Lottie, WebM and PAG. Older PAG exports cannot be recovered because they were not previously tracked. New successful PAG events increment `pag_export_count`; plugin analytics must send `pag_export` only after successful output. Export failures do not increment counters. Opens preserve the deployed semantics: explicit plugin opens plus one automatic daily open on the first heartbeat when that day has no recorded open; subsequent heartbeats do not inflate usage.

The lifetime RPC is `SECURITY INVOKER`, with empty search path and EXECUTE restricted to service_role. The Edge admin route still validates the authenticated user's email against `wenshiyun77@gmail.com`. No raw events or user-wide histories are fetched by the browser. PRO/day filters use SQL EXISTS rather than capped ID lists. Search uses literal substrings and exact #number matches.

Deployment order: migration → Edge → immutable admin release and entrypoint. Release `20261003-v16` keeps PRO controls, materials and growth chart behavior while adding compact lifetime metrics, global ranks and opens/exports leaderboards. Both first and subsequent pages send sort; in-flight pages are discarded when filter/sort changes.

## 独立统计排名（20261003-v17）

用户卡片仅保留当日数据；“统计排名”独立列表展示全部历史累计打开、成功导出、Figma/序列帧导入、SVGA/WebP/GIF/Lottie/WebM/PAG 各格式导出和首次/最近使用时间。14 个数据表头支持点击排序，再次点击切换升降序。统计单独调用管理员 action `admin-user-statistics`，由服务角色 RPC `svga_admin_user_statistics_page` 完成全局排名、搜索、排序和分页。同值并列，搜索后仍显示全局排名。

`supabase/tests/admin-statistics.sql` 的事务集成检查包括各格式汇总、每项升降序、并列排名、分页、零使用用户和管理员权限，所有测试数据最后回滚。`node --test cache-bridge/admin/src/admin-statistics.test.mjs supabase/tests/admin-user-usage.test.mjs` 验证当前列表、表头和过期响应保护。

累计基于已经记录的历史数据；旧版本没有记录 PAG 导出事件，无法补算过去的 PAG 导出，v0.8.67 开始记录。
