// ==UserScript==
// @name         Dungeon Participation Check
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Dungeon participation report
// @author       [SEREPH] koenrad
// @updateURL    https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/dungeon-participation-check.js
// @downloadURL  https://raw.githubusercontent.com/koenrad/veyra-hud/refs/heads/main/src/dungeon-participation-check.js
// @match        https://demonicscans.org/guild_dungeon_instance.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=demonicscans.org
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  "use strict";
  // ===============================
  // CONFIG
  // ===============================
  const CHECK_DAMAGE_LIMITS = true;

  const MONSTER_CONFIG = Object.freeze({
    // Winter Event
    "Rukka The Wolf Raider": {
      imposed_damage_limit: 12_000_000,
      exp_cap: 10_000_000,
      exp_per_damage: 0.014,
      max_hp: 50_000_000,
    },
    "Tharka Blood-Howl": {
      imposed_damage_limit: 0,
      exp_cap: 5_000_000,
      exp_per_damage: 0.012,
      max_hp: 25_000_000,
    },
    "Brog Skull": {
      imposed_damage_limit: 0,
      exp_cap: 3_000_000,
      exp_per_damage: 0.006667,
      max_hp: 15_000_000,
    },
    "Gorvash the Stone-Ram": {
      imposed_damage_limit: 0,
      exp_cap: 20_000_000,
      exp_per_damage: 0.009,
      max_hp: 100_000_000,
    },
    "Gribble Junk-Magus": {
      imposed_damage_limit: 2_000_000,
      exp_cap: 20_000_000,
      exp_per_damage: 0.004,
      max_hp: 100_000_000,
    },
    "Makra the Mireborn": {
      imposed_damage_limit: 0,
      exp_cap: 5_000_000,
      exp_per_damage: 0.012,
      max_hp: 25_000_000,
    },
    "Shagra Bone-Singer": {
      imposed_damage_limit: 0,
      exp_cap: 7_000_000,
      exp_per_damage: 0.007143,
      max_hp: 35_000_000,
    },
    "Talla Flint-Stem": {
      imposed_damage_limit: 4_900_000,
      exp_cap: 5_000_000,
      exp_per_damage: 0.008,
      max_hp: 25_000_000,
    },
    "Urzul Iron-Tusks": {
      imposed_damage_limit: 0,
      exp_cap: 7_000_000,
      exp_per_damage: 0.008571,
      max_hp: 35_000_000,
    },
    "Droknar Night-Blade": {
      imposed_damage_limit: 0,
      exp_cap: 5_000_000,
      exp_per_damage: 0.012,
      max_hp: 25_000_000,
    },
    "Pip Tanglefoot": {
      imposed_damage_limit: 0,
      exp_cap: 4_000_000,
      exp_per_damage: 0.01,
      max_hp: 20_000_000,
    },
    "Hruk Forge-Eater": {
      imposed_damage_limit: 0,
      exp_cap: 7_000_000,
      exp_per_damage: 0.008571,
      max_hp: 35_000_000,
    },
    "Zorgra Frost-Vein": {
      imposed_damage_limit: 0,
      exp_cap: 10_000_000,
      exp_per_damage: 0.009,
      max_hp: 50_000_000,
    },
    "Orc Stone-Rend ": {
      imposed_damage_limit: 0,
      exp_cap: 7_000_000,
      exp_per_damage: 0.007143,
      max_hp: 35_000_000,
    },
    "Vorga Ash-Shaman": {
      imposed_damage_limit: 0,
      exp_cap: 7_600_000,
      exp_per_damage: 0.006579,
      max_hp: 38_000_000,
    },
    "Krak One-Horn": {
      imposed_damage_limit: 0,
      exp_cap: 7_000_000,
      exp_per_damage: 0.007143,
      max_hp: 35_000_000,
    },
    "Nib Wickfingers": {
      imposed_damage_limit: 0,
      exp_cap: 4_000_000,
      exp_per_damage: 0.008,
      max_hp: 20_000_000,
    },
    "Skrit Gear": {
      imposed_damage_limit: 0,
      exp_cap: 7_600_000,
      exp_per_damage: 0.010526,
      max_hp: 38_000_000,
    },
  });

  GM_addStyle(`

    `);

  // ===============================
  // UTILITIES
  // ===============================

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
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

  const REPORTS = Storage.get("dungeon-participation-check:reports", {});

  function getUserId() {
    const img = document.querySelector('.small-ava img[src*="user_"]');
    if (!img) return null;

    const match = img.src.match(/user_(\d+)_/);
    return match ? Number(match[1]) : null;
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

  async function injectGenerateReportButton(id) {
    // Create the new button element
    const newBtn = document.createElement("div");
    newBtn.className = "btn report-btn";
    newBtn.textContent = "✨ Generate Report"; // button label

    // Add a click handler
    newBtn.addEventListener("click", async () => {
      // showTable(modal, id);
      console.log("generating report...");
      newBtn.textContent = "✨ Generating Report...";
      newBtn.setAttribute("disabled", true);
      await generateReport(id);
      newBtn.textContent = "✨ Generate Report";
      newBtn.removeAttribute("disabled");
    });

    // Find the row containing the Back and Info buttons
    const row = document.querySelector(".row > .row");

    // Insert the new button between the first (Back) and second (Info)
    row.insertBefore(newBtn, row.children[1]);
  }

  async function generateReport(id) {
    if (!id) {
      console.error("dungeon id not found");
      return;
    }
    let locations = ["1", "2", "3", "4"];
    let mobUrlsToCheck = [];
    // let results = [];
    // Build the mob list to check
    for (const location of locations) {
      const locationPage = await internalFetch(
        `/guild_dungeon_location.php?instance_id=${id}&location_id=${location}`
      );
      const cards = locationPage.getElementsByClassName("mon");
      for (const card of cards) {
        const url = card.querySelector(".btn").href;
        mobUrlsToCheck.push(url);
      }
    }

    const results = await Promise.allSettled(
      mobUrlsToCheck.map(async (mobUrl) => {
        const params = new URLSearchParams(mobUrl.split("?")[1]);
        const monsterId = params.get("dgmid");

        const mobPage = await internalFetch(mobUrl);
        const monsterName = getMonsterName(mobPage);
        const lb = mobPage.querySelectorAll(".lb-list .lb-row");

        return {
          monsterName,
          monsterId,
          url: mobUrl,
          leaderboard: extractLeaderboard(lb),
        };
      })
    );

    // keep only successful ones
    const successfulResults = results
      .filter((r) => r.status === "fulfilled")
      .map((r) => r.value);

    console.log("results", successfulResults);

    const aggregatedResults =
      aggregatePlayersWithExpExtended(successfulResults);

    console.log("player results", aggregatedResults);
    REPORTS[id] = aggregatedResults;
    Storage.set("dungeon-participation-check:reports", REPORTS);

    // injectTable(aggregatedResults);
    window.location.reload();
  }

  function aggregatePlayersWithExpExtended(results) {
    const players = new Map();

    for (const monster of results) {
      const config = MONSTER_CONFIG[monster.monsterName];
      if (!config) continue;

      const {
        imposed_damage_limit,
        exp_cap, // treated as damage cap for EXP
        exp_per_damage,
      } = config;

      for (const entry of monster.leaderboard) {
        const { pid, name, avatar, damage } = entry;

        if (!players.has(pid)) {
          players.set(pid, {
            pid,
            avatar: `https://demonicscans.org/${avatar}`,
            playerUrl: `https://demonicscans.org/player.php?pid=${pid}`,
            name,
            totalDamage: 0,
            totalExp: 0,
            monstersDamaged: 0,
            damageOverExpCap: 0,
            monstersOverImposedLimit: [],
          });
        }

        const player = players.get(pid);

        // Total damage always counts
        player.totalDamage += damage;

        // Count each monster once per appearance in leaderboard
        player.monstersDamaged += 1;

        // Determine max damage eligible for EXP
        let damageCap = Math.max(exp_cap, 0);

        const damageForExp = Math.min(damage, damageCap);
        const earnedExp = damageForExp * exp_per_damage;
        player.totalExp += earnedExp;

        // Track damage over the exp_cap
        const overExpCap = Math.max(damage - exp_cap, 0);
        player.damageOverExpCap += overExpCap;

        // Track monsters where player exceeded imposed_damage_limit
        if (imposed_damage_limit > 0 && damage > imposed_damage_limit) {
          player.monstersOverImposedLimit.push({
            monsterName: monster.monsterName,
            url: monster.url,
            damage: damage,
            imposed_damage_limit: imposed_damage_limit,
          });
        }
      }
    }

    // Convert map to array and sort by totalDamage descending
    return [...players.values()].sort((a, b) => b.totalDamage - a.totalDamage);
  }

  function getMonsterName(doc = document) {
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

  function extractLeaderboard(lb) {
    const data = Array.from(lb).map((row) => {
      const link = row.querySelector(".lb-name a");
      const img = row.querySelector(".lb-avatar");
      const dmgText = row.querySelector(".lb-dmg").textContent;

      return {
        name: link.textContent.trim(),
        pid: new URLSearchParams(link.getAttribute("href").split("?")[1]).get(
          "pid"
        ),
        avatar: img.getAttribute("src"),
        damage: Number(dmgText.replace(/[^\d]/g, "")),
      };
    });
    return data;
  }

  async function internalFetch(url) {
    const response = await fetch(url);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    return doc;
  }

  (async function main() {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get("id");
    if (id) {
      injectGenerateReportButton(id);
      if (REPORTS[id]) {
        injectTable(REPORTS[id]);
      }
    }
  })();

  function injectTable(data) {
    const wrap = document.querySelector(".wrap");
    // Create container div
    const container = document.createElement("div");
    container.style.marginBottom = "55px";
    container.className = "panel";

    const title = document.createElement("div");
    title.innerHTML = `📝 Dungeon Report`;
    title.className = "h";

    const tabulatorContainer = document.createElement("div");
    tabulatorContainer.id = "leaderboard";

    container.appendChild(title);
    container.appendChild(tabulatorContainer);
    wrap.appendChild(container);

    // Load Tabulator CSS dynamically
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href =
      "https://cdn.jsdelivr.net/npm/tabulator-tables@5.5.2/dist/css/tabulator_midnight.min.css";
    document.head.appendChild(link);

    // Load Tabulator JS dynamically
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/tabulator-tables@5.5.2/dist/js/tabulator.min.js";
    script.onload = () => {
      // Add custom styles via JS
      const style = document.createElement("style");
      style.innerHTML = `
      .player-cell {
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .player-cell img {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }
      .monster-list {
        padding: 5px 10px;
      }
      .monster-list a {
        display: block;
        color: #0077cc;
        text-decoration: none;
        margin-bottom: 2px;
      }
    `;
      document.head.appendChild(style);

      // Create Tabulator table
      new Tabulator("#leaderboard", {
        data,
        layout: "fitColumns",
        responsiveLayout: "collapse",
        columns: [
          {
            title: "Player",
            field: "name",
            formatter: (cell) => {
              const row = cell.getRow().getData();
              return `
              <a href="${row.playerUrl}" target="_blank" class="player-cell">
                <img src="${row.avatar}" alt="${row.name}"/> ${row.name}
              </a>
            `;
            },
          },
          { title: "Mobs Hit", field: "monstersDamaged", hozAlign: "right" },
          {
            title: "Total Damage",
            field: "totalDamage",
            hozAlign: "right",
            formatter: "money",
            formatterParams: { precision: 0 },
          },
          {
            title: "Total Exp",
            field: "totalExp",
            hozAlign: "right",
            formatter: "money",
            formatterParams: { precision: 0 },
          },
          {
            title: "Wasted Damage",
            field: "damageOverExpCap",
            hozAlign: "right",
            formatter: "money",
            formatterParams: { precision: 0 },
          },
          {
            title: "Overkilled",
            field: "monstersOverImposedLimit",
            formatter: (cell) => cell.getValue().length,
            hozAlign: "right",
          },
        ],
        rowFormatter: function (row) {
          const data = row.getData();
          if (data.monstersOverImposedLimit.length > 0) {
            const holder = document.createElement("div");
            holder.classList.add("monster-list");
            holder.style.display = "none";

            data.monstersOverImposedLimit.forEach((monster) => {
              const link = document.createElement("a");
              link.href = monster.url;
              link.target = "_blank";
              link.textContent = `${
                monster.monsterName
              }: ${monster.damage.toLocaleString()}`;
              holder.appendChild(link);
            });

            row.getElement().appendChild(holder);

            // Toggle on click
            row.getElement().addEventListener("click", () => {
              holder.style.display =
                holder.style.display === "none" ? "block" : "none";
            });
          }
        },
      });
    };
    document.body.appendChild(script);
  }
})();
