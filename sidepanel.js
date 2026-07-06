const SEARCH_TARGETS = {
  dict: { url: 'https://dict.hanhub.click/', param: 'word' },
  chronology: { url: 'https://chronology.hanhub.click/', param: 'year' }
};

const tabs = document.querySelectorAll('.tab');
const iframes = document.querySelectorAll('iframe');

function activateTab(target) {
  tabs.forEach((t) => t.classList.toggle('active', t.dataset.target === target));
  iframes.forEach((iframe) => iframe.classList.toggle('hidden', iframe.id !== target));
}

function applySearch(target, value) {
  const cfg = SEARCH_TARGETS[target];
  if (!cfg) {
    console.error(`에러: 알 수 없는 검색 대상 ${target}`);
    return;
  }
  const url = `${cfg.url}?embed=true&${cfg.param}=${encodeURIComponent(value)}`;
  const iframe = document.getElementById(target);
  if (!iframe) {
    console.error(`에러: iframe 요소를 찾을 수 없음 ${target}`);
    return;
  }
  iframe.src = url;
  activateTab(target);
}

tabs.forEach((tab) => {
  tab.addEventListener('click', () => activateTab(tab.dataset.target));
});

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'search') {
    applySearch(message.target, message.value);
  }
});

(async () => {
  const { pendingSearch } = await chrome.storage.session.get('pendingSearch');
  if (!pendingSearch) return;
  await chrome.storage.session.remove('pendingSearch');
  applySearch(pendingSearch.target, pendingSearch.value);
})();
