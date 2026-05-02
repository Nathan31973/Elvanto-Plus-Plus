console.log("Evanto Live Plus Plus By Nathan3197");
console.log("Current URL:", window.location.href);
console.log("Window.Live:", window.Live);

// Global state variables
let hideSlashCommands = false;
let hideGifPreviews = false;
let notificationsEnabled = false;
let lastRefreshTime = null;
let useLocalTimestamp = false;

if (window.location.href.match(/^https:\/\/.*\.elvanto\.com\.au\/live\//)) {
  console.log("Elvanto live page matched!");
} else {
  console.log("Not matching Elvanto live page.");
}

// ────────────────────────────────────────────────
// GIF Browser Functions (unchanged)
// ────────────────────────────────────────────────

function injectGifBrowserCSS() {
  const css = `
    #gif-browser-btn {
      position: absolute;
      top: 4px;
      right: 58px;
      width: 50px;
      height: 31px;
      background: #5865f2;
      color: white;
      border: none;
      border-radius: 3px;
      font-weight: bold;
      cursor: pointer;
    }
    #gif-browser-btn:hover { background: #4a54c9; }

    .chat .input textarea { padding-right: 112px !important; }

    #gif-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 10001;
      background: rgba(0,0,0,0.75);
      overflow: auto;
    }

    #gif-modal-content {
      position: relative;           /* ← THIS FIXES THE CLOSE BUTTON */
      background: #36393f;
      margin: 8% auto;
      padding: 20px 20px 20px 20px;
      border: 1px solid #202225;
      width: 90%;
      max-width: 640px;
      border-radius: 8px;
      color: white;
      box-shadow: 0 8px 25px rgba(0,0,0,0.6);
    }

    #gif-modal-close {
      position: absolute;
      top: 12px;
      right: 18px;
      font-size: 32px;
      font-weight: bold;
      color: #b9bbbe;
      cursor: pointer;
      line-height: 1;
      z-index: 1;
    }
    #gif-modal-close:hover { color: #ffffff; }

    #gif-search-container { display: flex; margin-bottom: 20px; }

    #gif-search-input {
      flex: 1;
      padding: 10px;
      border-radius: 3px;
      border: 1px solid #202225;
      background: #40444b;
      color: #dcddde;
      font-size: 16px;
    }

    #gif-results {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
      max-height: 55vh;
      overflow-y: auto;
      padding-right: 5px;
    }

    #gif-results::-webkit-scrollbar { width: 8px; }
    #gif-results::-webkit-scrollbar-track { background: #2e3338; }
    #gif-results::-webkit-scrollbar-thumb { background: #202225; border-radius: 4px; }

    #gif-results img {
      width: 100%;
      height: 110px;
      object-fit: cover;
      cursor: pointer;
      border-radius: 4px;
      background: #202225;
      transition: transform 0.2s;
    }
    #gif-results img:hover { transform: scale(1.05); }

    .gif-loading-text { color: #b9bbbe; }
  `;
  const style = document.createElement("style");
  style.innerText = css;
  document.head.appendChild(style);
}

async function fetchAndDisplayGifs(query = 'trending') {
  const container = document.getElementById('gif-results');
  if (!container) return;
  container.innerHTML = '<p class="gif-loading-text">Loading GIFs...</p>';

  const API_KEY = 'ENTERYOUAPIKEY';
  const CLIENT_KEY = 'ENTERYOURCLIENTKEY';
  const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${API_KEY}&client_key=${CLIENT_KEY}&limit=100`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    container.innerHTML = '';

    if (data.results?.length > 0) {
      data.results.forEach(gif => {
        const img = document.createElement('img');
        img.src = gif.media_formats.tinygif.url;
        img.dataset.gifUrl = gif.media_formats.gif.url;
        img.alt = gif.content_description;
        img.title = gif.content_description;
        container.appendChild(img);
      });
    } else {
      container.innerHTML = '<p class="gif-loading-text">No GIFs found.</p>';
    }
  } catch (err) {
    console.error('Tenor fetch error:', err);
    container.innerHTML = '<p class="gif-loading-text">Could not load GIFs.</p>';
  }
}

function createGifBrowser() {
  if (document.getElementById('gif-modal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="gif-modal">
      <div id="gif-modal-content">
        <span id="gif-modal-close">×</span>
        <h2>GIF Browser</h2>
        <div id="gif-search-container">
          <input type="text" id="gif-search-input" placeholder="Search Tenor GIFs..." />
        </div>
        <div id="gif-results"></div>
      </div>
    </div>
  `);

  const modal = document.getElementById('gif-modal');

  document.getElementById('gif-browser-btn').onclick = () => {
    modal.style.display = 'block';
    document.getElementById('gif-search-input').focus();
    fetchAndDisplayGifs('trending');
  };

  document.getElementById('gif-modal-close').onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  let timeout;
  document.getElementById('gif-search-input').onkeyup = e => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fetchAndDisplayGifs(e.target.value.trim() || 'trending'), 500);
  };

  document.getElementById('gif-results').onclick = e => {
    const img = e.target.closest('img');
    if (img?.dataset.gifUrl) {
      const ta = document.querySelector('textarea[name="chat_text"]');
      if (ta) ta.value = img.dataset.gifUrl;
      modal.style.display = 'none';
    }
  };
}

// ────────────────────────────────────────────────
// Emoji Browser CSS
// ────────────────────────────────────────────────

function injectEmojiBrowserCSS() {
  const css = `
    #emoji-browser-btn {
      position: absolute;
      top: 4px;
      right: 112px;
      width: 50px;
      height: 31px;
      background: #5865f2;
      color: white;
      border: none;
      border-radius: 3px;
      font-weight: bold;
      cursor: pointer;
    }
    #emoji-browser-btn:hover { background: #4a54c9; }

    .chat .input textarea { padding-right: 164px !important; }

    #emoji-modal {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 10002;
      background: rgba(0,0,0,0.75);
      overflow: auto;
    }

    #emoji-modal-content {
      position: relative;           /* ← THIS FIXES THE CLOSE BUTTON */
      background: #36393f;
      margin: 8% auto;
      padding: 20px 20px 20px 20px;
      border: 1px solid #202225;
      width: 90%;
      max-width: 640px;
      border-radius: 8px;
      color: white;
      box-shadow: 0 8px 25px rgba(0,0,0,0.6);
    }

    #emoji-modal-close {
      position: absolute;
      top: 12px;
      right: 18px;
      font-size: 32px;
      font-weight: bold;
      color: #b9bbbe;
      cursor: pointer;
      line-height: 1;
      z-index: 1;
    }
    #emoji-modal-close:hover { color: #ffffff; }

    #emoji-search-container { display: flex; margin-bottom: 15px; }

    #emoji-search-input {
      flex: 1;
      padding: 10px;
      border-radius: 3px;
      border: 1px solid #202225;
      background: #40444b;
      color: #dcddde;
      font-size: 16px;
    }

    #refresh-emoji-cache {
      margin-left: 10px;
      padding: 8px 12px;
      background: #5865f2;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    #emoji-results {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
      max-height: 55vh;
      overflow-y: auto;
      padding-right: 5px;
    }

    #emoji-results::-webkit-scrollbar { width: 8px; }
    #emoji-results::-webkit-scrollbar-track { background: #2e3338; }
    #emoji-results::-webkit-scrollbar-thumb { background: #202225; border-radius: 4px; }

    #emoji-results div {
      text-align: center;
      cursor: pointer;
      padding: 10px;
      border-radius: 4px;
      background: #202225;
      transition: transform 0.2s;
    }
    #emoji-results div:hover { transform: scale(1.05); }

    #emoji-results img {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }

    .emoji-loading-text { color: #b9bbbe; }

    .embedded-emoji {
      width: 32px !important;
      height: 32px !important;
      vertical-align: middle;
      margin: 0 3px;
      object-fit: contain;
      display: inline-block;
    }
  `;
  const style = document.createElement("style");
  style.innerText = css;
  document.head.appendChild(style);
}

// ─── Cache Helpers ──────────────────────────────────────

async function getCachedEmojiData() {
  return new Promise(r => chrome.storage.local.get('emojiCache', d => r(d.emojiCache || null)));
}

async function saveEmojiCache(data) {
  return new Promise(r => chrome.storage.local.set({ emojiCache: data }, r));
}

let allEmojis = null;
let emojiMap = {};
let customEmojiMap = {};   // NEW: GitHub custom emojis (slug → direct image URL)
// ────────────────────────────────────────────────
// CUSTOM GITHUB EMOJI INDEX (static JSON - auto-updated by GitHub Action)
// ────────────────────────────────────────────────

async function loadCustomEmojiIndex() {
  const INDEX_URL = 'https://nathan31973.github.io/Elvanto-Plus-Plus-Assets/emoji-index.json';

  try {
    const res = await fetch(INDEX_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.json();

    // Support both old "emojis" and new "assets" key (your GitHub Action uses "assets")
    const emojiData = data.assets || data.emojis || {};

    customEmojiMap = emojiData;

    const emojiList = Object.entries(emojiData).map(([slug, image]) => ({
      slug,
      image,
      title: slug,
      isCustom: true
    }));

    console.log(`✅ Loaded ${emojiList.length} custom emojis from emoji-index.json`);
    return emojiList;
  } catch (err) {
    console.warn('⚠️ Could not load emoji-index.json:', err.message);
    console.warn('Make sure this URL loads correctly:', INDEX_URL);
    return [];
  }
}
// Updated merged loader (emoji.gg + custom index)
// Merged emoji loader with MUCH better search
async function fetchAndDisplayEmojisWithCustom(query = '') {
  const container = document.getElementById('emoji-results');
  if (!container) return;
  container.innerHTML = '<p class="emoji-loading-text">Loading emojis (emoji.gg + custom index)... </p>';

  try {
    // emoji.gg part
    let emojiGgList = [];
    let cached = await getCachedEmojiData();
    if (cached) {
      allEmojis = cached.allEmojis;
      emojiMap = cached.emojiMap;
      emojiGgList = cached.allEmojis || [];
    } else {
      allEmojis = await getEmojisFromApi();
      emojiMap = {};
      allEmojis.forEach(e => { emojiMap[e.slug.toLowerCase()] = e.image; });
      await saveEmojiCache({ allEmojis, emojiMap });
      emojiGgList = allEmojis;
    }

    // Custom emojis from your GitHub index
    const customEmojis = await loadCustomEmojiIndex();

    const merged = [...emojiGgList, ...customEmojis];

    // ── IMPROVED SEARCH LOGIC ──
    let filtered = merged;

    if (query && query.trim() !== '') {
      const q = query.toLowerCase().trim();
      const searchWords = q.split(/\s+/).filter(Boolean);

      filtered = merged
        .filter(e => {
          const text = ((e.title || e.slug || '') + ' ' + (e.slug || '')).toLowerCase();
          return searchWords.every(word => text.includes(word));
        })
        .sort((a, b) => {
          const sa = (a.slug || '').toLowerCase();
          const sb = (b.slug || '').toLowerCase();
          // Exact match first
          if (sa === q) return -1;
          if (sb === q) return 1;
          return sa.localeCompare(sb);
        });
    } else {
      // When no search: show all custom emojis first, then top 300 from emoji.gg
      filtered = [...customEmojis, ...emojiGgList.slice(0, 300)];
    }

    container.innerHTML = '';

    if (filtered.length > 0) {
      filtered.forEach(emoji => {
        const div = document.createElement('div');
        div.innerHTML = `
          <img src="${emoji.image}" alt=":${emoji.slug}:" title=":${emoji.slug}:">
          <p>:${emoji.slug}:</p>
          ${emoji.isCustom ? '<span style="font-size:10px;color:#5865f2;">(custom)</span>' : ''}
        `;
        div.onclick = () => {
          const ta = document.querySelector('textarea[name="chat_text"]');
          if (ta) ta.value += ` :${emoji.slug}: `;
          document.getElementById('emoji-modal').style.display = 'none';
        };
        container.appendChild(div);
      });
    } else {
      container.innerHTML = '<p class="emoji-loading-text">No emojis found for that search.</p>';
    }
  } catch (err) {
    console.error('Emoji load error:', err);
    container.innerHTML = '<p class="emoji-loading-text">Failed to load emojis. Try again.</p>';
  }
}
async function getEmojisFromApi() {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'fetchEmojis' }, response => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError.message);
        return;
      }
      if (response.error) reject(response.error);
      else resolve(response.data);
    });
  });
}

function createEmojiBrowser() {
  if (document.getElementById('emoji-modal')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <div id="emoji-modal">
      <div id="emoji-modal-content">
        <span id="emoji-modal-close">×</span>
        <h2>Emoji Browser</h2>
        <div id="emoji-search-container">
          <input type="text" id="emoji-search-input" placeholder="Search Emojis..." />
          <button id="refresh-emoji-cache">Refresh List</button>
        </div>
        <div id="emoji-results"></div>
        </div>
      </div>
    </div>
  `);

  const modal = document.getElementById('emoji-modal');

  // Use the NEW merged function
  document.getElementById('emoji-browser-btn').onclick = async () => {
    modal.style.display = 'block';
    document.getElementById('emoji-search-input').focus();
    await fetchAndDisplayEmojisWithCustom();
  };

  document.getElementById('emoji-modal-close').onclick = () => modal.style.display = 'none';
  window.onclick = e => { if (e.target === modal) modal.style.display = 'none'; };

  let timeout;
  document.getElementById('emoji-search-input').onkeyup = e => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fetchAndDisplayEmojisWithCustom(e.target.value.trim()), 500);
  };

  document.getElementById('refresh-emoji-cache').onclick = async () => {
    await saveEmojiCache(null); // clear emoji.gg cache only
    allEmojis = null;
    await fetchAndDisplayEmojisWithCustom(document.getElementById('emoji-search-input').value);
    alert('Emoji list refreshed (emoji.gg + GitHub custom emojis)!');
  };
}

async function embedEmojis(messageElement) {
  if (messageElement.dataset.emojisProcessed) return;

  let html = messageElement.innerHTML;

  html = html.replace(/:([\w-]+):/g, (match, name) => {
    const key = name.toLowerCase();
    if (emojiMap[key]) {
      return `<img src="${emojiMap[key]}" alt="${match}" class="embedded-emoji" />`;
    }
    if (customEmojiMap[key]) {
      return `<img src="${customEmojiMap[key]}" alt="${match}" class="embedded-emoji" />`;
    }
    return match;
  });

  messageElement.innerHTML = html;
  messageElement.dataset.emojisProcessed = 'true';
}

// --- End of Emoji Browser Functions ---

function getPersonNameFromPage() {
  const scripts = document.getElementsByTagName('script');
  for (let script of scripts) {
    if (script.textContent.includes('Live.init')) {
      const match = script.textContent.match(/"person_name":"([^"]+)"/);
      if (match) {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("Found person name:", match[1]);
        }
        return match[1];
      }
    }
  }
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Person name not found in scripts");
  }
  return null;
}

// Function to get the controller's name from the UI
function getControllerName() {
  const currentControlElement = document.querySelector('.live-control .current span, .live-control [class*="current"] span');
  if (currentControlElement && currentControlElement.textContent.trim() !== "") {
    const fullText = currentControlElement.textContent.trim();
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Raw controller text:", fullText);
    }
    const match = fullText.match(/^(\w+)/);
    return match ? match[1] : null;
  }
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("No controller name found");
  }
  return null;
}

// Function to check if an element is visible
function isElementVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const visible = style.display !== 'none' && style.visibility !== 'hidden';
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Element visibility check: display=${style.display}, visibility=${style.visibility}, visible=${visible}`);
  }
  return visible;
}

// Function to check if current user is in control
function isCurrentUserInControl() {
  const releaseDiv = document.querySelector('.live-control .release, .live-control [class*="release"]');
  if (!releaseDiv) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("No release div found for control check");
    }
    return false;
  }
  const isVisible = isElementVisible(releaseDiv);
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Is current user in control?", isVisible);
  }
  return isVisible;
}

// Function to check if no one is in control
function isNoOneInControl() {
  const takeControlDiv = document.querySelector('.live-control .take, .live-control [class*="take"]');
  if (!takeControlDiv) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("No take div found for control check");
    }
    return false;
  }
  const isVisible = isElementVisible(takeControlDiv);
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Is no one in control?", isVisible);
  }
  return isVisible;
}

// Function to normalize role names for matching
function normalizeRoleName(role) {
  return role ? role.toLowerCase().replace(/\s+/g, '') : '';
}

// Function to convert a name to Lastname, FirstName format
function toLastnameFirstname(name) {
  if (!name) return '';
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name.trim();
  const firstName = parts[0];
  const lastName = parts[parts.length - 1];
  return `${lastName}, ${firstName}`;
}

// Function to determine if a user can use a feature based on kill switches and permissions
function canUseFeature(featureType, featureName, roles) {
  try {
    // Check kill switch first (highest priority)
    if (!window.isFeatureEnabled || !window.isFeatureEnabled(featureType, featureName)) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Feature ${featureType}:${featureName} disabled by kill switch`);
      }
      return false;
    }

    // Default to empty roles if not provided
    const userRoles = Array.isArray(roles) ? [...roles] : [];
    // Add InControl if applicable
    if (isCurrentUserInControl()) {
      userRoles.push("InControl");
    }
    // Always include Everyone
    userRoles.push("Everyone");

    // Log raw roles, permissions, and localStorage for debugging
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Raw user roles: ${roles ? roles.join(', ') : 'undefined'}`);
      console.log(`Processed user roles: ${userRoles.join(', ')}`);
      console.log(`Available permission roles: ${window.permissions && window.permissions.Roles ? Object.keys(window.permissions.Roles).join(', ') : 'none'}`);
      console.log(`Perspectives structure: ${JSON.stringify(window.permissions, null, 2)}`);
      console.log(`localStorage.elvantoRoles: ${localStorage.getItem('elvantoRoles') || 'empty'}`);
    }

    // Check if permissions are loaded
    if (!window.permissions || !window.permissions.Roles) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.warn(`No permissions loaded for ${featureType}:${featureName}, denying access`);
      }
      return false;
    }

    // Filter roles that exist in permissions and get their priorities
    const validRoles = userRoles.filter(role => window.permissions.Roles[role]);
    if (validRoles.length === 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`No valid roles found for ${featureType}:${featureName}, denying access`);
      }
      return false;
    }

    // Find the role with the highest priority (lowest Priority number)
    const rolePriorities = validRoles.map(role => ({
      role,
      priority: (window.permissions.Roles[role] && window.permissions.Roles[role].Priority) || 99
    }));
    const highestPriorityRole = rolePriorities.reduce((highest, current) =>
      current.priority < highest.priority ? current : highest,
      rolePriorities[0]
    );

    // Check permission for the highest-priority role
    const hasAccess = window.hasPermission(highestPriorityRole.role, featureType, featureName);
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(
        `Permission check for ${featureType}:${featureName}, ` +
        `roles: [${userRoles.join(', ')}], ` +
        `highest priority role: ${highestPriorityRole.role} (priority ${highestPriorityRole.priority}), ` +
        `access: ${hasAccess}`
      );
    }
    return hasAccess;
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error(`Error in canUseFeature(${featureType}, ${featureName}):`, error);
    }
    return false;
  }
}

// Function to correct description styles
function correctDescriptionStyles(elements) {
  elements.forEach(div => {
    if (div.hasAttribute('style')) {
      let styleMap = new Map();
      div.getAttribute('style').split(';').forEach(rule => {
        const [key, value] = rule.split(':').map(s => s.trim());
        if (key && value) styleMap.set(key, value);
      });
      if (styleMap.has('background-color')) {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Removing background-color from div: ${div.textContent.substring(0, 50)}...`);
        }
        styleMap.delete('background-color');
      }
      styleMap.set('color', 'white');
      const newStyle = Array.from(styleMap.entries()).map(([k, v]) => `${k}:${v}`).join(';');
      div.setAttribute('style', newStyle);

      const spans = div.querySelectorAll('span[style]');
      spans.forEach(span => {
        let spanStyleMap = new Map();
        span.getAttribute('style').split(';').forEach(rule => {
          const [key, value] = rule.split(':').map(s => s.trim());
          if (key && value) spanStyleMap.set(key, value);
        });
        if (spanStyleMap.has('color')) {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Removing color from span: ${span.textContent.substring(0, 50)}...`);
          }
          spanStyleMap.delete('color');
        }
        const newSpanStyle = Array.from(spanStyleMap.entries()).map(([k, v]) => `${k}:${v}`).join(';');
        if (newSpanStyle) {
          span.setAttribute('style', newSpanStyle);
        } else {
          span.removeAttribute('style');
        }
      });
    }
  });
}

// Function to find and embed GIF links in chat messages
function embedGifs(messageElement) {
  if (messageElement.dataset.gifsProcessed) {
    return;
  }

  const gifRegex = /(https?:\/\/[^\s"]+\.gif)/gi;

  if (gifRegex.test(messageElement.innerHTML)) {
    try {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Found GIF link in message:", messageElement.textContent);
      }

      // Store original message if not already stored
      if (!messageElement.dataset.originalText) {
        messageElement.dataset.originalText = messageElement.innerHTML;
      }

      if (hideGifPreviews) {
        // Replace entire message with placeholder when hideGifPreviews is enabled
        messageElement.innerHTML = '{Has sent a gif}';
        messageElement.dataset.gifsProcessed = 'true';
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("GIF message replaced with '{Has sent a gif}' due to hideGifPreviews");
        }
      } else {
        // Embed GIF as before
        messageElement.innerHTML = messageElement.innerHTML.replace(gifRegex, (match) => {
          try {
            const url = new URL(match);
            return `<a href="${url.href}" target="_blank" rel="noopener noreferrer" style="text-decoration: none; word-break: break-all;">
              <img src="${url.href}" class="embedded-gif" alt="Embedded GIF" style="display: block; max-width: 250px; max-height: 200px; border-radius: 4px; margin-top: 5px;" />
            </a>`;
          } catch (e) {
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.error("Malformed URL for GIF embedding:", match, e);
            }
            return match;
          }
        });
        messageElement.dataset.gifsProcessed = 'true';
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("GIF embedded in message");
        }
      }
    } catch (error) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("Error in embedGifs:", error);
      }
    }
  }
}

// --- Nickname Functions ---

/**
 * Retrieves nicknames from localStorage.
 * @returns {object} The nicknames object.
 */
function getNicknames() {
  try {
    const nicknames = localStorage.getItem('elvantoPlusPlus_nicknames');
    return nicknames ? JSON.parse(nicknames) : {};
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error getting nicknames from localStorage:", error);
    }
    return {};
  }
}

/**
 * Saves nicknames to localStorage.
 * @param {object} nicknames - The nicknames object to save.
 */
function saveNicknames(nicknames) {
  try {
    localStorage.setItem('elvantoPlusPlus_nicknames', JSON.stringify(nicknames));
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error saving nicknames to localStorage:", error);
    }
  }
}

/**
 * Updates the display name for a user across all their chat messages.
 * @param {string} personId - The user's person ID.
 * @param {string} newNickname - The new nickname to display.
 */
function updateDisplayNameForUser(personId, newNickname) {
  const messages = document.querySelectorAll(`.chat .content ol li[data-person-id="${personId}"]`);
  messages.forEach(message => {
    const nameElement = message.querySelector('.name');
    if (nameElement) {
      const textNode = Array.from(nameElement.childNodes).find(node => node.nodeType === Node.TEXT_NODE);
      if (textNode) {
        // If we haven't stored the original name yet, do it now.
        if (!nameElement.dataset.originalName) {
          const originalName = textNode.textContent.split(' - ')[0]?.trim();
          if (originalName) {
            nameElement.dataset.originalName = originalName;
          }
        }
        // Update the display name
        textNode.textContent = `${newNickname} - `;
      }
    }
  });
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Updated display name for person ${personId} to "${newNickname}"`);
  }
}

/**
 * Processes a /nick command from a message.
 * @param {HTMLElement} messageElement - The div.text element containing the command.
 */
function handleNickCommand(messageElement) {
  const liElement = messageElement.closest('li');
  if (!liElement) return;

  const personId = liElement.dataset.personId;
  const timestamp = parseInt(liElement.dataset.time, 10);
  const messageText = messageElement.textContent.trim();
  const match = messageText.match(/^\/nick\s+(.+)/i);

  if (!personId || !timestamp || !match) return;

  const newNickname = match[1].trim();

  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Processing /nick command for ${personId}: "${newNickname}" at ${timestamp}`);
  }

  const nicknames = getNicknames();
  const currentUserNick = nicknames[personId];

  if (!currentUserNick || timestamp > currentUserNick.timestamp) {
    nicknames[personId] = { nickname: newNickname, timestamp: timestamp };
    saveNicknames(nicknames);
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Saved new nickname for ${personId}: "${newNickname}"`);
    }
    updateDisplayNameForUser(personId, newNickname);
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Ignored older /nick command for ${personId}.`);
    }
  }
}

/**
 * Scans all messages on page load to process /nick commands and apply the latest ones.
 */
function scanAndApplyNicknames() {
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Scanning all messages for /nick commands and applying nicknames.");
  }
  const allMessages = document.querySelectorAll('.chat .content ol div.text');
  const nicknames = getNicknames();
  const personIdsWithNicknames = new Set(Object.keys(nicknames));

  // First pass: find all /nick commands and update the nicknames object if a newer one is found.
  allMessages.forEach(message => {
    const messageText = message.textContent.trim();
    if (messageText.toLowerCase().startsWith('/nick ')) {
      const liElement = message.closest('li');
      if (!liElement) return;

      const personId = liElement.dataset.personId;
      const timestamp = parseInt(liElement.dataset.time, 10);
      const match = messageText.match(/^\/nick\s+(.+)/i);

      if (!personId || !timestamp || !match) return;

      const newNickname = match[1].trim();
      const currentUserNick = nicknames[personId];

      if (!currentUserNick || timestamp > currentUserNick.timestamp) {
        nicknames[personId] = { nickname: newNickname, timestamp: timestamp };
        personIdsWithNicknames.add(personId); // Make sure this person's name gets updated
      }
    }
  });

  // Save the potentially updated nicknames from the scan
  saveNicknames(nicknames);

  // Second pass: apply the correct, latest nicknames to all users who have one.
  personIdsWithNicknames.forEach(personId => {
    if (nicknames[personId]) {
      updateDisplayNameForUser(personId, nicknames[personId].nickname);
    }
  });
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Finished scanning and applying nicknames.");
  }
}

// --- End of Nickname Functions ---

// Function to toggle GIF preview visibility
function toggleGifPreviewVisibility(messages, shouldHide) {
  try {
    messages.forEach(message => {
      const liElement = message.closest('li');
      if (!liElement) return;

      if (shouldHide) {
        if (message.dataset.originalText && /(https?:\/\/[^\s"]+\.gif)/gi.test(message.dataset.originalText)) {
          message.innerHTML = '{Has sent a gif}';
          message.dataset.gifsProcessed = 'true';
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Replaced GIF message with '{Has sent a gif}' for: ${message.textContent.substring(0, 50)}...`);
          }
        }
      } else {
        if (message.dataset.originalText) {
          message.innerHTML = message.dataset.originalText; // Restore original content
          message.dataset.gifsProcessed = '';
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Restored original message content for: ${message.textContent.substring(0, 50)}...`);
          }
          embedGifs(message); // Reprocess for GIF embedding
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Reprocessed GIF embedding for message: ${message.textContent.substring(0, 50)}...`);
          }
        }
      }
    });
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error in toggleGifPreviewVisibility:", error);
    }
  }
}

// Function to toggle slash command visibility
function toggleSlashCommandVisibility(messages, shouldHide) {
  try {
    messages.forEach(message => {
      const messageText = message.textContent.trim();
      const liElement = message.closest('li');
      if (liElement) {
        if (shouldHide && messageText.startsWith('/')) {
          liElement.style.display = 'none';
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Hid slash command message: ${messageText}`);
          }
        } else if (!shouldHide && messageText.startsWith('/')) {
          liElement.style.display = '';
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Showed slash command message: ${messageText}`);
          }
        }
      }
    });
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error in toggleSlashCommandVisibility:", error);
    }
  }
}

// Function to create Refresh button
function createRefreshButton(context) {
  const refreshButton = document.createElement('button');
  refreshButton.type = 'button';
  refreshButton.className = 'btn-refresh';
  refreshButton.textContent = 'Refresh';
  refreshButton.setAttribute('data-live-action', 'custom-refresh');

  refreshButton.addEventListener('click', () => {
    if (canUseFeature("Button", "Refresh", window.elvantoUserRoles)) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Refresh button clicked in ${context}`);
      }
      const confirmed = window.confirm("Are you sure you want to refresh all users web page?");
      if (confirmed) {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Refresh confirmed in ${context}`);
        }
        const chatForm = document.querySelector('.chat-form');
        const chatTextarea = chatForm?.querySelector('textarea[name="chat_text"]');
        if (chatForm && chatTextarea) {
          chatTextarea.value = '/refresh';
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          chatForm.dispatchEvent(submitEvent);
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Sent /refresh to chat");
          }
        } else {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.error("Chat form or textarea not found");
          }
        }
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Refresh canceled in ${context}`);
        }
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Refresh button inactive in ${context}: user lacks permission`);
      }
    }
  });

  return refreshButton;
}

// Function to inject Refresh buttons
function injectRefreshButton(liveControlDiv, context, retries = 3) {
  if (!canUseFeature("Button", "Refresh", window.elvantoUserRoles)) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button disabled by permissions or kill switch in ${context}`);
    }
    return;
  }

  if (!liveControlDiv) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`No live-control div in ${context}, ${retries} retries left`);
    }
    if (retries > 0) {
      setTimeout(() => {
        const retryDiv = document.querySelector(
          context.includes('first')
            ? '.controls-wrapper .live-control'
            : '.overview.content .live-control'
        );
        injectRefreshButton(retryDiv, context, retries - 1);
      }, 500);
    }
    return;
  }

  const currentDiv = liveControlDiv.querySelector('.current, [class*="current"]');
  const takeDiv = liveControlDiv.querySelector('.take, [class*="take"]');
  const releaseDiv = liveControlDiv.querySelector('.release, [class*="release"]');

  if (!currentDiv || !takeDiv) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Missing current=${!!currentDiv}, take=${!!takeDiv} in ${context}, ${retries} retries left`);
    }
    if (retries > 0) {
      setTimeout(() => injectRefreshButton(liveControlDiv, context, retries - 1), 500);
    }
    return;
  }

  // Inject into .current
  if (!currentDiv.querySelector('.btn-refresh')) {
    const refreshButtonCurrent = createRefreshButton(`${context} (current)`);
    currentDiv.appendChild(refreshButtonCurrent);
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button injected in ${context} inside current`);
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button already exists in ${context} inside current`);
    }
  }

  // Inject into .take
  if (!takeDiv.querySelector('.btn-refresh')) {
    const refreshButtonTake = createRefreshButton(`${context} (take)`);
    const takeControlButton = takeDiv.querySelector('button[data-live-action="take-control"]');
    if (takeControlButton && takeControlButton.nextSibling) {
      takeDiv.insertBefore(refreshButtonTake, takeControlButton.nextSibling);
    } else {
      takeDiv.appendChild(refreshButtonTake);
    }
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button injected in ${context} inside take`);
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button already exists in ${context} inside take`);
    }
  }

  // Inject into .release
  if (!releaseDiv.querySelector('.btn-refresh')) {
    const refreshButtonRelease = createRefreshButton(`${context} (release)`);
    const releaseButton = releaseDiv.querySelector('button[data-live-action="release-control"]');
    if (releaseButton && releaseButton.nextSibling) {
      releaseDiv.insertBefore(refreshButtonRelease, releaseButton.nextSibling);
    } else {
      releaseDiv.appendChild(refreshButtonRelease);
    }
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button injected in ${context} inside release`);
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Refresh button already exists in ${context} inside release`);
    }
  }
}

// Function to check if DOM is ready
function isDomReady() {
  const liveControl = document.querySelector('.controls-wrapper .live-control');
  const overviewControl = document.querySelector('.overview.content .live-control');
  const chatContainer = document.querySelector('.chat .content ol');
  const dropdownMenu = document.querySelector('ul.dropdown-menu.dropdown-menu-right');
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`DOM check: liveControl=${!!liveControl}, overviewControl=${!!overviewControl}, chatContainer=${!!chatContainer}, dropdownMenu=${!!dropdownMenu}`);
  }
  return liveControl && overviewControl && chatContainer && dropdownMenu;
}

// Function to request notification permission
function requestNotificationPermission() {
  if (!window.isFeatureEnabled || !window.isFeatureEnabled("Notification")) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Notifications disabled by kill switch");
    }
    return Promise.resolve(false);
  }

  if (!('Notification' in window)) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log('Notification API not supported in this browser');
    }
    return Promise.resolve(false);
  }

  return Notification.requestPermission().then(permission => {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Notification permission status: ${permission}`);
    }
    return permission === 'granted';
  }).catch(err => {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error('Error requesting notification permission:', err);
    }
    return false;
  });
}

// Function to show a notification
function showNotification(title, options) {
  if (!window.isFeatureEnabled || !window.isFeatureEnabled("Notification")) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Notifications disabled by kill switch");
    }
    return;
  }

  if (!('Notification' in window)) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log('Notification API not supported');
    }
    return;
  }

  if (Notification.permission === 'granted' && notificationsEnabled) {
    try {
      new Notification(title, options);
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Notification shown: ${title}`);
      }
    } catch (err) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error('Error showing notification:', err);
      }
    }
  } else if (Notification.permission !== 'denied' && notificationsEnabled) {
    // Request permission if not yet granted or denied
    requestNotificationPermission().then(granted => {
      if (granted) {
        try {
          new Notification(title, options);
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Notification shown after permission granted: ${title}`);
          }
        } catch (err) {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.error('Error showing notification after permission:', err);
          }
        }
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log('Notification permission not granted');
        }
      }
    });
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log('Notifications not shown: permission denied or toggle off');
    }
  }
}

// Function to create Last Refresh element
function createLastRefreshElement(context, retries = 3) {
  if (!window.isFeatureEnabled || !window.isFeatureEnabled("LastRefresh")) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`LastRefresh disabled by kill switch in ${context}`);
    }
    return null;
  }

  const liveControlDiv = document.querySelector(context === 'controls-wrapper' ? '.controls-wrapper .live-control' : '.overview.content .live-control');
  if (!liveControlDiv) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Live control div not found for LastRefresh in ${context}, ${retries} retries left`);
    }
    if (retries > 0) {
      setTimeout(() => createLastRefreshElement(context, retries - 1), 500);
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error(`Failed to find live control div for LastRefresh in ${context} after retries`);
      }
    }
    return null;
  }

  // Check if the element already exists to avoid recreating it
  const existingElement = liveControlDiv.querySelector('.last-refresh');
  if (existingElement) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`LastRefresh element already exists in ${context}`);
    }
    return existingElement;
  }

  const div = document.createElement('div');
  div.className = 'last-refresh';
  div.textContent = `Last Runsheet Update: just now`;

  // Set the initial refresh time if not already set
  if (!lastRefreshTime) {
    lastRefreshTime = new Date();
  }

  // Append to the live-control div
  liveControlDiv.appendChild(div);
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`LastRefresh element created and appended in ${context}`);
  }

  // Start or update timer to keep text updated
  const updateTimestamp = () => {
    const allLastRefreshElements = document.querySelectorAll('.last-refresh');
    allLastRefreshElements.forEach(elem => {
      if (lastRefreshTime) {
        elem.textContent = `Last Runsheet Update: ${timeAgo(lastRefreshTime)}`;
      }
    });
  };

  // Clear any existing interval to prevent duplicates
  if (window.lastRefreshInterval) {
    clearInterval(window.lastRefreshInterval);
  }
  window.lastRefreshInterval = setInterval(updateTimestamp, 60000); // Update every 60 seconds

  return div;
}

function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  
  let interval = seconds / 31536000;
  if (interval > 1) {
    return Math.floor(interval) + " year" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    return Math.floor(interval) + " month" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    return Math.floor(interval) + " day" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    return Math.floor(interval) + " hour" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    return Math.floor(interval) + " minute" + (Math.floor(interval) === 1 ? "" : "s") + " ago";
  }
  if (seconds < 10) {
    return "just now";
  }
  return Math.floor(seconds) + " second" + (Math.floor(seconds) === 1 ? "" : "s") + " ago";
}

// Convert ISO timestamp to local 12-hour clock (11:05 AM)
function updateAllTimestamps() {
  document.querySelectorAll('.timeago').forEach(span => {
    const iso = span.getAttribute('title');
    if (!iso) return;

    // Backup original text the first time we see it
    if (!span.dataset.originalTime) {
      span.dataset.originalTime = span.textContent.trim();
    }

    if (useLocalTimestamp) {
      const date = new Date(iso);
      if (isNaN(date.getTime())) return;

      const formatted = date.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).replace(/am$/i, 'AM').replace(/pm$/i, 'PM');

      span.textContent = formatted;
    } else {
      // Restore original "X minutes ago"
      span.textContent = span.dataset.originalTime || 'just now';
    }
  });
}

// Function to color chat names based on roles
function colorChatNames() {
  if (!window.permissions || !window.permissions.Roles) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.warn("No permissions loaded, cannot color chat names");
    }
    return;
  }

  // Get all chat messages
  const chatMessages = document.querySelectorAll('.chat .content ol li');
  chatMessages.forEach((message) => {
    const nameElement = message.querySelector('.name');
    if (!nameElement) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Name element not found in message");
      }
      return;
    }

    // Use the original name if it's stored, otherwise get it from the text content.
    const nameText = nameElement.dataset.originalName || nameElement.textContent.split(' - ')[0]?.trim();

    if (!nameText) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Could not extract name from message");
      }
      return;
    }

    // Convert chat name to Lastname, FirstName format to match roster
    const normalizedName = toLastnameFirstname(nameText);
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Chat name: ${nameText}, Normalized to: ${normalizedName}`);
    }

    // Get user's roles from roster
    const userRoles = (window.elvantoRoster && window.elvantoRoster[normalizedName]) || [];
    if (userRoles.length === 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`No roles found for user ${normalizedName}, using default color`);
      }
      return;
    }

    // Find the highest priority role with a color
    let selectedRole = null;
    let highestPriority = 100; // Higher than any priority in XML
    let roleColor = null;

    userRoles.forEach((role) => {
      const normalizedRole = normalizeRoleName(role);
      const roleData = window.permissions.Roles[normalizedRole];
      if (roleData && roleData.Priority < highestPriority && roleData.RoleColour) {
        selectedRole = normalizedRole;
        highestPriority = roleData.Priority;
        roleColor = roleData.RoleColour;
      }
    });

    if (roleColor && selectedRole) {
      // Apply the color to the name element
      nameElement.style.color = roleColor;
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Colored name "${normalizedName}" with role ${selectedRole} color ${roleColor}`);
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`No valid role with color found for ${normalizedName}, using default color`);
      }
    }
  });
}

/**
 * Retrieves toggle states from localStorage for a specific user.
 * @param {string} username - The username to namespace the storage key.
 * @returns {object} The toggle states object.
 */
function getToggleStates(username) {
  try {
    const key = `elvantoPlusPlus_toggles_${username}`;
    const states = localStorage.getItem(key);
    return states ? JSON.parse(states) : {};
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error getting toggle states from localStorage:", error);
    }
    return {};
  }
}

/**
 * Saves toggle states to localStorage for a specific user.
 * @param {string} username - The username to namespace the storage key.
 * @param {object} states - The toggle states to save.
 */
function saveToggleStates(username, states) {
  try {
    const key = `elvantoPlusPlus_toggles_${username}`;
    localStorage.setItem(key, JSON.stringify(states));
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Saved toggle states for ${username}:`, states);
    }
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error saving toggle states to localStorage:", error);
    }
  }
}

// Function to inject toggles with retry mechanism
function injectToggles(username, userRoles, retries = 3) {
  const dropdownMenu = document.querySelector('ul.dropdown-menu.dropdown-menu-right');
  if (!dropdownMenu) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Dropdown menu not found for toggle injection, ${retries} retries left`);
    }
    if (retries > 0) {
      setTimeout(() => injectToggles(username, userRoles, retries - 1), 500);
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("Dropdown menu not found after retries, toggles not injected");
      }
    }
    return;
  }

  // Notification toggle
  if ('Notification' in window && canUseFeature("SettingToggle", "Notification", userRoles)) {
    if (!dropdownMenu.querySelector('[data-live-action="toggle-notifications"]')) {
      const notificationItem = document.createElement('li');
      notificationItem.innerHTML = `
        <label class="custom-checkbox-label" data-live-action="toggle-notifications">
          <div class="custom-checkbox${Notification.permission === 'granted' ? ' checked' : ''}">
            <i class="fa fa-check"></i>
          </div>
          Notifications
        </label>
      `;
      dropdownMenu.appendChild(notificationItem);

      const notificationLabel = notificationItem.querySelector('label');
      const checkboxDiv = notificationItem.querySelector('.custom-checkbox');

      // Initialize notificationsEnabled based on checkbox state
      notificationsEnabled = Notification.permission === 'granted' && checkboxDiv.classList.contains('checked');
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Initial notificationsEnabled: ${notificationsEnabled}`);
      }

      notificationLabel.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default dropdown behavior
        const isChecked = checkboxDiv.classList.contains('checked');

        if (!isChecked) {
          // Request permission when enabling
          requestNotificationPermission().then(granted => {
            if (granted) {
              checkboxDiv.classList.add('checked');
              notificationsEnabled = true;
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log("Notifications enabled by user");
              }
            } else {
              checkboxDiv.classList.remove('checked');
              notificationsEnabled = false;
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log("User denied notification permission");
              }
              alert("Notifications were not enabled. You can enable them in your browser settings.");
            }
          });
        } else {
          // Disable notifications
          checkboxDiv.classList.remove('checked');
          notificationsEnabled = false;
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Notifications disabled by user");
          }
          alert("Notifications disabled. You can re-enable them here or in your browser settings.");
        }
      });
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Notification toggle injected");
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Notification toggle already exists");
      }
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Notifications API not supported or disabled by kill switch/permissions");
    }
  }

  // Hide slash commands toggle
  if (canUseFeature("SettingToggle", "HideCommands", userRoles)) {
    if (!dropdownMenu.querySelector('[data-live-action="toggle-hide-slash-commands"]')) {
      const hideSlashItem = document.createElement('li');
      hideSlashItem.innerHTML = `
        <label class="custom-checkbox-label" data-live-action="toggle-hide-slash-commands">
          <div class="custom-checkbox${hideSlashCommands ? ' checked' : ''}">
            <i class="fa fa-check"></i>
          </div>
          Hide Commands In Chat
        </label>
      `;
      dropdownMenu.appendChild(hideSlashItem);

      const hideSlashLabel = hideSlashItem.querySelector('label');
      const hideSlashCheckboxDiv = hideSlashItem.querySelector('.custom-checkbox');

      hideSlashLabel.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default dropdown behavior
        const isChecked = hideSlashCheckboxDiv.classList.contains('checked');

        if (!isChecked) {
          hideSlashCheckboxDiv.classList.add('checked');
          hideSlashCommands = true;
          saveToggleStates(username, { hideSlashCommands: true, hideGifPreviews });
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Hide slash commands enabled");
          }
          // Hide slash commands
          const allMessages = document.querySelectorAll('.chat .content ol div.text');
          toggleSlashCommandVisibility(allMessages, true);
        } else {
          hideSlashCheckboxDiv.classList.remove('checked');
          hideSlashCommands = false;
          saveToggleStates(username, { hideSlashCommands: false, hideGifPreviews });
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Hide slash commands disabled");
          }
          // Show all previously hidden slash commands
          const allMessages = document.querySelectorAll('.chat .content ol div.text');
          toggleSlashCommandVisibility(allMessages, false);
        }
      });
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Hide slash commands toggle injected");
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Hide slash commands toggle already exists");
      }
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("HideCommands toggle disabled by kill switch/permissions");
    }
  }

  // Hide GIF previews toggle
  if (canUseFeature("SettingToggle", "HideGifPreviews", userRoles)) {
    if (!dropdownMenu.querySelector('[data-live-action="toggle-hide-gif-previews"]')) {
      const hideGifItem = document.createElement('li');
      hideGifItem.innerHTML = `
        <label class="custom-checkbox-label" data-live-action="toggle-hide-gif-previews">
          <div class="custom-checkbox${hideGifPreviews ? ' checked' : ''}">
            <i class="fa fa-check"></i>
          </div>
          Hide GIF
        </label>
      `;
      dropdownMenu.appendChild(hideGifItem);

      const hideGifLabel = hideGifItem.querySelector('label');
      const hideGifCheckboxDiv = hideGifItem.querySelector('.custom-checkbox');

      hideGifLabel.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default dropdown behavior
        const isChecked = hideGifCheckboxDiv.classList.contains('checked');

        if (!isChecked) {
          hideGifCheckboxDiv.classList.add('checked');
          hideGifPreviews = true;
          saveToggleStates(username, { hideSlashCommands, hideGifPreviews: true });
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Hide GIF previews enabled");
          }
          // Hide GIF previews in messages
          const allMessages = document.querySelectorAll('.chat .content ol div.text');
          toggleGifPreviewVisibility(allMessages, true);
        } else {
          hideGifCheckboxDiv.classList.remove('checked');
          hideGifPreviews = false;
          saveToggleStates(username, { hideSlashCommands, hideGifPreviews: false });
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Hide GIF previews disabled");
          }
          // Show GIF previews in messages
          const allMessages = document.querySelectorAll('.chat .content ol div.text');
          toggleGifPreviewVisibility(allMessages, false);
        }
      });
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Hide GIF toggle injected");
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Hide GIF toggle already exists");
      }
    }
  } else {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("HideGifPreviews toggle disabled by kill switch/permissions");
    }
  }

    // ── Local Timestamp toggle ──
  if (canUseFeature("SettingToggle", "LocalTimestamp", userRoles)) {
    if (!dropdownMenu.querySelector('[data-live-action="toggle-local-timestamp"]')) {
      const localTimeItem = document.createElement('li');
      localTimeItem.innerHTML = `
        <label class="custom-checkbox-label" data-live-action="toggle-local-timestamp">
          <div class="custom-checkbox${useLocalTimestamp ? ' checked' : ''}">
            <i class="fa fa-check"></i>
          </div>
          Disable message Time Ago
        </label>
      `;
      dropdownMenu.appendChild(localTimeItem);

      const label = localTimeItem.querySelector('label');
      const checkbox = localTimeItem.querySelector('.custom-checkbox');

      label.addEventListener('click', (event) => {
        event.preventDefault();
        const isChecked = checkbox.classList.contains('checked');

        if (!isChecked) {
          checkbox.classList.add('checked');
          useLocalTimestamp = true;
        } else {
          checkbox.classList.remove('checked');
          useLocalTimestamp = false;
        }

        saveToggleStates(username, { hideSlashCommands, hideGifPreviews, useLocalTimestamp });
        updateAllTimestamps();

        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Local timestamp display: ${useLocalTimestamp ? 'ON (clock time)' : 'OFF (time ago)'}`);
        }
      });

      console.log("Local Timestamp toggle injected");
    }
  }
}

// ────────────────────────────────────────────────
// Inject custom toggles into the OFFICIAL Settings panel (cog icon)
// NOW remembers state after refresh (re-loads from localStorage every time)
// ────────────────────────────────────────────────
function injectCustomTogglesIntoSettingsPanel(username, userRoles) {
  const settingsContainer = document.querySelector('.settings');
  if (!settingsContainer) return;

  let injected = false;

  const injectToggles = () => {
    const formGroup = settingsContainer.querySelector('.content .form-group');
    if (!formGroup || injected) return;

    // ←←← FORCE RELOAD latest saved states from localStorage
    const latestStates = getToggleStates(username);
    hideSlashCommands = latestStates.hideSlashCommands || false;
    hideGifPreviews = latestStates.hideGifPreviews || false;
    useLocalTimestamp = latestStates.useLocalTimestamp || false;
    notificationsEnabled = latestStates.notificationsEnabled !== undefined 
      ? latestStates.notificationsEnabled 
      : notificationsEnabled;

    const customToggles = [
      { key: 'notificationsEnabled',     label: 'Notifications',           action: 'toggle-notifications',     perm: canUseFeature("SettingToggle", "Notification", userRoles) },
      { key: 'hideSlashCommands',        label: 'Hide Commands In Chat',   action: 'toggle-hide-slash-commands', perm: canUseFeature("SettingToggle", "HideCommands", userRoles) },
      { key: 'hideGifPreviews',          label: 'Hide GIF Previews',       action: 'toggle-hide-gif-previews',   perm: canUseFeature("SettingToggle", "HideGifPreviews", userRoles) },
      { key: 'useLocalTimestamp',        label: 'Disable message Time Ago',     action: 'toggle-local-timestamp',     perm: canUseFeature("SettingToggle", "LocalTimestamp", userRoles) }
    ];

    customToggles.forEach(t => {
      if (!t.perm) return;
      if (formGroup.querySelector(`[data-live-action="${t.action}"]`)) return;

      const isChecked = window[t.key] || latestStates[t.key] || false;

      const html = `
        <div class="checkbox">
          <label class="custom-checkbox-label" data-live-action="${t.action}">
            <div class="custom-checkbox ${isChecked ? 'checked' : ''}">
              <i class="fa fa-check"></i>
            </div>
            ${t.label}
          </label>
        </div>
      `;

      formGroup.insertAdjacentHTML('beforeend', html);

      // Click handler
      const label = formGroup.querySelector(`[data-live-action="${t.action}"]`);
      label.addEventListener('click', (e) => {
        e.preventDefault();
        const checkbox = label.querySelector('.custom-checkbox');
        const wasChecked = checkbox.classList.contains('checked');

        if (!wasChecked) {
          checkbox.classList.add('checked');
          window[t.key] = true;
        } else {
          checkbox.classList.remove('checked');
          window[t.key] = false;
        }

        // Save to localStorage (same as dropdown)
        saveToggleStates(username, {
          hideSlashCommands,
          hideGifPreviews,
          useLocalTimestamp,
          notificationsEnabled
        });

        // Apply changes live
        if (t.key === 'hideSlashCommands') toggleSlashCommandVisibility(document.querySelectorAll('.chat .content ol div.text'), window[t.key]);
        if (t.key === 'hideGifPreviews') toggleGifPreviewVisibility(document.querySelectorAll('.chat .content ol div.text'), window[t.key]);
        if (t.key === 'useLocalTimestamp') updateAllTimestamps();

        console.log(`[Settings Panel] ${t.label} → ${window[t.key]}`);
      });
    });

    injected = true;
    console.log("✅ Custom toggles added to official Settings panel (state remembered)");
  };

  // Watch for panel changes
  const observer = new MutationObserver(injectToggles);
  observer.observe(settingsContainer, { childList: true, subtree: true });

  // Try immediately and again after a short delay
  setTimeout(injectToggles, 200);
  setTimeout(injectToggles, 800);

  console.log("🔍 Settings panel observer active");
}

// Function to initialize the extension
function initExtension(retries = 10) {
  try {
    if (!window.isFeatureEnabled || !window.isFeatureEnabled("Plugin")) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Plugin disabled by kill switch");
      }
      return;
    }

    if (!isDomReady() && retries > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`DOM not ready, retrying (${retries} left)...`);
      }
      setTimeout(() => initExtension(retries - 1), 500);
      return;
    }
    if (!isDomReady()) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("DOM not ready after retries, exiting");
      }
      return;
    }

    const personName = getPersonNameFromPage();
    if (!personName && retries > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Person name not found, retrying (${retries} left)...`);
      }
      setTimeout(() => initExtension(retries - 1), 500);
      return;
    }
    if (!personName) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("Person name not found after retries, exiting");
      }
      return;
    }
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Current user's name:", personName);
    }

    // Check if roles are loaded
    if (typeof window.elvantoUserRoles === 'undefined' && retries > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Roles not loaded, retrying (${retries} left)...`);
      }
      setTimeout(() => initExtension(retries - 1), 500);
      return;
    }
    if (typeof window.elvantoUserRoles === 'undefined') {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.warn("Roles not loaded after retries, defaulting to empty array");
      }
      window.elvantoUserRoles = [];
    }

    // Ensure roster is initialized
    if (typeof window.elvantoRoster === 'undefined') {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.warn("Roster not loaded, defaulting to empty object");
      }
      window.elvantoRoster = {};
    }

    // Normalize roles to lowercase
    window.elvantoUserRoles = (window.elvantoUserRoles || []).map(normalizeRoleName);
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Normalized user roles:", window.elvantoUserRoles);
      console.log("Roster data:", JSON.stringify(window.elvantoRoster, null, 2));
    }

    const username = personName;
    const nameParts = username.split(' ');
    const firstName = nameParts[0].toLowerCase();
    const lastName = nameParts[nameParts.length - 1].toLowerCase();
    const fullMention = `${firstName}${lastName}`;

    // Load toggle states from localStorage
    const toggleStates = getToggleStates(username);
    hideSlashCommands = toggleStates.hideSlashCommands || false;
    hideGifPreviews = toggleStates.hideGifPreviews || false;
    useLocalTimestamp = toggleStates.useLocalTimestamp || false;
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Loaded toggle states for ${username}: hideSlashCommands=${hideSlashCommands}, hideGifPreviews=${hideGifPreviews}`);
    }

    // Get user's roles and transform them for mentions
    const userRoles = window.elvantoUserRoles;
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("User roles for mentions:", userRoles);
    }
    const roleMentionNames = userRoles;

    // Combine all mention targets: personal, all/everyone, and roles
    const mentionTargets = [];
    if (canUseFeature("Command", "@Everyone", userRoles)) {
      mentionTargets.push('everyone');
    }
    if (canUseFeature("Command", "@All", userRoles)) {
      mentionTargets.push('all');
    }
    if (canUseFeature("Command", "@PersonName", userRoles)) {
      mentionTargets.push(firstName, lastName, fullMention);
    }
    if (canUseFeature("Command", "@RoleName", userRoles)) {
      mentionTargets.push(...roleMentionNames);
    }
    const mentionRegex = mentionTargets.length > 0 ? new RegExp(`\\B@(${mentionTargets.join('|')})\\b`, 'i') : null;
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Mention regex pattern:", mentionRegex);
    }

    // Inject Refresh buttons
    injectRefreshButton(
      document.querySelector('.controls-wrapper .live-control'),
      'first live-control'
    );
    injectRefreshButton(
      document.querySelector('.overview.content .live-control'),
      'overview live-control'
    );

    // --- Inject GIF Browser ---
    const chatForm = document.querySelector('.chat-form');
    if (chatForm && !document.getElementById('gif-browser-btn')) {
      const gifButton = document.createElement('button');
      gifButton.type = 'button';
      gifButton.id = 'gif-browser-btn';
      gifButton.textContent = 'GIF';
      chatForm.appendChild(gifButton);

      createGifBrowser();
      injectGifBrowserCSS();
    }
    // --- End of GIF Browser Injection ---

    // --- Inject Emoji Browser ---
    if (chatForm && !document.getElementById('emoji-browser-btn')) {
      const emojiButton = document.createElement('button');
      emojiButton.type = 'button';
      emojiButton.id = 'emoji-browser-btn';
      emojiButton.textContent = 'Emoji';
      chatForm.appendChild(emojiButton);

      createEmojiBrowser();
      injectEmojiBrowserCSS();
    }
    // --- End of Emoji Browser Injection ---

    // Inject Last Refresh timestamp
    if (window.isFeatureEnabled && window.isFeatureEnabled("LastRefresh")) {
      createLastRefreshElement('controls-wrapper');
      createLastRefreshElement('overview');
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("LastRefresh feature disabled by kill switch");
      }
    }

    // Correct description styles
    const descriptionDivs = document.querySelectorAll('.plan.content .description-description div[style]');
    correctDescriptionStyles(descriptionDivs);

    // Define chatContainer once
    const chatContainer = document.querySelector('.chat .content ol');
    if (!chatContainer) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("Chat container not found for observers");
      }
      return;
    }

    // ─── IMPORTANT: Load emoji cache at startup + re-embed all messages ───
    (async () => {
      try {
        const cached = await getCachedEmojiData();
        if (cached) {
          allEmojis = cached.allEmojis;
          emojiMap = cached.emojiMap;
          console.log(`Emoji cache loaded on startup (${Object.keys(emojiMap).length} emojis ready)`);
        } else {
          console.log("No emoji cache found yet — will fetch when emoji modal is first opened");
        }

        // Also preload custom GitHub emojis (optional but nice)
        await loadCustomEmojiIndex();

        updateAllTimestamps();

        // Re-process ALL existing chat messages so they use the loaded map
        const initialMessages = chatContainer.querySelectorAll('div.text');
        for (const message of initialMessages) {
          embedGifs(message);
          await embedEmojis(message);
        }

        if (hideSlashCommands) {
          toggleSlashCommandVisibility(initialMessages, true);
        }
        if (hideGifPreviews) {
          toggleGifPreviewVisibility(initialMessages, true);
        }
      } catch (err) {
        console.warn("Failed to load or apply emoji cache on startup:", err);
      }
    })();

    // Inject toggles
    injectToggles(username, userRoles);
    injectCustomTogglesIntoSettingsPanel(username, userRoles);

    // Function to check commands and mentions in new messages
    const checkMessagesForCommands = (messages) => {
      try {
        messages.forEach(async (message) => {
          embedGifs(message);
          await embedEmojis(message);
          updateAllTimestamps();
          const messageText = message.textContent.trim();
          const liElement = message.closest('li');
          if (liElement) {
            const senderNameRaw = liElement.querySelector('.name')?.dataset.originalName || 
                                 liElement.querySelector('.name')?.textContent.split(' - ')[0]?.trim();
            if (!senderNameRaw) return;

            const senderName = senderNameRaw.replace(/\s+/g, ' ').trim();
            const senderFirstName = senderName.split(' ')[0];

            if (hideSlashCommands && messageText.startsWith('/')) {
              liElement.style.display = 'none';
            }

            if (canUseFeature("Command", "/nick", window.elvantoUserRoles)) {
              const nickCommandRegex = /^\/nick\s+/i;
              if (nickCommandRegex.test(messageText)) {
                handleNickCommand(message);
              }
            }

            if (messageText.toLowerCase() === "/refresh") {
              const normalizedSender = toLastnameFirstname(senderName);
              const normalizedPerson = personName.replace(/,\s*/g, ' ').trim();

              const senderRoles = window.elvantoRoster?.[normalizedSender] || [];

              if (normalizedSender === toLastnameFirstname(normalizedPerson)) {
                if (canUseFeature("Command", "/refresh", window.elvantoUserRoles)) {
                  lastRefreshTime = new Date();
                  location.reload();
                }
              } else if (canUseFeature("Command", "/refresh", senderRoles)) {
                lastRefreshTime = new Date();
                location.reload();
              } else {
                const controllerFirstName = getControllerName();
                if (controllerFirstName && senderFirstName === controllerFirstName) {
                  lastRefreshTime = new Date();
                  location.reload();
                }
              }
            } else if (mentionRegex && mentionRegex.test(messageText)) {
              message.classList.add('mentioned');
              showNotification(`Mention in Elvanto Live`, {
                body: `${senderName}: ${messageText}`,
                icon: 'https://www.elvanto.com.au/wp-content/themes/elvanto/assets/images/logo.png'
              });
            }
          }
        });
      } catch (error) {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.error("Error in checkMessagesForCommands:", error);
        }
      }
    };

    // === Initial Page Load Processing ===
    colorChatNames();
    scanAndApplyNicknames();

    // === Mutation Observer for new messages ===
    const chatObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'LI') {
              const newMessages = node.querySelectorAll('div.text');
              checkMessagesForCommands(newMessages);
              colorChatNames();
            }
          });
        }
      });
    });

    chatObserver.observe(chatContainer, { childList: true });
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Unified chat message observer started");
    }
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error in initExtension:", error);
    }
  }
}

// Start initialization
const startExtension = async (retries = 10) => {
  try {
    // Initialize roles and roster to avoid undefined
    window.elvantoUserRoles = window.elvantoUserRoles || [];
    window.elvantoRoster = window.elvantoRoster || {};

    if (
      window.elvantoRolesReady &&
      isDomReady() &&
      typeof window.isFeatureEnabled !== 'undefined' &&
      typeof window.killSwitchesLoaded !== 'undefined' &&
      typeof window.hasPermission !== 'undefined' &&
      typeof window.permissionsLoaded !== 'undefined'
    ) {
      try {
        await Promise.all([window.killSwitchesLoaded, window.permissionsLoaded]);
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("Roles, DOM, kill switches, and permissions ready, initializing extension:", window.elvantoUserRoles);
        }
        initExtension();
      } catch (error) {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.error("Error loading kill switches or permissions, initializing with defaults:", error.message);
        }
        initExtension();
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(
          `Waiting for rolesReady=${window.elvantoRolesReady}, ` +
          `DOM=${isDomReady()}, ` +
          `isFeatureEnabled=${typeof window.isFeatureEnabled}, ` +
          `killSwitchesLoaded=${typeof window.killSwitchesLoaded}, ` +
          `hasPermission=${typeof window.hasPermission}, ` +
          `permissionsLoaded=${typeof window.permissionsLoaded}, ` +
          `${retries} retries left...`
        );
      }
      if (retries > 0) {
        setTimeout(() => startExtension(retries - 1), 500);
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.error("Roles, DOM, kill switches, or permissions not ready after retries, initializing with defaults");
        }
        initExtension();
      }
    }
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error in startExtension:", error);
    }
  }
};

startExtension();