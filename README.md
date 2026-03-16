# Linear AI Enhancer

A Chrome extension that adds AI-powered buttons directly into [Linear](https://linear.app) to generate and enhance issue titles and descriptions — structured for AI coding agent workflows.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?logo=googlechrome&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-34A853)
![Version](https://img.shields.io/badge/version-1.0.0-blue)

## Why

Writing good issue tickets takes time. Vague titles and unstructured descriptions slow down development — especially when AI coding agents like Claude Code need clear, self-contained context to work effectively.

Linear AI Enhancer solves this by turning rough notes and screenshots into structured, actionable tickets in one click, right inside Linear.

## Features

- **Three enhancement modes** — generate a title, enhance a description, or do both at once
- **Structured output** — descriptions follow a consistent Problem → Expected Behavior → Acceptance Criteria → Visual Context format
- **Image-aware** — extracts images from issues, sends them to the LLM for analysis, and preserves them in the enhanced output
- **Multi-language** — auto-detects input language (English, Hebrew, etc.) and responds in kind
- **Multi-provider** — choose between Gemini, Claude, or GPT with your own API key
- **Zero dependencies** — pure vanilla JavaScript, no build step, no external libraries

## Supported Providers

| Provider | Model | Thinking |
|----------|-------|----------|
| Google Gemini | `gemini-3-flash-preview` | `thinkingLevel: "medium"` |
| Anthropic Claude | `claude-haiku-4-5-20251001` | `budget_tokens: 10000` |
| OpenAI GPT | `gpt-5-mini` | `reasoning_effort: "medium"` |

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/your-username/linear-ai-enhancer.git
   ```
2. Open `chrome://extensions/` in Chrome
3. Enable **Developer mode** (top-right toggle)
4. Click **Load unpacked** and select the `linear-ai-enhancer` directory
5. Click the extension icon in the toolbar, select a provider, enter your API key, and hit **Save**

## Usage

Navigate to any issue on [linear.app](https://linear.app). Three buttons appear automatically:

| Button | Location | Action |
|--------|----------|--------|
| ✦ Sparkle | Next to issue title | Generate a concise, verb-first title |
| ✧ Wand | Top-right of description | Enhance description into structured format |
| ✦✦ Double sparkle | Header button row | Generate both title and structured description |

Click any button — a spinner shows while processing, then a checkmark confirms success. The result is applied directly to Linear's editor.

### Output format

Enhanced descriptions follow this structure:

```
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

## How It Works

```
┌─────────────────────────────────────────────────────┐
│  Linear (linear.app)                                │
│                                                     │
│  content.js                                         │
│  ├─ Injects buttons via MutationObserver            │
│  ├─ Extracts title, description text, and images    │
│  └─ Applies results to editor                       │
│        │                                            │
│        │  chrome.runtime.sendMessage                │
│        ▼                                            │
│  background.js (service worker)                     │
│  ├─ Fetches & resizes images (max 1568px, ≤4MB)     │
│  ├─ Selects prompt based on action                  │
│  ├─ Calls LLM API (Gemini / Claude / GPT)           │
│  ├─ Parses structured response                      │
│  └─ Executes ProseMirror updates in MAIN world      │
│                                                     │
│  popup.html/js                                      │
│  └─ Provider selection & API key management         │
└─────────────────────────────────────────────────────┘
```

- **Content script** runs on `linear.app`, watching the DOM for issue title/description elements and injecting action buttons
- **Service worker** handles all API calls, image processing, and prompt orchestration — keeping CSP-sensitive logic out of the page context
- **MAIN world execution** uses `chrome.scripting.executeScript` to interact with Linear's ProseMirror editor directly, preserving images and rich formatting
- **Image pipeline** automatically resizes (max 1568×1568px) and compresses (iterative JPEG quality reduction down to 4MB) before sending to LLMs

## Project Structure

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

## Configuration

All settings are stored in Chrome's encrypted sync storage — no config files or environment variables needed.

| Setting | Description |
|---------|-------------|
| Provider | Gemini, Claude, or GPT |
| API Key | Your key for the selected provider (stored per-provider) |

API keys are persisted via `chrome.storage.sync` and travel with your Chrome profile across devices.

## Permissions

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

## License

MIT
