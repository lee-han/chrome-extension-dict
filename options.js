const SETTINGS_KEY = 'settings';
const DEFAULT_SETTINGS = {
  selectionTooltipEnabled: false,
  contextMenuEnabled: false
};
const HOST_ORIGIN_PATTERN = '<all_urls>';

const SETTING_FIELDS = ['selectionTooltipEnabled', 'contextMenuEnabled'];
const checkboxes = Object.fromEntries(
  SETTING_FIELDS.map((id) => [id, document.getElementById(id)])
);
const status = document.getElementById('status');

let statusTimer = null;
function flashStatus(text, color = '#10b981') {
  status.style.color = color;
  status.textContent = text;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    status.textContent = '';
  }, 1800);
}

async function readSettings() {
  const stored = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] ?? {}) };
}

async function ensureHostPermission() {
  const has = await chrome.permissions.contains({ origins: [HOST_ORIGIN_PATTERN] });
  if (has) return true;
  return await chrome.permissions.request({ origins: [HOST_ORIGIN_PATTERN] });
}

async function releaseHostPermission() {
  try {
    await chrome.permissions.remove({ origins: [HOST_ORIGIN_PATTERN] });
  } catch (err) {
    console.error(`에러: 권한 해제 실패 ${err?.message ?? err}`);
  }
}

async function load() {
  const settings = await readSettings();
  for (const field of SETTING_FIELDS) {
    checkboxes[field].checked = settings[field];
  }
}

async function handleChange(field) {
  const nextChecked = checkboxes[field].checked;

  if (field === 'selectionTooltipEnabled' && nextChecked) {
    const granted = await ensureHostPermission();
    if (!granted) {
      checkboxes[field].checked = false;
      flashStatus('에러: 페이지 접근 권한이 필요합니다.', '#ef4444');
      return;
    }
  }

  try {
    const settings = await readSettings();
    settings[field] = nextChecked;
    await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
    flashStatus('저장됨');
  } catch (err) {
    flashStatus(`에러: ${err?.message ?? err}`, '#ef4444');
    return;
  }

  if (field === 'selectionTooltipEnabled' && !nextChecked) {
    await releaseHostPermission();
  }
}

for (const field of SETTING_FIELDS) {
  checkboxes[field].addEventListener('change', () => handleChange(field));
}

load();
