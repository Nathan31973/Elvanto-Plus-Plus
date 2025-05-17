console.log("Elvanto Role Cacher By Nathan3197");
console.log("Current URL:", window.location.href);

// Function to normalize role names
function normalizeRoleName(role) {
  return role ? role.toLowerCase().replace(/\s+/g, '') : '';
}

// Function to get all users' names and roles from roster, including current user
function getUserInfoFromRoster(retries = 5, delay = 500) {
  const attempt = () => {
    // Select all roster items, not just .current
    const rosterItems = document.querySelectorAll(
      '.service-volunteers .positions li, ' +
      '.volunteer-roster li, ' +
      '[data-roster] li, ' +
      '.roster-list li, ' +
      '.roster-item'
    );
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Found ${rosterItems.length} roster items`);
      // Log raw HTML of items for debugging
      rosterItems.forEach((item, index) => {
        console.log(`Roster item ${index} HTML:`, item.outerHTML);
      });
    }

    const rosterData = {};
    let currentUserName = null;

    for (let item of rosterItems) {
      const nameElement = item.querySelector('.person .name, .volunteer-name, [data-name], .roster-name');
      const positionElement = item.querySelector('.position, .role, [data-role], .roster-role');
      if (nameElement && positionElement) {
        const name = nameElement.textContent.trim().replace(/\s+/g, ' ');
        const role = positionElement.textContent.trim();
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Raw roster item: name=${name}, role=${role}`);
        }
        if (name && role) {
          const normalizedRole = normalizeRoleName(role);
          // Initialize array for user if not exists
          rosterData[name] = rosterData[name] || [];
          // Avoid duplicate roles
          if (!rosterData[name].includes(normalizedRole)) {
            rosterData[name].push(normalizedRole);
          }
          // Check if this is the current user
          if (item.classList.contains('current') || item.getAttribute('data-current') === 'true') {
            currentUserName = name;
          }
        }
      }
    }

    if (Object.keys(rosterData).length > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Found roster data:`, JSON.stringify(rosterData, null, 2));
        if (currentUserName) {
          console.log(`Current user: ${currentUserName}, roles: ${rosterData[currentUserName]?.join(', ') || 'none'}`);
        } else {
          console.log("Current user not identified in roster");
        }
      }
      return { rosterData, currentUserName };
    }

    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("No roster items found");
    }
    return null;
  };

  let result = attempt();
  if (!result && retries > 0) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`No roster data found, retrying (${retries} left)...`);
    }
    return new Promise(resolve => {
      setTimeout(() => resolve(getUserInfoFromRoster(retries - 1, delay)), delay);
    });
  }
  return result;
}

// Function to get the service ID from the URL or href
function getServiceIdFromUrlOrHref(urlOrHref) {
  // Try hash-based service ID
  const hashMatch = urlOrHref.match(/#service-([a-f0-9-]+)/);
  if (hashMatch) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Found service ID from hash:", hashMatch[1]);
    }
    return hashMatch[1];
  }

  // Try query param time_id
  const urlParams = new URLSearchParams(new URL(urlOrHref, window.location.origin).search);
  const timeId = urlParams.get('time_id');
  if (timeId) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Found service ID from time_id:", timeId);
    }
    return timeId;
  }

  // Try DOM-based service ID
  const serviceElement = document.querySelector('[data-service-id], [data-time-id], .service-item');
  if (serviceElement) {
    const serviceId = serviceElement.getAttribute('data-service-id') || serviceElement.getAttribute('data-time-id');
    if (serviceId) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Found service ID from DOM:", serviceId);
      }
      return serviceId;
    }
  }

  // Fallback to broader regex for any service ID pattern
  const regexMatch = urlOrHref.match(/service[-_=]([a-f0-9-]+)/i);
  if (regexMatch) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Found service ID from regex:", regexMatch[1]);
    }
    return regexMatch[1];
  }

  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("No service ID found in", urlOrHref);
  }
  return null;
}

// Function to cache the roster data in localStorage
function cacheRoster(serviceId, rosterData, currentUserName) {
  if (!serviceId) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Cannot cache: missing serviceId");
    }
    return;
  }
  let rosterCache = JSON.parse(localStorage.getItem('elvantoRoster') || '{}');
  rosterCache[serviceId] = rosterData || {};
  localStorage.setItem('elvantoRoster', JSON.stringify(rosterCache));
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Cached roster for service ${serviceId}:`, JSON.stringify(rosterData, null, 2));
  }

  // Maintain compatibility with existing elvantoRoles for current user
  let roleCache = JSON.parse(localStorage.getItem('elvantoRoles') || '{}');
  roleCache[serviceId] = currentUserName && rosterData[currentUserName] ? rosterData[currentUserName] : [];
  localStorage.setItem('elvantoRoles', JSON.stringify(roleCache));
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Cached current user roles [${roleCache[serviceId].join(', ') || 'none'}] for service ${serviceId}`);
  }
}

// Function to retrieve the cached roster data
function getCachedRoster(serviceId) {
  if (!serviceId) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("No service ID, returning empty roster");
    }
    return {};
  }
  const rosterCache = JSON.parse(localStorage.getItem('elvantoRoster') || '{}');
  const rosterData = rosterCache[serviceId] || {};
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Retrieved roster for service ${serviceId}:`, JSON.stringify(rosterData, null, 2));
  }
  return rosterData;
}

// Function to retrieve the cached roles for the current user (for compatibility)
function getCachedRoles(serviceId) {
  if (!serviceId) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("No service ID, returning empty roles");
    }
    return [];
  }
  const roleCache = JSON.parse(localStorage.getItem('elvantoRoles') || '{}');
  let roles = roleCache[serviceId];
  // Handle legacy formats: string, undefined, or null
  if (typeof roles === 'string') {
    roles = [normalizeRoleName(roles)]; // Convert single role to array
  } else if (!Array.isArray(roles)) {
    roles = []; // Convert undefined/null to empty array
  } else {
    roles = roles.map(normalizeRoleName); // Normalize all roles
  }
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Retrieved current user roles [${roles.join(', ') || 'none'}] for service ${serviceId}`);
  }
  return roles;
}

// Function to handle service button click with retry
async function handleServiceButtonClick(serviceId, retries = 5, delay = 500) {
  const attempt = async () => {
    const result = await getUserInfoFromRoster();
    if (result) {
      const { rosterData, currentUserName } = result;
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Service button for ${serviceId} clicked, caching roster`);
      }
      cacheRoster(serviceId, rosterData, currentUserName);
    } else if (retries > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`No roster data for service ${serviceId}, retrying (${retries} left)...`);
      }
      setTimeout(() => handleServiceButtonClick(serviceId, retries - 1, delay), delay);
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`No roster data for service ${serviceId} after retries, caching empty roster`);
      }
      cacheRoster(serviceId, {}, null);
    }
  };
  await attempt();
}

// Function to observe roster DOM changes
function observeRosterChanges() {
  const rosterContainer = document.querySelector('.service-volunteers, .volunteer-roster, [data-roster], .roster-list');
  if (!rosterContainer) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Roster container not found for observer");
    }
    return;
  }

  const observer = new MutationObserver(async (mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length || mutation.removedNodes.length) {
        const serviceId = getServiceIdFromUrlOrHref(window.location.href);
        if (serviceId) {
          const result = await getUserInfoFromRoster();
          if (result) {
            const { rosterData, currentUserName } = result;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Roster DOM changed, caching roster`);
            }
            cacheRoster(serviceId, rosterData, currentUserName);
          }
        }
      }
    }
  });

  observer.observe(rosterContainer, { childList: true, subtree: true });
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Roster DOM observer started");
  }
}

// Function to initialize the script
async function initRoleCacher() {
  const url = window.location.href;

  // Roster page: cache roster data on Live button or service button click
  if (url.match(/^https:\/\/.*\.elvanto\.com\.au\/roster\//)) {
    // Start roster DOM observer
    observeRosterChanges();

    // Handle Live button
    const liveButtonSelectors = [
      'a[href*="/live/"]',
      'button[data-live]',
      '.btn-live',
      '[data-action="live"]'
    ];
    let liveButton = document.querySelector(liveButtonSelectors.join(', '));
    if (liveButton) {
      liveButton.addEventListener('click', async (e) => {
        const serviceId = getServiceIdFromUrlOrHref(window.location.href);
        if (serviceId) {
          const result = await getUserInfoFromRoster();
          if (result) {
            const { rosterData, currentUserName } = result;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Live button clicked, caching roster`);
            }
            cacheRoster(serviceId, rosterData, currentUserName);
          } else {
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("No roster data for Live button, caching empty roster");
            }
            cacheRoster(serviceId, {}, null);
          }
        }
      });
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Live button listener added");
      }
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("Live button not found, checking again...");
      }
      setTimeout(() => {
        liveButton = document.querySelector(liveButtonSelectors.join(', '));
        if (liveButton) {
          liveButton.addEventListener('click', async (e) => {
            const serviceId = getServiceIdFromUrlOrHref(window.location.href);
            if (serviceId) {
              const result = await getUserInfoFromRoster();
              if (result) {
                const { rosterData, currentUserName } = result;
                if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                  console.log(`Live button clicked (retry), caching roster`);
                }
                cacheRoster(serviceId, rosterData, currentUserName);
              } else {
                if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                  console.log("No roster data for Live button (retry), caching empty roster");
                }
                cacheRoster(serviceId, {}, null);
              }
            }
          });
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Live button listener added (retry)");
          }
        } else {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log("Live button still not found");
          }
        }
      }, 1000);
    }

    // Handle service buttons
    const serviceButtons = document.querySelectorAll('a.my-schedule[href*="#service-"], a[href*="#service-"]');
    serviceButtons.forEach(button => {
      button.addEventListener('click', async (e) => {
        const serviceId = getServiceIdFromUrlOrHref(button.href);
        if (serviceId) {
          if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
            console.log(`Service button clicked for service ${serviceId}, fetching roster...`);
          }
          await handleServiceButtonClick(serviceId);
        }
      });
    });
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Added listeners to ${serviceButtons.length} service buttons`);
    }
  }

  // Live chat page: retrieve cached roster and roles
  if (url.match(/^https:\/\/.*\.elvanto\.com\.au\/live\//)) {
    const serviceId = getServiceIdFromUrlOrHref(window.location.href);
    if (serviceId) {
      const rosterData = getCachedRoster(serviceId);
      const currentUserRoles = getCachedRoles(serviceId);
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Roster for live chat:`, JSON.stringify(rosterData, null, 2));
        console.log(`Current user roles for live chat: ${currentUserRoles.join(', ') || 'none'}`);
      }
      window.elvantoRoster = rosterData; // Make roster available globally
      window.elvantoUserRoles = currentUserRoles;
      window.elvantoRolesReady = true; // Signal roles are ready
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("No service ID, setting empty roster and roles");
      }
      window.elvantoRoster = {};
      window.elvantoUserRoles = [];
      window.elvantoRolesReady = true;
    }
  }
}

initRoleCacher().then(() => {
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log("Role cacher initialization complete");
  }
}).catch(err => {
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.error("Role cacher initialization failed:", err);
  }
});