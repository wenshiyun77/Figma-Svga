(() => {
  "use strict";
  const BASE = "https://wenshiyun77.github.io/Figma-Svga/gpt/engine";
  const BUILD = "v0853-gpt-1";
  window.__SVGA_GPT_MODE__ = true;
  window.__SVGA_GPT_CACHE_TOKEN__ = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now())) + (crypto.randomUUID ? crypto.randomUUID() : "");
  let pending = window.openai?.toolOutput || null;
  let engineReady = false;

  const extractToolResult = (message) => {
    if (!message || message.jsonrpc !== "2.0") return null;
    if (message.method === "ui/notifications/tool-result") return message.params || null;
    return null;
  };

  window.addEventListener("message", (event) => {
    if (event.source !== parent) return;
    const result = extractToolResult(event.data);
    if (!result) return;
    pending = result;
    window.__SVGA_GPT_PENDING_TOOL_OUTPUT__ = result;
    if (engineReady) {
      window.dispatchEvent(new CustomEvent("svga-gpt-tool-output", { detail: result }));
    }
  });

  const addStyle = () => new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${BASE}/v0853.css?v=${BUILD}`;
    link.onload = resolve;
    link.onerror = () => reject(new Error("v0.8.53 样式加载失败"));
    document.head.appendChild(link);
  });

  const loadBody = async () => {
    const response = await fetch(`${BASE}/v0853.body.html?v=${BUILD}`, { cache: "no-store" });
    if (!response.ok) throw new Error(`v0.8.53 UI 加载失败 (${response.status})`);
    document.body.innerHTML = await response.text();
  };

  const loadEngine = () => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${BASE}/v0853.engine.js?v=${BUILD}`;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error("v0.8.53 原生效果引擎加载失败"));
    document.body.appendChild(script);
  });

  const statusFallback = (message) => {
    document.body.innerHTML = `<main style="font:13px/1.5 system-ui;padding:18px;background:#101012;color:#eee;min-height:100vh"><b>SVGA Editor</b><p style="color:#aaa">${message}</p></main>`;
  };

  (async () => {
    try {
      window.__SVGA_GPT_PENDING_TOOL_OUTPUT__ = pending;
      await Promise.all([addStyle(), loadBody()]);
      await loadEngine();
      engineReady = true;
      const initial = pending || window.openai?.toolOutput;
      if (initial) {
        window.dispatchEvent(new CustomEvent("svga-gpt-tool-output", { detail: initial }));
      }
    } catch (error) {
      console.error(error);
      statusFallback(error?.message || String(error));
    }
  })();
})();
