// === SVG Icons ===

// Sparkle — title generation
const SPARKLE_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 1C6 1 6.5 3.5 7 4.5C7.5 5.5 9 6 9 6C9 6 7.5 6.5 7 7.5C6.5 8.5 6 11 6 11C6 11 5.5 8.5 5 7.5C4.5 6.5 3 6 3 6C3 6 4.5 5.5 5 4.5C5.5 3.5 6 1 6 1Z"/>
  <path d="M11.5 7C11.5 7 11.8 8.5 12.1 9C12.4 9.5 13.5 10 13.5 10C13.5 10 12.4 10.5 12.1 11C11.8 11.5 11.5 13 11.5 13C11.5 13 11.2 11.5 10.9 11C10.6 10.5 9.5 10 9.5 10C9.5 10 10.6 9.5 10.9 9C11.2 8.5 11.5 7 11.5 7Z" opacity="0.7"/>
  <path d="M12 2C12 2 12.2 3 12.4 3.3C12.6 3.6 13.5 4 13.5 4C13.5 4 12.6 4.4 12.4 4.7C12.2 5 12 6 12 6C12 6 11.8 5 11.6 4.7C11.4 4.4 10.5 4 10.5 4C10.5 4 11.4 3.6 11.6 3.3C11.8 3 12 2 12 2Z" opacity="0.5"/>
</svg>`;

// Wand — content enhancement
const WAND_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M2.5 13.5L6.5 9.5M2.5 13.5L1 15L0.5 14.5L2 13L2.5 13.5Z" stroke="currentColor" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M6.5 9.5L9 7L10 8L7.5 10.5L6.5 9.5Z" fill="currentColor"/>
  <path d="M9 7L11.5 4.5C12 4 12.8 4 13.3 4.5C13.8 5 13.8 5.8 13.3 6.3L10.8 8.8L9 7Z" fill="currentColor" opacity="0.8"/>
  <path d="M12 1L12.4 2.6L14 3L12.4 3.4L12 5L11.6 3.4L10 3L11.6 2.6L12 1Z" fill="currentColor" opacity="0.6"/>
  <path d="M5 2L5.3 3L6.3 3.3L5.3 3.6L5 4.6L4.7 3.6L3.7 3.3L4.7 3L5 2Z" fill="currentColor" opacity="0.5"/>
</svg>`;

// Double sparkle — enhance both
const BOTH_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M4 1C4 1 4.4 2.8 4.8 3.5C5.2 4.2 6.5 4.8 6.5 4.8C6.5 4.8 5.2 5.4 4.8 6.1C4.4 6.8 4 8.6 4 8.6C4 8.6 3.6 6.8 3.2 6.1C2.8 5.4 1.5 4.8 1.5 4.8C1.5 4.8 2.8 4.2 3.2 3.5C3.6 2.8 4 1 4 1Z"/>
  <path d="M10.5 5C10.5 5 10.9 6.8 11.3 7.5C11.7 8.2 13 8.8 13 8.8C13 8.8 11.7 9.4 11.3 10.1C10.9 10.8 10.5 12.6 10.5 12.6C10.5 12.6 10.1 10.8 9.7 10.1C9.3 9.4 8 8.8 8 8.8C8 8.8 9.3 8.2 9.7 7.5C10.1 6.8 10.5 5 10.5 5Z"/>
  <path d="M10 1.5L10.3 2.8L11.5 3.2L10.3 3.6L10 4.9L9.7 3.6L8.5 3.2L9.7 2.8L10 1.5Z" opacity="0.5"/>
  <path d="M3.5 10L3.8 11L4.8 11.3L3.8 11.6L3.5 12.6L3.2 11.6L2.2 11.3L3.2 11L3.5 10Z" opacity="0.5"/>
</svg>`;

// Loading spinner
const SPINNER_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" xmlns="http://www.w3.org/2000/svg">
  <path d="M8 2a6 6 0 1 0 6 6" stroke-linecap="round"/>
</svg>`;

// Success check
const CHECK_SVG = `<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
  <path d="M6.5 11.5L3 8l1-1 2.5 2.5L12 4l1 1-6.5 6.5z"/>
</svg>`;

let pendingRAF = false;

// === Scanning & Injection ===

function scan() {
  // Inject buttons for title elements
  const titles = document.querySelectorAll('[aria-label="Issue title"]:not([data-ltg-injected])');
  titles.forEach(injectTitleButtons);

  // Inject button for description elements
  const descs = document.querySelectorAll('[aria-label="Issue description"]:not([data-ltg-desc-injected])');
  descs.forEach(injectDescButton);
}

function injectTitleButtons(titleEl) {
  titleEl.setAttribute('data-ltg-injected', 'true');
  const parent = titleEl.parentElement;
  if (!parent) return;
  parent.style.position = 'relative';

  // Sparkle button — title only (next to title)
  const titleBtn = createButton(SPARKLE_SVG, 'Generate title with AI', 'ltg-btn ltg-btn-title ltg-btn-inline');
  titleBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleAction('title', titleBtn, titleEl); });
  parent.appendChild(titleBtn);

  // Both button — inject near Linear's native buttons
  injectBothButton(titleEl);
}

function injectBothButton(titleEl) {
  const dialog = titleEl.closest('[role="dialog"]');

  // Find the anchor button to place our "both" button next to
  let anchor;
  if (dialog) {
    // Modal: place to the left of the "Expand" button
    anchor = dialog.querySelector('[aria-label="Expand"]');
  } else {
    // Issue page: place to the left of the "Copy issue URL" button
    anchor = document.querySelector('[aria-label="Copy issue URL"]');
  }

  if (!anchor || anchor.parentElement.querySelector('.ltg-btn-both')) return; // already injected

  const bothBtn = createButton(BOTH_SVG, 'Enhance title & content with AI', 'ltg-btn ltg-btn-both ltg-btn-native');
  bothBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleAction('both', bothBtn, titleEl); });

  anchor.parentElement.insertBefore(bothBtn, anchor);
}

function injectDescButton(descEl) {
  descEl.setAttribute('data-ltg-desc-injected', 'true');
  const parent = descEl.parentElement;
  if (!parent) return;
  parent.style.position = 'relative';

  const contentBtn = createButton(WAND_SVG, 'Enhance content with AI', 'ltg-btn ltg-btn-content');
  contentBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); handleAction('content', contentBtn, null, descEl); });
  parent.appendChild(contentBtn);
}

function createButton(svg, title, className) {
  const btn = document.createElement('button');
  btn.className = className;
  btn.title = title;
  btn.type = 'button';
  btn.innerHTML = svg;
  return btn;
}

// === Core Action Handler ===

async function handleAction(action, btn, titleEl, descElOverride) {
  if (btn.classList.contains('loading')) return;
  const originalSvg = btn.innerHTML;

  // Find elements in context
  const dialog = btn.closest('[role="dialog"]');
  if (!titleEl) titleEl = dialog
    ? dialog.querySelector('[aria-label="Issue title"]')
    : document.querySelector('[aria-label="Issue title"]');
  const descEl = descElOverride || (dialog
    ? dialog.querySelector('[aria-label="Issue description"]')
    : document.querySelector('[aria-label="Issue description"]'));

  // Extract current data
  const currentTitle = titleEl?.innerText?.trim();
  const hasTitle = currentTitle && currentTitle !== 'Issue title';
  const segments = descEl ? extractContentSegments(descEl) : [];
  const hasContent = segments.length > 0;

  // Save original image URLs so we can re-append them after content replacement
  const originalImageUrls = segments.filter(s => s.type === 'image').map(s => s.url);

  // Validate
  if (!hasTitle && !hasContent) {
    showError(btn, originalSvg, 'Add a title or description first');
    return;
  }

  // Set loading
  btn.classList.add('loading');
  btn.innerHTML = SPINNER_SVG;

  try {
    console.log(`[TitleGen] ${action} request:`, { hasTitle, segmentCount: segments.length });

    const response = await chrome.runtime.sendMessage({
      type: 'ENHANCE',
      data: {
        action,
        segments,
        currentTitle: hasTitle ? currentTitle : null,
      },
    });

    console.log(`[TitleGen] ${action} response:`, response);

    if (response?.error) {
      console.error(`[TitleGen] ${action} error:`, response.error);
      showError(btn, originalSvg, response.error);
      return;
    }

    // Apply results
    if ((action === 'title' || action === 'both') && response?.title && titleEl?.isConnected) {
      setEditorContent(titleEl, response.title);
    }
    if ((action === 'content' || action === 'both') && response?.content && descEl?.isConnected) {
      setEditorContentWithImages(descEl, response.content, originalImageUrls);
    }

    // Success flash
    btn.classList.remove('loading');
    btn.classList.add('success');
    btn.innerHTML = CHECK_SVG;
    setTimeout(() => {
      btn.classList.remove('success');
      btn.innerHTML = originalSvg;
    }, 1500);
  } catch (e) {
    console.error(`[TitleGen] ${action} exception:`, e);
    showError(btn, originalSvg, e.message || 'Request failed');
  }
}

// === Editor Helpers ===


async function setEditorContentWithImages(descEl, newText, imageUrls) {
  // CSP blocks inline <script> tags on linear.app, so we use
  // chrome.scripting.executeScript via the background worker to run
  // code in the MAIN world with access to ProseMirror's pmView API.
  try {
    await chrome.runtime.sendMessage({
      type: 'EXECUTE_IN_MAIN_WORLD',
      data: { newText },
    });
    console.log('[TitleGen] MAIN world script executed via background');
  } catch (e) {
    console.error('[TitleGen] MAIN world execution failed, falling back:', e);
    // Fallback: plain text replacement without images
    setEditorContent(descEl, newText);
  }
}

function setEditorContent(el, text) {
  el.focus();
  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(el);
  selection.removeAllRanges();
  selection.addRange(range);
  document.execCommand('insertText', false, text);
}

function showError(btn, originalSvg, message) {
  console.error('[TitleGen] showError:', message);
  btn.classList.remove('loading');
  btn.classList.add('error');
  btn.title = message;
  btn.innerHTML = originalSvg;
  setTimeout(() => {
    btn.classList.remove('error');
    btn.title = btn.getAttribute('data-original-title') || 'Enhance with AI';
  }, 3000);
}

// === Content Extraction ===

function extractContentSegments(descEl) {
  const segments = [];
  let currentText = '';

  function flushText() {
    const trimmed = currentText.trim();
    if (trimmed && trimmed !== 'Add description…' && trimmed !== 'Add description...') {
      segments.push({ type: 'text', value: trimmed });
    }
    currentText = '';
  }

  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      currentText += node.textContent;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const tag = node.tagName;

    if (tag === 'IMG') {
      flushText();
      const src = node.src || node.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        segments.push({ type: 'image', url: src });
      }
      return;
    }

    const isBlock = /^(P|DIV|H[1-6]|LI|UL|OL|BLOCKQUOTE|PRE|HR|BR)$/.test(tag);
    if (isBlock && currentText) currentText += '\n';

    for (const child of node.childNodes) walk(child);

    if (isBlock) currentText += '\n';
  }

  walk(descEl);
  flushText();
  return segments;
}

// === MutationObserver ===

const observer = new MutationObserver(() => {
  if (!pendingRAF) {
    pendingRAF = true;
    requestAnimationFrame(() => {
      pendingRAF = false;
      scan();
    });
  }
});

observer.observe(document.body, { childList: true, subtree: true });
scan();
