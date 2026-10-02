# SVGA Editor ChatGPT Plugin

Public ChatGPT/Codex plugin MVP for SVGA Editor.

## Architecture

- MCP endpoint: `https://nepilrihisogontdkcqi.supabase.co/functions/v1/svga-gpt-mcp/mcp`
- Health endpoint: `https://nepilrihisogontdkcqi.supabase.co/functions/v1/svga-gpt-mcp/health`
- Product/UI site: `https://wenshiyun77.github.io/Figma-Svga/gpt/`
- Edge Function source: `supabase/functions/svga-gpt-mcp/`
- Browser animation runtime: `cache-bridge/gpt/editor.js`
- Public plugin package source: `gpt-plugin/`

## MVP scope

Inputs:
- PNG
- JPEG
- WebP
- GIF (first decoded frame in v0.1)

Effects:
- VIP combo
- Shine
- Glow
- Particles
- Fade
- Pulse
- Float

Exports:
- SVGA
- GIF
- Animated WebP

The animation preview and export encoding run in the ChatGPT plugin UI, keeping heavy raster work away from the Supabase Edge Function. The Edge Function provides MCP tools, validates file references, and exposes a short-lived encrypted source proxy.

## Updating

### Effects / export UI

Modify `cache-bridge/gpt/editor.js`. GitHub Pages deploys the `cache-bridge` directory automatically.

### MCP tools

Modify `supabase/functions/svga-gpt-mcp/index.ts`, then deploy the Edge Function. Published plugins can pick up hosted MCP tool changes through the plugin MCP rescan flow without requiring users to reinstall.

### Listing metadata

Modify `gpt-plugin/plugin.json` or assets, rebuild the plugin ZIP, and upload a new package version in the OpenAI plugin portal.

## Safety

- Source file proxy only accepts HTTPS.
- Localhost/private IPv4/private IPv6 destinations are rejected.
- Redirects are revalidated.
- Source proxy tokens are AES-GCM encrypted and expire after one hour.
- Maximum proxied source size is 20 MB.
- The MVP does not add database tables or change the existing Figma `plugin-control` function.
