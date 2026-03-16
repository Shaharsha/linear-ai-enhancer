const modelSelect = document.getElementById('model');
const saveBtn = document.getElementById('save');
const statusEl = document.getElementById('status');

// Model → provider mapping (both Claude models share one key)
const MODEL_TO_PROVIDER = {
  gemini: 'gemini',
  'claude-haiku': 'claude',
  'claude-sonnet': 'claude',
  gpt: 'gpt',
};

const keyInputs = {
  gemini: document.getElementById('key-gemini'),
  claude: document.getElementById('key-claude'),
  gpt: document.getElementById('key-gpt'),
};

// Load saved settings
chrome.storage.sync.get(['model', 'provider', 'keys'], (data) => {
  const keys = data.keys || {};
  // Support legacy 'provider' field for backward compat
  if (data.model) {
    modelSelect.value = data.model;
  } else if (data.provider) {
    modelSelect.value = data.provider;
  }
  for (const [provider, input] of Object.entries(keyInputs)) {
    input.value = keys[provider] || '';
  }
  updateModelOptions();
});

// Update disabled state as keys are typed
for (const input of Object.values(keyInputs)) {
  input.addEventListener('input', updateModelOptions);
}

// Toggle key visibility
document.querySelectorAll('.toggle-key').forEach((btn) => {
  btn.addEventListener('click', () => {
    const input = document.getElementById(btn.dataset.target);
    input.type = input.type === 'password' ? 'text' : 'password';
  });
});

// Save
saveBtn.addEventListener('click', () => {
  const model = modelSelect.value;
  const keys = {};
  for (const [p, input] of Object.entries(keyInputs)) {
    const val = input.value.trim();
    if (val) keys[p] = val;
  }

  chrome.storage.sync.set({ model, keys }, () => {
    statusEl.textContent = 'Saved';
    statusEl.className = 'saved';
    setTimeout(() => { statusEl.textContent = ''; statusEl.className = ''; }, 2000);
  });
});

function updateModelOptions() {
  for (const option of modelSelect.options) {
    const provider = MODEL_TO_PROVIDER[option.value];
    const hasKey = keyInputs[provider]?.value.trim().length > 0;
    option.disabled = !hasKey;
  }
  // If current selection is disabled, pick the first enabled option
  if (modelSelect.selectedOptions[0]?.disabled) {
    const first = [...modelSelect.options].find(o => !o.disabled);
    if (first) modelSelect.value = first.value;
  }
}
