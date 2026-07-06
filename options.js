const SETTINGS_KEY = 'settings';
const DEFAULT_SETTINGS = {
  selectionTooltipEnabled: false,
  contextMenuEnabled: false
};

const SETTING_FIELDS = ['selectionTooltipEnabled', 'contextMenuEnabled'];
const checkboxes = Object.fromEntries(
  SETTING_FIELDS.map((id) => [id, document.getElementById(id)])
);
const status = document.getElementById('status');

let statusTimer = null;
function flashStatus(text) {
  status.textContent = text;
  if (statusTimer) clearTimeout(statusTimer);
  statusTimer = setTimeout(() => {
    status.textContent = '';
  }, 1500);
}

async function readSettings() {
  const stored = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] ?? {}) };
}

async function load() {
  const settings = await readSettings();
  for (const field of SETTING_FIELDS) {
    checkboxes[field].checked = settings[field];
  }
}

for (const field of SETTING_FIELDS) {
  checkboxes[field].addEventListener('change', async () => {
    try {
      const settings = await readSettings();
      settings[field] = checkboxes[field].checked;
      await chrome.storage.sync.set({ [SETTINGS_KEY]: settings });
      flashStatus('저장됨');
    } catch (err) {
      status.style.color = '#ef4444';
      status.textContent = `에러: ${err?.message ?? err}`;
    }
  });
}

load();
