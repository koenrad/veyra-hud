# veyra-hud

UI enhancements and helper scripts to make interacting with **Veyra** smoother, faster, and more convenient.  
This project is designed to run as a **userscript** through Tampermonkey, making installation simple.

---

## 🚀 What is veyra-hud?

veyra-hud adds HUD improvements, QoL tools, and browser-side enhancements to the Veyra front end.  
Because it runs in Tampermonkey, it works across browsers and is even available on mobile browsers.

---

## ✨ Features

- UI tweaks and layout improvements
- Buttons, shortcut tools, and quality-of-life enhancements
- Inventory management

### ui-improvements.js

- Menu modifications
  - ~~moves halloween event to bottom of menu (event is currently over)~~ This link was finally removed in vanilla.
  - ~~adds Lizardman Winter event link to nav bar~~ This is now on vanilla.
  - adds link to Wave 3
  - adds link to Adventurer's Guild
  - adds link to Legendary Forge
  - fairly easy to add custom links using `addMenuLinkAfter`
- Wave Page

  - Modified `Loot X monsters` feature to be _significantly_ faster
    - Loot faster loots in parallel now (even faster)
  - Adds `In Battle:` count to show how many battles you are currently in.
  - Adds `Attack Strategy` to the multi target menu.
  - Adds a `Settings` button for `Attack Stragegy`.
    - Tap name of attack to add to strategy, arrange in order (top is first)
  - Strategy attack button now shows stamina cost
  - Adds HP bar to wave page (in multi target card)
    - Flashes red border around hp bar card when less than 10% hp
    - Color of bar is changeable in settings
  - Damage limit added to settings
    - stops strategic attack if damage exceeds the limit
    - this is usefull to save stamina if your first high stam hit crits.
    - `(limit {amount})` is added to the strategic attack button if limit is enabled
  - Calculate with Asterion setting will show stamina costs with multiplier applied
    - You still need to manually make sure Asterion is equipped.
  - Use Groups checkbox
    - Groups mobs when filtered to "All Monsters", and adds a divider between them
    - Useful for looking at the entire wave on a large monitor

- Battle Consumables Side Bar

  - Adds health potion usage (does not check for quanity)
  - Not available on every page.
  - Available on wave page.

- Battlepass
  - all 3 tiers are now linked when scrolling
  - auto scrolls to current level of battlepass.
- Merchant
  - Adds a buy {max} button to each item in stock so you can buy the max available
  - Adds a quantity input box for purchase of FSP using gems

### filter-inventory.js

- adds persistent filtering to inventory

### dungeon-participation-check.js

- Adds "Generate Report" button to the dungeon instance page
- Report is displayed at the bottom of the page once generated.
- Re-generating the report will overwrite the old report
- The report is saved in localStorage, so you won't have to generate it every time
- Checks all mobs based on the MONSTER_CONFIG object
- You can impose damage limits on a per mob type basis.
- Damage limit violations can be seen when clicking on a row in the report

### gamba-enhanced.js

- Adds multi-pull capability to the 2025 Winter Event gacha machine.
- Shows images of winnings with a count underneath.

### [depricated]equipment-presets.js.js

- adds presets for gear
- depricated - capability available in vanilla now.

---

## 📦 Installation

### 1. Install Tampermonkey

Tampermonkey is required to run the veyra-hud user scripts.

#### Chrome / Brave / Edge

1. Open the Web Store:  
   https://www.tampermonkey.net/?ext=dhdg&browser=chrome
2. Click **Add to Chrome**
3. Approve the extension

#### Firefox

1. Open the Add-ons page:  
   https://www.tampermonkey.net/?ext=dhdg&browser=firefox
2. Click **Add to Firefox**
3. Approve permissions

#### Safari

1. Install from the Mac App Store:  
   https://www.tampermonkey.net/?ext=dhdg&browser=safari

After installation, you should see a **Tampermonkey icon** in your browser toolbar.

---

## 🧩 Installing veyra-hud scripts

1. Open **Tampermonkey Dashboard**  
   (click the Tampermonkey icon → _Dashboard_)

2. Click **“+ Create a new script”** or **“Import”**

3. Copy the contents of the provided script file from this repo  
   (located in `src/`)

4. Paste it into the Tampermonkey editor (overwrite the pre-filled boilerplate)

5. Click **File → Save** (or press `Ctrl+S`)

6. Make sure the script is **Enabled**  
   (toggle switch should be ON in the Tampermonkey script list)

7. Reload Veyra in your browser
