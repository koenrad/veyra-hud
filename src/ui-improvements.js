// ==UserScript==
// @name         UI Improvements
// @namespace    http://tampermonkey.net/
// @version      2.0.4
// @description  Makes various ui improvements. Faster lootX, extra menu items, auto scroll to current battlepass, sync battlepass scroll bars
// @author       [SEREPH] koenrad
// @updateURL    https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/ui-improvements.js
// @downloadURL  https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/ui-improvements.js
// @require      https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/veyra-hud-core.js
// @match        https://demonicscans.org/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=demonicscans.org
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  ("use strict");

  GM_addStyle(`
    .custom-loot-btn {
      background: #333;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-size: 13px;
      line-height: 1.2;
      color: #fff;
      cursor: pointer;
      box-shadow: 0 6px 18px rgba(0, 0, 0, .6);
      border: 1px solid #2b2d44;
      white-space: nowrap;
    }
    .flash-red-border {
      position: relative; /* safe for most elements */
      border: 2px solid red;
      animation: flashRedBorder 1s infinite;
    }

    @keyframes flashRedBorder {
      0% {
        border-color: red;
      }
      50% {
        border-color: transparent;
      }
      100% {
        border-color: red;
      }
    }
    
  `);

  // ===============================
  // UTILITIES
  // ===============================

  async function useHealthPotion() {
    try {
      if (!USER_ID) {
        showNotification("USER_ID not set!", "error");
        return;
      }

      const fd = new URLSearchParams();
      fd.set("user_id", USER_ID);

      const res = await fetch("user_heal_potion.php", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: fd.toString(),
      });

      const ct = res.headers.get("content-type") || "";
      const raw = await res.text();
      let data = null;
      if (ct.includes("application/json")) {
        try {
          data = JSON.parse(raw);
        } catch {}
      }

      if (!res.ok || !data) {
        showNotification(
          data?.message || raw.slice(0, 200) || `HTTP ${res.status}`,
          "error"
        );
        return;
      }
      if (String(data.status).trim() === "success") {
        showNotification(data.message || "Healed!", "success");
        setTimeout(() => location.reload(), 500);
      } else {
        showNotification(data.message || "Heal failed.", "error");
      }
    } catch (e) {
      console.log(e);
      showNotification("Network error.", "error");
    }
  }

  function addMenuLinkAfter(afterLabel, newUrl, newTitle, newIcon = "✨") {
    // Find the anchor with the matching label text
    const targetLink = [...document.querySelectorAll(".side-nav-item")].find(
      (el) => el.querySelector(".side-label")?.textContent.trim() === afterLabel
    );

    if (!targetLink) {
      console.warn(`Menu item "${afterLabel}" not found.`);
      return;
    }

    // Create the new menu item
    const newLink = document.createElement("a");
    newLink.classList.add("side-nav-item");
    newLink.href = newUrl;

    newLink.innerHTML = `
      <span class="side-icon">${newIcon}</span>
      <span class="side-label">${newTitle}</span>
    `;

    // Insert after the target
    targetLink.insertAdjacentElement("afterend", newLink);
  }

  // ---------------------------- Top Bar ------------------------------- //

  const { container: betterGameTopBarToggle } = createSettingsInput({
    key: "ui-improvements:betterGameTopBar",
    label: "Better Header",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });

  const betterGameTopBar = Storage.get(
    "ui-improvements:betterGameTopBar",
    true
  );
  if (betterGameTopBar) {
    GM_addStyle(`
      body {
        margin-bottom: 35px;
      }
      .game-topbar {
        position: relative !important;
      }
      body {
        padding-block: 0px !important;
        padding-inline: 0px !important;
        padding-top: 0px !important;
      }
      @media (max-width: 600px) {
        body {
            padding-top: 0px !important;
        }
      }
    `);
    const gtbleft = document.querySelector(".gtb-left");
    if (gtbleft) {
      // wrap the top bar, even on small screens.
      gtbleft.style.setProperty("flex-wrap", "wrap", "important");
    }
  }

  // ---------------------------- Top Bar ------------------------------- //

  // -------------------- Menu Sidebar / Navigation -------------------- //

  const { container: useCustomNavigationToggle } = createSettingsInput({
    key: "ui-improvements:useCustomNavigation",
    label: "Custom Navigation",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });

  addSettingsGroup("global", "Global Settings", "Global settings", [
    useCustomNavigationToggle,
    betterGameTopBarToggle,
  ]);

  const useCustomNavigation = Storage.get(
    "ui-improvements:useCustomNavigation",
    true
  );

  if (useCustomNavigation) {
    // Find the event link by its label
    const eventLink = [...document.querySelectorAll(".side-nav-item")].find(
      (el) =>
        el.querySelector(".side-label")?.textContent.trim() === "New Year Event"
    );

    // Move New Year Event link to the bottom of the menu
    if (eventLink) {
      addMenuLinkAfter(
        "Battle Pass",
        eventLink.href,
        eventLink.querySelector(".side-label").textContent,
        eventLink.querySelector(".side-icon").textContent
      );
      eventLink.remove();
    }

    // Find the "Home" link by its label text
    const homeLink = [...document.querySelectorAll(".side-nav-item")].find(
      (el) => el.querySelector(".side-label")?.textContent.trim() === "Home"
    );

    if (homeLink) {
      addMenuLinkAfter(
        "Home",
        "/active_wave.php?gate=3&wave=8",
        "Wave 3",
        "🌊"
      );
      addMenuLinkAfter(
        "Wave 3",
        "/adventurers_guild.php",
        "Adventurer's Guild",
        "🛡️"
      );
      addMenuLinkAfter(
        "Blacksmith",
        "/legendary_forge.php",
        "Legendary Forge",
        "🔥"
      );
      addMenuLinkAfter("Guild", "/guild_dungeon.php", "Guild Dungeons", "🕳️");
    }
  }
  // -------------------- Menu Sidebar / Navigation -------------------- //

  // --------------------- Adventurer's Guild Page --------------------- //
  // Align the accept quest button on the Adventurer's Guild to the bottom of the element
  document.querySelectorAll(".quest-side").forEach((el) => {
    el.style.marginTop = "auto";
  });
  // --------------------- Adventurer's Guild Page --------------------- //

  // ------------------------ Battle Pass Page ------------------------- //

  const { container: syncBattlePassScrollbarsToggle } = createSettingsInput({
    key: "ui-improvements:syncBattlePassScrollbars",
    label: "Sync Scrollbars",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });

  const { container: scrollToCurrentLevelToggle } = createSettingsInput({
    key: "ui-improvements:scrollToCurrentLevel",
    label: "Auto Scroll to Current Level",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });

  addSettingsGroup(
    "battlepass-page",
    "BattlePass Settings",
    "Settings related to the Battlepass page",
    [syncBattlePassScrollbarsToggle, scrollToCurrentLevelToggle]
  );

  const syncBattlePassScrollbars = Storage.get(
    "ui-improvements:syncBattlePassScrollbars",
    true
  );
  const scrollToCurrentLevel = Storage.get(
    "ui-improvements:scrollToCurrentLevel",
    true
  );

  // sync scroll bars
  function syncScrollBars() {
    const scrollContainers = Array.from(
      document.querySelectorAll(".bp-scroll")
    );

    let isSyncing = false;

    scrollContainers.forEach((container) => {
      container.addEventListener("scroll", () => {
        if (isSyncing) return;
        isSyncing = true;

        const x = container.scrollLeft;

        scrollContainers.forEach((other) => {
          if (other !== container) {
            other.scrollLeft = x;
          }
        });

        isSyncing = false;
      });
    });
  }

  function getHighestReachedLevel() {
    const reachedBadges = [...document.querySelectorAll(".lvl-badge")].filter(
      (b) => b.textContent.trim() === "Reached"
    );

    if (reachedBadges.length === 0) return null;

    // Extract L# from the sibling badge
    const levels = reachedBadges
      .map((badge) => {
        const parent = badge.parentElement;
        const levelBadge = parent.querySelector(
          '.lvl-badge:not([style*="Reached"])'
        );
        if (!levelBadge) return null;
        const match = levelBadge.textContent.trim().match(/^L(\d+)$/);
        return match ? parseInt(match[1], 10) : null;
      })
      .filter((n) => n !== null);
    return Math.max(...levels);
  }

  function scrollToLevel(level) {
    const scrollContainers = document.querySelectorAll(".bp-scroll");
    if (!scrollContainers) return;
    for (const scrollContainer of scrollContainers) {
      const cards = [...scrollContainer.querySelectorAll(".level-card")];

      let targetCard = cards.find((card) => {
        const badge = card.querySelector(".lvl-top .lvl-badge");
        if (!badge) return false;
        return badge.textContent.trim() === `L${level}`;
      });

      if (!targetCard) return;
      const offset =
        targetCard.offsetLeft -
        scrollContainer.clientWidth / 2 +
        targetCard.clientWidth / 2;

      scrollContainer.scrollTo({
        left: offset,
        behavior: "smooth",
      });
    }
  }

  async function autoScrollToCurrentLevel() {
    const level = getHighestReachedLevel();
    if (!level) return;
    if (scrollToCurrentLevel) {
      scrollToLevel(level);
    }
    await sleep(1000);
    if (syncBattlePassScrollbars) {
      syncScrollBars();
    }
  }

  setTimeout(() => {
    autoScrollToCurrentLevel();
  }, 1300);

  // ------------------------ Battle Pass Page ------------------------- //

  // -------------------------- Wave X Page ---------------------------- //
  const {
    container: enableCustomAttackStrategyToggle,
    input: enableCustomAttackStrategyInput,
  } = createSettingsInput({
    key: "ui-improvements:enableCustomAttackStrategy",
    label: "Strategic Attack",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });
  const { container: useParallelJoinsToggle, input: useParallelJoinsInput } =
    createSettingsInput({
      key: "ui-improvements:useParallelJoins",
      label: "Join Mobs in Parallel",
      defaultValue: true,
      type: "checkbox",
      inputProps: { slider: true },
    });
  const { container: enableLootXFasterToggle } = createSettingsInput({
    key: "ui-improvements:enableLootXFaster",
    label: "Faster Loot X",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });
  const { container: enableInBattleCountToggle } = createSettingsInput({
    key: "ui-improvements:enableInBattleCount",
    label: "In Battle Count",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });
  const { container: showHpBarToggle, input: hpBarInput } = createSettingsInput(
    {
      key: "ui-improvements:showHpBar",
      label: "Show HP Bar",
      defaultValue: true,
      type: "checkbox",
      inputProps: { slider: true },
    }
  );

  const { container: hpBarColorContainer } = createSettingsInput({
    key: "ui-improvements:hpBarColor",
    label: "HP Bar Color",
    defaultValue: true,
    type: "color",
  });

  let showHpBar = hpBarInput.checked;
  hpBarColorContainer.style.display = showHpBar ? "inline-block" : "none";

  hpBarInput.addEventListener("change", () => {
    showHpBar = hpBarInput.checked;
    hpBarColorContainer.style.display = showHpBar ? "inline-block" : "none";
  });

  let showUseParallelToggle = enableCustomAttackStrategyInput.checked;
  useParallelJoinsToggle.style.display = showUseParallelToggle
    ? "flex"
    : "none";

  enableCustomAttackStrategyInput.addEventListener("change", () => {
    showUseParallelToggle = enableCustomAttackStrategyInput.checked;
    useParallelJoinsToggle.style.display = showUseParallelToggle
      ? "flex"
      : "none";
  });

  addSettingsGroup(
    "wave-page",
    "Wave Page",
    "Settings related to the wave page.",
    [
      enableCustomAttackStrategyToggle,
      useParallelJoinsToggle,
      enableInBattleCountToggle,
      enableLootXFasterToggle,
      showHpBarToggle,
      hpBarColorContainer,
    ]
  );

  if (window.location.href.includes("/active_wave.php")) {
    // ---------------- constants ------------------ //
    let inBattleCount = 0;
    const hideDeadRaw = getCookie("hide_dead_monsters");
    const HIDE_DEAD_MONSTERS = hideDeadRaw === "1" || hideDeadRaw === "true";

    // -------------- Loot X Faster ---------------- //
    const enableLootXFaster = Storage.get(
      "ui-improvements:enableLootXFaster",
      true
    );
    if (enableLootXFaster) {
      function overrideLootX() {
        const btnLootX = document.getElementById("btnLootX");
        if (btnLootX) {
          const customBtn = document.createElement("button");
          customBtn.id = "btnCustomLoot";
          customBtn.type = "button";
          customBtn.className = "custom-loot-btn";
          customBtn.textContent = "💰 Loot X monsters (super fast)";

          btnLootX.insertAdjacentElement("afterend", customBtn);
          btnLootX.textContent = "💰 Loot X monsters (vanilla)";

          customBtn?.addEventListener("click", async () => {
            const n = Math.max(1, parseInt($input.value || "1", 10));
            const eligibleEls = Array.from(
              document.querySelectorAll('.monster-card[data-eligible="1"]')
            );
            const targetIds = eligibleEls
              .slice(0, n)
              .map((el) => parseInt(el.dataset.monsterId, 10))
              .filter(Boolean);

            if (targetIds.length === 0) {
              $stat.textContent = "No eligible dead monsters you joined.";
              return;
            }

            setRunning(true);
            let ok = 0,
              fail = 0;
            let totalExp = 0,
              totalGold = 0;
            const allItems = [];
            const allNotes = [];
            const promises = targetIds.map(async (targetId, i) => {
              $stat.textContent = `Looting ${i + 1}/${
                targetIds.length
              }... (success: ${ok}, fail: ${fail})`;

              try {
                const res = await lootOne(targetId);

                if (res.ok) {
                  ok++;
                  totalExp += res.exp;
                  totalGold += res.gold;

                  if (res.items?.length) {
                    allItems.push(...res.items);
                  } else if (res.note) {
                    allNotes.push(res.note);
                  }

                  const el = document.querySelector(
                    `.monster-card[data-monster-id="${targetId}"]`
                  );
                  if (el) el.setAttribute("data-eligible", "0");
                } else {
                  fail++;
                  if (res.note) allNotes.push(res.note);
                }
              } catch {
                fail++;
                allNotes.push("Server error");
              }
            });

            await Promise.all(promises);
            $stat.textContent = `Done. Looted ${ok}, failed ${fail}.`;
            setRunning(false);
            openBatchLootModal(
              {
                processed: targetIds.length,
                success: ok,
                fail,
                exp: totalExp,
                gold: totalGold,
              },
              allItems,
              allNotes
            );
          });
        }
      }
      overrideLootX();
    }
    // -------------- Loot X Faster ---------------- //

    // --------- In Battle Count Injection ------------//
    const enableInBattleCount = Storage.get(
      "ui-improvements:enableInBattleCount",
      true
    );
    if (enableInBattleCount) {
      const calculateInBattle = () => {
        const monsterCards = document.querySelectorAll(".monster-card");

        let joinedCount = 0;

        monsterCards.forEach((card) => {
          if (card.dataset.joined === "1") {
            joinedCount++;
          }
        });
        return HIDE_DEAD_MONSTERS ? joinedCount : "??";
      };

      inBattleCount = calculateInBattle();

      const blLeft = document.querySelector(".bl-left");
      if (blLeft) {
        const inBattleDiv = document.createElement("div");
        const count = document.createElement("span");
        count.className = "count";
        count.id = "in-battle-count";
        count.textContent = inBattleCount.toString();
        inBattleDiv.className = "unclaimed-pill";
        inBattleDiv.textContent = `💪 In Battle:`;
        inBattleDiv.appendChild(count);
        blLeft.appendChild(inBattleDiv);
      }
    }
    // --------- In Battle Count Injection End ---------//

    // ------------- Custom Attack Strategy ------------//

    const JOIN_URL = ENDPOINTS && ENDPOINTS.JOIN ? ENDPOINTS.JOIN : "";
    const ATTACK_URL = ENDPOINTS && ENDPOINTS.ATTACK ? ENDPOINTS.ATTACK : "";

    let attackStrategy = Storage.get("ui-improvements:attackStrategy", []);

    GM_addStyle(`
      .attack-strat-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,.6);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .attack-strat-modal {
        background: #1f2233;
        padding: 16px;
        border-radius: 8px;
        width: 470px;
        margin: 5px;
        color: #e6e8ff;
        box-shadow: 0 10px 30px rgba(0,0,0,.4);
        max-height: 70%;
        overflow: auto;
      }

      .attack-strat-title {
        margin: 0 0 10px;
      }

      .attack-strat-picker {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-bottom: 10px;
      }

      .attack-strat-label {
        font-size: 12px;
        color: #9aa0be;
        margin-bottom: 6px;
      }

      .attack-strat-chips {
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      .attack-strat-meta {
        margin-top: 10px;
        font-size: 12px;
        color: #9aa0be;
      }

      .attack-strat-footer {
        margin-top: 14px;
        text-align: right;
      }

      .attack-strat-chip {
        display: flex;
        align-items: center;
        background: #2d3154;
        padding: 6px 10px;
        border-radius: 8px;
        font-size: 12px;
        width: 100%;
        box-sizing: border-box;
      }

      .attack-strat-chip-label {
        flex: 1;
        text-transform: capitalize;
      }

      .capitalize {
        text-transform: capitalize;
      }

      .attack-strat-chip-controls {
        display: flex;
        align-items: center;
        gap: 5px;
      }

      .attack-strat-chip-btn {
        background: none;
        border: none;
        cursor: pointer;
        color: #9aa0be;
        font-size: 12px;
        padding: 5px 15px;
        background-color: #1f2233;
        border-radius:5px
      }

      .attack-strat-chip-remove {
        color: #ef4444;
      }

      .attack-strat-chip-btn.is-disabled {
        opacity: 0.3;
        pointer-events: none;
      }

      .attack-strat-skill-btn {
        font-size: 12px;
        padding: 4px 8px;
        background: #151728;
        border-color: #2d3154;
        text-transform: capitalize;
      }
      .total-stam-cost {
        color: #FFD369;
        font-weight: 700;
        text-shadow: 0 0 6px rgba(255, 211, 105, .6);
      }
      .attack-strat-asterion {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
        font-size: 12px;
        color: #9aa0be;
      }

      .attack-strat-checkbox {
        width: 16px;
        height: 16px;
        padding-right: 10px
      }

      .attack-strat-label {
        cursor: pointer;
      }

      .attack-strat-asterion-input, .attack-strat-damage-limit-input {
        width: 60px;
        padding: 2px 4px;
        border-radius: 4px;
        border: 1px solid #2d3154;
        background: #2d3154;
        color: #e6e8ff;
      }
      .attack-strat-damage-limit-input {
        width: 120px;
      }
      .battle-card {
        background:#1a1b25;
        border:1px solid #24263a;
        border-radius:16px;
        box-shadow:0 12px 32px rgba(0,0,0,0.5);
        padding:16px 18px;
        position:relative;
        display:flex;
        flex-direction:column;
        gap:12px;
        max-width: 100%;
        width: 100%;
        box-sizing: border-box;
        overflow-x: hidden;
        min-width: 0; /* <- super important for flex items in grids */
        max-width: 900px;
        min-width: 0;
        box-sizing: border-box;
        word-break: break-word;
        margin: 0 auto 18px;
      }

      /* Player MANA = blue */
      .mana-fill--player {
        background: linear-gradient(90deg, #4b7bff, #2f53ff);
      }

      .custom-monster-container {
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

     .monster-row {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 16px;
        width: 100%;
        position: relative;
        padding-bottom: 30px;
      }
      .monster-row::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 10%;
        right: 10%;
        height: 10px;
        background: linear-gradient(
          to right,
          transparent,
          rgba(255, 255, 255, 0.7),
          transparent
        );
      }



      `);

    // Pass in any monster id that is valid to grab the hp and mana bars.
    async function fetchHpAndManaFragment(monster_id) {
      const response = await fetch(`/battle.php?id=${monster_id}`);
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const playerCard = document.createElement("div");
      playerCard.className = "battle-card player-card";
      playerCard.id = "custom-hp-bar";

      const livePlayerCard = doc.querySelector(".battle-card.player-card");

      const hpBars = livePlayerCard.getElementsByClassName("hp-bar");
      const hpBarColor = Storage.get("ui-improvements:hpBarColor", "#55ff55");

      if (hpBars) {
        // console.log("hpBars", hpBars);
        for (const hpBar of hpBars) {
          const hpBarContainer = hpBar.parentElement;
          // console.log(hpBarContainer);
          const hpEl = hpBarContainer.querySelector("#pHpFill");
          if (hpEl) {
            const hpPercent = parseFloat(hpEl.style.width);
            hpEl.style.background = hpBarColor;
            // console.log("hpPercent", hpPercent);
            if (hpPercent < 10) {
              playerCard.className = `flash-red-border needs-heal ${playerCard.className}`;
            }
          }
          playerCard.appendChild(hpBarContainer);
        }
      }

      return playerCard;
    }

    const Skills = Object.freeze({
      slash: { id: "-0", cost: 1 },
      "power slash": { id: "-1", cost: 10 },
      "heroic slash": { id: "-2", cost: 50 },
      "ultimate slash": { id: "-3", cost: 100 },
      "legendary slash": { id: "-4", cost: 200 },
    });

    function escapeHtml(s) {
      return String(s || "").replace(
        /[&<>"']/g,
        (m) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
          }[m])
      );
    }

    function getAttackStrategyCost(strategy = []) {
      if (!Array.isArray(strategy)) return 0;

      // Get asterion settings from storage
      const useAsterion = Storage.get("ui-improvements:useAsterion") || false;
      const asterionValue =
        parseFloat(Storage.get("ui-improvements:asterionValue")) || 1;

      return strategy.reduce((total, skillName) => {
        const skill = Skills[skillName];
        let cost = skill?.cost || 0;
        if (useAsterion) cost = Math.ceil(cost * asterionValue);
        return total + cost;
      }, 0);
    }

    function normalizeOk(r) {
      const raw = String(r?.raw || "");
      const d = r?.data || {};

      const ok =
        d.status === "success" ||
        d.ok === true ||
        d.success === true ||
        /^\s*success\s*$/i.test(raw) ||
        /joined|already joined/i.test(raw);

      const msg =
        typeof d.message === "string" && d.message.trim()
          ? d.message
          : typeof d.error === "string" && d.error.trim()
          ? d.error
          : raw || (ok ? "OK" : "Failed");

      return { ok, msg, data: d, raw };
    }

    function openBatchAttackModal(results) {
      const ok = results.filter((r) => r.ok).length;
      const fail = results.length - ok;

      const sum = document.getElementById("bamSummary");
      const list = document.getElementById("bamList");

      if (sum) {
        sum.textContent = `Processed: ${results.length} | Success: ${ok} | Failed: ${fail}`;
      }

      if (list) {
        list.innerHTML = ""; // clear previous entries

        results.forEach((r) => {
          const color = r.ok ? "#7CFFB8" : "#ff6b6b";
          const border = r.ok ? "rgba(0,255,140,.25)" : "rgba(255,0,80,.25)";

          // Outer card
          const card = document.createElement("div");
          card.style.cssText = `
        background:#1e1e2f;
        border:1px solid ${border};
        border-radius:10px;
        padding:10px 12px;
      `;

          // Header row
          const header = document.createElement("div");
          header.style.cssText = `
        display:flex;
        justify-content:space-between;
        gap:10px;
        align-items:center;
      `;

          const monster = document.createElement("div");
          monster.style.fontWeight = "700";
          monster.style.color = "#e6e9ff";
          monster.textContent = `#${r.monsterId ?? "?"}`;

          const status = document.createElement("div");
          status.style.fontWeight = "800";
          status.style.color = color;
          status.textContent = r.ok ? "✅ OK" : "❌ FAIL";

          header.append(monster, status);

          // Message container
          const msgWrap = document.createElement("div");
          msgWrap.style.cssText = `
        margin-top:6px;
        color:#9aa0be;
        font-size:12px;
        line-height:1.45;
      `;
          console.log("r", r);
          msgWrap.appendChild(r.msgEl);

          card.append(header, msgWrap);
          list.appendChild(card);
        });
      }

      document.getElementById("batchAttackModal").style.display = "flex";
    }

    function showStatus(t) {
      const statusEl = document.getElementById("batchAttackStatus");
      if (!statusEl) return;
      statusEl.innerHTML = t || "";
    }

    function setQuickBtnsRunning(running) {
      const quickBtns = Array.from(
        document.querySelectorAll(".btnQuickJoinAttack")
      );
      quickBtns.forEach((b) => {
        b.disabled = running;
        b.style.opacity = running ? "0.7" : "";
      });
    }

    function buildResult(skill, ok, msg, damage = 0) {
      const msgEl = document.createElement("div");
      msgEl.innerHTML = msg;
      msgEl.className = ok ? "attack-success" : "attack-fail";

      return {
        skill,
        ok,
        msg,
        msgEl,
        damage,
      };
    }

    async function performAttackStrat(monsterId, attackStrat) {
      const useDamageLimit = Storage.get(
        "ui-improvements:useDamageLimit",
        false
      );
      const damageLimitValue = parseFloat(
        Storage.get("ui-improvements:damageLimitValue") || 0
      );

      const results = [];
      let totalDamage = 0;

      for (const skillName of attackStrat) {
        const skill = Skills[skillName.toLowerCase()];

        if (!skill) {
          results.push(
            buildResult(skillName, false, `Unknown skill: ${skillName}`)
          );
          continue;
        }

        if (
          useDamageLimit &&
          damageLimitValue > 0 &&
          totalDamage >= damageLimitValue
        ) {
          console.info(`Target damage reached, skipping ${skillName}`);
          break;
        }

        try {
          const res = await doAttack(
            monsterId,
            parseInt(skill.id, 10),
            skill.cost
          );

          const msg =
            res.msg ||
            (res.ok
              ? `Attacked with ${skillName}`
              : `Attack failed with ${skillName}`);

          const match = msg.match(/<strong>([\d,]+)<\/strong>/);
          const damage = match ? Number(match[1].replace(/,/g, "")) : 0;

          totalDamage += damage;

          results.push(buildResult(skillName, !!res.ok, msg, damage));

          if (!res.ok) break; // stop strategy on failure
        } catch {
          results.push(
            buildResult(
              skillName,
              false,
              `Attack request failed (${skillName})`
            )
          );
          break;
        }
      }

      return results;
    }

    function getSelectedMonsterIds() {
      return Array.from(document.querySelectorAll(".pickMonster:checked"))
        .map((cb) => parseInt(cb.dataset.mid || "0", 10))
        .filter(Boolean);
    }

    async function doJoin(monsterId) {
      if (!JOIN_URL) return { ok: false, msg: "Join endpoint not set" };
      if (!USER_ID) return { ok: false, msg: "Missing USER_ID" };

      // ✅ user_join_battle.php expects POST monster_id + user_id
      const r = await postForm(JOIN_URL, {
        monster_id: monsterId,
        user_id: USER_ID,
      });

      const n = normalizeOk(r);
      return { ok: n.ok, msg: n.msg, data: n.data, raw: n.raw };
    }

    async function doAttack(monsterId, skillId, stam) {
      if (!ATTACK_URL) return { ok: false, msg: "Attack endpoint not set" };

      // ✅ damage.php expects POST monster_id + skill_id
      const payload = {
        monster_id: monsterId,
        skill_id: skillId,
        stamina_cost: stam,
      };

      const r = await postForm(ATTACK_URL, payload);
      const n = normalizeOk(r);
      const msg =
        n.msg || (n.ok ? `Attacked (${stam})` : `Attack failed (${stam})`);
      return { ok: n.ok, msg: n.msg, data: n.data, raw: n.raw };
    }

    async function postForm(url, payload) {
      const fd = new FormData();
      Object.entries(payload || {}).forEach(([k, v]) => fd.append(k, v));

      const res = await fetch(url, {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const txt = await res.text();

      try {
        return { ok: res.ok, data: JSON.parse(txt), raw: txt };
      } catch (_e) {
        return { ok: res.ok, data: null, raw: txt };
      }
    }

    function formatShortNumber(num) {
      const abs = Math.abs(num);

      if (abs >= 1e9) {
        return (num / 1e9).toFixed(1).replace(/\.0$/, "") + "b";
      }
      if (abs >= 1e6) {
        return (num / 1e6).toFixed(1).replace(/\.0$/, "") + "m";
      }
      if (abs >= 1e3) {
        return Math.floor(num / 1e3) + "k";
      }
      return String(num);
    }

    function openAttackSettingsModal() {
      if (document.getElementById("attackStratModal")) return;

      const overlay = document.createElement("div");
      overlay.id = "attackStratModal";
      overlay.className = "attack-strat-overlay";

      const modal = document.createElement("div");
      modal.className = "attack-strat-modal";

      modal.innerHTML = `
    <h3 class="attack-strat-title">🧠 Attack Strategy Builder</h3>

    <div id="skillPicker" class="attack-strat-picker"></div>

    <div class="attack-strat-label">Strategy order:</div>

    <div id="strategyChips" class="attack-strat-chips"></div>

    <div id="strategyMeta" class="attack-strat-meta"></div>

    <div class="attack-strat-footer">
      <button class="btn attack-strat-close" id="attackStratClose">Close</button>
    </div>
  `;

      overlay.appendChild(modal);
      document.body.appendChild(overlay);

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
      });

      modal
        .querySelector("#attackStratClose")
        .addEventListener("click", () => overlay.remove());

      const picker = modal.querySelector("#skillPicker");
      const chipsWrap = modal.querySelector("#strategyChips");
      const meta = modal.querySelector("#strategyMeta");

      // Load settings localStorage
      let useAsterion = Storage.get("ui-improvements:useAsterion", false);
      let asterionValue = parseFloat(
        Storage.get("ui-improvements:asterionValue") || 1
      );
      let useDamageLimit = Storage.get("ui-improvements:useDamageLimit", false);
      let damageLimitValue = parseFloat(
        Storage.get("ui-improvements:damageLimitValue") || 0
      );
      let useParallelJoins = Storage.get(
        "ui-improvements:useParallelJoins",
        true
      );

      // ---------- Helpers ----------
      function save() {
        Storage.set("ui-improvements:attackStrategy", attackStrategy);
        Storage.set("ui-improvements:useAsterion", useAsterion);
        Storage.set("ui-improvements:asterionValue", asterionValue);
        Storage.set("ui-improvements:useDamageLimit", useDamageLimit);
        Storage.set("ui-improvements:damageLimitValue", damageLimitValue);

        Storage.set("ui-improvements:useParallelJoins", useParallelJoins);
        useParallelJoinsInput.checked = useParallelJoins;

        // update the strategic attack button on the main page
        let newButtonString = `🧠 Quick Join & Attack (${getAttackStrategyCost(
          attackStrategy
        )}) `;
        if (useDamageLimit) {
          newButtonString += `(limit ${formatShortNumber(damageLimitValue)})`;
        }
        strategyAttackBtn.textContent = newButtonString;
        updateAttackButtons();
        renderMeta();
      }

      function renderMeta() {
        let total = getAttackStrategyCost(attackStrategy);

        meta.innerHTML = `Total stamina cost: <span class="total-stam-cost">${total}</span>`;

        // ----------  Use Asterion ----------
        let asterionContainer = document.getElementById("asterionContainer");
        if (!asterionContainer) {
          asterionContainer = document.createElement("div");
          asterionContainer.id = "asterionContainer";
          asterionContainer.className = "attack-strat-asterion";

          // Checkbox container
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = "useAsterionCheckbox";
          checkbox.checked = useAsterion;
          checkbox.className = "attack-strat-checkbox";

          const label = document.createElement("label");
          label.htmlFor = "useAsterionCheckbox";
          label.className = "attack-strat-label";
          label.textContent = "Calculate Using Asterion";

          // Number input
          const input = document.createElement("input");
          input.type = "number";
          input.min = "1";
          input.step = 0.5;
          input.value = asterionValue.toString();
          input.id = "asterionInput";
          input.className = "attack-strat-asterion-input";
          input.style.display = useAsterion ? "inline-block" : "none";

          checkbox.addEventListener("change", () => {
            useAsterion = checkbox.checked;
            input.style.display = useAsterion ? "inline-block" : "none";
            save();
          });

          input.addEventListener("change", () => {
            let val = parseFloat(input.value);
            if (isNaN(val) || val <= 0) val = 1;
            asterionValue = +val.toFixed(3);
            save();
          });

          asterionContainer.appendChild(checkbox);
          asterionContainer.appendChild(label);
          asterionContainer.appendChild(input);

          meta.appendChild(asterionContainer);
        }

        let damageLimitContainer = document.getElementById(
          "damageLimitContainer"
        );
        if (!damageLimitContainer) {
          damageLimitContainer = document.createElement("div");
          damageLimitContainer.id = "damageLimitContainer";
          damageLimitContainer.className = "attack-strat-damage-limit";

          // Checkbox container
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = "useDamageLimitCheckbox";
          checkbox.checked = useDamageLimit;
          checkbox.className = "attack-strat-checkbox";

          const label = document.createElement("label");
          label.htmlFor = "useDamageLimitCheckbox";
          label.className = "attack-strat-label";
          label.textContent = "Use Damage Limit (useful for crits) ";

          // Number input
          const input = document.createElement("input");
          input.type = "number";
          input.min = "0";
          input.value = damageLimitValue.toString();
          input.id = "damageLimitInput";
          input.className = "attack-strat-damage-limit-input";
          input.style.display = useDamageLimit ? "inline-block" : "none";

          checkbox.addEventListener("change", () => {
            useDamageLimit = checkbox.checked;
            input.style.display = useAsterion ? "inline-block" : "none";
            save();
          });

          input.addEventListener("change", () => {
            let val = parseFloat(input.value);
            if (isNaN(val) || val <= 0) val = 1;
            damageLimitValue = +val.toFixed(3);
            save();
          });

          damageLimitContainer.appendChild(checkbox);
          damageLimitContainer.appendChild(label);
          damageLimitContainer.appendChild(input);

          meta.appendChild(damageLimitContainer);
        }

        // ----------  Parallel Joins Settings Checkbox ----------
        let useParallelJoinsSettingsContainer = document.getElementById(
          "useParallelJoinsSettingsContainer"
        );
        if (!useParallelJoinsSettingsContainer) {
          useParallelJoinsSettingsContainer = document.createElement("div");
          useParallelJoinsSettingsContainer.id =
            "useParallelJoinsSettingsContainer";
          useParallelJoinsSettingsContainer.className =
            "parallel-joins-settings-container";

          // Checkbox container
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = "parallelJoinsSettingCheckbox";
          checkbox.checked = useParallelJoins;
          checkbox.className = "attack-strat-checkbox";

          const label = document.createElement("label");
          label.htmlFor = "parallelJoinsSettingCheckbox";
          label.className = "attack-strat-label";
          label.textContent = "Join monsters in parallel (faster)";

          checkbox.addEventListener("change", () => {
            useParallelJoins = checkbox.checked;
            save();
          });

          useParallelJoinsSettingsContainer.appendChild(checkbox);
          useParallelJoinsSettingsContainer.appendChild(label);

          meta.appendChild(useParallelJoinsSettingsContainer);
        }
      }

      function renderStrategy() {
        chipsWrap.innerHTML = "";

        attackStrategy.forEach((skill, index) => {
          const chip = document.createElement("div");
          chip.className = "attack-strat-chip";

          const label = document.createElement("span");
          label.className = "attack-strat-chip-label";
          label.textContent = skill;

          const controls = document.createElement("div");
          controls.className = "attack-strat-chip-controls";

          const up = document.createElement("button");
          up.className = "attack-strat-chip-btn attack-strat-chip-up";
          up.textContent = "↑";
          up.title = "Move up";

          const down = document.createElement("button");
          down.className = "attack-strat-chip-btn attack-strat-chip-down";
          down.textContent = "↓";
          down.title = "Move down";

          const remove = document.createElement("button");
          remove.className = "attack-strat-chip-btn attack-strat-chip-remove";
          remove.textContent = "✕";
          remove.title = "Remove";

          if (index === 0) up.classList.add("is-disabled");
          if (index === attackStrategy.length - 1)
            down.classList.add("is-disabled");

          up.onclick = () => {
            if (index === 0) return;
            [attackStrategy[index - 1], attackStrategy[index]] = [
              attackStrategy[index],
              attackStrategy[index - 1],
            ];
            save();
            renderStrategy();
          };

          down.onclick = () => {
            if (index === attackStrategy.length - 1) return;
            [attackStrategy[index + 1], attackStrategy[index]] = [
              attackStrategy[index],
              attackStrategy[index + 1],
            ];
            save();
            renderStrategy();
          };

          remove.onclick = () => {
            attackStrategy.splice(index, 1);
            save();
            renderStrategy();
          };

          controls.append(up, down, remove);
          chip.append(label, controls);
          chipsWrap.appendChild(chip);
        });

        renderMeta();
      }

      // ---------- Skill Picker ----------
      Object.keys(Skills).forEach((skillName) => {
        const btn = document.createElement("button");
        btn.className = "btn attack-strat-skill-btn";
        btn.textContent = skillName;

        btn.onclick = () => {
          attackStrategy.push(skillName);
          save();
          renderStrategy();
        };

        picker.appendChild(btn);
      });

      renderStrategy();
    }

    async function renderHpBar() {
      const firstMonsterCard = document.querySelector(".monster-card");
      const multiAttackCard = document.querySelector("#waveQolPanel");
      if (
        HIDE_DEAD_MONSTERS &&
        firstMonsterCard &&
        multiAttackCard &&
        showHpBar
      ) {
        const existing = document.getElementById("custom-hp-bar");
        if (existing) {
          existing.remove();
        }
        const monsterId = firstMonsterCard.dataset.monsterId;
        if (monsterId) {
          const hpAndManaBars = await fetchHpAndManaFragment(monsterId);
          if (hpAndManaBars) {
            multiAttackCard.append(hpAndManaBars);
          }
        }
      } else {
        document.querySelector("#custom-hp-bar")?.remove();
      }
    }

    (function injectAttackSettings() {
      const enableCustomAttackStrategy = Storage.get(
        "ui-improvements:enableCustomAttackStrategy",
        true
      );
      if (enableCustomAttackStrategy) {
        const actions = document.querySelector(".qol-select-actions");
        if (!actions) return;

        // Prevent duplicates
        if (actions.querySelector(".btnAttackSettings")) return;

        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "btn btnAttackSettings";
        btn.textContent = "⚙️ 🧠 Settings";

        actions.appendChild(btn);

        btn.addEventListener("click", openAttackSettingsModal);
      }
    })();

    let strategyAttackBtn;

    function updateAttackButtons() {
      // console.log("updating attack buttons!");
      const asterionValue =
        parseFloat(Storage.get("ui-improvements:asterionValue")) || 1;
      const useAsterion = Storage.get("ui-improvements:useAsterion") || false;

      const attackButtons = document.querySelectorAll(".btnQuickJoinAttack");
      if (attackButtons) {
        // console.log(attackButtons);
        attackButtons.forEach((btn) => {
          const text = btn.textContent.trim();
          // console.log(text);

          const cost = useAsterion
            ? Math.ceil(btn.dataset.stam * asterionValue)
            : btn.dataset.stam;

          const updatedText = `⚡ Quick Join & Attack (${cost})`;
          btn.textContent = updatedText;
        });
      }
    }

    (async function injectAttackStratButton() {
      const enableCustomAttackStrategy = Storage.get(
        "ui-improvements:enableCustomAttackStrategy",
        true
      );

      if (enableCustomAttackStrategy) {
        const attacksWrap = document.querySelector(".qol-attacks");
        if (!attacksWrap) return;

        const useAsterion = Storage.get("ui-improvements:useAsterion") || false;
        if (useAsterion) {
          updateAttackButtons();
        }

        // Prevent duplicate injection
        if (attacksWrap.querySelector(".btnAttackStrat")) return;

        let useDamageLimit = Storage.get(
          "ui-improvements:useDamageLimit",
          false
        );
        let damageLimitValue = parseFloat(
          Storage.get("ui-improvements:damageLimitValue") || 0
        );

        let newButtonString = `🧠 Quick Join & Attack (${getAttackStrategyCost(
          attackStrategy
        )}) `;

        if (useDamageLimit) {
          newButtonString += `(limit ${formatShortNumber(damageLimitValue)})`;
        }

        strategyAttackBtn = document.createElement("button");
        strategyAttackBtn.type = "button";
        strategyAttackBtn.className = "btn btnAttackStrat";
        strategyAttackBtn.textContent = newButtonString;

        // Match styling but distinguish it
        strategyAttackBtn.style.background = "#7c3aed";
        strategyAttackBtn.style.borderColor = "#7c3aed";

        attacksWrap.appendChild(strategyAttackBtn);

        strategyAttackBtn.addEventListener("click", async () => {
          const ids = getSelectedMonsterIds();
          const useParallelJoins = Storage.get(
            "ui-improvements:useParallelJoins",
            true
          );
          if (!ids.length) {
            showStatus("Select at least 1 monster.");
            return;
          }

          if (!JOIN_URL || !ATTACK_URL) {
            showStatus("Quick Join/Attack endpoints are not configured.");
            return;
          }

          setQuickBtnsRunning(true);
          showStatus(`Running attack strategy on ${ids.length} monsters...`);

          const results = [];

          const runTask = async (id, i) => {
            showStatus(
              `(${i + 1}/${ids.length}) Strategy attacking monster #${id}...`
            );

            const card = document.querySelector(
              `.monster-card[data-monster-id="${id}"]`
            );

            const alreadyJoined = card && card.dataset.joined === "1";
            let joinRes = { ok: true, msg: "" };

            if (!alreadyJoined) {
              try {
                joinRes = await doJoin(id);
              } catch {
                joinRes = { ok: false, msg: "Join request failed" };
              }

              if (!joinRes.ok) {
                const msgEl = document.createElement("div");
                msgEl.textContent = "Skipped (join failed)";
                return {
                  monsterId: id,
                  joinMsg: joinRes.msg,
                  ok: false,
                  msgEl,
                };
              }

              if (card) {
                card.dataset.joined = "1";
                card.dataset.unjoined = "0";
              }
            }

            const atkResults = await performAttackStrat(id, attackStrategy);

            const resultsEl = document.createElement("div");
            for (const result of atkResults) {
              resultsEl.appendChild(result.msgEl);
            }

            return {
              monsterId: id,
              joinMsg: joinRes.msg,
              ok: atkResults.every((r) => r.ok),
              msgEl: resultsEl,
            };
          };

          if (useParallelJoins) {
            // ⚡ PARALLEL
            const tasks = ids.map((id, i) => runTask(id, i));
            results.push(...(await Promise.all(tasks)));
          } else {
            // 🐢 SEQUENTIAL
            for (let i = 0; i < ids.length; i++) {
              results.push(await runTask(ids[i], i));
            }
          }

          showStatus("Strategy complete.");
          setQuickBtnsRunning(false);
          openBatchAttackModal(results);
        });
      }
      // --------- Inject Hp Bar --------- //
      renderHpBar();
    })();

    // ------------- Custom Attack Strategy ------------//

    // --------- Group Mobs in their own row ----------- //
    const useGroupedMobs = Storage.get("ui-imrovements:useGroupedMobs", false);

    (function groupMobs() {
      const capCheckbox = document.getElementById("fCapNotReached");
      if (!capCheckbox) return;

      // Create label + checkbox
      const label = document.createElement("label");

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = "fUseGroups";

      // Initialize from storage
      checkbox.checked = !!Storage.get("ui-imrovements:useGroupedMobs", false);

      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(" Use Groups"));

      // Insert after CAP not reached label
      const capLabel = capCheckbox.closest("label");
      capLabel.insertAdjacentElement("afterend", label);

      // Change handler
      checkbox.addEventListener("change", (e) => {
        Storage.set("ui-imrovements:useGroupedMobs", e.target.checked);
        window.location.reload();
      });

      if (useGroupedMobs) {
        const container = document.querySelector(".monster-container");
        const cards = Array.from(container.querySelectorAll(".monster-card"));
        const filterSelect = document.querySelector("#fNameSel");
        const filterValue = filterSelect.value;

        filterSelect.dataset.prev = filterSelect.value;

        filterSelect.addEventListener("change", (e) => {
          const prev = e.target.dataset.prev;
          const curr = e.target.value;

          e.target.dataset.prev = curr;
          if (prev === "" || curr === "") {
            setTimeout(() => {
              window.location.reload();
            }, 300);
          }
        });

        if (filterValue === "") {
          container.className = `${container.className} custom-monster-container`;
          const groups = new Map();

          // Group cards by data-name
          cards.forEach((card) => {
            const name = card.dataset.name;
            if (!groups.has(name)) {
              groups.set(name, []);
            }
            groups.get(name).push(card);
          });

          // Clear container
          container.innerHTML = "";

          // Rebuild grouped + sorted rows
          groups.forEach((groupCards, name) => {
            // 🔑 Sort cards by data-monster-id (numeric)
            groupCards.sort((a, b) => {
              return Number(a.dataset.monsterId) - Number(b.dataset.monsterId);
            });

            const row = document.createElement("div");
            row.className = "monster-row";
            row.dataset.name = name;

            groupCards.forEach((card) => row.appendChild(card));
            container.appendChild(row);
          });
        }
      }
    })();
    // --------- Group Mobs in their own row ----------- //
  }
  // -------------------------- Wave X Page ---------------------------- //

  // ---------------------------- Merchant ----------------------------- //

  const { container: enableBuyMaxButtonsToggle } = createSettingsInput({
    key: "ui-improvements:enableBuyAllButtons",
    label: "Buy {Max} Buttons",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });

  addSettingsGroup(
    "merchant-page",
    "Merchant",
    "Settings related to the merchant page.",
    [enableBuyMaxButtonsToggle]
  );

  const enableBuyAllButons = Storage.get(
    "ui-improvements:enableBuyAllButtons",
    true
  );

  function getGoldBalance() {
    const el = document.getElementById("goldBalance");
    return el ? parseInt(el.textContent.replace(/[^\d]/g, ""), 10) || 0 : 0;
  }

  function injectBuyX() {
    const goldBalance = getGoldBalance();

    document.querySelectorAll(".card").forEach((card) => {
      if ((card.dataset.currency || "").toLowerCase() !== "gold") return;

      const price = parseInt(card.dataset.price || "0", 10);
      const maxQ = parseInt(card.dataset.maxq || "0", 10);
      const bought = parseInt(card.dataset.bought || "0", 10);
      const merchId = parseInt(card.dataset.merchId, 10);
      const remaining = maxQ - bought;

      if (!price || !maxQ || remaining <= 1) {
        return;
      }

      const affordable = Math.floor(goldBalance / price);
      const buyX = Math.min(remaining, affordable);

      const actions = card.querySelector(".actions");
      const buyBtn = actions?.querySelector(".buy-btn");
      if (!actions || !buyBtn) return;

      if (actions.querySelector(".buy-x-btn")) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn buy-x-btn";
      btn.textContent = `Buy ${buyX}`;
      btn.disabled = buyX <= 0;

      btn.addEventListener("click", async () => {
        if (btn.disabled) return;

        const itemName =
          card.querySelector(".name")?.textContent?.trim() || "this item";

        const totalCost = price * buyX;

        const confirmed = window.confirm(
          `Confirm Purchase\n\nBuy ${buyX} × ${itemName}\nCost: ${totalCost.toLocaleString()} Gold`
        );

        if (!confirmed) return;

        btn.disabled = true;

        try {
          const params = new URLSearchParams();
          params.set("merch_id", merchId.toString());
          params.set("qty", buyX.toString());

          const res = await fetch("merchant_buy.php", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString(),
          });

          const data = await res.json().catch(() => ({}));

          if ((data.status || "").trim() === "success") {
            adjustTopbarCurrency("gold", -(price * buyX));

            const infoRow = card.querySelector(".muted");
            if (typeof data.remaining === "number") {
              const newBought = maxQ - data.remaining;
              if (infoRow) {
                infoRow.textContent = `Bought: ${newBought} / ${maxQ}`;
              }
              card.dataset.bought = String(newBought);
              btn.disabled = data.remaining <= 0;
            } else {
              const newBought = Math.min(maxQ, bought + buyX);
              if (infoRow) {
                infoRow.textContent = `Bought: ${newBought} / ${maxQ}`;
              }
              card.dataset.bought = String(newBought);
              btn.disabled = newBought >= maxQ;
            }

            showPurchaseModal((data.message || "Purchased!").trim(), "success");
          } else {
            const msg = (data.message || "Purchase failed.").trim();
            const warn = /not enough (gold|gems)/i.test(msg);
            showPurchaseModal(msg, warn ? "warn" : "error");
            btn.disabled = false;
          }
        } catch {
          showPurchaseModal("Server error. Please try again.", "error");
          btn.disabled = false;
        }
      });

      actions.appendChild(btn);
    });
  }

  if (enableBuyAllButons) {
    injectBuyX();
  }

  // ---------------------------- Merchant ----------------------------- //

  // ------------------------- Battle Side Bar ------------------------- //

  GM_addStyle(
    `

    `
  );
  (function sideBar() {
    const drawer = document.getElementById("battleDrawer");
    if (!drawer) return;
    // Make sidebar scrollable. (GM_addStyle didn't work for some reason)
    drawer.style.overflow = "auto";
    // add padding to last element so it's not below the chat button
    const lastElement = drawer.lastElementChild;
    lastElement.style.marginBottom = "100px";
  })();
  // ------------------------- Battle Side Bar ------------------------- //

  // ----------------------- Guild Member's List ----------------------- //
  const { container: enableGuildMemberListSortingToggle } = createSettingsInput(
    {
      key: "ui-improvements:enableGuildMemberListSorting",
      label: "Guild Members Sorting",
      defaultValue: true,
      type: "checkbox",
      inputProps: { slider: true },
    }
  );

  addSettingsGroup(
    "guild-management",
    "Guild Management",
    "Settings related to the guild pages.",
    [enableGuildMemberListSortingToggle]
  );

  const enableGuildMemberListSorting = Storage.get(
    "ui-improvements:enableGuildMemberListSorting",
    true
  );

  if (
    window.location.href.includes("/guild_members.php") &&
    enableGuildMemberListSorting
  ) {
    const table = document.querySelector("table");
    if (!table) return;

    const tbody = table.querySelector("tbody");
    const headers = Array.from(table.querySelectorAll("th"));

    // Custom role priority
    const roleOrder = {
      leader: 1,
      vice: 2,
      member: 3,
    };

    const getCellValue = (tr, idx) => tr.children[idx].innerText.trim();

    const parseValue = (value, colIndex) => {
      // Role column (index 1)
      if (colIndex === 1) {
        return roleOrder[value.toLowerCase()] ?? 99;
      }

      // Numbers (remove commas)
      const num = value.replace(/,/g, "");
      if (!isNaN(num) && num !== "") return Number(num);

      // Dates
      const date = Date.parse(value);
      if (!isNaN(date)) return new Date(date);

      // Text
      return value.toLowerCase();
    };

    const clearCarets = () => {
      headers.forEach((th) => {
        th.innerHTML = th.innerHTML.replace(/\s*[▲▼]$/, "");
      });
    };

    const sortTable = (colIndex, asc, showCaret = true) => {
      const rows = Array.from(tbody.querySelectorAll("tr"));

      rows.sort((a, b) => {
        const A = parseValue(getCellValue(a, colIndex), colIndex);
        const B = parseValue(getCellValue(b, colIndex), colIndex);

        if (A > B) return asc ? 1 : -1;
        if (A < B) return asc ? -1 : 1;
        return 0;
      });

      if (showCaret) {
        clearCarets();
        headers[colIndex].innerHTML =
          headers[colIndex].innerText + (asc ? " ▲" : " ▼");
      }

      rows.forEach((tr) => tbody.appendChild(tr));
    };

    // Enable click sorting on all headers
    headers.forEach((th, index) => {
      let asc = true;
      th.style.cursor = "pointer";
      th.title = "Click to sort";

      th.addEventListener("click", () => {
        sortTable(index, asc);
        asc = !asc;
      });
    });

    // 🔥 DEFAULT SORT: Role → Leader, Vice, Member (ASC)
    sortTable(1, true, true);
  }

  // ----------------------- Guild Member's List ----------------------- //

  // ------------------------- Dungeon Loot All ------------------------ //

  const { container: useDungeonLootToggle, input: useDungeonLootInput } =
    createSettingsInput({
      key: "ui-improvements:useDungeonLoot",
      label: "Enable Bulk Loot",
      defaultValue: true,
      type: "checkbox",
      inputProps: { slider: true },
    });

  const { container: stopLootingOnLevelUpToggle } = createSettingsInput({
    key: "ui-improvements:stopLootingOnLevelUp",
    label: "Stop Looting On Level",
    defaultValue: true,
    type: "checkbox",
    inputProps: { slider: true },
  });

  let showLootOnLevel = useDungeonLootInput.checked;
  stopLootingOnLevelUpToggle.style.display = showHpBar ? "flex" : "none";

  useDungeonLootInput.addEventListener("change", () => {
    console.log("changed!");
    showLootOnLevel = useDungeonLootInput.checked;
    stopLootingOnLevelUpToggle.style.display = showLootOnLevel
      ? "flex"
      : "none";
  });

  addSettingsGroup(
    "dungeon",
    "Dungeon Loot",
    "settings for bulk dungeon looting",
    [useDungeonLootToggle, stopLootingOnLevelUpToggle]
  );

  const useDungeonLoot = Storage.get("ui-improvements:useDungeonLoot", true);
  const stopLootingOnLevelUp = Storage.get(
    "ui-improvements:stopLootingOnLevelUp",
    true
  );

  function getUnootedMobs(doc = document) {
    return [...doc.querySelectorAll(".mon.dead")].filter((mon) =>
      [...mon.querySelectorAll(".pill")].some(
        (pill) => pill.textContent.trim() === "not looted"
      )
    );
  }

  async function lootAllMonsters(instanceId, stopIfLevelUp = true) {
    let locations = ["1", "2", "3", "4"];
    let mobsToLoot = [];
    const expToLevel = getRequiredExperienceToLevel();
    for (const location of locations) {
      const locationPage = await internalFetch(
        `/guild_dungeon_location.php?instance_id=${instanceId}&location_id=${location}`
      );
      const unlootedMobs = getUnootedMobs(locationPage);
      mobsToLoot.push(...unlootedMobs);
    }

    console.log(`Looting ${mobsToLoot.length} monsters...`);
    const allLootData = {
      leveledUp: false,
      numMobsToLoot: mobsToLoot.length,
      processed: 0,
      success: 0,
      fail: 0,
      items: [],
      rewards: { exp: 0, gold: 0, damage_dealt: 0 },
    };
    for (const mon of mobsToLoot) {
      // Getting monster id from the href of the view button (eww)
      const viewBtn = mon.querySelector('a[href*="battle.php"]');
      if (!viewBtn) continue;
      const params = new URLSearchParams(viewBtn.href.split("?")[1]);
      const monsterId = params.get("dgmid");

      try {
        const lootData = await lootMonster(monsterId, instanceId);
        allLootData.success += 1;
        allLootData.items.push(...lootData.items);
        allLootData.rewards.exp += lootData.rewards.exp;
        allLootData.rewards.gold += lootData.rewards.gold;
        allLootData.rewards.damage_dealt += lootData.rewards.damage_dealt;
      } catch (e) {
        console.error("Failed to loot monster:", monsterId, e);
        allLootData.fail += 1;
      }

      allLootData.processed += 1;

      // Check if leveled up
      if (allLootData.rewards.exp >= expToLevel) {
        allLootData.leveledUp = true;
        if (stopIfLevelUp) {
          break;
        }
      }
    }

    showNotification("All lootable monsters looted!");
    showLootModal(allLootData);
  }

  function showLootModal(lootData) {
    const lootModal = initLootModal();
    const items = dedupeItems(lootData.items);
    const rewards = lootData.rewards;
    const noteContainer = lootModal.querySelector("#lootNote");
    const itemsContainer = lootModal.querySelector("#lootItems");

    const chip = document.createElement("div");
    chip.className = "chip";

    if (lootData.leveledUp) {
      const levelUpChip = chip.cloneNode();
      levelUpChip.textContent = `Leveled Up!`;
      noteContainer.appendChild(levelUpChip);
    }

    const processedChip = chip.cloneNode();
    processedChip.textContent = `Processed: ${lootData.processed.toLocaleString()}/${lootData.numMobsToLoot.toLocaleString()}`;
    noteContainer.appendChild(processedChip);

    const successChip = chip.cloneNode();
    successChip.textContent = `Success: ${lootData.success.toLocaleString()}`;
    noteContainer.appendChild(successChip);

    const failedChip = chip.cloneNode();
    failedChip.textContent = `Fail: ${lootData.fail.toLocaleString()}`;
    noteContainer.appendChild(failedChip);

    const expChip = chip.cloneNode();
    expChip.textContent = `Exp: ${rewards.exp.toLocaleString()}`;
    noteContainer.appendChild(expChip);

    const goldChip = chip.cloneNode();
    goldChip.textContent = `Gold: ${rewards.gold.toLocaleString()}`;
    noteContainer.appendChild(goldChip);

    const dmgChip = chip.cloneNode();
    dmgChip.textContent = `Damage: ${rewards.damage_dealt.toLocaleString()}`;
    noteContainer.appendChild(dmgChip);

    const itemsChip = chip.cloneNode();
    itemsChip.textContent = `Items: ${lootData.items.length.toLocaleString()}`;
    noteContainer.appendChild(itemsChip);

    if (items.length === 0) {
      const noItems = document.createElement("div");
      noItems.className = "muted";
      noItems.style.padding = "6px 0";
      noItems.textContent = "No items this time.";
      itemsContainer.appendChild(noItems);
    } else {
      for (const item of items) {
        const itemDiv = document.createElement("div");
        itemDiv.className = "blm-item";

        // Quantity badge (only if > 1)
        if (item.QUANTITY_DROPPED) {
          const qty = document.createElement("div");
          qty.className = "blm-item-qty";
          qty.textContent = `x${item.QUANTITY_DROPPED}`;
          itemDiv.appendChild(qty);
        }

        const img = document.createElement("img");
        img.src = item.IMAGE_URL;
        img.alt = item.NAME;

        const name = document.createElement("small");
        name.textContent = item.NAME;

        itemDiv.appendChild(img);
        itemDiv.appendChild(name);

        if (item.TIER) {
          const tier = document.createElement("small");
          tier.className = "muted";
          tier.textContent = item.TIER;
          itemDiv.appendChild(tier);
        }

        itemsContainer.appendChild(itemDiv);
      }
    }
  }

  function initLootModal() {
    console.info("veyra-hud: loot modal init");
    let lootModal;
    const lootModals = document.getElementsByClassName(
      "veyra-hud-custom-loot-modal"
    );
    const exists = lootModals?.length > 0;
    if (exists) {
      return lootModals[0];
    } else {
      console.info("veyra-hud: injecting loot modal");
      // =======================
      // Inject CSS
      // =======================
      GM_addStyle(`
        #lootModal {
          display: none;
          position: fixed;
          inset: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loot-content {
          background: #2a2a3d;
          border-radius: 12px;
          padding: 20px;
          max-width: 90%;
          width: 500px;
          text-align: center;
          color: white;
          overflow-y: auto;
          max-height: 80%;
          box-shadow: 0 16px 44px rgba(0, 0, 0, .6), 0 0 0 4px rgba(219, 186, 107, .06);
        }

        .loot-content h2 {
          margin-bottom: 15px;
        }

        #lootNote {
          margin: -6px 0 10px 0;
          display: flex;
          flex-wrap: wrap;
          flex-direction: row;
          justify-content: center;
        }

        #lootItems {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
        }

        .loot-content button {
          margin-top: 10px;
          cursor: pointer;
          box-shadow: 0 6px 16px rgba(0, 0, 0, .35);
          background: linear-gradient(180deg, #23252B, #1A1B20);
        }
        .chip {
          background: #212439;
          color: #cdd1ea;
          border: 1px solid #2b2e49;
          border-radius: 999px;
          padding: 3px 10px;
          font-size: 12px
        }
        .btn-ghost {
          background: #333;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
        }
        .blm-item{background:#1e1e2f;border:1px solid #2b2d44;border-radius:10px;width:92px;padding:8px;text-align:center;position: relative;}
        .blm-item img{width:64px;height:64px;object-fit:cover;border-radius:8px;display:block;margin:0 auto 6px}
        .blm-item small{display:block;line-height:1.2}

        
        .blm-item-qty {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #111827;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 999px;
          border: 1px solid #2b2d44;
          line-height: 1;
          pointer-events: none;
        }
      `);

      // =======================
      // Create Modal Structure
      // =======================
      const lootModal = document.createElement("div");
      lootModal.id = "lootModal";
      lootModal.classList.add("veyra-hud-custom-loot-modal");

      // Content container
      const content = document.createElement("div");
      content.className = "loot-content";

      // Title
      const title = document.createElement("h2");
      title.textContent = "🎁 Loot Gained";

      // Loot note
      const lootNote = document.createElement("div");
      lootNote.id = "lootNote";
      lootNote.className = "muted";

      // Loot items container
      const lootItems = document.createElement("div");
      lootItems.id = "lootItems";

      // Spacer
      const spacer = document.createElement("br");

      // Close button
      const closeButton = document.createElement("button");
      closeButton.textContent = "Close";
      closeButton.className = "btn-ghost";
      closeButton.addEventListener("click", () => {
        lootModal.style.display = "none";
      });

      // =======================
      // Assemble DOM
      // =======================
      content.appendChild(title);
      content.appendChild(lootNote);
      content.appendChild(lootItems);
      content.appendChild(spacer);
      content.appendChild(closeButton);

      lootModal.appendChild(content);
      document.body.appendChild(lootModal);

      // =======================
      // Helper Functions
      // =======================
      window.showLootModal = () => {
        lootModal.style.display = "flex";
      };

      window.hideLootModal = () => {
        lootModal.style.display = "none";
      };
      return lootModal;
    }
  }

  async function lootMonster(monsterId, instanceId) {
    console.log("looting: ", monsterId);
    const results = {
      items: [],
      rewards: { exp: 0, gold: 0, damage_dealt: 0 },
    };

    const userId = getUserId();
    if (!userId || !monsterId || !instanceId) {
      console.warn(
        `lootMonster: missing params! userId: ${userId}, monsterId: ${monsterId}, instanceId: ${instanceId}`
      );
      return;
    }
    const params = new URLSearchParams();
    params.set("user_id", String(userId));
    params.set("dgmid", String(monsterId));
    params.set("instance_id", String(instanceId));

    const res = await fetch("dungeon_loot.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      referrer: `https://demonicscans.org/battle.php?dgmid=${monsterId}`,
      body: params.toString(),
    });

    const ct = res.headers.get("content-type") || "";
    const data = await res.json();

    if (Array.isArray(data.items)) {
      results.items.push(...data.items);
    }

    if (data.rewards) {
      results.rewards = data.rewards;
    }

    return results;
  }

  function dedupeItems(items) {
    const map = new Map();

    for (const item of items) {
      const id = item.ITEM_ID;

      if (!map.has(id)) {
        map.set(id, {
          ...item,
          QUANTITY_DROPPED: 1,
        });
      } else {
        map.get(id).QUANTITY_DROPPED++;
      }
    }

    return Array.from(map.values());
  }

  async function injectLootAllButton(instanceId) {
    const lootBtn = document.createElement("div");
    lootBtn.className = "btn";
    lootBtn.textContent = "💰 Loot Monsters";

    lootBtn.addEventListener("click", async () => {
      lootBtn.textContent = "💰 Looting...";
      lootBtn.setAttribute("disabled", true);

      await lootAllMonsters(instanceId, stopLootingOnLevelUp);

      lootBtn.textContent = "💰 Loot Monsters";
      lootBtn.removeAttribute("disabled");
    });

    const row = document.querySelector(".row > .row");
    row.insertBefore(lootBtn, row.children[2]);
  }

  (async function dungeonLooting() {
    if (
      window.location.href.includes("guild_dungeon_instance.php") &&
      useDungeonLoot
    ) {
      const urlParams = new URLSearchParams(window.location.search);
      const id = urlParams.get("id");
      if (id) {
        injectLootAllButton(id);
      }
    }
  })();

  // ------------------------- Dungeon Loot All ------------------------ //
})();
