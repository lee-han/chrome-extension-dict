const CONTEXT_MENU_ID_DICT = 'hanhub_search_dict';
const SETTINGS_KEY = 'settings';
const DEFAULT_SETTINGS = {
  selectionTooltipEnabled: false,
  contextMenuEnabled: false
};

async function readSettings() {
  const stored = await chrome.storage.sync.get(SETTINGS_KEY);
  return { ...DEFAULT_SETTINGS, ...(stored[SETTINGS_KEY] ?? {}) };
}

async function syncContextMenu() {
  const settings = await readSettings();
  await chrome.contextMenus.removeAll();
  if (!settings.contextMenuEnabled) return;
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID_DICT,
    title: '한국학 웹사전에서 "%s" 검색',
    contexts: ['selection']
  });
}

async function stashAndOpen(tabId, target, value) {
  await chrome.storage.session.set({
    pendingSearch: { target, value, at: Date.now() }
  });
  await chrome.sidePanel.open({ tabId });
  chrome.runtime.sendMessage({
    type: 'search',
    target,
    value
  }).catch(() => {});
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setOptions({ enabled: true });
  syncContextMenu();
});

chrome.runtime.onStartup.addListener(() => {
  syncContextMenu();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync' || !changes[SETTINGS_KEY]) return;
  syncContextMenu();
});

chrome.action.onClicked.addListener(async (tab) => {
  await chrome.sidePanel.open({ tabId: tab.id });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID_DICT) return;
  const word = info.selectionText?.trim();
  if (!word || !tab?.id) return;
  await stashAndOpen(tab.id, 'dict', word);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== 'openInSidePanel') return;
  const tabId = sender.tab?.id;
  const value = message.value?.trim();
  const target = message.target;
  if (!tabId || !value || !target) {
    sendResponse({ ok: false, error: '에러: 요청 인자 누락' });
    return;
  }
  stashAndOpen(tabId, target, value)
    .then(() => sendResponse({ ok: true }))
    .catch((err) => sendResponse({ ok: false, error: `에러: ${err?.message ?? err}` }));
  return true;
});
