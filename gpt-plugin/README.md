# SVGA Editor ChatGPT Plugin

SVGA Editor has two different OpenAI integration paths. They must not be confused.

## 1. ChatGPT Web development/testing

Do **not** upload the ZIP for this path. A manually imported plugin that declares `mcp.json` can be labeled **Desktop only**, even when the MCP server uses public HTTPS.

In ChatGPT Web:

1. Enable Developer mode in **Settings → Security and login**.
2. Open **Plugins** and select **+**.
3. Connect this production Remote MCP endpoint:

```
https://nepilrihisogontdkcqi.supabase.co/functions/v1/svga-gpt-mcp/mcp
```

4. Name it **SVGA Editor**.
5. Use it from a new **Work** chat on the web.

This is the correct web testing path for the current Remote MCP server.

## 2. Public Plugin Directory submission

For public publication, use the ZIP package in this repository and submit it through the OpenAI plugin submission portal using the **With MCP** flow.

The submission ZIP intentionally contains `mcp.json` because public remote-MCP submissions require the production MCP server declaration. Do not use that ZIP as the web-development installation method.

## Architecture

- Production MCP: `https://nepilrihisogontdkcqi.supabase.co/functions/v1/svga-gpt-mcp/mcp`
- Health: `https://nepilrihisogontdkcqi.supabase.co/functions/v1/svga-gpt-mcp/health`
- Product/UI site: `https://wenshiyun77.github.io/Figma-Svga/gpt/`
- Edge Function source: `supabase/functions/svga-gpt-mcp/`
- Browser animation runtime: `cache-bridge/gpt/editor.js`
- Public submission package source: `gpt-plugin/`

## MVP

Inputs: PNG, JPEG, WebP, GIF (first decoded frame).

Effects: VIP combo, shine, glow, particles, fade, pulse, float.

Exports: SVGA, GIF, animated WebP.

Rendering runs inside the ChatGPT MCP App UI; Supabase handles MCP orchestration and the short-lived source proxy.

## Important

The existing workspace-private plugin created from an uploaded ZIP may remain Desktop only. That is expected for the imported-package path and is not the web testing path or the final public-directory behavior.
