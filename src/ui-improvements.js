// ==UserScript==
// @name         UI Improvements
// @namespace    http://tampermonkey.net/
// @version      1.0.23
// @description  Makes various ui improvements. Faster lootX, extra menu items, auto scroll to current battlepass, sync battlepass scroll bars
// @author       koenrad
// @updateURL    https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/ui-improvements.js
// @downloadURL  https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/ui-improvements.js
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
  .set-tabs {
    flex-wrap: wrap;
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

  // ===============================
  // UTILITIES
  // ===============================
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function getCookie(name) {
    return document.cookie
      .split("; ")
      .find((c) => c.startsWith(name + "="))
      ?.split("=")[1];
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
  const gtbleft = document.querySelector(".gtb-left");
  if (gtbleft) {
    // wrap the top bar, even on small screens.
    gtbleft.style.setProperty("flex-wrap", "wrap", "important");
  }
  // ---------------------------- Top Bar ------------------------------- //

  // -------------------- Menu Sidebar / Navigation -------------------- //
  // Find the Halloween Event link by its icon or label
  const halloweenLink = [...document.querySelectorAll(".side-nav-item")].find(
    (el) =>
      el.querySelector(".side-label")?.textContent.trim() === "Halloween Event"
  );

  // Move halloween event link to the bottom of the menu
  if (halloweenLink) {
    addMenuLinkAfter(
      "Battle Pass",
      halloweenLink.href,
      halloweenLink.querySelector(".side-label").textContent,
      halloweenLink.querySelector(".side-icon").textContent
    );
    halloweenLink.remove();
  }

  // Find the "Home" link by its label text
  const homeLink = [...document.querySelectorAll(".side-nav-item")].find(
    (el) => el.querySelector(".side-label")?.textContent.trim() === "Home"
  );

  if (homeLink) {
    addMenuLinkAfter("Home", "/active_wave.php?gate=3&wave=8", "Wave 3", "🌊");
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
  // -------------------- Menu Sidebar / Navigation -------------------- //

  // --------------------- Adventurer's Guild Page --------------------- //
  // Align the accept quest button on the Adventurer's Guild to the bottom of the element
  document.querySelectorAll(".quest-side").forEach((el) => {
    el.style.marginTop = "auto";
  });
  // --------------------- Adventurer's Guild Page --------------------- //

  // ------------------------ Battle Pass Page ------------------------- //

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
    scrollToLevel(level);
    await sleep(1000);
    syncScrollBars();
  }

  setTimeout(() => {
    autoScrollToCurrentLevel();
  }, 1300);

  // ------------------------ Battle Pass Page ------------------------- //

  // -------------------------- Wave X Page ---------------------------- //
  if (window.location.href.includes("/active_wave.php")) {
    // ---------------- constants ------------------ //
    let inBattleCount = 0;
    const hideDeadRaw = getCookie("hide_dead_monsters");
    const HIDE_DEAD_MONSTERS = hideDeadRaw === "1" || hideDeadRaw === "true";

    // -------------- Loot X Faster ---------------- //
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
    // -------------- Loot X Faster ---------------- //

    // --------- In Battle Count Injection ------------//
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
    // --------- In Battle Count Injection End ---------//

    // ------------- Custom Attack Strategy ------------//

    const JOIN_URL = ENDPOINTS && ENDPOINTS.JOIN ? ENDPOINTS.JOIN : "";
    const ATTACK_URL = ENDPOINTS && ENDPOINTS.ATTACK ? ENDPOINTS.ATTACK : "";

    let attackStrategy = Storage.get("ui-improvements:attackStrategy", []);
    let showHpBar = Storage.get("ui-improvements:showHpBar", true);

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

      .monster-container {
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

      if (hpBars) {
        // console.log("hpBars", hpBars);
        for (const hpBar of hpBars) {
          const hpBarContainer = hpBar.parentElement;
          // console.log(hpBarContainer);
          const hpEl = hpBarContainer.querySelector("#pHpFill");
          if (hpEl) {
            const hpPercent = parseFloat(hpEl.style.width);
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
      showHpBar = Storage.get("ui-improvements:showHpBar", true);

      // ---------- Helpers ----------
      function save() {
        Storage.set("ui-improvements:attackStrategy", attackStrategy);
        Storage.set("ui-improvements:useAsterion", useAsterion);
        Storage.set("ui-improvements:asterionValue", asterionValue);
        Storage.set("ui-improvements:showHpBar", showHpBar);
        Storage.set("ui-improvements:useDamageLimit", useDamageLimit);
        Storage.set("ui-improvements:damageLimitValue", damageLimitValue);
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

        // ----------  Show HP Bar Settings Checkbox ----------
        let hpbarSettingContainer = document.getElementById(
          "hpbarSettingContainer"
        );
        if (!hpbarSettingContainer) {
          hpbarSettingContainer = document.createElement("div");
          hpbarSettingContainer.id = "hpbarSettingContainer";
          hpbarSettingContainer.className = "hp-bar-settings-container";

          // Checkbox container
          const checkbox = document.createElement("input");
          checkbox.type = "checkbox";
          checkbox.id = "hpbarSettingCheckbox";
          checkbox.checked = showHpBar;
          checkbox.className = "attack-strat-checkbox";

          const label = document.createElement("label");
          label.htmlFor = "hpbarSettingCheckbox";
          label.className = "attack-strat-label";
          label.textContent =
            "Show HP Bar (performs 1 extra request to battle.php)";

          checkbox.addEventListener("change", () => {
            showHpBar = checkbox.checked;
            renderHpBar();
            save();
          });

          hpbarSettingContainer.appendChild(checkbox);
          hpbarSettingContainer.appendChild(label);

          meta.appendChild(hpbarSettingContainer);
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
    })();

    let strategyAttackBtn;

    function updateAttackButtons() {
      console.log("updating attack buttons!");
      const asterionValue =
        parseFloat(Storage.get("ui-improvements:asterionValue")) || 1;
      const useAsterion = Storage.get("ui-improvements:useAsterion") || false;

      const attackButtons = document.querySelectorAll(".btnQuickJoinAttack");
      if (attackButtons) {
        console.log(attackButtons);
        attackButtons.forEach((btn) => {
          const text = btn.textContent.trim();
          console.log(text);

          const cost = useAsterion
            ? Math.ceil(btn.dataset.stam * asterionValue)
            : btn.dataset.stam;

          const updatedText = `⚡ Quick Join & Attack (${cost})`;
          btn.textContent = updatedText;
        });
      }
    }

    (async function injectAttackStratButton() {
      const attacksWrap = document.querySelector(".qol-attacks");
      if (!attacksWrap) return;

      const useAsterion = Storage.get("ui-improvements:useAsterion") || false;
      if (useAsterion) {
        updateAttackButtons();
      }

      // Prevent duplicate injection
      if (attacksWrap.querySelector(".btnAttackStrat")) return;

      let useDamageLimit = Storage.get("ui-improvements:useDamageLimit", false);
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

        const tasks = ids.map(async (id, i) => {
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
        });

        // 🔑 WAIT FOR ALL MONSTERS TO FINISH
        const results = await Promise.all(tasks);

        showStatus("Strategy complete.");
        setQuickBtnsRunning(false);
        openBatchAttackModal(results);
      });

      // --------- Inject Hp Bar --------- //
      renderHpBar();
    })();

    // ------------- Custom Attack Strategy ------------//

    // --------- Group Mobs in their own row ----------- //

    (function groupMobs() {
      const container = document.querySelector(".monster-container");
      const cards = Array.from(container.querySelectorAll(".monster-card"));

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
    })();
  }
  // -------------------------- Wave X Page ---------------------------- //

  // ---------------------------- Merchant ----------------------------- //

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

  const fullStaminaCard = document.querySelector('.card[data-merch-id="10"]');

  if (fullStaminaCard) {
    const actions = fullStaminaCard.querySelector(".actions");

    // Prevent duplicate injection
    if (!actions.querySelector(".qty-wrap")) {
      const qtyWrap = document.createElement("div");
      qtyWrap.className = "qty-wrap";
      qtyWrap.setAttribute("aria-label", "Quantity");

      qtyWrap.innerHTML = `
      <button type="button" class="qty-btn minus" tabindex="-1">−</button>
      <input type="number"
             class="qty-input"
             min="1"
             step="1"
             value="1"
             inputmode="numeric"
             pattern="[0-9]*"
             aria-label="Quantity">
      <button type="button" class="qty-btn plus" tabindex="-1">+</button>
    `;

      // Insert before Buy button
      actions.prepend(qtyWrap);
    }
  }

  injectBuyX();

  // ---------------------------- Merchant ----------------------------- //
})();
