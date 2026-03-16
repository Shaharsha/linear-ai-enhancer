// === Prompts ===

const TITLE_PROMPT = `You generate concise titles for software issue tickets from descriptions and images.

Rules:
- ALWAYS generate a title. Never refuse, never ask for more info, never explain.
- Start with an action verb: Fix, Add, Update, Implement, Remove, Refactor, Improve, etc.
- Keep under 80 characters.
- Be specific: name the affected component, feature, or behavior.
- If a current title is provided, generate a DIFFERENT, improved version.
- Match the dominant language of the description. If the input is mostly English with some non-English terms, write in English (and vice versa).
- Output ONLY the raw title text. No quotes, no prefix, no explanation.

Examples:

Input: The search bar on the dashboard doesn't return results when using special characters like & or #
Output: Fix search bar failing on special characters in dashboard

Input: We need to add a way for users to export their data as CSV from the settings page
Output: Add CSV data export option to settings page

Input: כשלוחצים על כפתור השמירה בדף העריכה, לפעמים זה לא שומר ואין הודעת שגיאה
Output: Fix intermittent save failure on edit page without error message

Input: [Screenshot of a 500 error page on the /api/users endpoint]
Output: Fix 500 error on users API endpoint

Input: Current title: stuff is broken. The payment processing webhook from Stripe fails silently when the customer has multiple subscriptions
Output: Fix Stripe webhook silent failure for multi-subscription customers`;

const CONTENT_PROMPT = `You enhance software issue ticket descriptions into a structured format optimized for AI coding agents (Claude Code). The enhanced description must be self-contained — all information needed to implement the ticket must be in the text.

Rules:
- ALWAYS produce enhanced content. Never refuse, never ask for more info.
- Preserve ALL original information. Never remove details.
- Describe any attached images in text within the relevant section — the AI coding agent may not receive the images directly.
- When images are provided, reference them in the Problem and Expected Behavior sections (e.g. "as shown in Image 1"). This is important because AI coding agents cannot see images — they rely on textual references to understand which image illustrates which issue.
- Keep acceptance criteria specific and testable (pass/fail checkable).
- Include 3-7 acceptance criteria. Cover edge cases, not just happy paths.
- Be specific about WHAT and WHY, not about HOW to implement.
- NEVER include a "Visual Context" section unless the input contains actual images. If there are no images, output only Problem, Expected Behavior, and Acceptance Criteria.
- When images ARE provided, you MUST include [IMAGE_1], [IMAGE_2], etc. placeholders on their own line in the Visual Context section. Each image MUST have its own placeholder. Without these placeholders, images will be lost.
- Match the dominant language of the original description. If the input is mostly English with some non-English terms, write in English (and vice versa).
- Output ONLY the enhanced description. No meta-commentary, no "Here is the enhanced version".

Output format — use these exact markdown headers:

## Problem
1-3 sentences: what is wrong or what feature is needed, and why it matters

## Expected Behavior
1-3 sentences: what should happen after implementation

## Acceptance Criteria
- Specific, testable condition — start with a verb or assertion
- Another specific condition
- Edge case or error handling condition

## Visual Context
Only include this section if images were provided.
- If there are multiple images, describe each one separately with a clear label.
- Use the placeholder [IMAGE_1], [IMAGE_2], etc. on its own line to indicate where each original image should be placed (in order they appeared in the description).
- Reproduce any visible text EXACTLY as it appears (keep original language, do NOT translate).
- Describe UI elements, layout, colors, icons, states, error messages, data values verbatim.
Skip this section entirely if no images.

Example with 2 images:
## Visual Context

### Image 1
Shows a login form with email and password fields. Error message "שם משתמש או סיסמה שגויים" appears in red below the form.

[IMAGE_1]

### Image 2
Shows the network tab with a 401 response from /api/auth/login endpoint.

[IMAGE_2]

Example input: the search doesn't work with special characters
Example output:
## Problem
The search functionality fails to return results when queries contain special characters such as &, #, or @. Users who search for terms containing these characters see no results even when matching records exist.

## Expected Behavior
Search handles special characters correctly, returning all matching results regardless of special characters in the query string.

## Acceptance Criteria
- Search returns correct results for queries containing &, #, @, and % characters
- Special characters are properly escaped before being sent to the backend
- Empty result set displays a "no results" message, not an error
- Search performance is not degraded by special character handling

Example input: we need to add the option for users to choose between dark and light theme in settings, currently its only light mode
Example output:
## Problem
The application only supports light mode. Users have no way to switch to a dark theme, which affects usability in low-light environments and does not accommodate user preferences.

## Expected Behavior
A theme toggle in the settings page allows users to switch between light and dark mode. The selected theme persists across sessions.

## Acceptance Criteria
- Settings page includes a theme selector with "Light" and "Dark" options
- Selected theme applies immediately without requiring a page reload
- Theme preference is saved and persists across browser sessions
- All UI components render correctly in both themes with sufficient contrast
- Default theme remains "Light" for new users

Example input: when on the טבלת מכרזים view and I type in the search box nothing happens, it doesn't filter
Example output:
## Problem
The search input on the tenders table view (טבלת מכרזים) does not filter the list when text is entered. Users cannot search or narrow down tenders, making it difficult to find specific entries.

## Expected Behavior
Typing in the search input filters the tenders table in real time, showing only rows that match the search query.

## Acceptance Criteria
- Typing in the search input filters the tenders list immediately
- Clearing the search input restores the full list
- Search supports substring matching, not just exact matches
- A "no results" message is shown when no tenders match the query
- Search works in combination with any other active filters`;

const BOTH_PROMPT = `You generate BOTH a concise title AND an enhanced description for software issue tickets. The enhanced description must be self-contained and structured for AI coding agents (Claude Code).

Rules:
- ALWAYS produce both title and content. Never refuse, never ask for more info.
- Preserve ALL original information in the description.
- Describe any attached images in text — the AI coding agent may not receive images directly.
- When images are provided, reference them in the Problem and Expected Behavior sections (e.g. "as shown in Image 1"). This is important because AI coding agents cannot see images — they rely on textual references to understand which image illustrates which issue.
- NEVER include a "Visual Context" section unless the input contains actual images. If there are no images, output only Problem, Expected Behavior, and Acceptance Criteria.
- When images ARE provided, you MUST include [IMAGE_1], [IMAGE_2], etc. placeholders on their own line in the Visual Context section. Each image MUST have its own placeholder. Without these placeholders, images will be lost.
- Match the dominant language of the original. If the input is mostly English with some non-English terms, write in English (and vice versa).
- Use the EXACT output format below with the TITLE: prefix and ---CONTENT--- delimiter.

Output format:
TITLE: verb-first, under 80 chars, specific
---CONTENT---
## Problem
1-3 sentences: what is wrong or needed, and why

## Expected Behavior
1-3 sentences: what should happen after implementation

## Acceptance Criteria
- Specific, testable condition
- Another condition
- Edge case

## Visual Context
Only if images were provided. Describe each image separately with labels. Use [IMAGE_1], [IMAGE_2] etc. placeholders on their own line to indicate where each original image belongs. Reproduce all visible text verbatim in its original language (do NOT translate). Describe UI elements, layout, icons, data values. Skip entirely if none.

Example input: users can't upload files bigger than 5MB, it just spins forever
Example output:
TITLE: Fix file upload hanging for files larger than 5MB
---CONTENT---
## Problem
File uploads exceeding 5MB fail silently — the upload spinner runs indefinitely with no error message or timeout. Users have no way to know the upload has failed.

## Expected Behavior
Large file uploads either complete successfully or show a clear error message with the file size limit. The upload should not hang indefinitely.

## Acceptance Criteria
- Files under 5MB upload successfully without changes
- Files over the size limit show a clear error message stating the maximum allowed size
- Upload spinner has a timeout (max 30 seconds) after which an error is shown
- Upload progress is displayed for files that are processing
- Error state allows the user to retry or choose a different file

Example input: add dark mode option in the settings page
Example output:
TITLE: Add dark mode theme toggle to settings page
---CONTENT---
## Problem
The application only supports light mode. Users have no way to switch to a dark theme, which affects usability in low-light environments.

## Expected Behavior
A theme toggle in the settings page allows users to switch between light and dark mode. The selected theme persists across sessions.

## Acceptance Criteria
- Settings page includes a theme selector with "Light" and "Dark" options
- Selected theme applies immediately without page reload
- Theme preference persists across browser sessions
- All UI components render correctly in both themes
- Default theme remains "Light" for new users

Example input: in the דוחות חודשיים page, the export button downloads an empty CSV file instead of the actual report data
Example output:
TITLE: Fix monthly reports CSV export downloading empty file
---CONTENT---
## Problem
Clicking the export button on the monthly reports page (דוחות חודשיים) downloads a CSV file with no data. The file contains only headers or is completely empty, despite report data being visible on screen.

## Expected Behavior
The export button downloads a CSV file containing all the report data currently displayed on the monthly reports page.

## Acceptance Criteria
- Exported CSV contains all columns visible in the report table
- Data values in the CSV match what is displayed on screen
- Export works for reports of any date range
- File name includes the report month for easy identification
- Large reports (1000+ rows) export without timeout or truncation`;

// === Model Configuration ===

const MODELS = {
  gemini:          { provider: 'gemini' },
  'claude-haiku':  { provider: 'claude', apiModel: 'claude-haiku-4-5-20251001', thinking: { type: 'enabled', budget_tokens: 10000 }, maxTokensPad: 12000 },
  'claude-sonnet': { provider: 'claude', apiModel: 'claude-sonnet-4-6', thinking: { type: 'adaptive' }, effort: 'medium', maxTokensPad: 0 },
  gpt:             { provider: 'gpt' },
};

function maxTokens(action) {
  return action === 'title' ? 1000 : 16000;
}

// === Message Handling ===

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'ENHANCE') {
    handleEnhance(message.data).then(sendResponse);
    return true;
  }
  if (message.type === 'GENERATE_TITLE') {
    handleEnhance({ ...message.data, action: 'title' }).then(sendResponse);
    return true;
  }
  if (message.type === 'EXECUTE_IN_MAIN_WORLD') {
    executeInMainWorld(sender.tab.id, message.data).then(sendResponse);
    return true;
  }
});

// === Core Logic ===

async function handleEnhance({ action, segments, currentTitle }) {
  const data = await chrome.storage.sync.get(['model', 'provider', 'keys']);
  const model = data.model || data.provider || 'gemini';
  const config = MODELS[model];
  if (!config) return { error: `Unknown model: ${model}` };

  const apiKey = (data.keys || {})[config.provider];
  if (!apiKey) return { error: 'No API key configured. Click the extension icon to set one up.' };

  const resolved = await resolveSegments(segments, currentTitle);
  if (resolved.length === 0) return { error: 'No content to generate from.' };

  const prompt = action === 'both' ? BOTH_PROMPT : action === 'content' ? CONTENT_PROMPT : TITLE_PROMPT;

  const imageCount = resolved.filter(s => s.type === 'image').length;

  try {
    const CALLERS = { gemini: callGemini, claude: callClaude, gpt: callGPT };
    const raw = await CALLERS[config.provider](apiKey, prompt, resolved, action, config);

    if (action === 'both') {
      const result = parseBothResult(raw);
      if (result.content) result.content = ensureImagePlaceholders(result.content, imageCount);
      return result;
    }
    if (action === 'content') return { content: ensureImagePlaceholders(raw, imageCount) };
    return { title: raw };
  } catch (e) {
    return { error: e.message || 'API call failed' };
  }
}

async function resolveSegments(segments, currentTitle) {
  const resolved = [];
  if (currentTitle) resolved.push({ type: 'text', value: `Current title: ${currentTitle}\n\n` });

  for (const seg of (segments || [])) {
    if (seg.type === 'text') {
      resolved.push({ type: 'text', value: seg.value.substring(0, 8000) });
    } else if (seg.type === 'image') {
      const img = await fetchImageAsBase64(seg.url).catch(() => null);
      if (img) resolved.push({ type: 'image', ...img });
    }
  }
  return resolved;
}

function ensureImagePlaceholders(text, imageCount) {
  if (imageCount === 0) return text;

  // Count how many [IMAGE_N] placeholders already exist
  const existing = new Set();
  for (const m of text.matchAll(/\[IMAGE_(\d+)\]/g)) existing.add(parseInt(m[1]));

  // All placeholders present — nothing to do
  if (existing.size >= imageCount) return text;

  // Build missing placeholders
  const missing = [];
  for (let i = 1; i <= imageCount; i++) {
    if (!existing.has(i)) missing.push(`\n[IMAGE_${i}]`);
  }

  // Insert at end of Visual Context section if it exists, otherwise append at end
  const vcHeader = /^## Visual Context$/m;
  const nextSection = /^## /gm;

  if (vcHeader.test(text)) {
    // Find the next ## header after Visual Context
    const vcStart = text.match(vcHeader).index;
    nextSection.lastIndex = vcStart + 1;
    let insertAt = text.length;
    let match;
    while ((match = nextSection.exec(text)) !== null) {
      if (match.index > vcStart + 20) { insertAt = match.index - 1; break; }
    }
    return text.slice(0, insertAt) + '\n' + missing.join('\n') + '\n' + text.slice(insertAt);
  }

  // No Visual Context section — append at end
  return text + '\n' + missing.join('\n');
}

function parseBothResult(raw) {
  const title = raw.match(/^TITLE:\s*(.+)/m)?.[1]?.trim() || null;
  const content = raw.split(/---CONTENT---/)[1]?.trim() || null;
  if (!title && !content) return { error: 'Could not parse response' };
  return { title, content };
}

// === ProseMirror Injection ===

async function executeInMainWorld(tabId, { newText }) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (text) => {
        try {
          const el = document.querySelector('[aria-label="Issue description"]');
          const view = el?.pmView;
          if (!view) return;

          const { state } = view;
          const { schema } = state;
          const imageType = schema.nodes.image;

          // Save existing images
          const savedImages = [];
          state.doc.descendants((node) => {
            if (node.type.name === 'image') savedImages.push(JSON.parse(JSON.stringify(node.attrs)));
          });

          // Parse inline marks: **bold** and _italic_
          function parseInline(str) {
            const parts = [];
            const re = /(\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*)/g;
            let last = 0;
            let m;
            while ((m = re.exec(str)) !== null) {
              if (m.index > last) parts.push(schema.text(str.slice(last, m.index)));
              const boldText = m[2] || m[3];
              const italicText = m[4] || m[5];
              if (boldText && schema.marks.strong) {
                parts.push(schema.text(boldText, [schema.marks.strong.create()]));
              } else if (boldText && schema.marks.bold) {
                parts.push(schema.text(boldText, [schema.marks.bold.create()]));
              } else if (italicText && schema.marks.em) {
                parts.push(schema.text(italicText, [schema.marks.em.create()]));
              } else {
                parts.push(schema.text(m[0]));
              }
              last = m.index + m[0].length;
            }
            if (last < str.length) parts.push(schema.text(str.slice(last)));
            return parts.length > 0 ? parts : [schema.text(str)];
          }

          function makeParagraph(str) {
            const content = str ? parseInline(str) : [];
            return schema.nodes.paragraph.create(null, content.length > 0 ? content : null);
          }

          const lines = text.split('\n');
          const newNodes = [];
          const usedImages = new Set();
          let i = 0;

          while (i < lines.length) {
            const line = lines[i];
            const trimmed = line.trim();

            // [IMAGE_N] placeholder
            const imgMatch = trimmed.match(/^\[IMAGE_(\d+)\]$/);
            if (imgMatch && imageType) {
              const idx = parseInt(imgMatch[1]) - 1;
              if (idx >= 0 && idx < savedImages.length) {
                try { newNodes.push(imageType.create(savedImages[idx])); usedImages.add(idx); } catch {}
              }
              i++;
              continue;
            }

            // ## Heading
            const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
            if (headingMatch && schema.nodes.heading) {
              const level = headingMatch[1].length;
              const content = parseInline(headingMatch[2]);
              try {
                newNodes.push(schema.nodes.heading.create({ level }, content));
              } catch {
                newNodes.push(makeParagraph(headingMatch[2]));
              }
              i++;
              continue;
            }

            // Consecutive bullet list items: - item
            if (trimmed.match(/^[-*]\s+/)) {
              const items = [];
              while (i < lines.length && lines[i].trim().match(/^[-*]\s+/)) {
                const itemText = lines[i].trim().replace(/^[-*]\s+/, '');
                const itemContent = makeParagraph(itemText);
                if (schema.nodes.list_item) {
                  try { items.push(schema.nodes.list_item.create(null, itemContent)); } catch {
                    items.push(itemContent);
                  }
                } else {
                  newNodes.push(makeParagraph('• ' + itemText));
                }
                i++;
              }
              if (items.length > 0 && schema.nodes.bullet_list) {
                try { newNodes.push(schema.nodes.bullet_list.create(null, items)); } catch {
                  items.forEach(item => newNodes.push(item));
                }
              } else if (items.length > 0) {
                items.forEach(item => newNodes.push(item));
              }
              continue;
            }

            // Empty line → empty paragraph
            if (!trimmed) {
              newNodes.push(makeParagraph(''));
              i++;
              continue;
            }

            // Regular paragraph
            newNodes.push(makeParagraph(trimmed));
            i++;
          }

          // Append unplaced images at the end
          const unplaced = savedImages.filter((_, i) => !usedImages.has(i));
          if (imageType && unplaced.length > 0) {
            newNodes.push(makeParagraph(''));
            for (const attrs of unplaced) {
              try { newNodes.push(imageType.create(attrs)); } catch {}
            }
          }

          const tr = state.tr;
          tr.replaceWith(0, state.doc.content.size, newNodes);
          view.dispatch(tr);
        } catch (e) {
          console.error('[LinearAI] ProseMirror injection error:', e);
        }
      },
      args: [newText],
    });
    return { success: true };
  } catch (e) {
    return { error: e.message };
  }
}

// === Image Handling ===

const MAX_IMAGE_DIMENSION = 1568;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

async function fetchImageAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) return null;
  const blob = await response.blob();

  try {
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale));
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    let quality = 0.85;
    let out = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    while (out.size > MAX_IMAGE_BYTES && quality > 0.3) {
      quality -= 0.15;
      out = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    }
    return { base64: await blobToBase64(out), mimeType: 'image/jpeg' };
  } catch {
    return { base64: await blobToBase64(blob), mimeType: blob.type || 'image/png' };
  }
}

async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

// === Provider Adapters ===

async function callGemini(apiKey, systemPrompt, segments, action) {
  const parts = segments.map(seg =>
    seg.type === 'text' ? { text: seg.value } : { inlineData: { mimeType: seg.mimeType, data: seg.base64 } }
  );

  const data = await postJSON(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts }],
      generationConfig: { maxOutputTokens: maxTokens(action), thinkingConfig: { thinkingLevel: 'medium' } },
    }
  );
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || throwErr('No text in Gemini response');
}

async function callClaude(apiKey, systemPrompt, segments, action, config) {
  const content = segments.map(seg =>
    seg.type === 'text' ? { type: 'text', text: seg.value } : { type: 'image', source: { type: 'base64', media_type: seg.mimeType, data: seg.base64 } }
  );

  const body = {
    model: config.apiModel,
    max_tokens: maxTokens(action) + (config.maxTokensPad || 0),
    system: systemPrompt,
    thinking: config.thinking,
    messages: [{ role: 'user', content }],
  };
  if (config.effort) body.output_config = { effort: config.effort };

  const data = await postJSON('https://api.anthropic.com/v1/messages', body, {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true',
  });
  return data.content?.find(b => b.type === 'text')?.text?.trim() || throwErr('No text in Claude response');
}

async function callGPT(apiKey, systemPrompt, segments, action) {
  const content = segments.map(seg =>
    seg.type === 'text' ? { type: 'text', text: seg.value } : { type: 'image_url', image_url: { url: `data:${seg.mimeType};base64,${seg.base64}` } }
  );

  const data = await postJSON('https://api.openai.com/v1/chat/completions', {
    model: 'gpt-5-mini',
    max_completion_tokens: maxTokens(action) + 200,
    reasoning_effort: 'medium',
    messages: [{ role: 'developer', content: systemPrompt }, { role: 'user', content }],
  }, { Authorization: `Bearer ${apiKey}` });
  return data.choices?.[0]?.message?.content?.trim() || throwErr('No text in GPT response');
}

// === Utilities ===

async function postJSON(url, body, extraHeaders = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

function throwErr(msg) { throw new Error(msg); }
