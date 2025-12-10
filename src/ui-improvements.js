// ==UserScript==
// @name         UI Improvements
// @namespace    http://tampermonkey.net/
// @version      1.0.2
// @description  Makes various ui improvements. Faster lootX, extra menu items,
// @author       koenrad
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
  `);

  function overrideLootX() {
    const btnLootX = document.getElementById("btnLootX");

    const customBtn = document.createElement("button");
    customBtn.id = "btnCustomLoot";
    customBtn.type = "button";
    customBtn.className = "custom-loot-btn";
    customBtn.textContent = "💰 Loot X monsters (faster)";

    btnLootX.insertAdjacentElement("afterend", customBtn);
    btnLootX.style.display = "none";

    const setRunning = (running) => {
      if (running) {
        customBtn.classList.add("is-running");
        customBtn.textContent = "Working...";
      } else {
        customBtn.classList.remove("is-running");
        customBtn.textContent = "💰 Loot X monsters (faster)";
      }
    };

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
      for (let i = 0; i < targetIds.length; i++) {
        $stat.textContent = `Looting ${i + 1}/${
          targetIds.length
        }... (success: ${ok}, fail: ${fail})`;
        try {
          const res = await lootOne(targetIds[i]);
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
              `.monster-card[data-monster-id="${targetIds[i]}"]`
            );
            if (el) el.setAttribute("data-eligible", "0");
          } else {
            fail++;
            if (res.note) allNotes.push(res.note);
          }
        } catch (_e) {
          fail++;
          allNotes.push("Server error");
        }
        // await new Promise((r) => setTimeout(r, 150));
      }
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
  }
  // -------------------- Menu Sidebar / Navigation -------------------- //

  // --------------------- Adventurer's Guild Page --------------------- //
  // Align the accept quest button on the Adventurer's Guild to the bottom of the element
  document.querySelectorAll(".quest-side").forEach((el) => {
    el.style.marginTop = "auto";
  });
  // --------------------- Adventurer's Guild Page --------------------- //

  overrideLootX();
})();
