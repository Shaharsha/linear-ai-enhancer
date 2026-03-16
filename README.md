# Linear AI Enhancer

One-click AI enhancement for [Linear](https://linear.app) issue tickets — turn rough notes into structured, agent-ready issues.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

<!-- TODO: Add a hero GIF/screenshot here showing the extension in action -->

## Before & After

| Before | After |
|--------|-------|
| **Title:** "fix the bug" | **Title:** "Fix login redirect loop causing 403 on SSO callback" |
| **Description:** "auth is broken when you log in with SSO, sometimes get error" | **Description:** Structured issue with Problem, Expected Behavior, 5 Acceptance Criteria, and Visual Context sections |

## Installation

1. Clone the repo and load it in Chrome:
   ```sh
   git clone https://github.com/Shaharsha/linear-ai-enhancer.git
   ```
2. Go to `chrome://extensions/` → enable **Developer mode** → click **Load unpacked** → select the folder
3. Click the extension icon → pick a provider → paste your API key → **Save**

## Usage

Open any issue on [linear.app](https://linear.app). Three buttons appear:

| Button | Action |
|--------|--------|
| ✨ Sparkle (next to title) | Generate a concise, verb-first title |
| 🪄 Wand (top-right of description) | Enhance description into structured format |
| ✨✨ Double sparkle (header row) | Both at once |

The extension reads the current title, description text, and any attached images from the issue and sends them together as context to the LLM.

## Features

- **Structured output** — Problem → Expected Behavior → Acceptance Criteria → Visual Context
- **Image-aware** — extracts screenshots, sends them to the LLM, preserves them in the output
- **Multi-language** — auto-detects and responds in the input language
- **Multi-provider** — Gemini, Claude, or GPT with your own API key
- **Zero dependencies** — vanilla JS, no build step

## Supported Providers

| Provider | Model | Thinking |
|----------|-------|----------|
| Google Gemini | `gemini-3-flash-preview` | `thinkingLevel: "medium"` |
| Anthropic Claude | `claude-haiku-4-5-20251001` | `budget_tokens: 10000` |
| OpenAI GPT | `gpt-5-mini` | `reasoning_effort: "medium"` |

## Getting API Keys

| Provider | Get a key |
|----------|-----------|
| Google Gemini | [Google AI Studio](https://aistudio.google.com/api-keys) |
| Anthropic Claude | [Claude Platform](https://platform.claude.com/settings/keys) |
| OpenAI GPT | [OpenAI Platform](https://platform.openai.com/api-keys) |

Keys are stored per-provider in Chrome's encrypted sync storage — switch providers without re-entering them.

<details>
<summary><strong>Output format</strong></summary>

```markdown
## Problem
What is wrong or needed, and why it matters.

## Expected Behavior
What should happen after implementation.

## Acceptance Criteria
- Specific, testable conditions (3–7 items)
- Covers edge cases, not just happy paths

## Visual Context
(Only if screenshots are present — describes each image and preserves it inline)
```

</details>

<details>
<summary><strong>How it works</strong></summary>

```
content.js (runs on linear.app)
├─ Injects buttons via MutationObserver
├─ Extracts title, description text, and images
└─ Applies results to Linear's ProseMirror editor
       │
       │  chrome.runtime.sendMessage
       ▼
background.js (service worker)
├─ Fetches & resizes images (max 1568px, ≤4MB)
├─ Calls LLM API (Gemini / Claude / GPT)
├─ Parses structured response
└─ Executes editor updates in MAIN world

popup.html/js — provider selection & API key management
```

</details>

<details>
<summary><strong>Project structure</strong></summary>

```
linear-ai-enhancer/
├── manifest.json     # Extension config, permissions, host rules
├── background.js     # Service worker — LLM calls, image processing, prompts
├── content.js        # Content script — DOM injection, extraction, editor updates
├── popup.html        # Settings popup markup
├── popup.js          # Settings popup logic (provider + API key)
├── popup.css         # Settings popup styling
├── styles.css        # Injected button styling
└── icons/            # Extension icons (16, 48, 128px)
```

</details>

<details>
<summary><strong>Permissions</strong></summary>

| Permission | Why |
|------------|-----|
| `storage` | Save provider selection and API keys |
| `scripting` | Execute ProseMirror editor updates in MAIN world |
| `activeTab` | Access the current Linear tab |
| `https://linear.app/*` | Inject buttons and extract issue content |
| `https://uploads.linear.app/*` | Fetch issue images for LLM analysis |
| `https://generativelanguage.googleapis.com/*` | Gemini API |
| `https://api.anthropic.com/*` | Claude API |
| `https://api.openai.com/*` | GPT API |

</details>

## Privacy

No backend, no analytics, no data collection. Your issue content is sent directly from your browser to the LLM provider you choose. API keys are stored locally in Chrome's encrypted storage.

## Contributing

PRs welcome. Please open an issue first to discuss what you'd like to change.

## License

MIT
