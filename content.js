console.log("Evanto Live Plus Plus By Nathan3197");
console.log("Current URL:", window.location.href);
console.log("Window.Live:", window.Live);

if (window.location.href.match(/^https:\/\/.*\.elvanto\.com\.au\/live\//)) {
  console.log("Elvanto live page matched!");
} else {
  console.log("Not matching Elvanto live page.");
}

// --- GIF Browser Functions ---

/**
 * Injects the necessary CSS for the GIF button and browser modal into the document's head.
 */
function injectGifBrowserCSS() {
  const css = `
    /* Style for the new GIF button */
    #gif-browser-btn {
      position: absolute;
      top: 4px;
      right: 58px; /* Positioned to the left of the send button */
      padding: 0;
      text-align: center;
      width: 50px;
      height: 31px;
      background-color: #5865f2; /* A modern, Discord-like color */
      border-color: #5865f2;
      color: #fff;
      border-radius: 3px;
      font-weight: bold;
      cursor: pointer;
      border: none;
    }
    #gif-browser-btn:hover {
        background-color: #4a54c9;
    }

    /* Adjust textarea to make space for both buttons */
    .chat .input textarea {
      padding-right: 112px !important;
    }

    /* Styles for the GIF browser modal */
    #gif-modal {
      display: none; /* Hidden by default */
      position: fixed;
      z-index: 10001; /* High z-index to appear on top */
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      background-color: rgba(0,0,0,0.75);
    }

    #gif-modal-content {
      position: relative;
      background-color: #36393f; /* Dark theme like Discord */
      margin: 8% auto;
      padding: 20px;
      border: 1px solid #202225;
      width: 90%;
      max-width: 640px;
      border-radius: 8px;
      color: #fff;
      box-shadow: 0 5px 15px rgba(0,0,0,0.5);
    }

    #gif-modal-close {
      color: #b9bbbe;
      position: absolute;
      top: 10px;
      right: 15px;
      font-size: 28px;
      font-weight: bold;
      cursor: pointer;
    }
    #gif-modal-close:hover {
        color: #fff;
    }

    #gif-search-container {
      display: flex;
      margin-bottom: 20px;
    }

    #gif-search-input {
      flex-grow: 1;
      padding: 10px;
      border-radius: 3px;
      border: 1px solid #202225;
      background-color: #40444b;
      color: #dcddde;
      font-size: 16px;
    }

    #gif-results {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
      gap: 10px;
      height: 55vh;
      overflow-y: auto;
      padding-right: 5px;
    }
    
    /* Custom scrollbar for the results */
    #gif-results::-webkit-scrollbar {
      width: 8px;
    }
    #gif-results::-webkit-scrollbar-track {
      background: #2e3338;
    }
    #gif-results::-webkit-scrollbar-thumb {
      background: #202225;
      border-radius: 4px;
    }

    #gif-results img {
      width: 100%;
      height: 110px;
      object-fit: cover;
      cursor: pointer;
      border-radius: 4px;
      background-color: #202225;
      transition: transform 0.2s ease;
    }
    #gif-results img:hover {
        transform: scale(1.05);
    }
    
    .gif-loading-text {
        color: #b9bbbe;
    }
  `;
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = css;
  document.head.appendChild(styleSheet);
}

/**
 * Fetches GIFs from the Tenor API based on a search query and displays them.
 * @param {string} query - The search term for GIFs.
 */
async function fetchAndDisplayGifs(query = 'trending') {
  const resultsContainer = document.getElementById('gif-results');
  if (!resultsContainer) return;
  resultsContainer.innerHTML = '<p class="gif-loading-text">Loading GIFs...</p>';

  // IMPORTANT: You should get your own API key from Tenor (https://tenor.com/developer/keyregistration)
  // The key below is a public test key from Tenor's documentation and may be rate-limited or disabled.
  const API_KEY = 'APIKEY';
  const CLIENT_KEY = 'APIKEY'; // A descriptive client key
  const url = `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${API_KEY}&client_key=${CLIENT_KEY}&limit=30`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    
    resultsContainer.innerHTML = ''; // Clear loading message

    if (data.results && data.results.length > 0) {
      data.results.forEach(gif => {
        const gifUrl = gif.media_formats.gif.url;
        const previewUrl = gif.media_formats.tinygif.url; // Use a smaller, animated preview
        
        const img = document.createElement('img');
        img.src = previewUrl;
        img.dataset.gifUrl = gifUrl; // Store the full-quality GIF URL
        img.alt = gif.content_description;
        img.title = gif.content_description;
        
        resultsContainer.appendChild(img);
      });
    } else {
      resultsContainer.innerHTML = '<p class="gif-loading-text">No GIFs found for that search.</p>';
    }
  } catch (error) {
    console.error('Error fetching GIFs from Tenor API:', error);
    resultsContainer.innerHTML = '<p class="gif-loading-text">Could not load GIFs. The public API key might be rate-limited.</p>';
  }
}

/**
 * Creates and injects the GIF browser modal into the page, and sets up its event listeners.
 */
function createGifBrowser() {
  // Don't create the modal if it already exists
  if (document.getElementById('gif-modal')) {
    return;
  }

  const modalHTML = `
    <div id="gif-modal">
      <div id="gif-modal-content">
        <span id="gif-modal-close">&times;</span>
        <h2>GIF Browser</h2>
        <div id="gif-search-container">
          <input type="text" id="gif-search-input" placeholder="Search Tenor GIFs..." />
        </div>
        <div id="gif-results"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // --- Event Listeners ---
  const modal = document.getElementById('gif-modal');
  const closeButton = document.getElementById('gif-modal-close');
  const searchInput = document.getElementById('gif-search-input');
  const resultsContainer = document.getElementById('gif-results');

  // Open the modal
  document.getElementById('gif-browser-btn').addEventListener('click', () => {
    modal.style.display = 'block';
    searchInput.focus();
    // Fetch trending GIFs when opened
    fetchAndDisplayGifs('trending');
  });

  // Close the modal
  closeButton.addEventListener('click', () => {
    modal.style.display = 'none';
  });
  window.addEventListener('click', (event) => {
    if (event.target == modal) {
      modal.style.display = 'none';
    }
  });

  // Search for GIFs on keyup with debounce
  let searchTimeout;
  searchInput.addEventListener('keyup', (event) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      const query = event.target.value.trim();
      fetchAndDisplayGifs(query || 'trending');
    }, 300); // Debounce search to avoid excessive API calls
  });

  // Handle GIF selection
  resultsContainer.addEventListener('click', (event) => {
    if (event.target.tagName === 'IMG' && event.target.dataset.gifUrl) {
      const chatTextarea = document.querySelector('textarea[name="chat_text"]');
      if (chatTextarea) {
        chatTextarea.value = event.target.dataset.gifUrl;
        // Optionally, auto-submit the form
        // const chatForm = document.querySelector('.chat-form');
        // if (chatForm) chatForm.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
      modal.style.display = 'none'; // Close modal after selection
    }
  });
}

// --- End of GIF Browser Functions ---

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
      console.log(` Perspectives structure: ${JSON.stringify(window.permissions, null, 2)}`);
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
let hideGifPreviews = false; // Track GIF preview toggle state
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
let notificationsEnabled = false; // Track notification toggle state
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
function createLastRefreshElement() {
  if (!window.isFeatureEnabled || !window.isFeatureEnabled("LastRefresh")) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("LastRefresh disabled by kill switch");
    }
    return null;
  }

  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  const div = document.createElement('div');
  div.className = 'last-refresh';
  div.textContent = `Last Runsheet Update: ${timeString}`;
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Created LastRefresh element: ${div.textContent}`);
  }
  return div;
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

    // Extract the person's name from the name element
    const nameText = nameElement.textContent.split(' - ')[0]?.trim();
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

      // Create the modal and its logic
      createGifBrowser();
      // Inject the CSS for the modal and button
      injectGifBrowserCSS();
    }
    // --- End of GIF Browser Injection ---

    // Inject Last Refresh timestamp
    if (window.isFeatureEnabled && window.isFeatureEnabled("LastRefresh")) {
      const liveControlDivs = [
        document.querySelector('.controls-wrapper .live-control'),
        document.querySelector('.overview.content .live-control')
      ].filter(div => div !== null);

      liveControlDivs.forEach(liveControlDiv => {
        if (!liveControlDiv) {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Live control div not found for LastRefresh injection");
          }
          return;
        }
        if (!liveControlDiv.querySelector('.last-refresh')) {
          const lastRefreshDiv = createLastRefreshElement();
          if (lastRefreshDiv) {
            liveControlDiv.appendChild(lastRefreshDiv);
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`LastRefresh timestamp injected into ${liveControlDiv.className}`);
            }
          } else {
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Failed to create LastRefresh element");
            }
          }
        } else {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`LastRefresh timestamp already exists in ${liveControlDiv.className}`);
          }
        }
      });
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
    }

    // Color chat names based on roles
    colorChatNames();

    // Observe chat for new messages to color names
    if (chatContainer) {
      const nameColorObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList.contains('name')) {
                  colorChatNames(); // Re-run for new names
                } else {
                  const newNames = node.querySelectorAll('.name');
                  if (newNames.length > 0) {
                    colorChatNames(); // Re-run for new names
                  }
                }
              }
            });
          }
        });
      });

      nameColorObserver.observe(chatContainer, { childList: true, subtree: true });
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Chat name color observer started");
      }
    }

    // Track hide slash commands toggle state
    let hideSlashCommands = false;

    // Function to hide or show slash command messages
    const toggleSlashCommandVisibility = (messages, shouldHide) => {
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
    };

    // Function to check mentions in initial messages
    const checkMessagesForMentions = (messages) => {
      messages.forEach(message => {
        embedGifs(message);
        const messageText = message.textContent.trim();
        const liElement = message.closest('li');
        if (hideSlashCommands && messageText.startsWith('/')) {
          if (liElement) {
            liElement.style.display = 'none';
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Hid slash command message: ${messageText}`);
            }
          }
        } else if (mentionRegex && mentionRegex.test(messageText)) {
          message.classList.add('mentioned');
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Highlighted mention: ${messageText}`);
          }
          // Show OS notification
          const senderName = liElement?.querySelector('.name')?.textContent.split(' - ')[0]?.trim() || 'Unknown';
          showNotification(`Mention in Elvanto Live`, {
            body: `${senderName}: ${messageText}`,
            icon: 'https://www.elvanto.com.au/wp-content/themes/elvanto/assets/images/logo.png'
          });
        }
      });
    };

    // Function to check commands and mentions in new messages
    const checkMessagesForCommands = (messages) => {
      try {
        messages.forEach(message => {
          embedGifs(message);
          const messageText = message.textContent.trim();
          const liElement = message.closest('li');
          if (liElement) {
            const senderNameRaw = liElement.querySelector('.name')?.textContent.split(' - ')[0]?.trim();
            if (!senderNameRaw) {
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log("Sender name not found in message");
              }
              return;
            }
            const senderName = senderNameRaw.replace(/\s+/g, ' ').trim();
            const senderFirstName = senderName.split(' ')[0];
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Message: ${messageText}, Sender: ${senderName}, Current user: ${personName}`);
            }

            if (hideSlashCommands && messageText.startsWith('/')) {
              liElement.style.display = 'none';
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log(`Hid slash command message: ${messageText}`);
              }
            }

            if (messageText.toLowerCase() === "/refresh") {
              // Normalize sender name to match roster format
              const normalizedSender = toLastnameFirstname(senderName);
              const normalizedPerson = personName.replace(/,\s*/g, ' ').trim();

              // Get sender's roles from roster
              const senderRoles = (window.elvantoRoster && window.elvantoRoster[normalizedSender]) || [];
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log(`Sender ${normalizedSender} roles: ${senderRoles.join(', ') || 'none'}`);
              }

              // Check if sender is the current user
              if (normalizedSender === toLastnameFirstname(normalizedPerson)) {
                if (canUseFeature("Command", "/refresh", window.elvantoUserRoles)) {
                  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                    console.log("Refresh command from current user with permission, reloading...");
                  }
                  location.reload();
                } else {
                  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                    console.log("Refresh command from current user denied: no permission");
                  }
                }
              }
              // Check sender's permission
              else if (canUseFeature("Command", "/refresh", senderRoles)) {
                if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                  console.log("Refresh command from sender with permission, reloading...");
                }
                location.reload();
              }
              // Check if sender is the controller
              else {
                const controllerFirstName = getControllerName();
                if (controllerFirstName && senderFirstName === controllerFirstName) {
                  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                    console.log("Refresh command from controller, reloading...");
                  }
                  location.reload();
                } else {
                  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                    console.log("Ignoring /refresh: sender has no permission and is not current user or controller");
                  }
                }
              }
            } else if (mentionRegex && mentionRegex.test(messageText)) {
              message.classList.add('mentioned');
              if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                console.log(`Highlighted mention: ${messageText}`);
              }
              // Show OS notification
              const senderName = liElement?.querySelector('.name')?.textContent.split(' - ')[0]?.trim() || 'Unknown';
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

    // Highlight existing messages and check for mentions
    if (chatContainer) {
      const initialMessages = chatContainer.querySelectorAll('div.text');
      checkMessagesForMentions(initialMessages);

      // Monitor new messages
      const messageObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.addedNodes) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.classList.contains('text')) {
                  checkMessagesForCommands([node]);
                } else {
                  const newMessages = node.querySelectorAll('div.text');
                  checkMessagesForCommands(newMessages);
                }
              }
            });
          }
        });
      });

      messageObserver.observe(chatContainer, { childList: true, subtree: true });
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Chat message observer started");
      }
    }

    // Inject toggles into dropdown menu
    const dropdownMenu = document.querySelector('ul.dropdown-menu.dropdown-menu-right');
    if (dropdownMenu) {
      // Notification toggle
      if ('Notification' in window && canUseFeature("SettingToggle", "Notification", window.elvantoUserRoles)) {
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
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("Notifications API not supported or disabled by kill switch/permissions");
        }
      }

      // Hide slash commands toggle
      if (canUseFeature("SettingToggle", "HideCommands", window.elvantoUserRoles)) {
        const hideSlashItem = document.createElement('li');
        hideSlashItem.innerHTML = `
          <label class="custom-checkbox-label" data-live-action="toggle-hide-slash-commands">
            <div class="custom-checkbox">
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
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Hide slash commands enabled");
            }
            // Hide slash commands
            const allMessages = document.querySelectorAll('.chat .content ol div.text');
            toggleSlashCommandVisibility(allMessages, true);
          } else {
            hideSlashCheckboxDiv.classList.remove('checked');
            hideSlashCommands = false;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Hide slash commands disabled");
            }
            // Show all previously hidden slash commands
            const allMessages = document.querySelectorAll('.chat .content ol div.text');
            toggleSlashCommandVisibility(allMessages, false);
          }
        });
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("HideCommands toggle disabled by kill switch/permissions");
        }
      }

      // Hide GIF previews toggle
      if (canUseFeature("SettingToggle", "HideGifPreviews", window.elvantoUserRoles)) {
        const hideGifItem = document.createElement('li');
        hideGifItem.innerHTML = `
          <label class="custom-checkbox-label" data-live-action="toggle-hide-gif-previews">
            <div class="custom-checkbox">
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
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Hide GIF previews enabled");
            }
            // Hide GIF previews in messages
            const allMessages = document.querySelectorAll('.chat .content ol div.text');
            toggleGifPreviewVisibility(allMessages, true);
          } else {
            hideGifCheckboxDiv.classList.remove('checked');
            hideGifPreviews = false;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("Hide GIF previews disabled");
            }
            // Show GIF previews in messages
            const allMessages = document.querySelectorAll('.chat .content ol div.text');
            toggleGifPreviewVisibility(allMessages, false);
          }
        });
      } else {
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log("HideGifPreviews toggle disabled by kill switch/permissions");
        }
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.error("Dropdown menu not found for toggles");
      }
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