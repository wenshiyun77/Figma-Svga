import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.95.0";

const ADMIN_EMAIL = "wenshiyun77@gmail.com";
const OFFICIAL_SEQUENCE_BUCKET = "svga-official-sequences";
const PERSONAL_SEQUENCE_BUCKET = "svga-personal-sequences";
const OFFICIAL_SEQUENCE_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const OFFICIAL_SEQUENCE_MAX_FRAMES = 300;
const OFFICIAL_SEQUENCE_MAX_BYTES = 10 * 1024 * 1024;
const OFFICIAL_SEQUENCE_MAX_PREVIEWS = 1;
const OFFICIAL_SEQUENCE_MAX_PREVIEW_BYTES = 512 * 1024;
const OFFICIAL_SEQUENCE_CATEGORY_MAX_NAME = 8;
const OFFICIAL_SEQUENCE_UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERSONAL_SEQUENCE_MAX_FRAMES = 1000;
const PERSONAL_SEQUENCE_MAX_FRAME_BYTES = 10 * 1024 * 1024;
const PERSONAL_SEQUENCE_MAX_TOTAL_BYTES = 10 * 1024 * 1024;
const PERSONAL_SEQUENCE_LIBRARY_MAX_BYTES = 10 * 1024 * 1024;
const PERSONAL_SEQUENCE_MAX_PREVIEWS = 1;
const PERSONAL_SEQUENCE_MAX_PREVIEW_BYTES = 1024 * 1024;
const PERSONAL_SEQUENCE_SIGNED_READ_SECONDS = 24 * 60 * 60;
const ALLOWED_EVENTS = new Set([
  "plugin_open",
  "figma_import",
  "svga_export",
  "webp_export",
  "gif_export",
  "lottie_export",
  "webm_export",
  "pag_export",
  "sequence_import",
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const DEFAULT_SEQUENCE_CACHE_BRIDGE_URL = "https://wenshiyun77.github.io/Figma-Svga/";
const sequenceCacheBridgeUrl = (() => {
  const value = String(Deno.env.get("SVGA_SEQUENCE_CACHE_BRIDGE_URL") || DEFAULT_SEQUENCE_CACHE_BRIDGE_URL).trim();
  return /^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value) ? value : "";
})();
const service = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const beijingDate = (value = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);
  const part = (type: string) => parts.find((item) => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const httpError = (status: number, message: string) => {
  const error = new Error(message) as Error & { status?: number };
  error.status = status;
  return error;
};

type PluginUser = {
  figmaUserId: string;
  displayName: string;
  photoUrl: string | null;
  sessionId: number;
  pluginVersion: string;
};

const normalizePluginUser = (value: unknown): PluginUser => {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const figmaUserId = String(source.figmaUserId || "").trim().slice(0, 256);
  if (!figmaUserId) throw httpError(400, "缺少 Figma 用户 ID。");
  const rawSessionId = Number(source.sessionId || 0);
  return {
    figmaUserId,
    displayName: String(source.displayName || "Anonymous").trim().slice(0, 256) || "Anonymous",
    photoUrl: source.photoUrl ? String(source.photoUrl).slice(0, 2048) : null,
    sessionId: Number.isSafeInteger(rawSessionId) && rawSessionId >= 0 ? rawSessionId : 0,
    pluginVersion: String(source.pluginVersion || "").slice(0, 64),
  };
};

const recordUsage = async (user: PluginUser, event: string | null) => {
  if (event !== null && !ALLOWED_EVENTS.has(event)) throw httpError(400, "无效的使用事件。");
  const { error } = await service.rpc("record_svga_plugin_usage", {
    p_figma_user_id: user.figmaUserId,
    p_display_name: user.displayName,
    p_photo_url: user.photoUrl,
    p_session_id: user.sessionId,
    p_plugin_version: user.pluginVersion,
    p_event: event,
  });
  if (error) throw error;
};

const personalLibraryTokenHash = async (token: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

const makePersonalLibraryToken = () => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const value of bytes) binary += String.fromCharCode(value);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

type PersonalLibraryClient = {
  id: string;
  token: string;
  figmaUserId: string;
};

const requirePersonalLibraryClient = async (body: Record<string, unknown>): Promise<PersonalLibraryClient> => {
  const token = String(body.libraryToken || "");
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) throw httpError(401, "个人素材库会话无效。");
  const tokenHash = await personalLibraryTokenHash(token);
  const { data, error } = await service
    .from("svga_personal_library_clients")
    .select("id, figma_user_id")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(401, "个人素材库会话已失效。");
  return {
    id: String(data.id),
    token,
    figmaUserId: String(data.figma_user_id || ""),
  };
};

const personalLibrarySession = async (body: Record<string, unknown>) => {
  // Figma profile fields are display-only metadata. The 256-bit opaque token is
  // the sole authorization credential for every personal-library read/write.
  const profile = normalizePluginUser(body.user);
  await recordUsage(profile, null);
  const suppliedToken = String(body.libraryToken || "");
  if (suppliedToken) {
    const client = await requirePersonalLibraryClient(body);
    if (client.figmaUserId !== profile.figmaUserId) {
      throw httpError(401, "个人会话与当前 Figma 账号不一致。");
    }
    const { error } = await service
      .from("svga_personal_library_clients")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("id", client.id);
    if (error) throw error;
    return {
      clientId: client.id,
      libraryToken: "",
      sequenceRevision: await personalSequenceLibraryRevision(client.figmaUserId),
    };
  }
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const libraryToken = makePersonalLibraryToken();
    const tokenHash = await personalLibraryTokenHash(libraryToken);
    const { data, error } = await service
      .from("svga_personal_library_clients")
      .insert({ token_hash: tokenHash, figma_user_id: profile.figmaUserId })
      .select("id")
      .single();
    if (!error && data) {
      return {
        clientId: String(data.id),
        libraryToken,
        sequenceRevision: await personalSequenceLibraryRevision(profile.figmaUserId),
      };
    }
    if (error?.code !== "23505") throw error;
  }
  throw new Error("无法创建个人素材库会话。");
};

type ProSubscription = {
  plan: "none" | "trial" | "monthly" | "permanent";
  startedAt: string | null;
  expiresAt: string | null;
  daysRemaining: number | null;
};

const emptyProSubscription = (): ProSubscription => ({
  plan: "none",
  startedAt: null,
  expiresAt: null,
  daysRemaining: null,
});

const normalizeProSubscription = (value: unknown, nowMs = Date.now()): ProSubscription => {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const rawPlan = String(source.plan_type || source.plan || "none");
  const startedAt = source.started_at || source.startedAt
    ? String(source.started_at || source.startedAt)
    : null;
  const expiresAt = source.expires_at || source.expiresAt
    ? String(source.expires_at || source.expiresAt)
    : null;
  const expiresMs = expiresAt ? Date.parse(expiresAt) : Number.NaN;
  const active = rawPlan === "permanent"
    || (["trial", "monthly"].includes(rawPlan) && Number.isFinite(expiresMs) && expiresMs > nowMs);
  if (!active) return { ...emptyProSubscription(), startedAt, expiresAt };
  const daysRemaining = ["trial", "monthly"].includes(rawPlan)
    ? Math.max(1, Math.ceil((expiresMs - nowMs) / 86_400_000))
    : null;
  return {
    plan: rawPlan === "permanent" ? "permanent" : rawPlan === "trial" ? "trial" : "monthly",
    startedAt,
    expiresAt: ["trial", "monthly"].includes(rawPlan) ? expiresAt : null,
    daysRemaining,
  };
};

const featureState = async (figmaUserId: string) => {
  const { data, error } = await service.rpc("svga_effective_pro_subscription", {
    p_figma_user_id: figmaUserId,
  });
  if (error) throw error;
  const source = Array.isArray(data) ? data[0] : data;
  const subscription = normalizeProSubscription(source);
  return {
    features: { lighting: subscription.plan !== "none" },
    subscription,
  };
};

const requireFeedbackClient = async (body: Record<string, unknown>) => {
  const client = await requirePersonalLibraryClient(body);
  return client;
};

const normalizeFeedbackBody = (value: unknown) => String(value || "").trim().slice(0, 2000);

const feedbackMessages = async (threadId: string) => {
  const { data, error } = await service
    .from("svga_plugin_feedback_messages")
    .select("id, sender, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw error;
  return (data || []).map((message) => ({
    id: String(message.id),
    sender: message.sender === "admin" ? "admin" : "user",
    body: String(message.body || ""),
    createdAt: message.created_at,
  }));
};

const feedbackThreadForClient = async (client: { id: string; figmaUserId: string }) => {
  const { data, error } = await service
    .from("svga_plugin_feedback_threads")
    .select("id, figma_user_id, rating, created_at, updated_at")
    .eq("client_id", client.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { thread: null, messages: [] };
  return {
    thread: {
      id: String(data.id),
      figmaUserId: String(data.figma_user_id || client.figmaUserId),
      rating: Number(data.rating || 0),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    messages: await feedbackMessages(String(data.id)),
  };
};

const submitFeedback = async (
  body: Record<string, unknown>,
  client: { id: string; figmaUserId: string },
) => {
  const rating = Math.round(Number(body.rating || 0));
  const messageBody = normalizeFeedbackBody(body.body);
  if ((rating < 1 || rating > 5) && !messageBody) {
    throw httpError(400, "请选择 1 至 5 星评分或填写反馈建议。");
  }
  if (rating && (rating < 1 || rating > 5)) throw httpError(400, "评分必须是 1 至 5 星。");
  const now = new Date().toISOString();
  const { data: existing, error: existingError } = await service
    .from("svga_plugin_feedback_threads")
    .select("id, rating")
    .eq("client_id", client.id)
    .maybeSingle();
  if (existingError) throw existingError;
  let threadId = String(existing?.id || "");
  if (threadId) {
    const patch: Record<string, unknown> = {
      figma_user_id: client.figmaUserId,
      updated_at: now,
    };
    if (rating) patch.rating = rating;
    const { error } = await service.from("svga_plugin_feedback_threads").update(patch).eq("id", threadId);
    if (error) throw error;
  } else {
    const { data, error } = await service
      .from("svga_plugin_feedback_threads")
      .insert({
        client_id: client.id,
        figma_user_id: client.figmaUserId,
        rating: rating || null,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single();
    if (error) throw error;
    threadId = String(data.id);
  }
  if (messageBody) {
    const { error } = await service.from("svga_plugin_feedback_messages").insert({
      thread_id: threadId,
      sender: "user",
      body: messageBody,
    });
    if (error) throw error;
  }
  return await feedbackThreadForClient(client);
};

const isBoundAdmin = async (figmaUserId: string) => {
  const { data, error } = await service
    .from("svga_plugin_users")
    .select("is_admin")
    .eq("figma_user_id", figmaUserId)
    .maybeSingle();
  if (error) throw error;
  return data?.is_admin === true;
};

const requireAdmin = async (req: Request) => {
  const authorization = req.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) throw httpError(401, "请先登录管理员账号。");
  const token = authorization.slice(7).trim();
  if (!token || token.startsWith("sb_")) throw httpError(401, "管理员登录令牌无效。");
  const { data, error } = await service.auth.getUser(token);
  if (error || !data.user) throw httpError(401, "管理员登录已失效，请重新登录。");
  if (String(data.user.email || "").toLowerCase() !== ADMIN_EMAIL) {
    throw httpError(403, "该账号没有管理员权限。");
  }
  return data.user;
};

const adminUsers = async (body: Record<string, unknown>) => {
  const rawDate = String(body.date || "");
  const date = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? rawDate
    : beijingDate();
  const query = String(body.query || "").trim().toLocaleLowerCase().slice(0, 256);
  const requestedMode = String(body.mode || "online");
  const mode = ["online", "daily", "history"].includes(requestedMode)
    ? requestedMode
    : "online";
  const searchAcrossAllUsers = Boolean(query);
  const effectiveMode = searchAcrossAllUsers && mode === "online" ? "history" : mode;
  const proOnly = body.proOnly === true;
  const limit = Math.max(1, Math.min(50, Math.round(Number(body.limit || 40))));
  const offset = Math.max(0, Math.round(Number(body.offset || 0)));
  const onlineSince = new Date(Date.now() - 90_000).toISOString();
  const nowIso = new Date().toISOString();

  const sort = ["opens", "exports"].includes(String(body.sort)) ? String(body.sort) : "default";
  const [summaryResult, pageResult] = await Promise.all([
    service.rpc("svga_admin_dashboard_summary", { p_date: date, p_online_since: onlineSince }),
    service.rpc("svga_admin_user_usage_page", {
      p_date: date, p_online_since: onlineSince, p_mode: effectiveMode,
      p_query: query, p_pro_only: proOnly, p_sort: sort,
      p_offset: offset, p_limit: limit,
    }),
  ]);
  if (summaryResult.error) throw summaryResult.error;
  if (pageResult.error) throw pageResult.error;
  const summary = summaryResult.data || {};
  const pageUsers = pageResult.data?.users || [];
  const ids = pageUsers.map((user) => user.figma_user_id);
  const [usageResult, subscriptionsResult, personalLibraries] = ids.length
    ? await Promise.all([
        service
          .from("svga_plugin_daily_usage")
          .select("figma_user_id, open_count, figma_import_count, svga_export_count, webp_export_count, gif_export_count, lottie_export_count, webm_export_count, pag_export_count, sequence_import_count")
          .eq("usage_date", date)
          .in("figma_user_id", ids),
        service
          .from("svga_plugin_pro_subscriptions")
          .select("figma_user_id, plan_type, started_at, expires_at")
          .in("figma_user_id", ids),
        searchAcrossAllUsers
          ? adminPersonalSequenceLibrariesForUsers(ids)
          : Promise.resolve(new Map<string, Record<string, unknown>>()),
      ])
    : [
        { data: [], error: null },
        { data: [], error: null },
        new Map<string, Record<string, unknown>>(),
      ];
  if (usageResult.error) throw usageResult.error;
  if (subscriptionsResult.error) throw subscriptionsResult.error;

  const usageByUser = new Map((usageResult.data || []).map((row) => [row.figma_user_id, row]));
  const subscriptions = new Map<string, ProSubscription>();
  const nowMs = Date.parse(nowIso);
  for (const row of subscriptionsResult.data || []) {
    subscriptions.set(String(row.figma_user_id), normalizeProSubscription(row, nowMs));
  }

  const users = pageUsers.map((user) => {
    const usage = usageByUser.get(user.figma_user_id);
    const webpExportCount = Number(usage?.webp_export_count || 0);
    const gifExportCount = Number(usage?.gif_export_count || 0);
    const lottieExportCount = Number(usage?.lottie_export_count || 0);
    const webmExportCount = Number(usage?.webm_export_count || 0);
    const pagExportCount = Number(usage?.pag_export_count || 0);
    const subscription = subscriptions.get(user.figma_user_id) || emptyProSubscription();
    const features = { lighting: subscription.plan !== "none" };
    return {
      figmaUserId: user.figma_user_id,
      userNumber: Number(user.user_number || 0),
      displayName: user.display_name,
      photoUrl: user.photo_url,
      firstSeenAt: user.first_seen_at,
      lastOpenedAt: user.last_opened_at,
      lastHeartbeatAt: user.last_heartbeat_at,
      isOnline: Boolean(user.last_heartbeat_at && user.last_heartbeat_at >= onlineSince),
      pluginVersion: user.plugin_version,
      isAdmin: user.is_admin === true,
      totalOpenCount: Number(user.total_open_count || 0),
      totalExportCount: Number(user.total_export_count || 0),
      openRank: Number(user.open_rank || 0),
      exportRank: Number(user.export_rank || 0),
      openCount: Number(usage?.open_count || 0),
      figmaImportCount: Number(usage?.figma_import_count || 0),
      svgaExportCount: Number(usage?.svga_export_count || 0),
      webpExportCount,
      gifExportCount,
      lottieExportCount,
      webmExportCount,
      pagExportCount,
      otherExportCount: webpExportCount + gifExportCount + lottieExportCount + webmExportCount + pagExportCount,
      sequenceImportCount: Number(usage?.sequence_import_count || 0),
      isPro: features.lighting === true,
      features,
      subscription: subscription,
      personalLibrary: searchAcrossAllUsers
        ? personalLibraries.get(String(user.figma_user_id)) || {
            totalBytes: 0,
            libraryCount: 1,
            capacityBytes: PERSONAL_SEQUENCE_LIBRARY_MAX_BYTES,
            sequenceCount: 0,
            sequences: [],
          }
        : undefined,
    };
  });
  const total = Number(pageResult.data?.total || 0);
  return {
    date,
    mode: effectiveMode,
    sort,
    searchAcrossAllUsers,
    users,
    pagination: {
      offset,
      limit,
      total,
      hasMore: offset + users.length < total,
    },
    summary,
  };
};

const adminProMilestones = async () => {
  const [{ data: rows, error: rowsError }, { data: latestUser, error: latestUserError }] = await Promise.all([
    service
      .from("svga_plugin_pro_milestones")
      .select("user_number, enabled, note, awarded_figma_user_id, awarded_at, created_at")
      .order("user_number", { ascending: true })
      .limit(1000),
    service
      .from("svga_plugin_users")
      .select("user_number")
      .order("user_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (rowsError) throw rowsError;
  if (latestUserError) throw latestUserError;

  const awardedIds = Array.from(new Set((rows || [])
    .map((row) => String(row.awarded_figma_user_id || ""))
    .filter(Boolean)));
  const { data: awardedUsers, error: awardedUsersError } = awardedIds.length
    ? await service
        .from("svga_plugin_users")
        .select("figma_user_id, user_number, display_name, photo_url")
        .in("figma_user_id", awardedIds)
    : { data: [], error: null };
  if (awardedUsersError) throw awardedUsersError;
  const userById = new Map((awardedUsers || []).map((user) => [String(user.figma_user_id), user]));

  const milestones = (rows || []).map((row) => {
    const figmaUserId = String(row.awarded_figma_user_id || "");
    const user = figmaUserId ? userById.get(figmaUserId) : null;
    return {
      userNumber: Number(row.user_number || 0),
      enabled: row.enabled === true,
      note: String(row.note || ""),
      awardedAt: row.awarded_at,
      createdAt: row.created_at,
      awardedUser: user ? {
        figmaUserId: String(user.figma_user_id || ""),
        userNumber: Number(user.user_number || 0),
        displayName: String(user.display_name || "Anonymous"),
        photoUrl: user.photo_url ? String(user.photo_url) : null,
      } : null,
    };
  });
  const latestUserNumber = Math.max(0, Number(latestUser?.user_number || 0));
  return {
    milestones,
    latestUserNumber,
    nextUserNumber: latestUserNumber + 1,
  };
};

const saveAdminProMilestone = async (body: Record<string, unknown>, authUserId: string) => {
  const userNumber = Math.round(Number(body.userNumber || 0));
  if (!Number.isSafeInteger(userNumber) || userNumber < 1) throw httpError(400, "用户编号无效。");
  const note = String(body.note || "").trim().slice(0, 256);
  const enabled = body.enabled !== false;
  const { data, error } = await service.rpc("configure_svga_pro_milestone", {
    p_user_number: userNumber,
    p_enabled: enabled,
    p_note: note,
    p_created_by: authUserId,
  });
  if (error) throw error;
  const result = data && typeof data === "object" ? data as Record<string, unknown> : {};
  return {
    userNumber,
    enabled,
    awarded: result.awarded === true,
    figmaUserId: String(result.figmaUserId || ""),
  };
};

const deleteAdminProMilestone = async (body: Record<string, unknown>) => {
  const userNumber = Math.round(Number(body.userNumber || 0));
  if (!Number.isSafeInteger(userNumber) || userNumber < 1) throw httpError(400, "用户编号无效。");
  const { data: milestone, error: readError } = await service
    .from("svga_plugin_pro_milestones")
    .select("user_number, awarded_at")
    .eq("user_number", userNumber)
    .maybeSingle();
  if (readError) throw readError;
  if (!milestone) throw httpError(404, "没有找到该里程碑奖励。");
  if (milestone.awarded_at) throw httpError(409, "已发放的里程碑奖励会保留记录，不能删除。");
  const { error } = await service
    .from("svga_plugin_pro_milestones")
    .delete()
    .eq("user_number", userNumber);
  if (error) throw error;
  return { userNumber, deleted: true };
};

type OfficialSequenceFrameInput = {
  name: string;
  mimeType: string;
  width: number;
  height: number;
  dataUrl: string;
};

const decodeSequenceFrame = (value: unknown, index: number) => {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const dataUrl = String(source.dataUrl || "");
  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
  const mimeType = String(source.mimeType || match?.[1] || "").toLowerCase();
  if (!match || !OFFICIAL_SEQUENCE_MIME_TYPES.has(mimeType)) {
    throw httpError(400, `第 ${index + 1} 帧不是支持的 PNG、JPEG、WebP 或 GIF 图片。`);
  }
  let binary = "";
  try {
    binary = atob(match[2]);
  } catch (_error) {
    throw httpError(400, `第 ${index + 1} 帧数据损坏。`);
  }
  if (!binary.length || binary.length > OFFICIAL_SEQUENCE_MAX_BYTES) {
    throw httpError(400, `第 ${index + 1} 帧大小不符合要求。`);
  }
  const bytes = new Uint8Array(binary.length);
  for (let offset = 0; offset < binary.length; offset += 1) {
    bytes[offset] = binary.charCodeAt(offset);
  }
  const width = Math.max(1, Math.min(8192, Math.round(Number(source.width || 1))));
  const height = Math.max(1, Math.min(8192, Math.round(Number(source.height || 1))));
  const extension = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  }[mimeType] || "png";
  return {
    name: String(source.name || `frame_${index + 1}.${extension}`).slice(0, 256),
    mimeType,
    width,
    height,
    extension,
    bytes,
  };
};

const decodeOfficialSequencePreview = (value: unknown, index: number) => {
  const source = value && typeof value === "object"
    ? value as Record<string, unknown>
    : {};
  const dataUrl = String(source.dataUrl || "");
  const match = dataUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=]+)$/);
  const mimeType = String(source.mimeType || match?.[1] || "").toLowerCase();
  if (!match || mimeType !== "image/webp") {
    throw httpError(400, `第 ${index + 1} 张预览图必须是动态 WebP。`);
  }
  let binary = "";
  try {
    binary = atob(match[2]);
  } catch (_error) {
    throw httpError(400, `第 ${index + 1} 张预览图数据损坏。`);
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  if (!bytes.byteLength || bytes.byteLength > OFFICIAL_SEQUENCE_MAX_PREVIEW_BYTES) {
    throw httpError(400, `第 ${index + 1} 张预览图不能超过 512KB。`);
  }
  const asciiAt = (offset: number, value: string) =>
    value.split("").every((char, charIndex) => bytes[offset + charIndex] === char.charCodeAt(0));
  let hasAnimationChunk = false;
  for (let offset = 12; offset + 4 <= bytes.length; offset += 1) {
    if (asciiAt(offset, "ANIM")) {
      hasAnimationChunk = true;
      break;
    }
  }
  if (bytes.length < 20 || !asciiAt(0, "RIFF") || !asciiAt(8, "WEBP") || !hasAnimationChunk) {
    throw httpError(400, `第 ${index + 1} 张预览图不是有效的动态 WebP。`);
  }
  const extension = "webp";
  return { mimeType, extension, bytes };
};

const latestCollectionRevision = async (
  table: string,
  configure: (query: any) => any = (query) => query,
) => {
  let query = service
    .from(table)
    .select("id, updated_at", { count: "exact" })
    .order("updated_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(1);
  query = configure(query);
  const { data, error, count } = await query;
  if (error) throw error;
  const latest = Array.isArray(data) && data.length ? data[0] : null;
  return [
    Math.max(0, Number(count || 0)),
    String(latest?.updated_at || ""),
    String(latest?.id || ""),
  ].join(":");
};

const revisionFromCollection = (items: Array<Record<string, unknown>>) => {
  const normalized = (Array.isArray(items) ? items : []).map((item) => ({
    id: String(item?.id || ""),
    updatedAt: String(item?.updatedAt || item?.updated_at || ""),
  }));
  normalized.sort((left, right) => {
    const timeOrder = right.updatedAt.localeCompare(left.updatedAt);
    return timeOrder || right.id.localeCompare(left.id);
  });
  const latest = normalized[0] || { id: "", updatedAt: "" };
  return [normalized.length, latest.updatedAt, latest.id].join(":");
};

const officialSequenceLibraryRevision = async () => {
  const [setsRevision, categoriesRevision] = await Promise.all([
    latestCollectionRevision(
      "svga_official_sequence_sets",
      (query) => query.eq("enabled", true),
    ),
    latestCollectionRevision("svga_official_sequence_categories"),
  ]);
  return `official-v1|sets:${setsRevision}|categories:${categoriesRevision}`;
};

const officialSequenceLibraryRevisionFromCollections = (
  sequences: Array<Record<string, unknown>>,
  categories: Array<Record<string, unknown>>,
) => `official-v1|sets:${revisionFromCollection(sequences)}|categories:${revisionFromCollection(categories)}`;

const personalSequenceLibraryRevision = async (figmaUserId: string) => {
  const setsRevision = await latestCollectionRevision(
    "svga_personal_sequence_sets",
    (query) => query.eq("figma_user_id", figmaUserId).eq("status", "ready"),
  );
  return `personal-v1|sets:${setsRevision}`;
};

const personalSequenceLibraryRevisionFromSequences = (
  sequences: Array<Record<string, unknown>>,
) => `personal-v1|sets:${revisionFromCollection(sequences)}`;

const officialSequenceCategories = async () => {
  const { data, error } = await service
    .from("svga_official_sequence_categories")
    .select("id, name, sort_order, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map((category) => ({
    id: String(category.id),
    name: String(category.name || "").trim(),
    sortOrder: Number(category.sort_order || 0),
    createdAt: category.created_at,
    updatedAt: category.updated_at,
  })).filter((category) => category.id && category.name);
};

const normalizedOfficialSequenceCategoryId = (value: unknown) => {
  const id = String(value || "").trim();
  if (!id) return null;
  if (!OFFICIAL_SEQUENCE_UUID_PATTERN.test(id)) {
    throw httpError(400, "素材标签 ID 无效。");
  }
  return id;
};

const createOfficialSequenceCategory = async (
  body: Record<string, unknown>,
  authUserId: string,
) => {
  const name = String(body.name || "").trim().slice(0, OFFICIAL_SEQUENCE_CATEGORY_MAX_NAME);
  if (!name) throw httpError(400, "请输入标签名称。");
  let sortOrder = Number(body.sortOrder);
  if (!Number.isFinite(sortOrder)) {
    const { data: lastCategory, error: lastCategoryError } = await service
      .from("svga_official_sequence_categories")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastCategoryError) throw lastCategoryError;
    sortOrder = Number(lastCategory?.sort_order || 0) + 10;
  }
  const { data, error } = await service
    .from("svga_official_sequence_categories")
    .insert({
      name,
      sort_order: Math.max(-100000, Math.min(100000, Math.round(sortOrder))),
      created_by: authUserId,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: String(data.id), name };
};

const updateOfficialSequenceCategory = async (body: Record<string, unknown>) => {
  const id = normalizedOfficialSequenceCategoryId(body.id);
  if (!id) throw httpError(400, "素材标签 ID 无效。");
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("name" in body) {
    const name = String(body.name || "").trim().slice(0, OFFICIAL_SEQUENCE_CATEGORY_MAX_NAME);
    if (!name) throw httpError(400, "标签名称不能为空。");
    patch.name = name;
  }
  if ("sortOrder" in body) {
    patch.sort_order = Math.max(-100000, Math.min(100000, Math.round(Number(body.sortOrder) || 0)));
  }
  const { error } = await service
    .from("svga_official_sequence_categories")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
  return { id };
};

const deleteOfficialSequenceCategory = async (body: Record<string, unknown>) => {
  const id = normalizedOfficialSequenceCategoryId(body.id);
  if (!id) throw httpError(400, "素材标签 ID 无效。");
  const { error } = await service
    .from("svga_official_sequence_categories")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return { id };
};

const officialSequenceSets = async (includeDisabled = false, kind = "sequence") => {
  let setsQuery = service
    .from("svga_official_sequence_sets")
    .select("id, name, sort_order, enabled, is_locked, category_id, material_kind, preset_key, created_at, updated_at")
    .eq("material_kind", kind)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (!includeDisabled) setsQuery = setsQuery.eq("enabled", true);
  const [
    { data: sets, error: setsError },
    { data: frames, error: framesError },
    { data: previews, error: previewsError },
  ] =
    await Promise.all([
      setsQuery,
      service
        .from("svga_official_sequence_frames")
        .select("sequence_set_id, frame_index, object_path, file_name, mime_type, width, height, byte_size")
        .order("frame_index", { ascending: true }),
      service
        .from("svga_official_sequence_previews")
        .select("sequence_set_id, preview_index, object_path, mime_type, byte_size")
        .order("preview_index", { ascending: true }),
    ]);
  if (setsError) throw setsError;
  if (framesError) throw framesError;
  if (previewsError) throw previewsError;
  const framesBySet = new Map<string, Array<Record<string, unknown>>>();
  const contentVersionBySet = new Map<string, string>();
  for (const frame of frames || []) {
    const list = framesBySet.get(frame.sequence_set_id) || [];
    const publicUrl = service.storage
      .from(OFFICIAL_SEQUENCE_BUCKET)
      .getPublicUrl(frame.object_path).data.publicUrl;
    list.push({
      index: Number(frame.frame_index),
      name: frame.file_name,
      mimeType: frame.mime_type,
      width: Number(frame.width),
      height: Number(frame.height),
      byteSize: Number(frame.byte_size),
      url: publicUrl,
    });
    framesBySet.set(frame.sequence_set_id, list);
    if (!contentVersionBySet.has(String(frame.sequence_set_id))) {
      const pathParts = String(frame.object_path || "").split("/").filter(Boolean);
      contentVersionBySet.set(
        String(frame.sequence_set_id),
        pathParts.slice(0, 2).join(":") || String(frame.object_path || ""),
      );
    }
  }
  const previewsBySet = new Map<string, string[]>();
  const previewPathsBySet = new Map<string, string[]>();
  for (const preview of previews || []) {
    const setId = String(preview.sequence_set_id);
    const list = previewsBySet.get(setId) || [];
    const publicUrl = service.storage
      .from(OFFICIAL_SEQUENCE_BUCKET)
      .getPublicUrl(preview.object_path).data.publicUrl;
    list.push(publicUrl);
    previewsBySet.set(setId, list);
    const paths = previewPathsBySet.get(setId) || [];
    paths.push(String(preview.object_path || ""));
    previewPathsBySet.set(setId, paths);
  }
  return (sets || []).map((set) => {
    const setId = String(set.id);
    const storedPreviews = previewsBySet.get(setId) || [];
    const storedPreviewPaths = previewPathsBySet.get(setId) || [];
    const sourceFrames = framesBySet.get(setId) || [];
    const fallbackPreviews = (() => {
      // Legacy records have no generated thumbnails. Use one original as a
      // compatibility cover instead of turning list browsing into a six-frame download.
      const count = Math.min(1, sourceFrames.length);
      if (!count) return [];
      return Array.from({ length: count }, (_, index) => {
        const sourceIndex = Math.min(
          sourceFrames.length - 1,
          Math.round((index * (sourceFrames.length - 1)) / Math.max(1, count - 1)),
        );
        return String(sourceFrames[sourceIndex]?.url || "");
      }).filter(Boolean);
    })();
    return {
      id: set.id,
      name: set.name,
      sortOrder: Number(set.sort_order),
      enabled: set.enabled === true,
      locked: set.is_locked === true,
      categoryId: String(set.category_id || ""),
      presetKey: String(set.preset_key || ""),
      materialKind: String(set.material_kind || "sequence"),
      createdAt: set.created_at,
      updatedAt: set.updated_at,
      contentVersion: contentVersionBySet.get(setId) || String(set.updated_at || ""),
      previewVersion: storedPreviewPaths[0] || `legacy:${contentVersionBySet.get(setId) || String(set.updated_at || "")}`,
      previewAnimated: storedPreviewPaths.some((path) => path.includes("animated-v1.webp")),
      frames: sourceFrames,
      previewFrames: storedPreviews.length ? storedPreviews : fallbackPreviews,
    };
  });
};

const uploadOfficialSequence = async (
  body: Record<string, unknown>,
  authUserId: string,
  kind = "sequence",
) => {
  const source = body.sequence && typeof body.sequence === "object"
    ? body.sequence as Record<string, unknown>
    : {};
  const name = String(source.name || "").trim().slice(0, 120);
  if (!name) throw httpError(400, "请输入官方序列帧名称。");
  const categoryId = kind === "displacement" ? null : normalizedOfficialSequenceCategoryId(source.categoryId);
  const rawFrames = Array.isArray(source.frames) ? source.frames : [];
  if (!rawFrames.length || rawFrames.length > OFFICIAL_SEQUENCE_MAX_FRAMES) {
    throw httpError(400, `每个官方动效需要 1–${OFFICIAL_SEQUENCE_MAX_FRAMES} 帧。`);
  }
  const rawPreviews = Array.isArray(source.previews) ? source.previews : [];
  if (rawPreviews.length !== OFFICIAL_SEQUENCE_MAX_PREVIEWS) {
    throw httpError(400, "每个官方动效需要 1 个动态 WebP 预览。 ");
  }
  const decoded = rawFrames.map((frame, index) => decodeSequenceFrame(frame, index));
  const decodedPreviews = rawPreviews.map((preview, index) =>
    decodeOfficialSequencePreview(preview, index)
  );
  const totalBytes = decoded.reduce((total, frame) => total + frame.bytes.byteLength, 0);
  if (totalBytes > OFFICIAL_SEQUENCE_MAX_BYTES) {
    throw httpError(400, "单个官方序列帧动效不能超过 10MB。");
  }
  const requestedId = String(source.id || "");
  const setId = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestedId)
    ? requestedId
    : crypto.randomUUID();
  if (requestedId) {
    const { data: oldSet, error: oldSetError } = await service.from("svga_official_sequence_sets")
      .select("material_kind, preset_key").eq("id", setId).maybeSingle();
    if (oldSetError) throw oldSetError;
    if (oldSet && oldSet.material_kind !== kind) {
      throw httpError(400, "不能覆盖其他类型的素材。");
    }
  }
  const [oldFramesResult, oldPreviewsResult] = await Promise.all([
    service
      .from("svga_official_sequence_frames")
      .select("object_path")
      .eq("sequence_set_id", setId),
    service
      .from("svga_official_sequence_previews")
      .select("object_path")
      .eq("sequence_set_id", setId),
  ]);
  if (oldFramesResult.error) throw oldFramesResult.error;
  if (oldPreviewsResult.error) throw oldPreviewsResult.error;
  let sortOrder = Number(source.sortOrder);
  if (!Number.isFinite(sortOrder)) {
    const { data: lastSet, error: lastSetError } = await service
      .from("svga_official_sequence_sets")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (lastSetError) throw lastSetError;
    sortOrder = Number(lastSet?.sort_order || 0) + 10;
  }
  sortOrder = Math.max(-100000, Math.min(100000, Math.round(sortOrder)));
  const revision = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const uploadedPaths: string[] = [];
  const frameRows: Array<Record<string, unknown>> = [];
  const previewRows: Array<Record<string, unknown>> = [];
  try {
    for (let start = 0; start < decoded.length; start += 4) {
      await Promise.all(decoded.slice(start, start + 4).map(async (frame, offset) => {
        const frameIndex = start + offset;
        const objectPath = `${setId}/${revision}/${String(frameIndex).padStart(4, "0")}.${frame.extension}`;
        const { error } = await service.storage
          .from(OFFICIAL_SEQUENCE_BUCKET)
          .upload(objectPath, frame.bytes, {
            contentType: frame.mimeType,
            cacheControl: "31536000",
            upsert: false,
          });
        if (error) throw error;
        uploadedPaths.push(objectPath);
        frameRows[frameIndex] = {
          frame_index: frameIndex,
          object_path: objectPath,
          file_name: frame.name,
          mime_type: frame.mimeType,
          width: frame.width,
          height: frame.height,
          byte_size: frame.bytes.byteLength,
        };
      }));
    }
    await Promise.all(decodedPreviews.map(async (preview, previewIndex) => {
      const objectPath = `${setId}/${revision}/previews/animated-v1.webp`;
      const { error } = await service.storage
        .from(OFFICIAL_SEQUENCE_BUCKET)
        .upload(objectPath, preview.bytes, {
          contentType: preview.mimeType,
          cacheControl: "31536000",
          upsert: false,
        });
      if (error) throw error;
      uploadedPaths.push(objectPath);
      previewRows[previewIndex] = {
        preview_index: previewIndex,
        object_path: objectPath,
        mime_type: preview.mimeType,
        byte_size: preview.bytes.byteLength,
      };
    }));
    const { error } = await service.rpc("replace_svga_official_material_v5", {
      p_id: setId,
      p_name: name,
      p_sort_order: sortOrder,
      p_enabled: source.enabled !== false,
      p_is_locked: source.locked === true,
      p_category_id: categoryId,
      p_created_by: authUserId,
      p_frames: frameRows,
      p_previews: previewRows,
      p_material_kind: kind,
    });
    if (error) throw error;
  } catch (error) {
    if (uploadedPaths.length) {
      await service.storage.from(OFFICIAL_SEQUENCE_BUCKET).remove(uploadedPaths);
    }
    throw error;
  }
  const oldPaths = [...(oldFramesResult.data || []), ...(oldPreviewsResult.data || [])]
    .map((frame) => String(frame.object_path || ""))
    .filter(Boolean);
  if (oldPaths.length) {
    await service.storage.from(OFFICIAL_SEQUENCE_BUCKET).remove(oldPaths);
  }
  return {
    id: setId,
    name,
    frameCount: frameRows.length,
    previewCount: previewRows.length,
    locked: source.locked === true,
  };
};

const backfillOfficialSequencePreview = async (body: Record<string, unknown>) => {
  const setId = String(body.id || "");
  if (!uuidPattern.test(setId)) throw httpError(400, "官方动效 ID 无效。");
  const preview = decodeOfficialSequencePreview(body.preview, 0);
  const { data: set, error: setError } = await service
    .from("svga_official_sequence_sets")
    .select("id")
    .eq("id", setId)
    .maybeSingle();
  if (setError) throw setError;
  const { data: oldPreviews, error: previewError } = await service
    .from("svga_official_sequence_previews")
    .select("preview_index, object_path")
    .eq("sequence_set_id", setId);
  if (previewError) throw previewError;
  if (!set) throw httpError(404, "没有找到该官方动效。");
  const revision = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const objectPath = `${setId}/${revision}/previews/animated-v1.webp`;
  const { error: uploadError } = await service.storage
    .from(OFFICIAL_SEQUENCE_BUCKET)
    .upload(objectPath, preview.bytes, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) throw uploadError;
  try {
    const { error: upsertError } = await service
      .from("svga_official_sequence_previews")
      .upsert({
        sequence_set_id: setId,
        preview_index: 0,
        object_path: objectPath,
        mime_type: "image/webp",
        byte_size: preview.bytes.byteLength,
      }, { onConflict: "sequence_set_id,preview_index" });
    if (upsertError) throw upsertError;
    const { error: trimError } = await service
      .from("svga_official_sequence_previews")
      .delete()
      .eq("sequence_set_id", setId)
      .neq("preview_index", 0);
    if (trimError) throw trimError;
    const { error: updateError } = await service
      .from("svga_official_sequence_sets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", setId);
    if (updateError) throw updateError;
  } catch (error) {
    await service.storage.from(OFFICIAL_SEQUENCE_BUCKET).remove([objectPath]);
    throw error;
  }
  const stalePaths = (oldPreviews || [])
    .map((row) => String(row.object_path || ""))
    .filter((path) => path && path !== objectPath);
  if (stalePaths.length) await service.storage.from(OFFICIAL_SEQUENCE_BUCKET).remove(stalePaths);
  return { id: setId, previewAnimated: true, previewVersion: objectPath };
};

const updateOfficialSequence = async (body: Record<string, unknown>, kind = "sequence") => {
  const id = String(body.id || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw httpError(400, "官方动效 ID 无效。");
  const { data: target, error: targetError } = await service.from("svga_official_sequence_sets")
    .select("material_kind").eq("id", id).maybeSingle();
  if (targetError) throw targetError;
  if (!target || target.material_kind !== kind) throw httpError(404, "没有找到对应类型的素材。");
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("name" in body) {
    const name = String(body.name || "").trim().slice(0, 120);
    if (!name) throw httpError(400, "官方动效名称不能为空。");
    patch.name = name;
  }
  if ("sortOrder" in body) {
    patch.sort_order = Math.max(-100000, Math.min(100000, Math.round(Number(body.sortOrder) || 0)));
  }
  if ("enabled" in body) patch.enabled = body.enabled === true;
  if ("locked" in body) patch.is_locked = body.locked === true;
  if ("categoryId" in body && kind === "sequence") patch.category_id = normalizedOfficialSequenceCategoryId(body.categoryId);
  const { error } = await service
    .from("svga_official_sequence_sets")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
  return { id };
};

const deleteOfficialSequence = async (body: Record<string, unknown>, kind = "sequence") => {
  const id = String(body.id || "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw httpError(400, "官方动效 ID 无效。");
  const { data: target, error: targetError } = await service.from("svga_official_sequence_sets")
    .select("material_kind, preset_key").eq("id", id).maybeSingle();
  if (targetError) throw targetError;
  if (!target || target.material_kind !== kind) throw httpError(404, "没有找到对应类型的素材。");
  if (target.preset_key) throw httpError(400, "内置置换素材只支持隐藏，不能删除。");
  const [framesResult, previewsResult] = await Promise.all([
    service
      .from("svga_official_sequence_frames")
      .select("object_path")
      .eq("sequence_set_id", id),
    service
      .from("svga_official_sequence_previews")
      .select("object_path")
      .eq("sequence_set_id", id),
  ]);
  if (framesResult.error) throw framesResult.error;
  if (previewsResult.error) throw previewsResult.error;
  const paths = [...(framesResult.data || []), ...(previewsResult.data || [])]
    .map((item) => String(item.object_path || ""))
    .filter(Boolean);
  const { error } = await service.from("svga_official_sequence_sets").delete().eq("id", id);
  if (error) throw error;
  if (paths.length) {
    // Database deletion is authoritative. If Storage cleanup is temporarily
    // unavailable, leave only unreachable immutable objects instead of a
    // visible official animation whose frames have already disappeared.
    await service.storage.from(OFFICIAL_SEQUENCE_BUCKET).remove(paths);
  }
  return { id };
};

type PersonalSequenceFrameInput = {
  name: string;
  mimeType: string;
  width: number;
  height: number;
  byteSize: number;
  extension: string;
};

type PersonalSequencePreviewInput = {
  mimeType: string;
  byteSize: number;
  extension: string;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const sequenceMimeFromName = (name: string) => {
  if (/\.jpe?g$/i.test(name)) return "image/jpeg";
  if (/\.webp$/i.test(name)) return "image/webp";
  if (/\.gif$/i.test(name)) return "image/gif";
  return "image/png";
};

const sequenceExtension = (mimeType: string) => ({
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
})[mimeType] || "png";

const normalizePersonalFrameInput = (value: unknown, index: number): PersonalSequenceFrameInput => {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const name = String(source.name || `frame_${index + 1}.png`).trim().slice(0, 256) || `frame_${index + 1}.png`;
  const requestedMime = String(source.mimeType || "").toLowerCase();
  const mimeType = OFFICIAL_SEQUENCE_MIME_TYPES.has(requestedMime)
    ? requestedMime
    : sequenceMimeFromName(name);
  const width = Math.round(Number(source.width || 0));
  const height = Math.round(Number(source.height || 0));
  const byteSize = Math.round(Number(source.byteSize || 0));
  if (width < 1 || width > 8192 || height < 1 || height > 8192) {
    throw httpError(400, `第 ${index + 1} 帧尺寸不符合要求。`);
  }
  if (byteSize < 1 || byteSize > PERSONAL_SEQUENCE_MAX_FRAME_BYTES) {
    throw httpError(400, `第 ${index + 1} 帧不能超过 10MB。`);
  }
  return { name, mimeType, width, height, byteSize, extension: sequenceExtension(mimeType) };
};

const normalizePersonalPreviewInput = (value: unknown, index: number): PersonalSequencePreviewInput => {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const requestedMime = String(source.mimeType || "image/webp").toLowerCase();
  const mimeType = requestedMime === "image/webp" ? requestedMime : "image/webp";
  const byteSize = Math.round(Number(source.byteSize || 0));
  if (byteSize < 1 || byteSize > PERSONAL_SEQUENCE_MAX_PREVIEW_BYTES) {
    throw httpError(400, `第 ${index + 1} 张预览图大小不符合要求。`);
  }
  return { mimeType, byteSize, extension: sequenceExtension(mimeType) };
};

const personalOwnerPrefix = async (ownerClientId: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ownerClientId));
  return Array.from(new Uint8Array(digest))
    .slice(0, 16)
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
};

const absoluteStorageUrl = (value: unknown) => {
  const url = String(value || "");
  if (/^https:\/\//i.test(url)) return url;
  return `${supabaseUrl.replace(/\/+$/, "")}/storage/v1${url.startsWith("/") ? "" : "/"}${url}`;
};

const signPersonalUpload = async (path: string) => {
  const { data, error } = await service.storage
    .from(PERSONAL_SEQUENCE_BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data?.signedUrl || !data?.token) throw error || new Error("无法创建素材上传地址。");
  return {
    path,
    token: data.token,
    signedUrl: absoluteStorageUrl(data.signedUrl),
  };
};

const signedPersonalReadUrls = async (paths: string[]) => {
  const urls = new Map<string, string>();
  for (let start = 0; start < paths.length; start += 100) {
    const batch = paths.slice(start, start + 100);
    const { data, error } = await service.storage
      .from(PERSONAL_SEQUENCE_BUCKET)
      .createSignedUrls(batch, PERSONAL_SEQUENCE_SIGNED_READ_SECONDS);
    if (error) throw error;
    for (const item of data || []) {
      if (item.signedUrl) urls.set(String(item.path || ""), absoluteStorageUrl(item.signedUrl));
    }
  }
  return urls;
};

const personalSequenceStoragePaths = async (setId: string) => {
  const [{ data: frames, error: framesError }, { data: previews, error: previewsError }] = await Promise.all([
    service.from("svga_personal_sequence_frames").select("object_path").eq("sequence_set_id", setId),
    service.from("svga_personal_sequence_previews").select("object_path").eq("sequence_set_id", setId),
  ]);
  if (framesError) throw framesError;
  if (previewsError) throw previewsError;
  return [...(frames || []), ...(previews || [])]
    .map((item) => String(item.object_path || ""))
    .filter(Boolean);
};

const removePersonalSequenceObjects = async (paths: string[]) => {
  for (let start = 0; start < paths.length; start += 100) {
    await service.storage.from(PERSONAL_SEQUENCE_BUCKET).remove(paths.slice(start, start + 100));
  }
};

const deletePersonalSequenceById = async (setId: string) => {
  const paths = await personalSequenceStoragePaths(setId);
  const { error } = await service.from("svga_personal_sequence_sets").delete().eq("id", setId);
  if (error) throw error;
  if (paths.length) await removePersonalSequenceObjects(paths);
};

const personalSequenceSets = async (client: PersonalLibraryClient, requestedId = "") => {
  let setsQuery = service
    .from("svga_personal_sequence_sets")
    .select("id, client_set_id, name, source_fingerprint, frame_count, preview_count, total_bytes, created_at, updated_at")
    .eq("figma_user_id", client.figmaUserId)
    .eq("status", "ready")
    .order("created_at", { ascending: true })
    .limit(200);
  if (requestedId) setsQuery = setsQuery.eq("id", requestedId);
  const { data: sets, error: setsError } = await setsQuery;
  if (setsError) throw setsError;
  const ids = (sets || []).map((set) => String(set.id));
  if (!ids.length) return [];
  const [{ data: frames, error: framesError }, { data: previews, error: previewsError }] = await Promise.all([
    service
      .from("svga_personal_sequence_frames")
      .select("sequence_set_id, frame_index, object_path, file_name, mime_type, width, height, byte_size")
      .in("sequence_set_id", ids)
      .order("frame_index", { ascending: true }),
    service
      .from("svga_personal_sequence_previews")
      .select("sequence_set_id, preview_index, object_path")
      .in("sequence_set_id", ids)
      .order("preview_index", { ascending: true }),
  ]);
  if (framesError) throw framesError;
  if (previewsError) throw previewsError;
  const framesBySet = new Map<string, Array<Record<string, unknown>>>();
  const framePathsBySet = new Map<string, string[]>();
  for (const frame of frames || []) {
    const setId = String(frame.sequence_set_id);
    const list = framesBySet.get(setId) || [];
    list.push({
      index: Number(frame.frame_index),
      name: frame.file_name,
      mimeType: frame.mime_type,
      width: Number(frame.width),
      height: Number(frame.height),
      byteSize: Number(frame.byte_size),
    });
    framesBySet.set(setId, list);
    const paths = framePathsBySet.get(setId) || [];
    paths.push(String(frame.object_path || ""));
    framePathsBySet.set(setId, paths);
  }
  const previewSourcePathsBySet = new Map<string, string[]>();
  for (const preview of previews || []) {
    const setId = String(preview.sequence_set_id);
    const list = previewSourcePathsBySet.get(setId) || [];
    list.push(String(preview.object_path || ""));
    previewSourcePathsBySet.set(setId, list);
  }
  for (const set of sets || []) {
    const setId = String(set.id);
    if ((previewSourcePathsBySet.get(setId) || []).length) continue;
    const paths = (framePathsBySet.get(setId) || []).filter(Boolean);
    // Legacy rows without previews get a single compatibility cover. New uploads
    // provide one tiny animated WebP without original-frame egress.
    const count = Math.min(1, paths.length);
    if (!count) continue;
    const sampled = Array.from({ length: count }, (_, index) =>
      paths[Math.min(paths.length - 1, Math.round((index * (paths.length - 1)) / Math.max(1, count - 1)))]
    );
    previewSourcePathsBySet.set(setId, Array.from(new Set(sampled)));
  }
  const previewPaths = Array.from(new Set(Array.from(previewSourcePathsBySet.values()).flat().filter(Boolean)));
  const previewUrls = await signedPersonalReadUrls(previewPaths);
  return (sets || []).map((set) => ({
    id: set.id,
    clientSetId: set.client_set_id,
    name: set.name,
    sourceFingerprint: set.source_fingerprint,
    frameCount: Number(set.frame_count),
    previewCount: Number(set.preview_count),
    totalBytes: Number(set.total_bytes),
    createdAt: set.created_at,
    updatedAt: set.updated_at,
    contentVersion: [set.source_fingerprint, set.frame_count, set.total_bytes].join(":"),
    previewVersion: (previewSourcePathsBySet.get(String(set.id)) || [])[0] || `legacy:${set.updated_at || ""}`,
    previewAnimated: (previewSourcePathsBySet.get(String(set.id)) || [])
      .some((path) => path.includes("animated-v1.webp")),
    previewSignedAt: Date.now(),
    frames: framesBySet.get(set.id) || [],
    previewFrames: (previewSourcePathsBySet.get(String(set.id)) || [])
      .map((path) => previewUrls.get(path) || "")
      .filter(Boolean),
  }));
};

const preparePersonalSequence = async (
  body: Record<string, unknown>,
  client: PersonalLibraryClient,
) => {
  const ownerClientId = client.id;
  const source = body.sequence && typeof body.sequence === "object"
    ? body.sequence as Record<string, unknown>
    : {};
  const clientSetId = String(source.clientSetId || "").trim().slice(0, 160);
  const name = String(source.name || "").trim().slice(0, 120);
  const sourceFingerprint = String(source.sourceFingerprint || "").trim().slice(0, 256);
  if (!clientSetId || !name || !sourceFingerprint) throw httpError(400, "个人序列帧信息不完整。");
  const rawFrames = Array.isArray(source.frames) ? source.frames : [];
  const rawPreviews = Array.isArray(source.previews) ? source.previews : [];
  if (!rawFrames.length || rawFrames.length > PERSONAL_SEQUENCE_MAX_FRAMES) {
    throw httpError(400, `每套个人动效需要 1–${PERSONAL_SEQUENCE_MAX_FRAMES} 帧。`);
  }
  if (rawPreviews.length !== PERSONAL_SEQUENCE_MAX_PREVIEWS) {
    throw httpError(400, "每套个人动效需要 1 个动态 WebP 预览。 ");
  }
  const frames = rawFrames.map(normalizePersonalFrameInput);
  const previews = rawPreviews.map(normalizePersonalPreviewInput);
  const totalBytes = [...frames, ...previews].reduce((total, item) => total + item.byteSize, 0);
  if (totalBytes > PERSONAL_SEQUENCE_MAX_TOTAL_BYTES) {
    throw httpError(400, "单套个人序列帧素材总大小不能超过 10MB。");
  }

  const { data: existing, error: existingError } = await service
    .from("svga_personal_sequence_sets")
    .select("id, status")
    .eq("figma_user_id", client.figmaUserId)
    .eq("source_fingerprint", sourceFingerprint)
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing?.status === "ready") {
    const sequences = await personalSequenceSets(client, String(existing.id));
    return { duplicate: true, sequence: sequences[0] || null, uploads: [] };
  }
  if (existing?.id) await deletePersonalSequenceById(String(existing.id));

  const { data: clientCollision, error: collisionError } = await service
    .from("svga_personal_sequence_sets")
    .select("id")
    .eq("figma_user_id", client.figmaUserId)
    .eq("client_set_id", clientSetId)
    .maybeSingle();
  if (collisionError) throw collisionError;
  if (clientCollision?.id) await deletePersonalSequenceById(String(clientCollision.id));

  const { data: usageRows, error: usageError } = await service
    .from("svga_personal_sequence_sets")
    .select("total_bytes")
    .eq("figma_user_id", client.figmaUserId)
    .in("status", ["uploading", "ready"])
    .limit(201);
  if (usageError) throw usageError;
  if ((usageRows || []).length > 200) {
    throw httpError(409, "我的素材数量过多，请删除部分素材后再上传。");
  }
  const usedBytes = (usageRows || []).reduce(
    (total, row) => total + Math.max(0, Number(row.total_bytes || 0)),
    0,
  );
  if (usedBytes + totalBytes > PERSONAL_SEQUENCE_LIBRARY_MAX_BYTES) {
    const remainingBytes = Math.max(0, PERSONAL_SEQUENCE_LIBRARY_MAX_BYTES - usedBytes);
    throw httpError(413, `我的素材总容量不能超过 10MB，当前剩余 ${remainingBytes} 字节。`);
  }

  const setId = crypto.randomUUID();
  const ownerPrefix = await personalOwnerPrefix(ownerClientId);
  const frameRows = frames.map((frame, index) => ({
    sequence_set_id: setId,
    frame_index: index,
    object_path: `${ownerPrefix}/${setId}/frames/${String(index).padStart(4, "0")}.${frame.extension}`,
    file_name: frame.name,
    mime_type: frame.mimeType,
    width: frame.width,
    height: frame.height,
    byte_size: frame.byteSize,
  }));
  const previewRows = previews.map((preview, index) => ({
    sequence_set_id: setId,
    preview_index: index,
    object_path: `${ownerPrefix}/${setId}/previews/animated-v1.webp`,
    mime_type: preview.mimeType,
    byte_size: preview.byteSize,
  }));
  const { error: setError } = await service.from("svga_personal_sequence_sets").insert({
    id: setId,
    owner_client_id: ownerClientId,
    // The validated bearer token authenticates this installation. Sequence access
    // is scoped by the Figma account stored on that validated client record so a
    // plugin update can issue a new installation token without hiding old assets.
    figma_user_id: client.figmaUserId,
    client_set_id: clientSetId,
    name,
    source_fingerprint: sourceFingerprint,
    status: "uploading",
    frame_count: frames.length,
    preview_count: previews.length,
    total_bytes: totalBytes,
  });
  if (setError) throw setError;
  try {
    const { error: framesError } = await service.from("svga_personal_sequence_frames").insert(frameRows);
    if (framesError) throw framesError;
    if (previewRows.length) {
      const { error: previewsError } = await service.from("svga_personal_sequence_previews").insert(previewRows);
      if (previewsError) throw previewsError;
    }
    const uploads: Array<Record<string, unknown>> = [];
    for (let start = 0; start < frameRows.length; start += 16) {
      const signed = await Promise.all(frameRows.slice(start, start + 16).map((row) => signPersonalUpload(row.object_path)));
      signed.forEach((item, offset) => uploads.push({
        ...item,
        kind: "frame",
        index: start + offset,
        mimeType: frames[start + offset].mimeType,
      }));
    }
    if (previewRows.length) {
      const signed = await Promise.all(previewRows.map((row) => signPersonalUpload(row.object_path)));
      signed.forEach((item, index) => uploads.push({
        ...item,
        kind: "preview",
        index,
        mimeType: previews[index].mimeType,
      }));
    }
    return { duplicate: false, setId, uploads };
  } catch (error) {
    await deletePersonalSequenceById(setId).catch(() => null);
    throw error;
  }
};

const finalizePersonalSequence = async (body: Record<string, unknown>, client: PersonalLibraryClient) => {
  const setId = String(body.id || "");
  if (!uuidPattern.test(setId)) throw httpError(400, "个人动效 ID 无效。");
  const { data: set, error: setError } = await service
    .from("svga_personal_sequence_sets")
    .select("id, owner_client_id, status, frame_count, preview_count")
    .eq("id", setId)
    .eq("figma_user_id", client.figmaUserId)
    .maybeSingle();
  if (setError) throw setError;
  if (!set) throw httpError(404, "没有找到这套个人序列帧。");
  if (set.status !== "ready") {
    const ownerPrefix = await personalOwnerPrefix(String(set.owner_client_id));
    const [{ data: frames, error: framesError }, { data: previews, error: previewsError }] = await Promise.all([
      service.storage.from(PERSONAL_SEQUENCE_BUCKET).list(`${ownerPrefix}/${setId}/frames`, { limit: 1000 }),
      Number(set.preview_count) > 0
        ? service.storage.from(PERSONAL_SEQUENCE_BUCKET).list(`${ownerPrefix}/${setId}/previews`, { limit: 8 })
        : Promise.resolve({ data: [], error: null }),
    ]);
    if (framesError) throw framesError;
    if (previewsError) throw previewsError;
    if ((frames || []).length !== Number(set.frame_count) || (previews || []).length !== Number(set.preview_count)) {
      throw httpError(409, "仍有序列帧尚未上传完成，请稍后重试。");
    }
    const { error: updateError } = await service
      .from("svga_personal_sequence_sets")
      .update({ status: "ready", updated_at: new Date().toISOString() })
      .eq("id", setId)
      .eq("figma_user_id", client.figmaUserId);
    if (updateError) throw updateError;
  }
  const sequences = await personalSequenceSets(client, setId);
  return sequences[0] || null;
};

const personalSequenceFrames = async (body: Record<string, unknown>, client: PersonalLibraryClient) => {
  const setId = String(body.id || "");
  if (!uuidPattern.test(setId)) throw httpError(400, "个人动效 ID 无效。");
  const { data: set, error: setError } = await service
    .from("svga_personal_sequence_sets")
    .select("id")
    .eq("id", setId)
    .eq("figma_user_id", client.figmaUserId)
    .eq("status", "ready")
    .maybeSingle();
  if (setError) throw setError;
  if (!set) throw httpError(404, "没有找到这套个人序列帧。");
  const { data: frames, error: framesError } = await service
    .from("svga_personal_sequence_frames")
    .select("frame_index, object_path, file_name, mime_type, width, height, byte_size")
    .eq("sequence_set_id", setId)
    .order("frame_index", { ascending: true });
  if (framesError) throw framesError;
  const urls = await signedPersonalReadUrls((frames || []).map((frame) => String(frame.object_path)));
  return (frames || []).map((frame) => ({
    index: Number(frame.frame_index),
    name: frame.file_name,
    mimeType: frame.mime_type,
    width: Number(frame.width),
    height: Number(frame.height),
    byteSize: Number(frame.byte_size),
    url: urls.get(String(frame.object_path)) || "",
  }));
};

const updatePersonalSequence = async (body: Record<string, unknown>, client: PersonalLibraryClient) => {
  const setId = String(body.id || "");
  const name = String(body.name || "").trim().slice(0, 120);
  if (!uuidPattern.test(setId) || !name) throw httpError(400, "个人动效名称无效。");
  const { data, error } = await service
    .from("svga_personal_sequence_sets")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", setId)
    .eq("figma_user_id", client.figmaUserId)
    .eq("status", "ready")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, "没有找到这套个人序列帧。");
  return { id: setId, name };
};

const deletePersonalSequence = async (body: Record<string, unknown>, client: PersonalLibraryClient) => {
  const setId = String(body.id || "");
  if (!uuidPattern.test(setId)) throw httpError(400, "个人动效 ID 无效。");
  const { data: set, error } = await service
    .from("svga_personal_sequence_sets")
    .select("id")
    .eq("id", setId)
    .eq("figma_user_id", client.figmaUserId)
    .maybeSingle();
  if (error) throw error;
  if (!set) throw httpError(404, "没有找到这套个人序列帧。");
  await deletePersonalSequenceById(setId);
  return { id: setId };
};

const adminPersonalSequenceLibrariesForUsers = async (figmaUserIds: string[]) => {
  const ids = Array.from(new Set(
    figmaUserIds.map((value) => String(value || "").trim()).filter(Boolean),
  )).slice(0, 50);
  const libraries = new Map<string, Record<string, unknown>>();
  if (!ids.length) return libraries;
  const { data: sets, error: setsError } = await service
    .from("svga_personal_sequence_sets")
    .select("id, owner_client_id, figma_user_id, name, frame_count, preview_count, total_bytes, created_at, updated_at")
    .eq("status", "ready")
    .in("figma_user_id", ids)
    .order("created_at", { ascending: true });
  if (setsError) throw setsError;
  const setRows = sets || [];
  const setIds = setRows.map((set) => String(set.id));
  const { data: previews, error: previewsError } = setIds.length
    ? await service
        .from("svga_personal_sequence_previews")
        .select("sequence_set_id, preview_index, object_path")
        .in("sequence_set_id", setIds)
        .eq("preview_index", 0)
        .order("preview_index", { ascending: true })
    : { data: [], error: null };
  if (previewsError) throw previewsError;
  const previewPaths = (previews || [])
    .map((preview) => String(preview.object_path || ""))
    .filter(Boolean);
  const previewUrls = await signedPersonalReadUrls(previewPaths);
  const previewsBySet = new Map<string, string[]>();
  for (const preview of previews || []) {
    const url = previewUrls.get(String(preview.object_path || ""));
    if (!url) continue;
    const setId = String(preview.sequence_set_id || "");
    const urls = previewsBySet.get(setId) || [];
    urls.push(url);
    previewsBySet.set(setId, urls);
  }
  const groups = new Map<string, {
    totalBytes: number;
    ownerClientIds: Set<string>;
    sequences: Array<Record<string, unknown>>;
  }>();
  for (const set of setRows) {
    const figmaUserId = String(set.figma_user_id || "");
    if (!figmaUserId) continue;
    const group = groups.get(figmaUserId) || {
      totalBytes: 0,
      ownerClientIds: new Set<string>(),
      sequences: [],
    };
    const totalBytes = Math.max(0, Number(set.total_bytes || 0));
    group.totalBytes += totalBytes;
    group.ownerClientIds.add(String(set.owner_client_id || ""));
    const previewPath = String((previews || [])
      .find((preview) => String(preview.sequence_set_id) === String(set.id))?.object_path || "");
    group.sequences.push({
      id: set.id,
      name: set.name,
      frameCount: Number(set.frame_count || 0),
      previewCount: Number(set.preview_count || 0),
      totalBytes,
      previewFrames: previewsBySet.get(String(set.id)) || [],
      previewVersion: previewPath || `legacy:${set.updated_at || ""}`,
      previewAnimated: previewPath.includes("animated-v1.webp"),
      createdAt: set.created_at,
      updatedAt: set.updated_at,
    });
    groups.set(figmaUserId, group);
  }
  for (const figmaUserId of ids) {
    const group = groups.get(figmaUserId);
    const libraryCount = Math.max(1, group?.ownerClientIds.size || 0);
    const sequences = group?.sequences || [];
    libraries.set(figmaUserId, {
      totalBytes: group?.totalBytes || 0,
      libraryCount,
      capacityBytes: libraryCount * PERSONAL_SEQUENCE_LIBRARY_MAX_BYTES,
      sequenceCount: sequences.length,
      sequences,
    });
  }
  return libraries;
};

const adminPersonalSequences = async (body: Record<string, unknown>) => {
  const query = String(body.query || "").trim().toLocaleLowerCase().slice(0, 256);
  const { data: sets, error: setsError } = await service
    .from("svga_personal_sequence_sets")
    .select("id, owner_client_id, figma_user_id, name, frame_count, preview_count, total_bytes, created_at, updated_at")
    .eq("status", "ready")
    .order("created_at", { ascending: true })
    .limit(2000);
  if (setsError) throw setsError;
  const setRows = sets || [];
  const figmaUserIds = Array.from(new Set(setRows.map((set) => String(set.figma_user_id || "")).filter(Boolean)));
  const setIds = setRows.map((set) => String(set.id));
  const [usersResult, previewsResult] = await Promise.all([
    figmaUserIds.length
      ? service
        .from("svga_plugin_users")
        .select("figma_user_id, display_name, photo_url")
        .in("figma_user_id", figmaUserIds)
      : Promise.resolve({ data: [], error: null }),
    setIds.length
      ? service
        .from("svga_personal_sequence_previews")
        .select("sequence_set_id, preview_index, object_path")
        .in("sequence_set_id", setIds)
        .order("preview_index", { ascending: true })
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (usersResult.error) throw usersResult.error;
  if (previewsResult.error) throw previewsResult.error;
  const userById = new Map((usersResult.data || []).map((user) => [String(user.figma_user_id), user]));
  const previewPaths = (previewsResult.data || []).map((preview) => String(preview.object_path || "")).filter(Boolean);
  const previewUrls = await signedPersonalReadUrls(previewPaths);
  const previewsBySet = new Map<string, string[]>();
  for (const preview of previewsResult.data || []) {
    const url = previewUrls.get(String(preview.object_path || ""));
    if (!url) continue;
    const id = String(preview.sequence_set_id);
    const list = previewsBySet.get(id) || [];
    list.push(url);
    previewsBySet.set(id, list);
  }
  const groups = new Map<string, {
    figmaUserId: string;
    displayName: string;
    photoUrl: string | null;
    totalBytes: number;
    ownerClientIds: Set<string>;
    sequences: Array<Record<string, unknown>>;
  }>();
  for (const set of setRows) {
    const figmaUserId = String(set.figma_user_id || "");
    const profile = userById.get(figmaUserId);
    const displayName = String(profile?.display_name || "Anonymous");
    if (query && !displayName.toLocaleLowerCase().includes(query) &&
      !figmaUserId.toLocaleLowerCase().includes(query) &&
      !String(set.name || "").toLocaleLowerCase().includes(query)) continue;
    const group = groups.get(figmaUserId) || {
      figmaUserId,
      displayName,
      photoUrl: profile?.photo_url ? String(profile.photo_url) : null,
      totalBytes: 0,
      ownerClientIds: new Set<string>(),
      sequences: [],
    };
    const totalBytes = Math.max(0, Number(set.total_bytes || 0));
    group.totalBytes += totalBytes;
    group.ownerClientIds.add(String(set.owner_client_id || ""));
    const previewPath = String((previewsResult.data || [])
      .find((preview) => String(preview.sequence_set_id) === String(set.id))?.object_path || "");
    group.sequences.push({
      id: set.id,
      name: set.name,
      frameCount: Number(set.frame_count || 0),
      previewCount: Number(set.preview_count || 0),
      totalBytes,
      previewFrames: previewsBySet.get(String(set.id)) || [],
      previewVersion: previewPath || `legacy:${set.updated_at || ""}`,
      previewAnimated: previewPath.includes("animated-v1.webp"),
      createdAt: set.created_at,
      updatedAt: set.updated_at,
    });
    groups.set(figmaUserId, group);
  }
  const users = Array.from(groups.values()).map((group) => ({
    figmaUserId: group.figmaUserId,
    displayName: group.displayName,
    photoUrl: group.photoUrl,
    totalBytes: group.totalBytes,
    libraryCount: Math.max(1, group.ownerClientIds.size),
    capacityBytes: Math.max(1, group.ownerClientIds.size) * PERSONAL_SEQUENCE_LIBRARY_MAX_BYTES,
    sequences: group.sequences,
  }));
  return {
    users,
    summary: {
      userCount: users.length,
      sequenceCount: users.reduce((total, user) => total + user.sequences.length, 0),
      totalBytes: users.reduce((total, user) => total + user.totalBytes, 0),
    },
  };
};

const adminPersonalSequenceFrames = async (body: Record<string, unknown>) => {
  const setId = String(body.id || "");
  if (!uuidPattern.test(setId)) throw httpError(400, "个人动效 ID 无效。");
  const { data: set, error: setError } = await service
    .from("svga_personal_sequence_sets")
    .select("id, name")
    .eq("id", setId)
    .eq("status", "ready")
    .maybeSingle();
  if (setError) throw setError;
  if (!set) throw httpError(404, "没有找到这套个人序列帧。");
  const { data: frames, error: framesError } = await service
    .from("svga_personal_sequence_frames")
    .select("frame_index, object_path, file_name, mime_type, width, height, byte_size")
    .eq("sequence_set_id", setId)
    .order("frame_index", { ascending: true });
  if (framesError) throw framesError;
  const urls = await signedPersonalReadUrls((frames || []).map((frame) => String(frame.object_path)));
  return {
    id: setId,
    name: set.name,
    frames: (frames || []).map((frame) => ({
      index: Number(frame.frame_index),
      name: frame.file_name,
      mimeType: frame.mime_type,
      width: Number(frame.width),
      height: Number(frame.height),
      byteSize: Number(frame.byte_size),
      url: urls.get(String(frame.object_path)) || "",
    })),
  };
};

const backfillPersonalSequencePreview = async (body: Record<string, unknown>) => {
  const setId = String(body.id || "");
  if (!uuidPattern.test(setId)) throw httpError(400, "个人动效 ID 无效。");
  const preview = decodeOfficialSequencePreview(body.preview, 0);
  const { data: set, error: setError } = await service
    .from("svga_personal_sequence_sets")
    .select("id, owner_client_id, total_bytes")
    .eq("id", setId)
    .eq("status", "ready")
    .maybeSingle();
  if (setError) throw setError;
  const { data: oldPreviews, error: previewError } = await service
    .from("svga_personal_sequence_previews")
    .select("preview_index, object_path, byte_size")
    .eq("sequence_set_id", setId);
  if (previewError) throw previewError;
  if (!set) throw httpError(404, "没有找到这套个人序列帧。");
  const ownerPrefix = await personalOwnerPrefix(String(set.owner_client_id));
  const revision = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const objectPath = `${ownerPrefix}/${setId}/previews/${revision}-animated-v1.webp`;
  const { error: uploadError } = await service.storage
    .from(PERSONAL_SEQUENCE_BUCKET)
    .upload(objectPath, preview.bytes, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });
  if (uploadError) throw uploadError;
  const oldPreviewBytes = (oldPreviews || []).reduce(
    (total, row) => total + Math.max(0, Number(row.byte_size || 0)),
    0,
  );
  try {
    const { error: upsertError } = await service
      .from("svga_personal_sequence_previews")
      .upsert({
        sequence_set_id: setId,
        preview_index: 0,
        object_path: objectPath,
        mime_type: "image/webp",
        byte_size: preview.bytes.byteLength,
      }, { onConflict: "sequence_set_id,preview_index" });
    if (upsertError) throw upsertError;
    const { error: trimError } = await service
      .from("svga_personal_sequence_previews")
      .delete()
      .eq("sequence_set_id", setId)
      .neq("preview_index", 0);
    if (trimError) throw trimError;
    const totalBytes = Math.max(
      0,
      Number(set.total_bytes || 0) - oldPreviewBytes + preview.bytes.byteLength,
    );
    const { error: updateError } = await service
      .from("svga_personal_sequence_sets")
      .update({ preview_count: 1, total_bytes: totalBytes, updated_at: new Date().toISOString() })
      .eq("id", setId);
    if (updateError) throw updateError;
  } catch (error) {
    await service.storage.from(PERSONAL_SEQUENCE_BUCKET).remove([objectPath]);
    throw error;
  }
  const stalePaths = (oldPreviews || [])
    .map((row) => String(row.object_path || ""))
    .filter((path) => path && path !== objectPath);
  if (stalePaths.length) await removePersonalSequenceObjects(stalePaths);
  return { id: setId, previewAnimated: true, previewVersion: objectPath };
};

const updateAdminPersonalSequence = async (body: Record<string, unknown>) => {
  const setId = String(body.id || "");
  const name = String(body.name || "").trim().slice(0, 120);
  if (!uuidPattern.test(setId) || !name) throw httpError(400, "个人动效名称无效。");
  const { data, error } = await service
    .from("svga_personal_sequence_sets")
    .update({ name, updated_at: new Date().toISOString() })
    .eq("id", setId)
    .eq("status", "ready")
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, "没有找到这套个人序列帧。");
  return { id: setId, name };
};

const deleteAdminPersonalSequence = async (body: Record<string, unknown>) => {
  const setId = String(body.id || "");
  if (!uuidPattern.test(setId)) throw httpError(400, "个人动效 ID 无效。");
  const { data, error } = await service
    .from("svga_personal_sequence_sets")
    .select("id")
    .eq("id", setId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, "没有找到这套个人序列帧。");
  await deletePersonalSequenceById(setId);
  return { id: setId };
};

const adminFeedbackThreads = async (body: Record<string, unknown>) => {
  const query = String(body.query || "").trim().toLocaleLowerCase().slice(0, 256);
  const { data: threads, error } = await service
    .from("svga_plugin_feedback_threads")
    .select("id, figma_user_id, rating, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  const threadIds = (threads || []).map((thread) => String(thread.id));
  const figmaUserIds = Array.from(new Set((threads || []).map((thread) => String(thread.figma_user_id || "")).filter(Boolean)));
  const [usersResult, messagesResult] = await Promise.all([
    figmaUserIds.length
      ? service.from("svga_plugin_users").select("figma_user_id, display_name, photo_url").in("figma_user_id", figmaUserIds)
      : Promise.resolve({ data: [], error: null }),
    threadIds.length
      ? service.from("svga_plugin_feedback_messages")
          .select("thread_id, sender, body, created_at")
          .in("thread_id", threadIds)
          .order("created_at", { ascending: false })
          .limit(5000)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (usersResult.error) throw usersResult.error;
  if (messagesResult.error) throw messagesResult.error;
  const userById = new Map((usersResult.data || []).map((user) => [String(user.figma_user_id), user]));
  const latestByThread = new Map<string, { body: string; sender: string; created_at: string }>();
  const searchableByThread = new Map<string, string>();
  for (const message of messagesResult.data || []) {
    const threadId = String(message.thread_id);
    if (!latestByThread.has(threadId)) latestByThread.set(threadId, message);
    searchableByThread.set(threadId, `${searchableByThread.get(threadId) || ""} ${String(message.body || "").toLocaleLowerCase()}`);
  }
  const result = (threads || []).map((thread) => {
    const figmaUserId = String(thread.figma_user_id || "");
    const user = userById.get(figmaUserId);
    const latest = latestByThread.get(String(thread.id));
    return {
      id: String(thread.id),
      figmaUserId,
      displayName: String(user?.display_name || "未命名 Figma 用户"),
      photoUrl: user?.photo_url ? String(user.photo_url) : null,
      rating: Number(thread.rating || 0),
      latestMessage: latest ? String(latest.body || "") : "",
      latestSender: latest?.sender === "admin" ? "admin" : "user",
      createdAt: thread.created_at,
      updatedAt: thread.updated_at,
      searchableText: searchableByThread.get(String(thread.id)) || "",
    };
  }).filter((thread) => !query ||
    thread.displayName.toLocaleLowerCase().includes(query) ||
    thread.figmaUserId.toLocaleLowerCase().includes(query) ||
    thread.searchableText.includes(query));
  return { threads: result.map(({ searchableText: _searchableText, ...thread }) => thread) };
};

const adminFeedbackThread = async (body: Record<string, unknown>) => {
  const threadId = String(body.id || "");
  if (!uuidPattern.test(threadId)) throw httpError(400, "反馈会话 ID 无效。");
  const { data, error } = await service
    .from("svga_plugin_feedback_threads")
    .select("id, figma_user_id, rating, created_at, updated_at")
    .eq("id", threadId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw httpError(404, "没有找到反馈会话。");
  const { data: user, error: userError } = await service
    .from("svga_plugin_users")
    .select("display_name, photo_url")
    .eq("figma_user_id", data.figma_user_id)
    .maybeSingle();
  if (userError) throw userError;
  return {
    thread: {
      id: String(data.id),
      figmaUserId: String(data.figma_user_id || ""),
      displayName: String(user?.display_name || "未命名 Figma 用户"),
      photoUrl: user?.photo_url ? String(user.photo_url) : null,
      rating: Number(data.rating || 0),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
    messages: await feedbackMessages(threadId),
  };
};

const replyAdminFeedback = async (body: Record<string, unknown>, adminUserId: string) => {
  const threadId = String(body.id || "");
  const messageBody = normalizeFeedbackBody(body.body);
  if (!uuidPattern.test(threadId)) throw httpError(400, "反馈会话 ID 无效。");
  if (!messageBody) throw httpError(400, "请输入回复内容。");
  const { data: thread, error: threadError } = await service
    .from("svga_plugin_feedback_threads")
    .select("id")
    .eq("id", threadId)
    .maybeSingle();
  if (threadError) throw threadError;
  if (!thread) throw httpError(404, "没有找到反馈会话。");
  const now = new Date().toISOString();
  const { error } = await service.from("svga_plugin_feedback_messages").insert({
    thread_id: threadId,
    sender: "admin",
    body: messageBody,
    admin_auth_user_id: adminUserId,
  });
  if (error) throw error;
  const { error: updateError } = await service
    .from("svga_plugin_feedback_threads")
    .update({ updated_at: now })
    .eq("id", threadId);
  if (updateError) throw updateError;
  return await adminFeedbackThread({ id: threadId });
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json() as Record<string, unknown>;
    const action = String(body.action || "");

    if (action === "session") {
      const user = normalizePluginUser(body.user);
      const event = body.event ? String(body.event) : null;
      await recordUsage(user, event);
      const [entitlement, isAdmin, officialSequenceRevision] = await Promise.all([
        featureState(user.figmaUserId),
        isBoundAdmin(user.figmaUserId),
        officialSequenceLibraryRevision(),
      ]);
      return json({
        features: entitlement.features,
        subscription: entitlement.subscription,
        isAdmin,
        cacheBridgeUrl: sequenceCacheBridgeUrl,
        officialSequenceRevision,
      });
    }

    if (action === "track") {
      const user = normalizePluginUser(body.user);
      await recordUsage(user, String(body.event || ""));
      return json({ tracked: true });
    }

    if (action === "official-sequences") {
      const [sequences, categories, displacements] = await Promise.all([
        officialSequenceSets(false),
        officialSequenceCategories(),
        officialSequenceSets(false, "displacement"),
      ]);
      return json({
        sequences,
        categories,
        displacements,
        revision: officialSequenceLibraryRevisionFromCollections([...sequences, ...displacements], categories),
      });
    }

    if (action === "personal-library-session") {
      return json(await personalLibrarySession(body));
    }

    if (action === "personal-sequences") {
      const client = await requirePersonalLibraryClient(body);
      const sequences = await personalSequenceSets(client);
      return json({
        sequences,
        revision: personalSequenceLibraryRevisionFromSequences(sequences),
      });
    }

    if (action === "personal-sequence-prepare") {
      const client = await requirePersonalLibraryClient(body);
      return json(await preparePersonalSequence(body, client));
    }

    if (action === "personal-sequence-finalize") {
      const client = await requirePersonalLibraryClient(body);
      return json({ sequence: await finalizePersonalSequence(body, client) });
    }

    if (action === "personal-sequence-frames") {
      const client = await requirePersonalLibraryClient(body);
      return json({ frames: await personalSequenceFrames(body, client) });
    }

    if (action === "personal-sequence-update") {
      const client = await requirePersonalLibraryClient(body);
      return json({ updated: true, ...await updatePersonalSequence(body, client) });
    }

    if (action === "personal-sequence-delete" || action === "personal-sequence-abort") {
      const client = await requirePersonalLibraryClient(body);
      return json({ deleted: true, ...await deletePersonalSequence(body, client) });
    }

    if (action === "feedback-thread") {
      const client = await requireFeedbackClient(body);
      return json(await feedbackThreadForClient(client));
    }

    if (action === "feedback-submit") {
      const client = await requireFeedbackClient(body);
      return json(await submitFeedback(body, client));
    }

    if (action === "admin-bind") {
      const authUser = await requireAdmin(req);
      const user = normalizePluginUser(body.user);
      const { error } = await service.rpc("bind_svga_plugin_admin", {
        p_figma_user_id: user.figmaUserId,
        p_display_name: user.displayName,
        p_photo_url: user.photoUrl,
        p_session_id: user.sessionId,
        p_plugin_version: user.pluginVersion,
        p_auth_user_id: authUser.id,
      });
      if (error) throw error;
      const entitlement = await featureState(user.figmaUserId);
      return json({
        bound: true,
        isAdmin: true,
        features: entitlement.features,
        subscription: entitlement.subscription,
      });
    }

    if (action === "admin-state") {
      await requireAdmin(req);
      const user = normalizePluginUser(body.user);
      const bound = await isBoundAdmin(user.figmaUserId);
      const entitlement = await featureState(user.figmaUserId);
      return json({
        isAdmin: bound,
        features: entitlement.features,
        subscription: entitlement.subscription,
      });
    }

    if (action === "admin-users") {
      await requireAdmin(req);
      return json(await adminUsers(body));
    }

    if (action === "admin-pro-milestones") {
      await requireAdmin(req);
      return json(await adminProMilestones());
    }

    if (action === "admin-pro-milestone-save") {
      const authUser = await requireAdmin(req);
      return json(await saveAdminProMilestone(body, authUser.id));
    }

    if (action === "admin-pro-milestone-delete") {
      await requireAdmin(req);
      return json(await deleteAdminProMilestone(body));
    }

    if (action === "admin-sequences") {
      await requireAdmin(req);
      const [sequences, categories] = await Promise.all([
        officialSequenceSets(true),
        officialSequenceCategories(),
      ]);
      return json({ sequences, categories });
    }

    if (action === "admin-displacements") {
      await requireAdmin(req);
      return json({ materials: await officialSequenceSets(true, "displacement") });
    }
    if (action === "admin-displacement-upsert") {
      const authUser = await requireAdmin(req);
      return json({ saved: true, ...await uploadOfficialSequence(body, authUser.id, "displacement") });
    }
    if (action === "admin-displacement-update") {
      await requireAdmin(req);
      return json({ updated: true, ...await updateOfficialSequence(body, "displacement") });
    }
    if (action === "admin-displacement-delete") {
      await requireAdmin(req);
      return json({ deleted: true, ...await deleteOfficialSequence(body, "displacement") });
    }
    if (action === "admin-sequence-category-create") {
      const authUser = await requireAdmin(req);
      return json({ created: true, ...await createOfficialSequenceCategory(body, authUser.id) });
    }

    if (action === "admin-sequence-category-update") {
      await requireAdmin(req);
      return json({ updated: true, ...await updateOfficialSequenceCategory(body) });
    }

    if (action === "admin-sequence-category-delete") {
      await requireAdmin(req);
      return json({ deleted: true, ...await deleteOfficialSequenceCategory(body) });
    }

    if (action === "admin-sequence-upsert") {
      const authUser = await requireAdmin(req);
      const result = await uploadOfficialSequence(body, authUser.id);
      return json({ saved: true, ...result });
    }

    if (action === "admin-sequence-preview-backfill") {
      await requireAdmin(req);
      return json({ updated: true, ...await backfillOfficialSequencePreview(body) });
    }

    if (action === "admin-sequence-update") {
      await requireAdmin(req);
      return json({ updated: true, ...await updateOfficialSequence(body) });
    }

    if (action === "admin-sequence-delete") {
      await requireAdmin(req);
      return json({ deleted: true, ...await deleteOfficialSequence(body) });
    }

    if (action === "admin-personal-sequences") {
      await requireAdmin(req);
      return json(await adminPersonalSequences(body));
    }

    if (action === "admin-personal-sequence-frames") {
      await requireAdmin(req);
      return json(await adminPersonalSequenceFrames(body));
    }

    if (action === "admin-personal-sequence-preview-backfill") {
      await requireAdmin(req);
      return json({ updated: true, ...await backfillPersonalSequencePreview(body) });
    }

    if (action === "admin-personal-sequence-update") {
      await requireAdmin(req);
      return json({ updated: true, ...await updateAdminPersonalSequence(body) });
    }

    if (action === "admin-personal-sequence-delete") {
      await requireAdmin(req);
      return json({ deleted: true, ...await deleteAdminPersonalSequence(body) });
    }

    if (action === "admin-feedback-list") {
      await requireAdmin(req);
      return json(await adminFeedbackThreads(body));
    }

    if (action === "admin-feedback-thread") {
      await requireAdmin(req);
      return json(await adminFeedbackThread(body));
    }

    if (action === "admin-feedback-reply") {
      const authUser = await requireAdmin(req);
      return json(await replyAdminFeedback(body, authUser.id));
    }

    if (action === "admin-user-feature") {
      const authUser = await requireAdmin(req);
      const figmaUserId = String(body.figmaUserId || "").trim().slice(0, 256);
      const feature = String(body.feature || "");
      const requestedPlan = String(body.plan || "");
      const plan = requestedPlan || (body.enabled === true ? "permanent" : "");
      if (!figmaUserId) throw httpError(400, "缺少 Figma 用户 ID。");
      if (feature !== "lighting") throw httpError(400, "不支持该功能权限。");
      if (!requestedPlan && body.enabled === false) {
        throw httpError(409, "旧版后台不能关闭 PRO，请刷新页面后使用新版套餐按钮。");
      }
      if (!["none", "trial", "monthly", "permanent"].includes(plan)) throw httpError(400, "不支持的 PRO 套餐。");
      if (plan === "none" && body.confirmCancel !== true) {
        throw httpError(400, "取消 PRO 需要二次确认。");
      }
      const rawMonths = Math.round(Number(body.months || 1));
      const months = plan === "monthly"
        ? Math.max(1, Math.min(120, rawMonths))
        : 1;
      if (
        !Number.isFinite(rawMonths)
        || (plan === "monthly" && rawMonths !== months)
        || (plan === "trial" && rawMonths !== 1)
      ) {
        if (plan === "trial") throw httpError(400, "每次只能发放 7 天试用 PRO。");
        throw httpError(400, "续费月份必须介于 1 到 120。");
      }
      const { data: target, error: targetError } = await service
        .from("svga_plugin_users")
        .select("figma_user_id")
        .eq("figma_user_id", figmaUserId)
        .maybeSingle();
      if (targetError) throw targetError;
      if (!target) throw httpError(404, "没有找到该用户。");
      const { data, error } = plan === "none"
        ? await service.rpc("svga_admin_cancel_pro_subscription", {
            p_figma_user_id: figmaUserId,
            p_updated_by: authUser.id,
          })
        : await service.rpc("svga_admin_set_pro_subscription", {
            p_figma_user_id: figmaUserId,
            p_plan_type: plan,
            p_months: months,
            p_updated_by: authUser.id,
          });
      if (error) throw error;
      const source = Array.isArray(data) ? data[0] : data;
      const subscription = normalizeProSubscription(source);
      return json({
        figmaUserId,
        feature,
        enabled: subscription.plan !== "none",
        subscription,
      });
    }

    throw httpError(400, "不支持的请求。");
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error
      ? Number((error as { status?: number }).status || 500)
      : 500;
    const message = error instanceof Error ? error.message : "服务请求失败。";
    console.error(JSON.stringify({ message, status }));
    return json({ error: status >= 500 ? "服务暂时不可用，请稍后重试。" : message }, status);
  }
});
