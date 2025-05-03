console.log("Elvanto Role Cacher By Nathan3197");
console.log("Current URL:", window.location.href);

// Function to normalize role names
function normalizeRoleName(role) {
  return role ? role.toLowerCase().replace(/\s+/g, '') : '';
}

// Function to get the current user's name and all roles from roster
function getUserInfoFromRoster(retries = 5, delay = 500) {
  const attempt = () => {
    // Broader selectors to handle DOM changes
    const currentItems = document.querySelectorAll(
      '.service-volunteers .positions li.current, ' +
      '.volunteer-roster li.current, ' +
      '[data-roster] li.current, ' +
      '.roster-list li.current, ' +
      'li[data-current="true"], ' +
      '.roster-item.current'
    );
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Found ${currentItems.length} current roster items`);
    }

    let name = null;
    const roles = [];

    for (let item of currentItems) {
      const nameElement = item.querySelector('.person .name, .volunteer-name, [data-name], .roster-name');
      const positionElement = item.querySelector('.position, .role, [data-role], .roster-role');
      if (nameElement && positionElement) {
        const currentName = nameElement.textContent.trim();
        const role = positionElement.textContent.trim();
        if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
          console.log(`Raw roster item: name=${currentName}, role=${role}`);
        }
        if (!name) name = currentName; // Set name from first match
        if (currentName === name && role) {
          const normalizedRole = normalizeRoleName(role);
          roles.push(normalizedRole);
        }
      }
    }

    if (name && roles.length > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Found user: ${name}, roles: ${roles.join(', ')}`);
      }
      return { name, roles };
    }

    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(name ? `No roles found for ${name} in current items` : "No current roster items found");
    }
    return name ? { name, roles: [] } : null;
  };

  let result = attempt();
  if (!result && retries > 0) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`No user info found, retrying (${retries} left)...`);
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

// Function to cache the roles in localStorage
function cacheRoles(serviceId, roles) {
  if (!serviceId) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Cannot cache: missing serviceId");
    }
    return;
  }
  let roleCache = JSON.parse(localStorage.getItem('elvantoRoles') || '{}');
  roleCache[serviceId] = roles || []; // Ensure array
  localStorage.setItem('elvantoRoles', JSON.stringify(roleCache));
  if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
    console.log(`Cached roles [${roles.join(', ') || 'none'}] for service ${serviceId}`);
  }
}

// Function to retrieve the cached roles
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
    console.log(`Retrieved roles [${roles.join(', ') || 'none'}] for service ${serviceId}`);
  }
  return roles;
}

// Function to handle service button click with retry
async function handleServiceButtonClick(serviceId, retries = 5, delay = 500) {
  const attempt = async () => {
    const userInfo = await getUserInfoFromRoster();
    if (userInfo) {
      const { name, roles } = userInfo;
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Service button for ${serviceId} clicked, caching roles for ${name}`);
      }
      cacheRoles(serviceId, roles);
    } else if (retries > 0) {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`No user info for service ${serviceId}, retrying (${retries} left)...`);
      }
      setTimeout(() => handleServiceButtonClick(serviceId, retries - 1, delay), delay);
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`No user info for service ${serviceId} after retries, caching empty roles`);
      }
      cacheRoles(serviceId, []);
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
          const userInfo = await getUserInfoFromRoster();
          if (userInfo) {
            const { name, roles } = userInfo;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Roster DOM changed, caching roles for ${name}`);
            }
            cacheRoles(serviceId, roles);
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

  // Roster page: cache roles on Live button or service button click
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
          const userInfo = await getUserInfoFromRoster();
          if (userInfo) {
            const { name, roles } = userInfo;
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log(`Live button clicked for ${name}, caching roles...`);
            }
            cacheRoles(serviceId, roles);
          } else {
            if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
              console.log("No user info for Live button, caching empty roles");
            }
            cacheRoles(serviceId, []);
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
              const userInfo = await getUserInfoFromRoster();
              if (userInfo) {
                const { name, roles } = userInfo;
                if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                  console.log(`Live button clicked (retry) for ${name}, caching roles...`);
                }
                cacheRoles(serviceId, roles);
              } else {
                if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
                  console.log("No user info for Live button (retry), caching empty roles");
                }
                cacheRoles(serviceId, []);
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
            console.log(`Service button clicked for service ${serviceId}, fetching roles...`);
          }
          await handleServiceButtonClick(serviceId);
        }
      });
    });
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log(`Added listeners to ${serviceButtons.length} service buttons`);
    }
  }

  // Live chat page: retrieve cached roles
  if (url.match(/^https:\/\/.*\.elvanto\.com\.au\/live\//)) {
    const serviceId = getServiceIdFromUrlOrHref(window.location.href);
    if (serviceId) {
      const roles = getCachedRoles(serviceId);
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log(`Roles for live chat: ${roles.join(', ') || 'none'}`);
      }
      window.elvantoUserRoles = roles;
      window.elvantoRolesReady = true; // Signal roles are ready
    } else {
      if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
        console.log("No service ID, setting empty roles");
      }
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