const providerSelect = document.getElementById('provider');
const apiKeyInput = document.getElementById('apiKey');
const toggleKeyBtn = document.getElementById('toggleKey');
const saveBtn = document.getElementById('save');
const statusEl = document.getElementById('status');

let keys = {};

// Load saved settings
chrome.storage.sync.get(['provider', 'keys'], (data) => {
  keys = data.keys || {};
  if (data.provider) {
    providerSelect.value = data.provider;
  }
  showKeyForProvider(providerSelect.value);
});

// Switch provider → show that provider's saved key
providerSelect.addEventListener('change', () => {
  showKeyForProvider(providerSelect.value);
  updateStatus();
});

// Toggle key visibility
toggleKeyBtn.addEventListener('click', () => {
  apiKeyInput.type = apiKeyInput.type === 'password' ? 'text' : 'password';
});

// Save
saveBtn.addEventListener('click', () => {
  const provider = providerSelect.value;
  const key = apiKeyInput.value.trim();
  keys[provider] = key;
  chrome.storage.sync.set({ provider, keys }, () => {
    statusEl.textContent = 'Saved';
    statusEl.className = 'saved';
    setTimeout(() => { statusEl.textContent = ''; }, 2000);
  });
});

function showKeyForProvider(provider) {
  apiKeyInput.value = keys[provider] || '';
  apiKeyInput.type = 'password';
}

function updateStatus() {
  const provider = providerSelect.value;
  if (keys[provider]) {
    statusEl.textContent = 'Key saved';
    statusEl.className = 'saved';
  } else {
    statusEl.textContent = 'No key';
    statusEl.className = 'error';
  }
}
