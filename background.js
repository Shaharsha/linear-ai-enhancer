// === Prompts (optimized for Claude Haiku 4.5 — budget model needs explicit examples) ===

const TITLE_PROMPT = `You generate concise titles for software issue tickets from descriptions and screenshots.

Rules:
- ALWAYS generate a title. Never refuse, never ask for more info, never explain.
- Start with an action verb: Fix, Add, Update, Implement, Remove, Refactor, Improve, etc.
- Keep under 80 characters.
- Be specific: name the affected component, feature, or behavior.
- If a current title is provided, generate a DIFFERENT, improved version.
- Match the language of the description (Hebrew input → Hebrew title).
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
- Describe any screenshots/images in text within the relevant section — the AI coding agent may not receive the images directly.
- Keep acceptance criteria specific and testable (pass/fail checkable).
- Include 3-7 acceptance criteria. Cover edge cases, not just happy paths.
- Be specific about WHAT and WHY, not about HOW to implement.
- In Problem/Expected Behavior sections, reference screenshots when relevant (e.g. "as shown in Screenshot 1").
- Match the language of the original description.
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
Only include this section if screenshots were provided.
- If there are multiple images, describe each one separately with a clear label.
- Use the placeholder [IMAGE_1], [IMAGE_2], etc. on its own line to indicate where each original image should be placed (in order they appeared in the description).
- Reproduce any visible text EXACTLY as it appears (keep original language, do NOT translate).
- Describe UI elements, layout, colors, icons, states, error messages, data values verbatim.
Skip this section entirely if no screenshots.

Example with 2 images:
## Visual Context

### Screenshot 1
Shows a login form with email and password fields. Error message "שם משתמש או סיסמה שגויים" appears in red below the form.

[IMAGE_1]

### Screenshot 2
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
- Search performance is not degraded by special character handling`;

const BOTH_PROMPT = `You generate BOTH a concise title AND an enhanced description for software issue tickets. The enhanced description must be self-contained and structured for AI coding agents (Claude Code).

Rules:
- ALWAYS produce both title and content. Never refuse, never ask for more info.
- Preserve ALL original information in the description.
- Describe any screenshots/images in text — the AI coding agent may not receive images directly.
- In Problem/Expected Behavior sections, reference screenshots when relevant (e.g. "as shown in Screenshot 1").
- Match the language of the original.
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
Only if screenshots were provided. Describe each image separately with labels. Use [IMAGE_1], [IMAGE_2] etc. placeholders on their own line to indicate where each original image belongs. Reproduce all visible text verbatim in its original language (do NOT translate). Describe UI elements, layout, icons, data values. Skip entirely if none.

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
- Error state allows the user to retry or choose a different file`;

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

async function executeInMainWorld(tabId, { newText }) {
  console.log('[TitleGen BG] executeInMainWorld called, tabId:', tabId, 'textLen:', newText?.length);
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      world: 'MAIN',
      func: (text) => {
        try {
          const el = document.querySelector('[aria-label="Issue description"]');
          const view = el?.pmView;
          if (!view) { console.error('[TitleGen] No pmView found'); return; }

          const { state } = view;
          const { schema } = state;
          const imageType = schema.nodes.image;

          // Save existing image node attrs
          const savedImages = [];
          state.doc.descendants((node) => {
            if (node.type.name === 'image') {
              savedImages.push(JSON.parse(JSON.stringify(node.attrs)));
            }
          });
          console.log('[TitleGen] Saved ' + savedImages.length + ' images');

          // Build new document: text paragraphs with [IMAGE_N] placeholders replaced by actual images
          const newNodes = [];
          const lines = text.split('\n');
          let usedImageIndices = new Set();

          for (const line of lines) {
            // Check for [IMAGE_N] placeholder
            const imgMatch = line.trim().match(/^\[IMAGE_(\d+)\]$/);
            if (imgMatch && imageType) {
              const imgIndex = parseInt(imgMatch[1]) - 1; // 1-based to 0-based
              if (imgIndex >= 0 && imgIndex < savedImages.length) {
                try {
                  newNodes.push(imageType.create(savedImages[imgIndex]));
                  usedImageIndices.add(imgIndex);
                } catch (e) {
                  console.warn('[TitleGen] Failed to create image node:', e);
                }
              }
            } else if (line.trim()) {
              newNodes.push(schema.nodes.paragraph.create(null, schema.text(line)));
            } else {
              newNodes.push(schema.nodes.paragraph.create());
            }
          }

          // Append any remaining images that weren't placed via placeholders
          if (imageType && savedImages.length > 0) {
            const unplaced = savedImages.filter((_, i) => !usedImageIndices.has(i));
            if (unplaced.length > 0) {
              newNodes.push(schema.nodes.paragraph.create());
              for (const attrs of unplaced) {
                try {
                  newNodes.push(imageType.create(attrs));
                } catch (e) {
                  console.warn('[TitleGen] Failed to create image node:', e);
                }
              }
            }
          }

          // Replace entire document via one transaction
          const tr = state.tr;
          tr.replaceWith(0, state.doc.content.size, newNodes);
          view.dispatch(tr);
          console.log('[TitleGen] Replaced with ' + newNodes.length + ' nodes (' + savedImages.length + ' images preserved)');
        } catch (e) {
          console.error('[TitleGen] MAIN world script error:', e);
        }
      },
      args: [newText],
    });
    console.log('[TitleGen BG] executeScript results:', results);
    return { success: true };
  } catch (e) {
    console.error('[TitleGen BG] executeScript failed:', e.message, e.stack);
    return { error: e.message };
  }
}

async function handleEnhance({ action, segments, currentTitle }) {
  console.log(`[TitleGen BG] ${action} request:`, { segmentCount: segments?.length, currentTitle });

  const data = await chrome.storage.sync.get(['provider', 'keys']);
  const provider = data.provider || 'gemini';
  const apiKey = (data.keys || {})[provider];

  if (!apiKey) {
    return { error: 'No API key configured. Click the extension icon to set one up.' };
  }

  // Resolve segments: fetch images as base64, preserve order
  const resolvedSegments = [];
  if (currentTitle) {
    resolvedSegments.push({ type: 'text', value: `Current title: ${currentTitle}\n\n` });
  }

  for (const seg of (segments || [])) {
    if (seg.type === 'text') {
      resolvedSegments.push({ type: 'text', value: seg.value.substring(0, 8000) });
    } else if (seg.type === 'image') {
      try {
        console.log('[TitleGen BG] Fetching image:', seg.url.substring(0, 80));
        const img = await fetchImageAsBase64(seg.url);
        if (img) {
          console.log('[TitleGen BG] Image fetched:', img.mimeType, Math.round(img.base64.length / 1024) + 'KB');
          resolvedSegments.push({ type: 'image', ...img });
        }
      } catch (e) {
        console.error('[TitleGen BG] Image fetch failed:', e.message);
      }
    }
  }

  if (resolvedSegments.length === 0) {
    return { error: 'No content to generate from.' };
  }

  // Select prompt based on action
  const prompt = action === 'both' ? BOTH_PROMPT : action === 'content' ? CONTENT_PROMPT : TITLE_PROMPT;

  try {
    console.log(`[TitleGen BG] Calling ${provider} for ${action}`);
    let rawResult;
    switch (provider) {
      case 'gemini': rawResult = await callGemini(apiKey, prompt, resolvedSegments, action); break;
      case 'claude': rawResult = await callClaude(apiKey, prompt, resolvedSegments, action); break;
      case 'gpt': rawResult = await callGPT(apiKey, prompt, resolvedSegments, action); break;
      default: return { error: `Unknown provider: ${provider}` };
    }

    if (action === 'both') {
      return parseBothResult(rawResult);
    } else if (action === 'content') {
      return { content: rawResult };
    } else {
      return { title: rawResult };
    }
  } catch (e) {
    console.error(`[TitleGen BG] ${action} failed:`, e.message);
    return { error: e.message || 'API call failed' };
  }
}

function parseBothResult(raw) {
  const titleMatch = raw.match(/^TITLE:\s*(.+)/m);
  const contentSplit = raw.split(/---CONTENT---/);

  const title = titleMatch ? titleMatch[1].trim() : null;
  const content = contentSplit.length > 1 ? contentSplit[1].trim() : null;

  if (!title && !content) {
    return { error: 'Could not parse response' };
  }
  return { title, content };
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
    const { width, height } = bitmap;
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(width, height));
    const newW = Math.round(width * scale);
    const newH = Math.round(height * scale);

    const canvas = new OffscreenCanvas(newW, newH);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0, newW, newH);
    bitmap.close();

    let quality = 0.85;
    let outputBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    while (outputBlob.size > MAX_IMAGE_BYTES && quality > 0.3) {
      quality -= 0.15;
      outputBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
    }

    console.log(`[TitleGen BG] Resized ${width}x${height} → ${newW}x${newH}, q=${quality.toFixed(2)}, ${Math.round(outputBlob.size / 1024)}KB`);

    return { base64: await blobToBase64(outputBlob), mimeType: 'image/jpeg' };
  } catch (e) {
    console.warn('[TitleGen BG] Resize failed, sending raw:', e.message);
    return { base64: await blobToBase64(blob), mimeType: blob.type || 'image/png' };
  }
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// === Provider Adapters ===

function buildMaxTokens(action) {
  return action === 'title' ? 1000 : 16000;
}

// --- Gemini 3 Flash ---
async function callGemini(apiKey, systemPrompt, segments, action) {
  const parts = [];
  for (const seg of segments) {
    if (seg.type === 'text') parts.push({ text: seg.value });
    else if (seg.type === 'image') parts.push({ inlineData: { mimeType: seg.mimeType, data: seg.base64 } });
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts }],
        generationConfig: {
          maxOutputTokens: buildMaxTokens(action),
          thinkingConfig: { thinkingLevel: 'medium' },
        },
      }),
    }
  );

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error('No text in Gemini response');
  return text;
}

// --- Claude Haiku 4.5 ---
async function callClaude(apiKey, systemPrompt, segments, action) {
  const content = [];
  for (const seg of segments) {
    if (seg.type === 'text') content.push({ type: 'text', text: seg.value });
    else if (seg.type === 'image') content.push({ type: 'image', source: { type: 'base64', media_type: seg.mimeType, data: seg.base64 } });
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: buildMaxTokens(action) + 12000,
      system: systemPrompt,
      thinking: { type: 'enabled', budget_tokens: 10000 },
      messages: [{ role: 'user', content }],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  // With thinking enabled, response has thinking blocks then text blocks — find the text block
  const textBlock = data.content?.find(b => b.type === 'text');
  const text = textBlock?.text?.trim();
  if (!text) throw new Error('No text in Claude response');
  return text;
}

// --- GPT 5 Mini ---
async function callGPT(apiKey, systemPrompt, segments, action) {
  const userContent = [];
  for (const seg of segments) {
    if (seg.type === 'text') userContent.push({ type: 'text', text: seg.value });
    else if (seg.type === 'image') userContent.push({ type: 'image_url', image_url: { url: `data:${seg.mimeType};base64,${seg.base64}` } });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-5-mini',
      max_completion_tokens: buildMaxTokens(action) + 200,
      reasoning_effort: 'medium',
      messages: [
        { role: 'developer', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    }),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error('No text in GPT response');
  return text;
}
