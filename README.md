# Restaurant Empire Online (local prototype)

Browser-based restaurant business simulation. Plain HTML/CSS/JS ES modules, **no build step and no dependencies**.

## Run
- **GitHub Pages:** repo → Settings → Pages → Deploy from branch → `main` / `(root)`. Open the URL it gives you.
- **Locally:** `python3 -m http.server 8080` (or `npm run serve`) then open http://localhost:8080
- Opening `index.html` directly from disk will not work (browsers block ES modules on `file://`).

## Test
`node --test` (Node 20+). Covers economy, inventory, market, persistence, preferences and company validation.

## Architecture
- `src/domain/*` business rules. Functions take a state draft; `Game.transact()` (src/app/appState.js) clones state, runs the action, validates, then commits + saves. Any error discards everything (atomic).
- Cash is **derived from the ledger**. Money is integer cents. Inventory stores qty + integer value (moving-average cost).
- `src/persistence/*` versioned save (`schema`), validation, migrations, export/import, one-level backup, corrupt-save preservation. Preferences are stored separately.
- `src/ui/*` DOM rendering. Text is always inserted as text nodes, never `innerHTML`. UI only calls domain actions.
- `src/app/routes.js` is the single route table; only implemented pages are listed.

## Time model
Discrete game days, advanced **only** by the player's "Advance to next day" button. No offline catch-up.

## Market
Simulated NPC market, not other players. Mid price = base × (1 ± 15%), deterministic from (save seed, product, day). Ask/bid spread 8%, 2% fee, daily supply/demand caps. Tunables: `src/data/balanceConfig.js`, `src/data/products.js`.

See `IMPLEMENTATION_STATUS.md` for what is and isn't built.
