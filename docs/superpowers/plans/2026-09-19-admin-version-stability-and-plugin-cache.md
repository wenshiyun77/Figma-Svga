# 后台版本稳定与插件缓存优化 Implementation Plan

> **For implementation:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task in the current session. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 发布一个不会混装新旧资源的单渲染器后台，并交付默认深色棋盘格、序列帧本地即时恢复的 SVGA Editor v0.8.37 插件包。

**Architecture:** GitHub Pages 后台改为按发布目录组织的自包含 v9 构建，入口只加载一套应用资源，素材管理由应用内唯一控制器拥有。插件侧保留 Supabase revision 作为失效信号，但先返回本地元数据和 IndexedDB 预览；远端完整清单仅在 revision 变化、显式重试或素材写操作后读取。

**Tech Stack:** 原生 HTML/CSS/ES Modules、Node.js 22 `node:test`、Figma Plugin API、Supabase Edge Function、GitHub Pages/GitHub Actions、IndexedDB、Figma `clientStorage`。

**Spec:** `docs/superpowers/specs/2026-09-19-admin-version-stability-and-plugin-cache-design.md`

## Global Constraints

- 后台线上唯一源码是 `wenshiyun77/Figma-Svga` 的 `cache-bridge/admin`。
- 插件源码基线是 Library 中的 `Figma-SVGA-Editor-v0.8.36-sequence-cache-ui-optimized.zip`，不是 GitHub Pages 仓库根目录里的旧插件文件。
- 后台 PRO 按钮高度保持 30px，文案保持“已开通PRO/未开通PRO”。
- 画布默认值改为 `checkered-dark`，但不得覆盖已保存项目或用户主动选择的背景。
- 缓存命中必须先显示素材；revision 相同不得请求完整官方素材清单。
- 入口不得依赖查询参数隔离发布版本；同一入口只引用同一发布目录下的资源。
- 旧发布资源必须保留，以保证缓存入口能够完整加载对应旧构建。

## Review Focus

- 用户在 Pages 更新后的十分钟 CDN 缓存窗口内拿到旧入口：旧入口必须仍能加载完整旧资源，不能引用已覆盖的新文件。
- 后台接口慢或失败：素材页不得先渲染一套旧 DOM 再被另一套新 DOM 替换。
- 插件控制面 revision 尚未返回但本地快照存在：序列帧仍应立即显示缓存，不得发起完整清单请求。
- “我的”素材本地快照为空数组：必须区分“有效空库缓存”和“从未同步”，防止每次进入都联网。
- 后台上传、删除或重命名后：本地缓存必须立即失效或更新，下一次显示不能继续使用旧数据。

---

### Task 1: 固定后台单构建发布契约

**Files:**
- Create: `cache-bridge/admin/src/admin-release-v9.test.mjs`
- Modify: `.github/workflows/admin-ui-tests.yml`
- Modify: `.github/workflows/cache-bridge-pages.yml`

**Interfaces:**
- Consumes: `cache-bridge/admin/index.html` 和 `cache-bridge/admin/releases/<build>/` 的发布结构。
- Produces: `node --test cache-bridge/admin/src/admin-release-v9.test.mjs`，作为 Pages 部署前门禁。

- [ ] **Step 1: 写发布契约失败测试**

测试读取 `index.html`，断言：

```js
assert.match(html, /window\.__SVGA_ADMIN_BUILD__="20260919-v9"/);
assert.match(html, /\.\/releases\/20260919-v9\/app\.mjs/);
assert.match(html, /\.\/releases\/20260919-v9\/styles\.css/);
assert.doesNotMatch(html, /official-materials-v6|official-materials-stable-v7|admin-upload-v7|admin-upload-queue-v8/);
assert.equal((html.match(/data-material-controller/g) || []).length, 1);
```

测试还应读取发布目录并断言 `app.mjs`、`styles.css`、`growth.mjs`、`growth.css` 和 `vendor/uPlot.iife.min.js` 均存在。

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test cache-bridge/admin/src/admin-release-v9.test.mjs`

Expected: FAIL，原因是 v9 构建标识或发布目录不存在。

- [ ] **Step 3: 将发布测试加入两个工作流**

在 `admin-ui-tests.yml` 和 Pages 工作流的上传步骤之前运行：

```yaml
- uses: actions/setup-node@v6
  with:
    node-version: 22
- name: Run admin release tests
  run: node --test cache-bridge/admin/src/admin-ui-v5.test.mjs cache-bridge/admin/src/admin-release-v9.test.mjs
```

- [ ] **Step 4: 运行现有测试，确认仅新契约失败**

Run: `node --test cache-bridge/admin/src/admin-ui-v5.test.mjs cache-bridge/admin/src/admin-release-v9.test.mjs`

Expected: 现有用例通过，新发布契约失败。

- [ ] **Step 5: 提交测试门禁**

```bash
git add cache-bridge/admin/src/admin-release-v9.test.mjs .github/workflows/admin-ui-tests.yml .github/workflows/cache-bridge-pages.yml
git commit -m "test: gate immutable admin releases"
```

### Task 2: 建立 v9 自包含后台发布

**Files:**
- Create: `cache-bridge/admin/releases/20260919-v9/app.mjs`
- Create: `cache-bridge/admin/releases/20260919-v9/styles.css`
- Create: `cache-bridge/admin/releases/20260919-v9/growth.mjs`
- Create: `cache-bridge/admin/releases/20260919-v9/growth.css`
- Create: `cache-bridge/admin/releases/20260919-v9/vendor/uPlot.iife.min.js`
- Create: `cache-bridge/admin/releases/20260919-v9/vendor/uPlot.min.css`
- Modify: `cache-bridge/admin/index.html`
- Test: `cache-bridge/admin/src/admin-release-v9.test.mjs`

**Interfaces:**
- Consumes: 当前 `main-v2.mjs` 的登录、用户、反馈和 API 请求逻辑；v6/v7/v8 中已验证的素材操作行为。
- Produces: `window.__SVGA_ADMIN_BUILD__ = "20260919-v9"` 和页面中唯一的 `data-material-controller="v9"` 素材根节点。

- [ ] **Step 1: 扩展失败测试覆盖资源一致性和禁止二次渲染**

```js
assert.match(app, /const ADMIN_BUILD='20260919-v9'/);
assert.match(app, /data-material-controller="v9"/);
assert.doesNotMatch(app, /new MutationObserver/);
assert.equal((app.match(/function renderOfficialMaterials/g) || []).length, 1);
assert.equal((app.match(/function uploadOfficialFolders/g) || []).length, 1);
```

同时断言入口引用均位于 `./releases/20260919-v9/`，不含 `?v=`。

- [ ] **Step 2: 运行扩展测试并确认失败**

Run: `node --test cache-bridge/admin/src/admin-release-v9.test.mjs`

Expected: FAIL，原因是 v9 应用和资源尚未创建。

- [ ] **Step 3: 创建发布目录并复制稳定能力**

以 `main-v2.mjs` 为应用基线，合并为一个 `app.mjs`：

```js
const ADMIN_BUILD='20260919-v9';
window.__SVGA_ADMIN_BUILD__=ADMIN_BUILD;
```

应用内部只保留以下素材入口：

```js
async function materialsPage() { /* 创建唯一 v9 根节点并加载当前 Tab */ }
async function loadOfficialMaterials() { /* 请求并提交快照 */ }
function renderOfficialMaterials() { /* 标签栏和卡片一次性渲染 */ }
async function uploadOfficialFolders(fileList) { /* 多文件夹队列 */ }
```

把 v7 的局部锁定、重命名、显示/隐藏、删除行为直接纳入这些函数，不注册捕获阶段补丁，也不使用 MutationObserver。

- [ ] **Step 4: 创建单发布样式和本地 vendor**

将当前 `styles-v2.css`、`material-density-v4.css`、`official-materials-v6.css` 和 PRO 样式合并进发布目录的 `styles.css`；从 `src/growth-trend-v5.mjs`、`src/growth-trend-v5.css` 和 `vendor/uplot/` 复制 growth v5 与 uPlot 到同一发布目录。删除合并后重复的 `.proBtn` 规则，只保留 Task 3 将验证的一套。

- [ ] **Step 5: 将入口切换到单发布目录**

入口只加载：

```html
<script>window.__SVGA_ADMIN_BUILD__="20260919-v9"</script>
<link rel="stylesheet" href="./releases/20260919-v9/styles.css">
<link rel="stylesheet" href="./releases/20260919-v9/growth.css">
<script src="./releases/20260919-v9/vendor/uPlot.iife.min.js"></script>
<script type="module" src="./releases/20260919-v9/app.mjs"></script>
<script type="module" src="./releases/20260919-v9/growth.mjs"></script>
```

- [ ] **Step 6: 运行语法和发布测试**

Run:

```bash
node --check cache-bridge/admin/releases/20260919-v9/app.mjs
node --check cache-bridge/admin/releases/20260919-v9/growth.mjs
node --test cache-bridge/admin/src/admin-ui-v5.test.mjs cache-bridge/admin/src/admin-release-v9.test.mjs
```

Expected: 全部通过。

- [ ] **Step 7: 提交自包含发布**

```bash
git add cache-bridge/admin/index.html cache-bridge/admin/releases/20260919-v9 cache-bridge/admin/src/admin-release-v9.test.mjs
git commit -m "fix: ship a single-renderer admin release"
```

### Task 3: 调整后台 PRO 按钮

**Files:**
- Modify: `cache-bridge/admin/releases/20260919-v9/app.mjs`
- Modify: `cache-bridge/admin/releases/20260919-v9/styles.css`
- Test: `cache-bridge/admin/src/admin-release-v9.test.mjs`

**Interfaces:**
- Consumes: `userCard(user, index)` 输出的 `.avatar`、`.user-copy` 和 `.proBtn[data-on]`。
- Produces: 30px 高、相对 34px 头像顶部偏移 2px 的权限按钮；`applyProButtonState(button, enabled)` 负责无刷新切换状态。

- [ ] **Step 1: 写按钮视觉和局部更新失败测试**

```js
assert.match(css, /\.proBtn\{[^}]*height:30px[^}]*align-self:start[^}]*margin-top:2px/s);
assert.match(css, /\.proBtn\[data-on="0"\][^{]*\{[^}]*#8b5cf6/s);
assert.match(css, /\.proBtn\[data-on="1"\][^{]*\{[^}]*#edc676/s);
assert.match(app, /function applyProButtonState\(button,enabled\)/);
assert.doesNotMatch(app, /await loadUsers\(\)[\s\S]{0,120}admin-user-feature/);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node --test cache-bridge/admin/src/admin-release-v9.test.mjs`

Expected: FAIL，原因是按钮中心线或局部更新函数不符合契约。

- [ ] **Step 3: 实现插件端一致的两种按钮状态**

公共尺寸：

```css
.proBtn{height:30px;min-height:30px;align-self:start;margin-top:2px;padding:0 6px;border-radius:6px}
```

未开通使用 `#8b5cf6` 紫色描边；已开通使用 `#edc676` 金色与 2.8 秒扫光。点击保存成功后调用：

```js
function applyProButtonState(button,enabled){
  button.dataset.on=enabled?'1':'0';
  button.textContent=enabled?'已开通PRO':'未开通PRO';
}
```

- [ ] **Step 4: 运行后台全部测试**

Run: `node --test cache-bridge/admin/src/admin-ui-v5.test.mjs cache-bridge/admin/src/admin-release-v9.test.mjs`

Expected: 全部通过。

- [ ] **Step 5: 提交按钮改动**

```bash
git add cache-bridge/admin/releases/20260919-v9 cache-bridge/admin/src/admin-release-v9.test.mjs
git commit -m "style: align admin PRO controls with plugin"
```

### Task 4: 插件默认深色棋盘格

**Files:**
- Create: `/workspace/scratch/7df98f31870c/project_source/unpacked/scripts/check-v0837-default-canvas-and-cache.mjs`
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/src/ui.html`

**Interfaces:**
- Consumes: `state.canvasBg` 与 `.swatch[data-bg]` 的既有背景切换逻辑。
- Produces: 新项目默认 `checkered-dark`，既有保存状态仍可在恢复阶段覆盖默认值。

- [ ] **Step 1: 写默认背景失败测试**

```js
assert.match(ui, /canvasBg:\s*"checkered-dark"/);
assert.match(ui, /class="swatch checkered-dark active" data-bg="checkered-dark"/);
assert.doesNotMatch(ui, /class="swatch black active"/);
```

- [ ] **Step 2: 运行测试并确认失败**

Run: `node scripts/check-v0837-default-canvas-and-cache.mjs`

Expected: FAIL，当前默认值仍为 `black`。

- [ ] **Step 3: 修改默认状态和按钮激活态**

仅修改初始化默认值和静态按钮 class，不改变 `updateCanvasBackground()` 或已有配置恢复流程。

- [ ] **Step 4: 运行聚焦测试**

Run: `node scripts/check-v0837-default-canvas-and-cache.mjs`

Expected: 默认背景检查通过。

### Task 5: 官方序列帧缓存先显示、revision 变化才同步

**Files:**
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/src/main.js`
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/src/ui.html`
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/scripts/check-v0837-default-canvas-and-cache.mjs`
- Test: `/workspace/scratch/7df98f31870c/project_source/unpacked/scripts/check-sequence-local-persistence.mjs`
- Test: `/workspace/scratch/7df98f31870c/project_source/unpacked/scripts/check-sequence-library-sync.mjs`

**Interfaces:**
- Consumes: `readOfficialSequenceMetadataCache()`、`controlPlaneRuntime.officialSequenceRevision`。
- Produces: `listOfficialSequences(message)` 的 `cacheSource: "local-first" | "local-revision" | "remote"`；缓存响应带 `needsRefresh` 布尔值。

- [ ] **Step 1: 写官方本地优先失败测试**

测试提取 `listOfficialSequences` 并用 fixture 验证：

```js
assert.equal(result.cacheSource, 'local-first');
assert.equal(remoteCalls, 0);
assert.equal(result.needsRefresh, true); // 远端 revision 已知且不同
```

另一个 fixture 验证 revision 相同返回 `local-revision` 且 `remoteCalls === 0`。

- [ ] **Step 2: 运行聚焦测试并确认失败**

Run:

```bash
node scripts/check-v0837-default-canvas-and-cache.mjs
node scripts/check-sequence-local-persistence.mjs
```

Expected: 新本地优先契约失败。

- [ ] **Step 3: 修改主线程官方列表策略**

当 `force !== true` 且缓存可用时立即返回缓存：

```js
const revisionChanged = Boolean(expectedRevision && cached.revision !== expectedRevision);
payload = {
  sequences: cached.sequences,
  categories: cached.categories,
  revision: cached.revision,
  cacheSource: revisionChanged ? 'local-first' : 'local-revision',
  needsRefresh: revisionChanged,
  unchanged: !revisionChanged,
};
```

只有 UI 随后的显式静默刷新请求带 `force: true` 时读取 `official-sequences`。

- [ ] **Step 4: UI 先渲染缓存，再静默刷新**

`loadOfficialSequenceLibrary()` 收到 `needsRefresh` 时设置非阻塞状态，保持 `officialSequenceLibraryReady = true`，先调用 `renderSequenceList()`，再排队一次 `force: true` 请求。静默刷新不得设置 `sequence-library-busy`。

- [ ] **Step 5: 运行官方缓存测试**

Run:

```bash
node scripts/check-v0837-default-canvas-and-cache.mjs
node scripts/check-sequence-local-persistence.mjs
node scripts/check-sequence-library-sync.mjs
```

Expected: 全部通过，revision 相同零完整列表请求。

### Task 6: “我的”素材跳过首次远端会话

**Files:**
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/src/main.js`
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/src/ui.html`
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/scripts/check-v0837-default-canvas-and-cache.mjs`
- Test: `/workspace/scratch/7df98f31870c/project_source/unpacked/scripts/check-personal-library-identity.mjs`

**Interfaces:**
- Consumes: `readPersonalSequenceMetadataCacheSnapshot()` 返回 `{ savedAt, revision, sequences, initialized }`。
- Produces: `listPersonalSequences(message)` 在有效缓存下不调用 `ensurePersonalLibrarySession()`；素材写操作通过 `markPersonalSequenceMetadataDirty()` 标记需要远端核对。

- [ ] **Step 1: 写有效空库与非空快照失败测试**

测试同时覆盖：

```js
assert.equal(snapshot.initialized, true);
assert.deepEqual(snapshot.sequences, []);
assert.equal(sessionCalls, 0);
```

以及有素材快照时 `sessionCalls === 0`。从未写入缓存时 `initialized === false`，允许建立远端会话。

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
node scripts/check-v0837-default-canvas-and-cache.mjs
node scripts/check-personal-library-identity.mjs
```

Expected: FAIL，当前列表读取会先调用远端会话。

- [ ] **Step 3: 为缓存快照加入 initialized/dirty 状态**

写入缓存时保存：

```js
{ version: 4, initialized: true, dirty: false, savedAt, revision, sequences }
```

上传完成、删除、重命名后更新本地条目并设置 `dirty: true`；远端完整同步成功后写回 `dirty: false`。

- [ ] **Step 4: 修改个人列表读取顺序**

先读快照。`force !== true && initialized && !dirty` 时直接返回 `cacheSource: "local-first"`，不调用远端会话。`dirty`、无缓存或显式重试时才调用 `ensurePersonalLibrarySession()` 和 `personal-sequences`。

- [ ] **Step 5: 运行个人素材与完整序列帧测试**

Run:

```bash
node scripts/check-v0837-default-canvas-and-cache.mjs
node scripts/check-personal-library-identity.mjs
node scripts/check-sequence-library-sync.mjs
node scripts/check-sequence-local-persistence.mjs
```

Expected: 全部通过。

### Task 7: 同步后台快照并发布插件 v0.8.37 包

**Files:**
- Replace directory: `/workspace/scratch/7df98f31870c/project_source/unpacked/cache-bridge/admin/`
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/package.json`
- Modify: `/workspace/scratch/7df98f31870c/project_source/unpacked/src/main.js`
- Create: `/workspace/scratch/7df98f31870c/project_source/unpacked/SVGA-v0.8.37-更新说明.txt`
- Create: `/workspace/scratch/7df98f31870c/Figma-SVGA-Editor-v0.8.37-admin-stable-local-first.zip`

**Interfaces:**
- Consumes: GitHub Pages 仓库已通过测试的 `cache-bridge/admin` 与插件改动。
- Produces: v0.8.37 可安装 ZIP，内含与线上一致的后台发布快照。

- [ ] **Step 1: 写版本和后台快照一致性失败检查**

在 v0.8.37 检查脚本中断言：

```js
assert.equal(pkg.version, '0.8.37');
assert.match(main, /pluginVersion:\s*"0\.8\.37"/);
assert.equal(pluginAdminIndex, pagesAdminIndex);
```

- [ ] **Step 2: 运行检查并确认失败**

Run: `node scripts/check-v0837-default-canvas-and-cache.mjs`

Expected: FAIL，版本仍为 0.8.36 或后台快照未同步。

- [ ] **Step 3: 同步后台目录并升级版本**

使用已验证的 GitHub Pages `cache-bridge/admin` 覆盖插件包内同名目录；将 `package.json` 和 `src/main.js` 两处上报版本改为 `0.8.37`。

- [ ] **Step 4: 运行插件完整验证**

Run:

```bash
npm run check
node --check src/main.js
node scripts/check-v0837-default-canvas-and-cache.mjs
```

Expected: 全部退出 0。

- [ ] **Step 5: 打包并校验 ZIP**

Run:

```bash
zip -qr /workspace/scratch/7df98f31870c/Figma-SVGA-Editor-v0.8.37-admin-stable-local-first.zip . -x '*.DS_Store'
unzip -t /workspace/scratch/7df98f31870c/Figma-SVGA-Editor-v0.8.37-admin-stable-local-first.zip
```

Expected: `No errors detected in compressed data`。

### Task 8: 部署 GitHub Pages 并验证线上一致性

**Files:**
- Modify: Git history on `main`
- Verify: `https://wenshiyun77.github.io/Figma-Svga/admin/`

**Interfaces:**
- Consumes: Tasks 1-3 的已提交后台构建。
- Produces: GitHub Pages 线上 v9 后台，以及可核对的 `20260919-v9` 构建标识。

- [ ] **Step 1: 运行部署前完整检查**

Run:

```bash
git status --short
node --test cache-bridge/admin/src/admin-ui-v5.test.mjs cache-bridge/admin/src/admin-release-v9.test.mjs
node --check cache-bridge/admin/releases/20260919-v9/app.mjs
```

Expected: 工作树仅含计划内改动，全部测试通过。

- [ ] **Step 2: 推送 main**

Run: `git push origin main`

Expected: 推送成功，Pages 工作流开始运行。

- [ ] **Step 3: 等待并核对 Pages 工作流**

使用仓库工作流状态确认 `Deploy SVGA Cache Bridge` 成功；若失败，只依据失败日志修复并重新运行完整检查。

- [ ] **Step 4: 验证线上入口与资源**

连续请求入口并检查：

```bash
curl -fsSL https://wenshiyun77.github.io/Figma-Svga/admin/ | rg '20260919-v9|releases/20260919-v9'
curl -fsSL https://wenshiyun77.github.io/Figma-Svga/admin/releases/20260919-v9/app.mjs | shasum -a 256
```

线上哈希必须与本地文件一致。

- [ ] **Step 5: 浏览器行为验证**

在普通刷新、强制刷新、新标签页、切换浏览器标签和用户数据/素材管理往返后确认：

- `window.__SVGA_ADMIN_BUILD__ === "20260919-v9"`；
- 页面始终只有一个 `[data-material-controller="v9"]`；
- 素材卡片不会从旧版布局跳变为新版；
- PRO 按钮与头像中心线一致，两个状态视觉正确。

### Task 9: 保存交付物并最终复核

**Files:**
- Create Library file: `Figma-SVGA-Editor-v0.8.37-admin-stable-local-first.zip`
- Create Library file: `SVGA-v0.8.37-更新说明.txt`

**Interfaces:**
- Consumes: 已验证 ZIP、更新说明、线上构建哈希。
- Produces: 用户可下载的最终插件包和说明。

- [ ] **Step 1: 再次执行完成前验证**

Run:

```bash
npm run check
node --check src/main.js
unzip -t /workspace/scratch/7df98f31870c/Figma-SVGA-Editor-v0.8.37-admin-stable-local-first.zip
```

Expected: 所有命令退出 0。

- [ ] **Step 2: 核对需求清单**

逐项确认：后台单渲染器、不可混用发布、PRO 按钮、默认深色棋盘格、官方 revision 本地优先、个人缓存跳过会话、线上部署和插件包后台快照一致。

- [ ] **Step 3: 保存最终文件**

创建新的 v0.8.37 Library 文件，不覆盖原 v0.8.36 恢复包；返回最终 ZIP 和更新说明链接。
