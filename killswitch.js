console.log("Elvanto Killswitch Service Loaded");

const KILLSWITCH_URL = "https://nathan31973.github.io/Elvanto-Plus-Plus-Assets/Killswitch.xml";

// Object to store kill switch states with default values
let killSwitches = {
  Plugin: false,
  AllCommands: false,
  Commands: {},
  Buttons: {},
  SettingToggles: {},
  Notification: false,
  ConsoleLogging: false,
  LastRefresh: false
};

// Promise to track when kill switches are loaded
let killSwitchesLoaded = null;

// Function to fetch and parse XML
async function fetchKillSwitches() {
  try {
    const response = await fetch(KILLSWITCH_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const xmlText = await response.text();
    // Log raw XML for debugging
    if (xmlText.length > 1000) {
      console.warn("Raw XML truncated for logging:", xmlText.substring(0, 1000) + "...");
    } else {
      console.warn("Raw XML:", xmlText);
    }

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "application/xml");

    // Check for XML parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError || xmlDoc.documentElement.nodeName === "parsererror") {
      throw new Error(`Error parsing XML: ${parserError ? parserError.textContent : "Invalid XML structure"}`);
    }

    // Verify xmlDoc is a valid Document
    if (!(xmlDoc instanceof Document)) {
      throw new Error("Parsed XML is not a valid Document");
    }

    // Update killSwitches object
    killSwitches = {
      Plugin: false,
      AllCommands: false,
      Commands: {},
      Buttons: {},
      SettingToggles: {},
      Notification: false,
      ConsoleLogging: false,
      LastRefresh: false
    };

    // Parse Plugin
    const pluginNode = xmlDoc.querySelector("Plugin");
    if (pluginNode && pluginNode.getAttribute) {
      killSwitches.Plugin = pluginNode.getAttribute("Kill") === "true";
    }

    // Parse AllCommands
    const allCommandsNode = xmlDoc.querySelector("AllCommands");
    if (allCommandsNode && allCommandsNode.getAttribute) {
      killSwitches.AllCommands = allCommandsNode.getAttribute("Kill") === "true";
    }

    // Parse Commands
    const commandNodes = xmlDoc.querySelectorAll("Command");
    console.warn(`Found ${commandNodes.length} Command nodes`);
    if (commandNodes instanceof NodeList && commandNodes.length > 0) {
      Array.from(commandNodes).forEach((node, index) => {
        if (node && node.getAttribute) {
          const commandName = node.getAttribute("CommandName");
          if (commandName) {
            killSwitches.Commands[commandName] = node.getAttribute("Kill") === "true";
          } else {
            console.warn(`Command node ${index} missing CommandName attribute`);
          }
        } else {
          console.warn(`Invalid Command node at index ${index}`);
        }
      });
    } else {
      console.warn("No valid Command nodes found in Killswitch.xml");
    }

    // Parse Buttons
    const buttonNodes = xmlDoc.querySelectorAll("Button");
    console.warn(`Found ${buttonNodes.length} Button nodes`);
    if (buttonNodes instanceof NodeList && buttonNodes.length > 0) {
      Array.from(buttonNodes).forEach((node, index) => {
        if (node && node.getAttribute) {
          const buttonName = node.getAttribute("ButtonName");
          if (buttonName) {
            killSwitches.Buttons[buttonName] = node.getAttribute("Kill") === "true";
          } else {
            console.warn(`Button node ${index} missing ButtonName attribute`);
          }
        } else {
          console.warn(`Invalid Button node at index ${index}`);
        }
      });
    } else {
      console.warn("No valid Button nodes found in Killswitch.xml");
    }

    // Parse SettingToggles
    const toggleNodes = xmlDoc.querySelectorAll("SettingToggle");
    console.warn(`Found ${toggleNodes.length} SettingToggle nodes`);
    if (toggleNodes instanceof NodeList && toggleNodes.length > 0) {
      Array.from(toggleNodes).forEach((node, index) => {
        if (node && node.getAttribute) {
          const toggleName = node.getAttribute("ToggleName");
          if (toggleName) {
            killSwitches.SettingToggles[toggleName] = node.getAttribute("Kill") === "true";
          } else {
            console.warn(`SettingToggle node ${index} missing ToggleName attribute`);
          }
        } else {
          console.warn(`Invalid SettingToggle node at index ${index}`);
        }
      });
    } else {
      console.warn("No valid SettingToggle nodes found in Killswitch.xml");
    }

    // Parse Notification
    const notificationNode = xmlDoc.querySelector("Notification");
    if (notificationNode && notificationNode.getAttribute) {
      killSwitches.Notification = notificationNode.getAttribute("Kill") === "true";
    }

    // Parse ConsoleLogging
    const consoleLoggingNode = xmlDoc.querySelector("ConsoleLogging");
    if (consoleLoggingNode && consoleLoggingNode.getAttribute) {
      killSwitches.ConsoleLogging = consoleLoggingNode.getAttribute("Kill") === "true";
    }

    // Parse LastRefresh
    const lastRefreshNode = xmlDoc.querySelector("LastRefresh");
    if (lastRefreshNode && lastRefreshNode.getAttribute) {
      killSwitches.LastRefresh = lastRefreshNode.getAttribute("Kill") === "true";
    }

    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.log("Kill switches loaded:", killSwitches);
    }
  } catch (error) {
    if (window.isFeatureEnabled && window.isFeatureEnabled("ConsoleLogging")) {
      console.error("Error fetching or parsing kill switches:", error.message);
    }
    // Reset to default values (all features enabled)
    killSwitches = {
      Plugin: false,
      AllCommands: false,
      Commands: {},
      Buttons: {},
      SettingToggles: {},
      Notification: false,
      ConsoleLogging: false,
      LastRefresh: false
    };
  }
}

// Function to check if a feature is enabled
function isFeatureEnabled(featureType, featureName = null) {
  // Check if the entire plugin is disabled
  if (killSwitches.Plugin) {
    return false;
  }

  // Handle specific feature types
  if (featureType === "Command" && featureName) {
    return !killSwitches.AllCommands && !(killSwitches.Commands && killSwitches.Commands[featureName]);
  }
  if (featureType === "Button" && featureName) {
    return !(killSwitches.Buttons && killSwitches.Buttons[featureName]);
  }
  if (featureType === "SettingToggle" && featureName) {
    return !(killSwitches.SettingToggles && killSwitches.SettingToggles[featureName]);
  }
  if (featureType === "Notification") {
    return !killSwitches.Notification;
  }
  if (featureType === "ConsoleLogging") {
    return !killSwitches.ConsoleLogging;
  }
  if (featureType === "LastRefresh") {
    return !killSwitches.LastRefresh;
  }

  // Default: feature enabled if not explicitly disabled
  return true;
}

// Initialize kill switches and store the promise
killSwitchesLoaded = fetchKillSwitches();

// Expose isFeatureEnabled and killSwitchesLoaded to the global scope
window.isFeatureEnabled = isFeatureEnabled;
window.killSwitchesLoaded = killSwitchesLoaded;