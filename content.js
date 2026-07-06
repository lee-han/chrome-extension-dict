(() => {
  const ICON_ID = '__hanhub_selection_icon__';
  const TOOLTIP_ID = '__hanhub_selection_tooltip__';
  const HOST_IDS = `#${ICON_ID}, #${TOOLTIP_ID}`;
  const SETTINGS_KEY = 'settings';
  const DEFAULT_SETTINGS = { selectionTooltipEnabled: false };

  let selectedText = '';
  let selectionTooltipEnabled = DEFAULT_SETTINGS.selectionTooltipEnabled;

  chrome.storage.sync.get(SETTINGS_KEY, (stored) => {
    const settings = { ...DEFAULT_SETTINGS, ...(stored?.[SETTINGS_KEY] ?? {}) };
    selectionTooltipEnabled = settings.selectionTooltipEnabled;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !changes[SETTINGS_KEY]) return;
    const next = { ...DEFAULT_SETTINGS, ...(changes[SETTINGS_KEY].newValue ?? {}) };
    selectionTooltipEnabled = next.selectionTooltipEnabled;
    if (!selectionTooltipEnabled) removeAll();
  });

  function removeIcon() {
    document.getElementById(ICON_ID)?.remove();
  }

  function removeTooltip() {
    document.getElementById(TOOLTIP_ID)?.remove();
  }

  function removeAll() {
    removeIcon();
    removeTooltip();
  }

  function makeIcon(x, y) {
    const icon = document.createElement('div');
    icon.id = ICON_ID;
    icon.textContent = '韓';
    icon.style.cssText = [
      'position: absolute',
      `top: ${y}px`,
      `left: ${x}px`,
      'z-index: 2147483647',
      'width: 22px',
      'height: 22px',
      'background: #6366f1',
      'color: #fff',
      'border-radius: 50%',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'font-size: 13px',
      'font-weight: 600',
      'cursor: pointer',
      'box-shadow: 0 2px 6px rgba(0,0,0,0.2)',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'user-select: none'
    ].join(';');
    icon.addEventListener('mousedown', (e) => e.preventDefault());
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = icon.getBoundingClientRect();
      const tx = rect.left + window.scrollX;
      const ty = rect.bottom + window.scrollY + 4;
      showTooltip(tx, ty);
    });
    return icon;
  }

  function showIcon(x, y) {
    removeAll();
    const icon = makeIcon(x, y);
    document.body.appendChild(icon);
  }

  function showTooltip(x, y) {
    removeTooltip();
    const tip = document.createElement('div');
    tip.id = TOOLTIP_ID;
    tip.style.cssText = [
      'position: absolute',
      `top: ${y}px`,
      `left: ${x}px`,
      'z-index: 2147483647',
      'background: #fff',
      'border: 1px solid #e5e7eb',
      'border-radius: 8px',
      'padding: 10px 12px',
      'box-shadow: 0 4px 12px rgba(0,0,0,0.15)',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-size: 13px',
      'color: #111827',
      'min-width: 180px',
      'max-width: 260px'
    ].join(';');

    const preview = document.createElement('div');
    const shown = selectedText.length > 40 ? selectedText.slice(0, 40) + '…' : selectedText;
    preview.textContent = shown;
    preview.style.cssText = 'margin-bottom: 8px; color: #4b5563; word-break: break-all;';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = '동양연표에서 보기';
    btn.style.cssText = [
      'width: 100%',
      'padding: 6px 10px',
      'background: #6366f1',
      'color: #fff',
      'border: none',
      'border-radius: 6px',
      'font-size: 13px',
      'cursor: pointer',
      'font-family: inherit'
    ].join(';');
    btn.addEventListener('mousedown', (e) => e.preventDefault());
    btn.addEventListener('click', () => {
      const value = selectedText;
      removeAll();
      chrome.runtime.sendMessage({
        type: 'openInSidePanel',
        target: 'chronology',
        value
      }).catch((err) => console.error(`에러: ${err?.message ?? err}`));
    });

    tip.appendChild(preview);
    tip.appendChild(btn);
    document.body.appendChild(tip);
  }

  document.addEventListener('mouseup', (e) => {
    if (!selectionTooltipEnabled) return;
    if (e.target instanceof Element && e.target.closest(HOST_IDS)) return;
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      if (!text) {
        removeAll();
        return;
      }
      selectedText = text;
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const x = rect.right + window.scrollX + 4;
      const y = rect.top + window.scrollY - 4;
      showIcon(x, y);
    }, 0);
  });

  document.addEventListener('mousedown', (e) => {
    if (e.target instanceof Element && e.target.closest(HOST_IDS)) return;
    removeAll();
  });

  document.addEventListener('scroll', () => {
    removeAll();
  }, true);
})();
