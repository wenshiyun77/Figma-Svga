export function correctDisplacementFrameCounts(root) {
  for (const meta of root.querySelectorAll('[data-displacement-id] .body .muted')) {
    if (meta.textContent.includes('内置效果 · 0 帧')) {
      meta.textContent = meta.textContent.replace('内置效果 · 0 帧', '内置效果 · 12 帧');
    }
  }
}

if (typeof document !== 'undefined') {
  const app = document.getElementById('app');
  if (app) {
    const correct = () => correctDisplacementFrameCounts(app);
    new MutationObserver(correct).observe(app, { childList: true, subtree: true });
    correct();
  }
}
