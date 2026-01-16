// ==UserScript==
// @name         Veyra Hud Core
// @namespace    http://tampermonkey.net/
// @version      2.0.4
// @description  Core functionality for veyra-hud
// @author       [SEREPH] koenrad
// @updateURL    https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/veyra-hud-core.js
// @downloadURL  https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/veyra-hud-core.js
// @match        https://demonicscans.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=demonicscans.org
// @grant        GM_addStyle
// ==/UserScript==

const VHC_USER_ID = await getUserId();

function upgradeCheck() {
  const scriptVersion = GM_info.script.version;
  const scriptName = GM_info.script.name;
  const previousVersion = Storage.get(
    `${scriptName}:version`,
    "unknown version"
  );
  const enableNewVersionNotification = Storage.get(
    "ui-improvements:enableNewVersionNotification",
    true
  );
  if (previousVersion !== scriptVersion) {
    Storage.set(`${scriptName}:version`, scriptVersion);
    let direction = checkVersion(scriptVersion, previousVersion)
      ? "upgraded"
      : "downgraded";
    if (enableNewVersionNotification) {
      pageAlert(
        `${scriptName} ${direction} from v${previousVersion} => v${scriptVersion}`
      );
    }
  }
}

const Storage = {
  get(key, fallback = null) {
    try {
      const value = localStorage.getItem(key);
      return value !== null ? JSON.parse(value) : fallback;
    } catch {
      return fallback;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch {}
  },

  has(key) {
    return localStorage.getItem(key) !== null;
  },
};

initSettingsDrawer();

const { container: enableNewVersionNotificationToggle } = createSettingsInput({
  key: "ui-improvements:enableNewVersionNotification",
  label: "New Version Notification",
  defaultValue: true,
  type: "checkbox",
  inputProps: { slider: true },
});

const { container: disableRefreshToggle } = createSettingsInput({
  key: "ui-improvements:disableRefresh",
  label: "Disable Refreshes",
  defaultValue: false,
  type: "checkbox",
  inputProps: { slider: true },
});

const { container: persistLogsToggle } = createSettingsInput({
  key: "ui-improvements:persistLogs",
  label: "Persist Logs",
  defaultValue: true,
  type: "checkbox",
  inputProps: { slider: true },
});

const { container: useDebugConsoleToggle, input: useDebugConsoleInput } =
  createSettingsInput({
    key: "ui-improvements:debugConsole",
    label: "Show Debug Console",
    defaultValue: false,
    type: "checkbox",
    inputProps: { slider: true },
    onChange: (value, input) => {
      persistLogsToggle.style.display = value ? "flex" : "none";
    },
  });

const useDebugConsole = useDebugConsoleInput.checked;
persistLogsToggle.style.display = useDebugConsole ? "flex" : "none";

// useDebugConsoleInput.addEventListener("click", () => {

// });

addSettingsGroup("debug-console", "Developer Mode", "debug settings", [
  enableNewVersionNotificationToggle,
  disableRefreshToggle,
  useDebugConsoleToggle,
  persistLogsToggle,
]);

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function refreshPage(msg) {
  const disableRefresh = Storage.get("ui-improvements:disableRefresh", false);
  if (disableRefresh) {
    console.warn(`Refresh intercepted. ${msg ? msg.toString() : ""} `);
    return;
  }
  console.log("refreshing page");
  window.location.reload();
}

function getRandomDelay(min, max) {
  return Math.random() * (max - min) + min;
}

function getCookie(name) {
  return document.cookie
    .split("; ")
    .find((c) => c.startsWith(name + "="))
    ?.split("=")[1];
}

async function internalFetch(url) {
  const response = await fetch(url);
  const html = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  return doc;
}

async function getUserId() {
  const userId =
    (typeof USER_ID !== "undefined" && USER_ID) ||
    getUserIdByPfP() ||
    getUserIdByHealBtn() ||
    getUserIdByGemPurchaseExample() ||
    (await getUserIdByLoadingWavePage());

  if (!userId) {
  }

  return userId;
}

function getUserIdByPfP(doc = document) {
  const img = doc.querySelector('.small-ava img[src*="user_"]');
  if (!img) return null;

  const match = img.src.match(/user_(\d+)_/);
  return match ? Number(match[1]) : null;
}

function getUserIdByHealBtn(doc = document) {
  const btn = doc.getElementById("healBtn");
  if (!btn) return null;

  const onclick = btn.getAttribute("onclick");
  if (!onclick) return null;

  // Extract second numeric argument from healDungeonPlayer(a, b, ...)
  const match = onclick.match(/healDungeonPlayer\(\s*\d+\s*,\s*(\d+)\s*,/);
  return match ? Number(match[1]) : null;
}

async function getUserIdByLoadingWavePage() {
  const doc = await internalFetch("/active_wave.php?gate=3&wave=3");
  const scripts = [...doc.querySelectorAll("script")];

  let userId = null;

  for (const script of scripts) {
    const match = script.textContent.match(/const\s+USER_ID\s*=\s*(\d+);/);
    if (match) {
      userId = Number(match[1]);
      break;
    }
  }

  return userId;
}

function getUserIdByGemPurchaseExample() {
  const block = document.querySelector(".ny-crypto-example-block");
  if (!block) return null;

  // Find all strong spans inside the example text
  const strongs = block.querySelectorAll(".ny-crypto-example-text .ny-strong");

  for (const el of strongs) {
    const text = el.textContent.trim();
    if (/^\d+$/.test(text)) {
      return Number(text);
    }
  }

  return null;
}

function checkVersion(v1, v2) {
  // Ensure versions are strings
  v1 = String(v1);
  v2 = String(v2);

  // Split versions into parts
  const parse = (v) => v.split(".").map((n) => parseInt(n, 10) || 0);

  const [major1, minor1, patch1] = parse(v1);
  const [major2, minor2, patch2] = parse(v2);

  if (major1 > major2) return true;
  if (major1 < major2) return false;

  // majors equal, compare minor
  if (minor1 > minor2) return true;
  if (minor1 < minor2) return false;

  // minors equal, compare patch
  if (patch1 >= patch2) return true;

  return false;
}

function pageAlert(message, options = {}) {
  const { title = "Alert", buttonText = "OK" } = options;

  // Create overlay
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999999;
    font-family: sans-serif;
  `;

  // Create dialog box
  const box = document.createElement("div");
  box.style.cssText = `
    background: #111;
    color: #fff;
    min-width: 280px;
    max-width: 90%;
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 20px 50px rgba(0,0,0,.5);
  `;

  // Title
  const titleEl = document.createElement("div");
  titleEl.textContent = title;
  titleEl.style.cssText = `font-weight: 600; margin-bottom: 8px;`;

  // Message
  const msgEl = document.createElement("div");
  msgEl.textContent = message;
  msgEl.style.cssText = `margin-bottom: 14px; white-space: pre-wrap;`;

  // Button
  const btn = document.createElement("button");
  btn.textContent = buttonText;
  btn.style.cssText = `
    padding: 6px 14px;
    background: #4f46e5;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    float: right;
  `;

  // Assemble
  box.append(titleEl, msgEl, btn);
  overlay.appendChild(box);
  document.body.appendChild(overlay);

  // Close function
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };

  // Close on click or Enter/Escape
  btn.addEventListener("click", close);
  const onKey = (e) => {
    if (e.key === "Enter" || e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);
}

function showNotification(msg, type = "success") {
  const note = document.getElementById("notification");
  if (!note) return;
  note.innerHTML = msg;
  note.style.background = type === "error" ? "#e74c3c" : "#2ecc71";
  note.style.display = "block";
  setTimeout(() => {
    note.style.display = "none";
  }, 3000);
}

function titleCase(str) {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function sendWebhookMessage(webhookUrl, message) {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message }),
    });

    if (!res.ok) throw new Error(await res.text());

    console.log("Message sent!");
  } catch (err) {
    console.error("Webhook send failed:", err);
  }
}

function getRequiredExperienceToLevel(doc = document) {
  const expEl = doc.querySelector(".gtb-exp-top span:last-child");

  let expToNext = null;

  if (expEl) {
    const text = expEl.textContent; // "26,728,765 / 79,254,606"
    const match = text.match(/([\d,]+)\s*\/\s*([\d,]+)/);

    if (match) {
      const current = Number(match[1].replace(/,/g, ""));
      const total = Number(match[2].replace(/,/g, ""));
      expToNext = total - current;
    }
  }
  return expToNext;
}

function getCurrentLevel(doc = document) {
  const match = doc
    .querySelector(".gtb-level")
    ?.textContent.match(/LV\s*(\d+)/);
  return match ? Number(match[1]) : null;
}

// Pass in Battle page
function getMonsterNameFromBattlePage(doc = document) {
  const cardTitle = doc.querySelector(".monster-card .card-title");
  if (!cardTitle) return null;

  // Find the first text node (safer than childNodes[0])
  const textNode = [...cardTitle.childNodes].find(
    (node) => node.nodeType === Node.TEXT_NODE
  );
  if (!textNode) return null;

  return textNode.textContent
    .replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, "")
    .trim();
}

// ------------------------ Settings Drawer --------------------------- //

GM_addStyle(`
  .switch-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    font-size: 14px;
    user-select: none;
  }
  .switch-label input[type="checkbox"] {
    display: none;
  }
  .switch-label .slider {
    position: relative;
    width: 36px;
    height: 20px;
    background-color: #ccc;
    border-radius: 20px;
    transition: background-color 0.3s;
  }
  .switch-label .slider::before {
    content: "";
    position: absolute;
    width: 16px;
    height: 16px;
    left: 2px;
    top: 2px;
    background: white;
    border-radius: 50%;
    transition: transform 0.3s;
  }
  .switch-label input[type="checkbox"]:checked + .slider {
    background-color: #4caf50;
  }
  .switch-label input[type="checkbox"]:checked + .slider::before {
    transform: translateX(16px);
  }
  .set-tabs {
      flex-wrap: wrap;
      justify-content: center !important;
      overflow-x: visible !important;
  }`);

GM_addStyle(`
    .qs-list {
      margin-bottom: 55px !important;
      padding-bottom: 75px !important;
    }

    .qs-list input[type="text"] {
      width: 100px;
      padding: 2px 4px;
      border-radius: 4px;
      border: 1px solid #2d3154;
      background: #2d3154;
      color: #e6e8ff;
    }
    .settings-drawer-trigger {
        position: fixed;
        right: 175px;
        bottom: 17px;
        z-index: 10001;
        background: #24263a;
        border: 1px solid #2f324d;
        box-shadow: 0 10px 24px rgba(0, 0, 0, .6);
        border-radius: 12px;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
        cursor: pointer;
        font-weight: 700;
        font-size: 14px;
        line-height: 1.2;
        padding: 10px 12px;
        gap: 6px;
    }

    #settingsDrawer {
        position: fixed;
        top: 0;
        right: -280px;
        width: 260px;
        max-width: 80vw;
        height: 100vh;
        background: #1a1b25;
        border-left: 1px solid #2f324d;
        box-shadow: 0 0 30px rgba(0, 0, 0, .8);
        z-index: 10002;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        transition: right .25s ease;
        color: #fff;
        font-family: Arial, sans-serif;
    }

    #settingsDrawerContainer {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 35px;
    }

    body.settingsdrawer-open #battleDrawerBackdrop {
        display: block;
    }

    body.settingsdrawer-open #settingsDrawer {
        right: 0;
    }

    `);
function initSettingsDrawer() {
  const bodyEl = document.body;

  // 1️⃣ Prevent duplicate drawer
  if (document.getElementById("settingsDrawer")) {
    console.warn("Settings drawer already exists. Skipping injection.");
  } else {
    const original = document.getElementById("qsDrawer");
    if (!original) {
      console.error("Original Quick Sets drawer not found. Cannot clone.");
      return;
    }

    // Clone drawer and update ID
    const drawer = original.cloneNode(true);
    drawer.id = "settingsDrawer";

    // Update header
    const titleEl = drawer.querySelector(".title");
    const subtitleEl = drawer.querySelector(".subtitle");
    if (titleEl) titleEl.textContent = "Veyra-Hud Settings";
    if (subtitleEl)
      subtitleEl.textContent =
        "Global settings for various plugins and userscripts developed by koenrad for the SEREPH guild";

    // Update close button
    const closeBtn = drawer.querySelector(".qs-drawer-close");
    if (closeBtn) closeBtn.id = "closeSettingsDrawerBtn";

    // Replace list with container for future settings buttons
    const listEl = drawer.querySelector(".qs-list");
    if (listEl) {
      listEl.innerHTML = `
        <div id="settingsDrawerContainer"></div>
      `;
    }

    // Insert drawer next to original
    original.insertAdjacentElement("afterend", drawer);
  }

  // 2️⃣ Prevent duplicate trigger button
  if (!document.getElementById("openSettingsDrawerBtn")) {
    const originalBtn = document.getElementById("openQuickSetDrawerBtn");
    if (!originalBtn) {
      console.error("Original Quick Sets trigger button not found.");
      return;
    }

    const btn = originalBtn.cloneNode(true);
    btn.id = "openSettingsDrawerBtn";

    // Remove old classes and add new
    btn.className = "";
    btn.classList.add("settings-drawer-trigger");

    btn.title = "Dungeon Settings";
    btn.textContent = "⚙️";

    originalBtn.insertAdjacentElement("afterend", btn);
  }

  // 3️⃣ Wire open/close logic
  const openBtn = document.getElementById("openSettingsDrawerBtn");
  const closeBtn = document.getElementById("closeSettingsDrawerBtn");
  const backdrop = document.getElementById("battleDrawerBackdrop");

  if (!openBtn || !closeBtn || !backdrop) return;

  function openDrawer() {
    bodyEl.classList.add("settingsdrawer-open");
  }
  function closeDrawer() {
    bodyEl.classList.remove("settingsdrawer-open");
    refreshPage();
  }

  openBtn.addEventListener("click", openDrawer);
  closeBtn.addEventListener("click", closeDrawer);
  backdrop.addEventListener("click", closeDrawer);
}

/**
 * Adds a settings group to the Settings Drawer container.
 *
 * @param {string} groupId - Unique ID for the group.
 * @param {string} title - The title of the group.
 * @param {string} subtitle - The subtitle/description of the group.
 * @param {HTMLElement|HTMLElement[]} elements - One or more HTML elements to append under the title/subtitle.
 * @returns {HTMLElement} - The created group element.
 */
function addSettingsGroup(groupId, title, subtitle, elements) {
  const container = document.getElementById("settingsDrawerContainer");
  if (!container) {
    console.error(
      "Settings drawer container not found. Make sure initSettingsDrawer() has run."
    );
    return null;
  }

  if (document.getElementById(groupId)) {
    console.warn(
      `Settings group with id "${groupId}" already exists. Skipping creation.`
    );
    return document.getElementById(groupId);
  }

  // Ensure elements is an array
  if (!Array.isArray(elements)) elements = [elements];

  // Create group wrapper
  const group = document.createElement("div");
  group.className = "settings-group";
  group.id = groupId;
  group.style.display = "flex";
  group.style.flexDirection = "column";
  group.style.gap = "6px";
  group.style.padding = "8px 0";
  group.style.borderBottom = "1px solid rgba(255,255,255,0.1)";

  // Title
  const titleEl = document.createElement("div");
  titleEl.textContent = title;
  titleEl.style.fontWeight = "700";
  titleEl.style.fontSize = "14px";
  group.appendChild(titleEl);

  // Subtitle
  if (subtitle) {
    const subtitleEl = document.createElement("div");
    subtitleEl.textContent = subtitle;
    subtitleEl.style.fontSize = "12px";
    subtitleEl.style.opacity = "0.7";
    group.appendChild(subtitleEl);
  }

  // Append provided elements
  elements.forEach((el) => group.appendChild(el));

  // Append group to container
  container.appendChild(group);

  return group;
}

/**
 * Adds elements to an existing settings group.
 *
 * @param {string} groupId - ID of the existing group.
 * @param {HTMLElement|HTMLElement[]} elements - Element(s) to append to the group.
 */
function addToSettingsGroup(groupId, elements) {
  const group = document.getElementById(groupId);
  if (!group) {
    console.error(`Settings group with id "${groupId}" not found.`);
    return;
  }

  if (!Array.isArray(elements)) elements = [elements];
  elements.forEach((el) => group.appendChild(el));
}

/**
 * Creates a persistent settings input bound to Storage.
 *
 * @param {Object} options
 * @param {string} options.key           Storage key
 * @param {string} options.label         Label text
 * @param {string} [options.type]        Input type (checkbox, number, text, select, etc.)
 * @param {*}      [options.defaultValue] Default value if none stored
 * @param {Object} [options.inputProps]  Extra properties to assign to the input
 * @param {Array}  [options.options]     Options for <select> [{ value, label }]
 * @param {Function} [options.onChange]  Callback when value changes
 *
 * @returns {{ container: HTMLElement, input: HTMLElement }}
 */
function createSettingsInput({
  key,
  id = "",
  label,
  type = "checkbox",
  defaultValue = null,
  inputProps = {},
  containerProps = {},
  options = [],
  onChange = null,
}) {
  if (!key || !label) {
    throw new Error("createSettingsInput requires both key and label");
  }

  // Load stored value
  const storedValue = Storage.get(key, defaultValue);

  // Container
  const container = document.createElement("label");
  container.className = "settings-input";
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.gap = "8px";
  container.style.cursor = "pointer";
  container.style.marginTop = "6px";

  // Assign extra properties
  const { style, ...rest } = containerProps;
  Object.assign(container, rest);
  if (style) {
    Object.assign(container.style, style);
  }

  // Label text
  const textEl = document.createElement("span");
  textEl.textContent = label;
  textEl.style.marginLeft = "5px";
  textEl.style.marginRight = "5px";

  let input;

  // ----- Create input -----
  if (type === "select") {
    input = document.createElement("select");

    options.forEach(({ value, label }) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      input.appendChild(opt);
    });

    input.value = storedValue;
  } else {
    input = document.createElement("input");
    input.type = type;
    input.style.marginLeft = "5px";
    input.style.marginRight = "5px";

    if (type === "checkbox") {
      input.checked = Boolean(storedValue);
    } else if (storedValue !== null) {
      input.value = storedValue;
    }
  }

  // Assign extra properties
  const { style: style2, ...rest2 } = inputProps;
  Object.assign(input, rest2);
  if (style2) {
    Object.assign(input.style, style2);
  }

  // Tag input for discovery
  input.dataset.settingKey = key;

  // ----- Persistence -----
  const getValue = () => {
    if (type === "checkbox") return input.checked;
    if (type === "number") return Number(input.value);
    return input.value;
  };

  input.addEventListener("change", () => {
    const value = getValue();
    Storage.set(key, value);

    if (typeof onChange === "function") {
      onChange(value, input);
    }
  });

  input.id = id || key;

  // Optional slider styling compatibility
  if (type === "checkbox") {
    container.classList.add("switch-label");
    const slider = document.createElement("span");
    slider.className = "slider";

    const labelText = document.createElement("span");
    labelText.textContent = label;

    container.appendChild(input); // 👈 input first
    container.appendChild(slider); // 👈 slider immediately after
    container.appendChild(labelText); // 👈 text last
  } else {
    // Assemble
    container.appendChild(textEl);
    container.appendChild(input);
  }

  return { container, input };
}

// Run settings initializer
initSettingsDrawer();

// ------------------------ Settings Drawer --------------------------- //

function injectIntoPage(fn) {
  const script = document.createElement("script");
  script.textContent = `(${fn.toString()})();`;
  document.documentElement.appendChild(script);
  script.remove();
}

// IN BROWSER DEBUGGING
await (async function () {
  const useDebugConsole = Storage.get("ui-improvements:debugConsole", false);
  let container = document.getElementById("debug-log-container");
  const LOG_KEY = "ui-improvements:debugConsole:logs";
  const MAX_LOGS = 500;
  if (useDebugConsole) {
    if (!container) {
      injectIntoPage(function () {
        if (window.__DEBUG_CONSOLE_INSTALLED__) return;
        window.__DEBUG_CONSOLE_INSTALLED__ = true;

        const METHODS = ["log", "warn", "error", "info", "debug", "trace"];

        const original = {};

        function send(type, args) {
          window.postMessage(
            {
              __DEBUG_CONSOLE__: true,
              type,
              args: args.map((a) => {
                try {
                  return typeof a === "object" ? structuredClone(a) : a;
                } catch {
                  return String(a);
                }
              }),
            },
            "*"
          );
        }

        METHODS.forEach((type) => {
          original[type] = console[type];
          console[type] = (...args) => {
            original[type]?.apply(console, args);
            send(type, args);
          };
        });

        window.addEventListener("error", (e) => {
          send("error", [e.message, `${e.filename}:${e.lineno}`]);
        });

        window.addEventListener("unhandledrejection", (e) => {
          send("error", ["Unhandled Promise Rejection", e.reason]);
        });

        console.log("Debug console attached (page context)");
      });

      window.addEventListener("message", (e) => {
        if (!e.data || e.data.__DEBUG_CONSOLE__ !== true) return;
        appendLog(e.data.type, e.data.args);
      });

      // ==========================
      // Inject Styles
      // ==========================
      const style = document.createElement("style");
      style.textContent = `
        #debug-log-modal {
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.85);
            z-index: 99999;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: translateY(20px);
            pointer-events: none;
            transition: opacity 0.25s ease, transform 0.25s ease;
        }
    
        #debug-log-modal.open {
            opacity: 1;
            transform: translateY(0);
            pointer-events: auto;
        }
    
        #debug-log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 14px;
            background: #0f172a;
            border-bottom: 1px solid #1e293b;
            color: #e5e7eb;
            font-weight: 600;
        }
    
        #debug-log-close {
            background: none;
            border: none;
            color: #e5e7eb;
            font-size: 20px;
            cursor: pointer;
        }
    
        #debug-log-container {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            font-family: monospace;
            font-size: 13px;
            line-height: 1.4;
            background: #020617;
        }
    
        .debug-log-entry {
            margin-bottom: 4px;
            white-space: pre-wrap;
            word-break: break-word;
        }
    
        .debug-log-log { color: #e5e7eb; }
        .debug-log-warn { color: #facc15; }
        .debug-log-error { color: #f87171; }
        .debug-log-info { color: #38bdf8; }
        .console-trigger {
            position: fixed;
            right: 230px;
            bottom: 17px;
            z-index: 10001;
            background: #24263a;
            border: 1px solid #2f324d;
            box-shadow: 0 10px 24px rgba(0, 0, 0, .6);
            border-radius: 12px;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            line-height: 1;
            cursor: pointer;
            font-weight: 700;
            font-size: 14px;
            line-height: 1.2;
            padding: 10px 12px;
            gap: 6px;
        }
        #debug-log-clear {
            background: none;
            border: 1px solid #334155;
            color: #e5e7eb;
            padding: 4px 8px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 12px;
        }
        
        #debug-log-clear:hover {
            background: #1e293b;    
        }
          
        `;
      document.head.appendChild(style);

      // ==========================
      // Create DOM
      // ==========================
      const modal = document.createElement("div");
      modal.id = "debug-log-modal";

      const header = document.createElement("div");
      header.id = "debug-log-header";

      const title = document.createElement("div");
      title.textContent = "Debug Console";

      const actions = document.createElement("div");
      actions.style.display = "flex";
      actions.style.gap = "8px";

      const clearBtn = document.createElement("button");
      clearBtn.id = "debug-log-clear";
      clearBtn.textContent = "🧹";
      clearBtn.title = "Clear logs";

      clearBtn.addEventListener("click", () => {
        container.innerHTML = "";
        Storage.set("ui-improvements:debugConsole:logs", []);
        console.log("[Debug Console] Logs cleared");
      });

      const closeBtn = document.createElement("button");
      closeBtn.id = "debug-log-close";
      closeBtn.textContent = "×";

      container = document.createElement("div");
      container.id = "debug-log-container";

      const persistedLogs = Storage.get(LOG_KEY, []);

      persistedLogs.forEach((entry) => {
        appendLog(entry.type, entry.args, false);
      });

      // Prevent duplicate trigger button
      if (!document.getElementById("openConsoleBtn")) {
        const originalBtn = document.getElementById("openQuickSetDrawerBtn");
        if (!originalBtn) {
          console.error("Original Quick Sets trigger button not found.");
          return;
        }

        const btn = originalBtn.cloneNode(true);
        btn.id = "openConsoleBtn";

        // Remove old classes and add new
        btn.className = "";
        btn.classList.add("console-trigger");

        btn.title = "Open Console";
        btn.textContent = "📟";

        btn.addEventListener("click", () => {
          openModal();
        });

        originalBtn.insertAdjacentElement("afterend", btn);
      }

      actions.appendChild(clearBtn);
      actions.appendChild(closeBtn);
      header.appendChild(title);
      header.appendChild(actions);
      modal.appendChild(header);
      modal.appendChild(container);
      document.body.appendChild(modal);

      // ==========================
      // Open / Close Logic
      // ==========================
      function openModal() {
        modal.classList.add("open");
      }

      function closeModal() {
        modal.classList.remove("open");
      }

      closeBtn.addEventListener("click", closeModal);
      //   // Expose controls globally
      //   window.openDebugLog = openModal;
      //   window.closeDebugLog = closeModal;
    } else {
      console.log("container already exists, skipping");
    }

    // ==========================
    // Console Hijacking
    // ==========================
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error,
      info: console.info,
    };

    // ==========================
    // Console Bridge (Userscript)
    // ==========================
    function appendLog(type, args, persist = true) {
      const entry = document.createElement("div");
      entry.className = `debug-log-entry debug-log-${type}`;
      const time = new Date().toLocaleTimeString();
      entry.textContent =
        `[${time}] [${type.toUpperCase()}] ` +
        args
          .map((a) =>
            typeof a === "object" ? JSON.stringify(a, null, 2) : String(a)
          )
          .join(" ");

      container.appendChild(entry);
      container.scrollTop = container.scrollHeight;
      if (!persist) {
        return;
      }

      const persistLogsSetting = Storage.get(
        "ui-improvements:persistLogs",
        true
      );
      if (persistLogsSetting) {
        const logs = Storage.get(LOG_KEY, []);
        logs.push({
          type,
          time: Date.now(),
          args,
        });

        if (logs.length > MAX_LOGS) {
          logs.splice(0, logs.length - MAX_LOGS);
        }

        Storage.set(LOG_KEY, logs);
      }
    }

    console.log = (...args) => {
      originalConsole.log(...args);
      appendLog("log", args);
    };

    console.warn = (...args) => {
      originalConsole.warn(...args);
      appendLog("warn", args);
    };

    console.error = (...args) => {
      originalConsole.error(...args);
      appendLog("error", args);
    };

    console.info = (...args) => {
      originalConsole.info(...args);
      appendLog("info", args);
    };

    Object.defineProperty(console, "log", {
      configurable: false,
      writable: false,
      value: console.log,
    });
  }
})();
