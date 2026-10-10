# Implementation status

## Milestone 1 — Runnable foundation: DONE (verified)
App shell, hash router, single route table, versioned local save, prefs, seed data.

## Milestone 2 — UI & navigation: PARTIAL
Done: desktop sidebar (collapsible, persisted), mobile bottom nav + More page, breadcrumbs, 404 page, company profile + edit, settings (interface, save mgmt, privacy, about).
Not done: global search, notification center, quick actions, achievements, settings pages for gameplay/notifications/accessibility beyond reduced-motion, tables-as-cards on mobile (wide tables scroll horizontally).

## Milestone 3 — Isometric world (Phaser): NOT STARTED
Phaser is not bundled (sandbox had no network). Add via CDN or Vite when ready.

## Milestone 4 — Core economy: DONE for what exists (verified)
EconomyService ledger, InventoryService, MarketService (NPC), finance report with reconciliation checks, warehouse + movement history.
Not done: transfers, reservations, batches/expiry, adjustments, price-history storage (history is recomputed deterministically), sell-side order book.

## Milestones 5–8: NOT STARTED
Restaurants, recipes, demand, staff, research, production, buildings/placement, online/Supabase.
Company page shows 0 for restaurants/employees/research because those systems don't exist yet.

## Verification run (this build)
- `node --test`: 16/16 pass.
- All JS files pass `node --check`; all UI modules import cleanly.
- Headless Chromium (Playwright) at 1366x768 and 360x800: dashboard loads, market buy works, warehouse shows stock, finance reconciles, unknown route fallback works, no horizontal page overflow, no console/page errors; cash and stock survive a reload.
- NOT verified: other browsers, real touch devices, 390/430/768 widths, keyboard-only use, import/export through the file picker, settings page interactions.

## Next task
Milestone 5 groundwork: recipes + RestaurantService (menu, order fulfilment consuming inventory via Inventory.remove with kind 'consume', revenue via Economy). Then global search and notifications.
