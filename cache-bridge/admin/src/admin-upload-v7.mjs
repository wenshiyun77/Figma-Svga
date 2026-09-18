const NAME_LIMIT = 120;

const activeCategory = () => {
  const chip = document.querySelector('.official-category-chip.active[data-filter-category]');
  const id = String(chip?.dataset?.filterCategory || '').trim();
  return {
    id: id && id !== 'all' ? id : '',
    name: id && id !== 'all' ? String(chip?.textContent || '').trim() : '',
  };
};

const truncateName = (value) => {
  const chars = Array.from(String(value || '未命名').trim() || '未命名');
  return chars.length <= NAME_LIMIT ? chars.join('') : chars.slice(0, NAME_LIMIT - 3).join('') + '...';
};

const relativePath = (file) => String(file?.webkitRelativePath || file?.name || '');

const normalizeFolderNames = (files) => [...(files || [])].map((file) => {
  const parts = relativePath(file).split('/').filter(Boolean);
  if (!parts.length) return file;
  const folderIndex = parts.length > 2 ? 1 : 0;
  const nextName = truncateName(parts[folderIndex] || '未命名');
  if (nextName === parts[folderIndex]) return file;
  parts[folderIndex] = nextName;
  const clone = new File([file], file.name, { type: file.type, lastModified: file.lastModified });
  try {
    Object.defineProperty(clone, 'webkitRelativePath', { value: parts.join('/'), configurable: true });
  } catch {}
  return clone;
});

const readEntries = (reader) => new Promise((resolve, reject) => reader.readEntries(resolve, reject));

const collectEntry = async (entry, prefix, files) => {
  if (!entry) return;
  if (entry.isFile) {
    await new Promise((resolve, reject) => entry.file((file) => {
      try {
        Object.defineProperty(file, 'webkitRelativePath', { value: prefix + file.name, configurable: true });
      } catch {}
      files.push(file);
      resolve();
    }, reject));
    return;
  }
  if (!entry.isDirectory) return;
  const nextPrefix = prefix + truncateName(entry.name) + '/';
  const reader = entry.createReader();
  for (;;) {
    const batch = await readEntries(reader);
    if (!batch.length) break;
    for (const child of batch) await collectEntry(child, nextPrefix, files);
  }
};

const droppedFiles = async (dataTransfer) => {
  const entries = [...(dataTransfer?.items || [])]
    .map((item) => item.webkitGetAsEntry?.())
    .filter(Boolean);
  if (!entries.length) return [...(dataTransfer?.files || [])];
  const files = [];
  for (const entry of entries) await collectEntry(entry, '', files);
  return files;
};

const currentIds = () => new Set(
  [...document.querySelectorAll('.official-v6-card[data-sequence-id]')]
    .map((node) => String(node.dataset.sequenceId || ''))
    .filter(Boolean),
);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const applyCategoryToNewCards = async (beforeIds, categoryId) => {
  if (!categoryId) return;
  const deadline = Date.now() + 8000;
  const applied = new Set();
  while (Date.now() < deadline) {
    const cards = [...document.querySelectorAll('.official-v6-card[data-sequence-id]')]
      .filter((card) => !beforeIds.has(String(card.dataset.sequenceId || '')));

    for (const card of cards) {
      const id = String(card.dataset.sequenceId || '');
      if (!id || applied.has(id)) continue;
      const select = card.querySelector('select[data-category-id]');
      if (!select || select.value === categoryId) {
        applied.add(id);
        continue;
      }
      select.value = categoryId;
      if (typeof select.onchange === 'function') {
        await select.onchange();
      } else {
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      applied.add(id);
      await wait(120);
      break;
    }

    if (cards.length && cards.every((card) => applied.has(String(card.dataset.sequenceId || '')))) return;
    await wait(180);
  }
};

const syncButton = () => {
  const button = document.querySelector('#uploadFolder');
  if (!button) return;
  const category = activeCategory();
  button.textContent = category.id ? `上传到「${category.name}」` : '批量上传文件夹';
  button.title = '点击选择文件夹；也可同时拖入多个文件夹';
};

const enhance = () => {
  const input = document.querySelector('#folderInput');
  const button = document.querySelector('#uploadFolder');
  if (!input || !button) return;

  syncButton();

  if (input.dataset.uploadV7 === '1') return;
  input.dataset.uploadV7 = '1';
  input.multiple = true;

  const originalChange = input.onchange;
  input.onchange = async (event) => {
    const category = activeCategory();
    const beforeIds = currentIds();
    const files = normalizeFolderNames(event?.target?.files || []);
    if (!files.length) return;
    if (typeof originalChange === 'function') {
      await originalChange({ target: { files } });
      await applyCategoryToNewCards(beforeIds, category.id);
    }
  };

  button.addEventListener('dragover', (event) => {
    event.preventDefault();
    button.classList.add('active');
  });

  button.addEventListener('dragleave', () => button.classList.remove('active'));

  button.addEventListener('drop', async (event) => {
    event.preventDefault();
    button.classList.remove('active');
    const files = await droppedFiles(event.dataTransfer);
    if (!files.length) return;
    await input.onchange({ target: { files } });
  });
};

let raf = 0;
const schedule = () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(enhance);
};

new MutationObserver(schedule).observe(document.documentElement, {
  subtree: true,
  childList: true,
  attributes: true,
  attributeFilter: ['class'],
});

document.addEventListener('click', (event) => {
  if (event.target?.closest?.('[data-filter-category]')) queueMicrotask(syncButton);
}, true);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', schedule, { once: true });
} else {
  schedule();
}
