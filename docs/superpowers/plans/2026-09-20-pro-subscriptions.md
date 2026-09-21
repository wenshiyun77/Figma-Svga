# PRO 订阅（包月与永久）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 SVGA 编辑器交付可续费、会自动到期的包月 PRO，以及可区分展示的永久 PRO。

**Architecture:** 新的私有订阅表是套餐、开通时间和到期时间的权威来源；现有 `lighting` 权限表继续同步为兼容数据。`plugin-control` 只返回按当前服务端时间计算后的有效权益，后台和插件只消费这一统一契约。管理后台作为新的不可变 v10 release 发布，插件只替换顶部 PRO 文案与包月点击行为。

**Tech Stack:** Supabase Postgres migration/RLS/RPC、Supabase Edge Function（Deno TypeScript）、原生 ES module 管理后台、Figma Plugin JavaScript/HTML、Node assert checks。

**Spec:** `docs/superpowers/specs/2026-09-20-pro-subscriptions.md`

## Global Constraints

- 旧的 `lighting=true` 用户必须迁移为永久 PRO，不能丢失权限。
- 包月时长固定为每月 30 天；有效包月续费必须以既有到期日为基准顺延。
- 数据库以 `now()` 为到期权威；不得以浏览器时间或定时任务判断授权。
- 新订阅表启用 RLS，撤销 `anon`/`authenticated` 权限，仅 `service_role` 可访问。
- 后台包月与永久按钮高度均为 30px；未开通灰色、已开通金色且仅文字扫光。
- 插件端不得改变主体布局；包月身份点击仍打开既有购买联系弹窗，永久身份不打开。
- 管理后台必须以新的不可变 release 发布，不修改已上线 v9 文件。

## Review Focus

- 已过期的包月用户在任何 session、用户列表与 PRO Tab 中都不可作为 PRO；由 Task 2 的到期计算和 Task 5 的端到端契约测试覆盖。
- 同一用户在短时间内连续确认多次续费时，每次均按最新到期日累加；由 Task 1 的原子 RPC 断言和 Task 2 的请求测试覆盖。
- 历史 `lighting=true` 用户上线后仍显示永久 PRO 并保持可用；由 Task 1 迁移回填断言、Task 2 `featureState` 断言覆盖。
- 包月剩余 72 小时边界显示 3 天而不是 4 天，剩余不足 24 小时显示 1 天；由 Task 4 的 UI 运行时测试覆盖。
- 点击已开通包月不应关闭权限或弹出错误的会员反馈面板；由 Task 3 后台交互测试和 Task 4 点击行为断言覆盖。

---

## File Structure

- `project_source/unpacked/supabase/migrations/<generated>_pro_subscriptions.sql`：私有订阅表、RLS、权限、旧权限回填、原子套餐 RPC、有效 PRO 汇总函数。
- `project_source/unpacked/supabase/functions/plugin-control/index.ts`：将订阅信息纳入 session、管理员列表、PRO 筛选与写入动作。
- `project_source/unpacked/scripts/check-control-plane.mjs`：数据库和 Edge Function 静态安全/契约验证。
- `project_source/unpacked/src/main.js`：将订阅契约安全地透传给插件 UI。
- `project_source/unpacked/src/ui.html`：显示套餐与剩余天数；包月 PRO 点击打开既有购买弹窗。
- `project_source/unpacked/scripts/check-upgrade-runtime.mjs`：插件标题栏与套餐边界行为运行时验证。
- `live_admin_repo/cache-bridge/admin/releases/20260920-v10/*`：新的不可变管理后台 release。
- `live_admin_repo/cache-bridge/admin/index.html`：唯一引用 v10 release 的入口。
- `live_admin_repo/cache-bridge/admin/src/admin-release-v9.test.mjs`：扩展为覆盖当前不可变发布及订阅 UI 契约。

### Task 1: 数据库订阅权威模型

**Files:**
- Create: `project_source/unpacked/supabase/migrations/<generated>_pro_subscriptions.sql`
- Modify: `project_source/unpacked/scripts/check-control-plane.mjs`

**Interfaces:**
- Produces: `public.svga_plugin_pro_subscriptions`；`public.svga_admin_set_pro_subscription(p_figma_user_id text, p_plan_type text, p_months integer, p_updated_by uuid)`；`public.svga_effective_pro_subscription(p_figma_user_id text)`。
- Consumes: `svga_plugin_users`、`svga_plugin_feature_permissions` 和 `svga_admin_dashboard_summary`。

- [ ] **Step 1: Write the failing test**

Extend `check-control-plane.mjs` to require a generated subscription migration, RLS plus revoked grants, legacy `lighting=true` permanent backfill, a service-role-only atomic RPC, 30-day renewal arithmetic, and an effective-entitlement query that excludes expired monthly rows.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-control-plane.mjs`

Expected: FAIL because no subscription migration or subscription RPC exists.

- [ ] **Step 3: Generate and implement the migration**

Run `supabase migration new pro_subscriptions` to obtain the migration filename. Add the table, check constraints, RLS/grants, permanent backfill, atomic RPC, and summary function update. The RPC must reject invalid plan types/month counts and must use database time and row locking/upsert semantics.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-control-plane.mjs`

Expected: PASS with the migration security and entitlement contracts detected.

- [ ] **Step 5: Commit**

```bash
git add project_source/unpacked/supabase/migrations project_source/unpacked/scripts/check-control-plane.mjs
git commit -m "feat: add PRO subscription authority"
```

### Task 2: Edge Function subscription contract

**Files:**
- Modify: `project_source/unpacked/supabase/functions/plugin-control/index.ts`
- Modify: `project_source/unpacked/scripts/check-control-plane.mjs`

**Interfaces:**
- Consumes: `svga_effective_pro_subscription` and `svga_admin_set_pro_subscription` from Task 1.
- Produces: `features.lighting` plus `subscription: {plan, startedAt, expiresAt, daysRemaining}` in `session`, `admin-state`, and `admin-users`; `admin-user-feature` accepts `plan` and `months`.

- [ ] **Step 1: Write the failing test**

Add assertions that `featureState` reads the effective subscription, serializes `none/monthly/permanent`, that `adminUsers` uses effective PRO IDs and returns the subscription fields, and that `admin-user-feature` validates `plan`/`months` before calling the atomic RPC.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-control-plane.mjs`

Expected: FAIL because the function still reads raw `lighting` rows and accepts only `enabled`.

- [ ] **Step 3: Implement the minimal contract**

Create normalized subscription helpers in the Edge Function. Route user-list summary/filter and user cards through those helpers. Replace boolean toggling with server-validated plan actions; send ISO timestamps and a server-computed `daysRemaining`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-control-plane.mjs`

Expected: PASS with no direct raw permission entitlement path remaining for PRO status.

- [ ] **Step 5: Commit**

```bash
git add project_source/unpacked/supabase/functions/plugin-control/index.ts project_source/unpacked/scripts/check-control-plane.mjs
git commit -m "feat: expose effective PRO subscriptions"
```

### Task 3: 不可变后台 v10 的双套餐交互

**Files:**
- Create: `live_admin_repo/cache-bridge/admin/releases/20260920-v10/*` copied from v9 then minimally changed
- Modify: `live_admin_repo/cache-bridge/admin/index.html`
- Modify: `live_admin_repo/cache-bridge/admin/src/admin-release-v9.test.mjs`

**Interfaces:**
- Consumes: Task 2 `admin-users` subscription fields and `admin-user-feature` `{plan, months}` action.
- Produces: two non-destructive user-card controls and a local subscription dialog which updates one card only.

- [ ] **Step 1: Write the failing test**

Extend the release test to expect an immutable v10 entry, separate monthly/permanent controls, gray inactive state, 30px size, text-only gold sweep using `attr(data-label)`, modal quantity controls, and plan/month request payloads rather than `enabled` toggles.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test cache-bridge/admin/src/admin-release-v9.test.mjs`

Expected: FAIL because the entry is still v9 and contains one boolean PRO button.

- [ ] **Step 3: Implement the v10 release**

Copy v9 release assets to v10, preserve all existing material controls, add a compact accessible dialog, and update only user-card controls/styles. Update index references as one atomic release switch. Render `套餐 / 开通时间 / 到期时间` in PRO Tab cards; do not reload the complete list after success.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test cache-bridge/admin/src/admin-release-v9.test.mjs`

Expected: PASS with exactly one v10 runtime dependency set and no legacy boolean confirmation path.

- [ ] **Step 5: Commit**

```bash
git add cache-bridge/admin
git commit -m "feat: add monthly and permanent PRO admin controls"
```

### Task 4: 插件套餐身份与倒计时

**Files:**
- Modify: `project_source/unpacked/src/main.js`
- Modify: `project_source/unpacked/src/ui.html`
- Modify: `project_source/unpacked/scripts/check-upgrade-runtime.mjs`

**Interfaces:**
- Consumes: Task 2 subscription payload through `controlPlaneUiPayload()`.
- Produces: unchanged `lightingUnlocked` feature gate plus title-bar label behavior for monthly/permanent plans.

- [ ] **Step 1: Write the failing test**

Add tests for subscription normalization and UI rendering: monthly displays `包月PRO`, permanent displays `永久PRO`, 72-hour/24-hour boundaries show a clock icon and 3/1 remaining days, expired monthly becomes non-PRO, and monthly title click opens the existing contact popover while permanent does not.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/check-upgrade-runtime.mjs`

Expected: FAIL because the UI only renders `PRO` and returns early for every PRO click.

- [ ] **Step 3: Implement minimal UI propagation**

Normalize `subscription` in main/UI state, retain `lightingUnlocked` as the sole feature gate, add an inline clock SVG only for last-three-day monthly plans, and permit the existing contact popover only for `monthly`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/check-upgrade-runtime.mjs`

Expected: PASS with original contact image and permanent behavior preserved.

- [ ] **Step 5: Commit**

```bash
git add project_source/unpacked/src/main.js project_source/unpacked/src/ui.html project_source/unpacked/scripts/check-upgrade-runtime.mjs
git commit -m "feat: show PRO subscription type in plugin"
```

### Task 5: 集成、发布与生产验证

**Files:**
- Modify: `project_source/unpacked/cache-bridge/admin/*` synchronized from the verified v10 admin release
- Create: `Figma-SVGA-Editor-v0.8.38-pro-subscriptions.zip`
- Create: `project_source/unpacked/SVGA-v0.8.38-更新说明.txt`

**Interfaces:**
- Consumes: all prior task artifacts.
- Produces: deployed Edge Function/migration, published admin v10, validated plugin package.

- [ ] **Step 1: Write the failing integration gate**

Add/extend static checks so `npm run check` requires the new subscription migration, Edge contract, plugin labels, and the synchronized v10 admin artifacts.

- [ ] **Step 2: Run the gate to verify it fails before synchronization**

Run: `npm run check`

Expected: FAIL until the final admin v10 artifacts are copied into the plugin package and all new contracts exist.

- [ ] **Step 3: Complete integration and deploy**

Synchronize the verified admin v10 folder into the plugin package; build the v0.8.38 zip and update note. Apply the migration, deploy `plugin-control`, publish the admin release, and verify the online entry references only v10. Use only configured project credentials; do not expose keys.

- [ ] **Step 4: Run final verification**

Run: `npm run check && node --check src/main.js && node --test ../live_admin_repo/cache-bridge/admin/src/admin-release-v9.test.mjs && unzip -t ../Figma-SVGA-Editor-v0.8.38-pro-subscriptions.zip`

Expected: every command passes; production session/admin API returns subscription fields and an expired monthly fixture is not entitled.

- [ ] **Step 5: Commit**

```bash
git add cache-bridge/admin src supabase scripts SVGA-v0.8.38-更新说明.txt
git commit -m "release: ship PRO subscriptions"
```

## Self-Review

- Spec coverage: Tasks 1–2 provide authoritative, secured, automatic expiry; Task 3 covers all backend visual and dialog requirements; Task 4 covers the plugin’s distinct identity/click/countdown behavior; Task 5 packages and verifies the delivery.
- Placeholder scan: no deferred behavior or unspecified interfaces remain; the generated migration filename is intentionally obtained through the Supabase CLI.
- Type consistency: every consumer receives the shared `subscription` object and relies on `features.lighting` only for feature gating.
- Review focus: all five failure modes are assigned to Tasks 1–5 above.
