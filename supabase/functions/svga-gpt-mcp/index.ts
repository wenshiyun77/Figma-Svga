import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createMcpHandler, McpServer } from "npm:@modelcontextprotocol/server@2.2.0";
import * as z from "npm:zod@4.6.5";

const VERSION = "0.1.2";
const PROJECT_ORIGIN = "https://nepilrihisogontdkcqi.supabase.co";
const FUNCTION_BASE = `${PROJECT_ORIGIN}/functions/v1/svga-gpt-mcp`;
const STATIC_ORIGIN = "https://wenshiyun77.github.io";
const STATIC_BASE = `${STATIC_ORIGIN}/Figma-Svga/gpt`;
const SECRET = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SVGA_GPT_TOKEN_SECRET") || "";
const TOKEN_TTL_MS = 60 * 60 * 1000;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, mcp-protocol-version, mcp-session-id, last-event-id",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Expose-Headers": "mcp-session-id, mcp-protocol-version",
};

const FileInput = z.object({
  download_url: z.string().url(),
  file_id: z.string().min(1),
  mime_type: z.string().optional(),
  file_name: z.string().optional(),
}).strict();
const Preset = z.enum(["vip", "shine", "glow", "particles", "fade", "pulse", "float"]);
const Format = z.enum(["svga", "gif", "webp"]);
const ConfigInput = {
  preset: Preset.optional(),
  duration: z.number().min(1).max(6).optional(),
  fps: z.union([z.literal(10), z.literal(12), z.literal(15)]).optional(),
  intensity: z.number().min(0.1).max(1).optional(),
  accent_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  formats: z.array(Format).min(1).max(3).optional(),
};
const OutputSchema = z.object({
  job_id: z.string(),
  job_token: z.string(),
  file_id: z.string(),
  file_name: z.string(),
  mime_type: z.string(),
  source_proxy_url: z.string().url(),
  preset: Preset,
  duration: z.number(),
  fps: z.number(),
  intensity: z.number(),
  accent_color: z.string(),
  formats: z.array(Format),
  render_location: z.literal("chatgpt_widget"),
  max_output_edge_px: z.literal(640),
});

type AnimationConfig = {
  preset: z.infer<typeof Preset>;
  duration: number;
  fps: 10 | 12 | 15;
  intensity: number;
  accent_color: string;
  formats: Array<z.infer<typeof Format>>;
};
type JobPayload = {
  v: 1;
  exp: number;
  job_id: string;
  file_id: string;
  file_name: string;
  mime_type: string;
  download_url: string;
};

function normalizeConfig(input: Record<string, unknown>): AnimationConfig {
  const parsedFormats = Array.isArray(input.formats)
    ? input.formats.filter((x): x is z.infer<typeof Format> => Format.safeParse(x).success).slice(0, 3)
    : [];
  return {
    preset: Preset.safeParse(input.preset).success ? input.preset as z.infer<typeof Preset> : "vip",
    duration: Math.max(1, Math.min(6, Number(input.duration || 3))),
    fps: ([10, 12, 15].includes(Number(input.fps)) ? Number(input.fps) : 12) as 10 | 12 | 15,
    intensity: Math.max(0.1, Math.min(1, Number(input.intensity || 0.7))),
    accent_color: /^#[0-9a-fA-F]{6}$/.test(String(input.accent_color || "")) ? String(input.accent_color) : "#e8bd59",
    formats: parsedFormats.length ? parsedFormats : ["svga", "gif", "webp"],
  };
}

function b64urlEncode(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function b64urlDecode(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}
async function tokenKey(): Promise<CryptoKey> {
  if (!SECRET) throw new Error("Server token secret is not configured.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SECRET));
  return await crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}
async function seal(payload: JobPayload): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const clear = new TextEncoder().encode(JSON.stringify(payload));
  const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await tokenKey(), clear));
  const joined = new Uint8Array(iv.length + cipher.length);
  joined.set(iv, 0);
  joined.set(cipher, iv.length);
  return b64urlEncode(joined);
}
async function unseal(token: string): Promise<JobPayload> {
  const bytes = b64urlDecode(token);
  if (bytes.length < 29) throw new Error("Invalid token.");
  const iv = bytes.slice(0, 12);
  const cipher = bytes.slice(12);
  const clear = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, await tokenKey(), cipher);
  const value = JSON.parse(new TextDecoder().decode(clear)) as JobPayload;
  if (value.v !== 1 || !value.exp || Date.now() > value.exp) throw new Error("Token expired.");
  return value;
}

function assertSafeHttpsUrl(value: string): URL {
  const url = new URL(value);
  if (url.protocol !== "https:") throw new Error("Only HTTPS file URLs are allowed.");
  const host = url.hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) throw new Error("Private hosts are not allowed.");
  if (/^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host)) throw new Error("Private IP addresses are not allowed.");
  if (host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80")) throw new Error("Private IP addresses are not allowed.");
  return url;
}
async function fetchSource(downloadUrl: string): Promise<Response> {
  let current = assertSafeHttpsUrl(downloadUrl);
  for (let hop = 0; hop < 4; hop++) {
    const res = await fetch(current, { redirect: "manual", headers: { "User-Agent": "SVGA-Editor-GPT/0.1" } });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Source redirect has no location.");
      current = assertSafeHttpsUrl(new URL(location, current).toString());
      continue;
    }
    if (!res.ok) throw new Error(`Source download failed (${res.status}).`);
    const length = Number(res.headers.get("content-length") || 0);
    if (length > MAX_SOURCE_BYTES) throw new Error("Source file is too large.");
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MAX_SOURCE_BYTES) throw new Error("Source file is too large.");
    return new Response(bytes, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": res.headers.get("content-type") || "application/octet-stream",
        "Content-Length": String(bytes.byteLength),
        "Cache-Control": "private, max-age=300",
      },
    });
  }
  throw new Error("Too many redirects.");
}

const widgetHtml = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SVGA Editor</title></head><body><div id="app"></div><script type="module" src="${STATIC_BASE}/editor.js?v=${VERSION}"></script></body></html>`;

function makeServer() {
  const server = new McpServer(
    { name: "svga-editor", version: VERSION },
    { instructions: "Use create_animation when a user attaches an image and asks to add motion or export SVGA, GIF, or WebP. The embedded UI renders locally in ChatGPT. Default to the VIP preset, 3 seconds, 12 fps, intensity 0.7, and all three formats when the user does not specify details." },
  );

  server.registerResource(
    "svga-editor-ui",
    "ui://svga-editor/editor-v2.html",
    { title: "SVGA Editor", description: "Interactive animation preview and export controls.", mimeType: "text/html;profile=mcp-app" },
    async (uri) => ({
      contents: [{
        uri: uri.href,
        mimeType: "text/html;profile=mcp-app",
        text: widgetHtml,
        _meta: {
          ui: {
            prefersBorder: true,
            domain: STATIC_ORIGIN,
            csp: { connectDomains: [PROJECT_ORIGIN, STATIC_ORIGIN], resourceDomains: [STATIC_ORIGIN] },
          },
          "openai/ui": { availableDisplayModes: ["inline", "fullscreen"] },
          "openai/widgetDescription": "SVGA Editor using the same v0.8.53 animation rendering engine as the Figma plugin, with native preview and SVGA/GIF/WebP export.",
        },
      }],
    }),
  );

  server.registerTool(
    "create_animation",
    {
      title: "Create animated asset",
      description: "Prepare an attached PNG, JPEG, WebP, or GIF image for interactive animation in ChatGPT. The widget previews fade, pulse, float, shine, glow, particles, or a combined VIP effect and exports SVGA, GIF, and animated WebP. Use this for short looping design assets, not long videos or 3D models.",
      inputSchema: z.object({ file: FileInput, ...ConfigInput }),
      outputSchema: OutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: false },
      _meta: {
        "openai/fileParams": ["file"],
        ui: { resourceUri: "ui://svga-editor/editor-v2.html", visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Preparing animation editor...",
        "openai/toolInvocation/invoked": "Animation editor ready",
      },
    },
    async ({ file, ...options }) => {
      const allowed = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
      if (file.mime_type && !allowed.has(file.mime_type)) {
        return { isError: true, content: [{ type: "text", text: "SVGA Editor MVP supports PNG, JPEG, WebP, and GIF image inputs." }] };
      }
      assertSafeHttpsUrl(file.download_url);
      const job_id = crypto.randomUUID();
      const payload: JobPayload = {
        v: 1,
        exp: Date.now() + TOKEN_TTL_MS,
        job_id,
        file_id: file.file_id,
        file_name: file.file_name || "asset.png",
        mime_type: file.mime_type || "image/png",
        download_url: file.download_url,
      };
      const job_token = await seal(payload);
      const cfg = normalizeConfig(options as Record<string, unknown>);
      const structured = {
        job_id,
        job_token,
        file_id: payload.file_id,
        file_name: payload.file_name,
        mime_type: payload.mime_type,
        source_proxy_url: `${FUNCTION_BASE}/source?token=${encodeURIComponent(job_token)}`,
        ...cfg,
        render_location: "chatgpt_widget" as const,
        max_output_edge_px: 640 as const,
      };
      return {
        structuredContent: structured,
        content: [{ type: "text", text: `Animation editor prepared with the ${cfg.preset} effect. Open the preview to refine settings and export ${cfg.formats.map((x) => x.toUpperCase()).join(", ")}. Rendering is performed in the ChatGPT widget.` }],
      };
    },
  );

  server.registerTool(
    "update_animation",
    {
      title: "Update animation settings",
      description: "Update the effect settings for an existing SVGA Editor job. Use this for follow-up requests such as stronger glow, fewer particles, a softer pulse, a different duration, FPS, accent color, or export format. The widget re-renders locally.",
      inputSchema: z.object({ job_token: z.string().min(20), ...ConfigInput }),
      outputSchema: OutputSchema,
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false, idempotentHint: true },
      _meta: {
        ui: { resourceUri: "ui://svga-editor/editor-v2.html", visibility: ["model", "app"] },
        "openai/toolInvocation/invoking": "Updating animation settings...",
        "openai/toolInvocation/invoked": "Animation settings updated",
      },
    },
    async ({ job_token, ...options }) => {
      const payload = await unseal(job_token);
      const nextToken = await seal({ ...payload, exp: Date.now() + TOKEN_TTL_MS });
      const cfg = normalizeConfig(options as Record<string, unknown>);
      const structured = {
        job_id: payload.job_id,
        job_token: nextToken,
        file_id: payload.file_id,
        file_name: payload.file_name,
        mime_type: payload.mime_type,
        source_proxy_url: `${FUNCTION_BASE}/source?token=${encodeURIComponent(nextToken)}`,
        ...cfg,
        render_location: "chatgpt_widget" as const,
        max_output_edge_px: 640 as const,
      };
      return {
        structuredContent: structured,
        content: [{ type: "text", text: `Animation settings updated to ${cfg.preset}, ${cfg.duration}s, ${cfg.fps} fps.` }],
      };
    },
  );

  return server;
}

const mcpHandler = createMcpHandler(() => makeServer());

function withCors(response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) headers.set(key, value);
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  const url = new URL(req.url);
  try {
    if (url.pathname.endsWith("/health")) {
      return new Response(JSON.stringify({ ok: true, name: "svga-editor", version: VERSION }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (url.pathname.endsWith("/source")) {
      const token = url.searchParams.get("token") || "";
      const payload = await unseal(token);
      return await fetchSource(payload.download_url);
    }
    if (url.pathname.endsWith("/mcp") || url.pathname.endsWith("/svga-gpt-mcp")) {
      return withCors(await mcpHandler.fetch(req));
    }
    return new Response("Not Found", { status: 404, headers: corsHeaders });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
