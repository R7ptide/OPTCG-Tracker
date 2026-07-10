Missing for first release (functional gaps):

- Tournaments/Decks screens: pure "coming soon" stub. Either ship w/out those nav buttons or finish minimal version — half-dead buttons look bad day one.
- No onboarding/empty-state on fresh install (empty DB before first sync) — user open app, see zeros, confused.
- No error boundary / crash screen — DB or sync fail throws Alert only, no global catch.
- No loading state for initial DB/sync on cold start (initDB() in \_layout.tsx fire-and-forget, no splash gate).
- Search/filter only inside a set (FilterDrawer) — no cross-set search ("find card X anywhere in my collection").
- Backup/restore is manual JSON export via share sheet — no auto-backup, easy to lose collection on device loss.

Missing for "professional" polish:

- Zero tests (no test files at all) — risky for a data-integrity app (collection counts).
- No CI (no .github/workflows) — nothing gates merges.
- No privacy policy / terms — required by App Store/Play if publishing.
- No analytics/crash reporting (Sentry etc.) — you'll ship blind to real-world crashes.
- No app versioning/changelog strategy visible in app.json.
- Accessibility untouched — no accessibilityLabel on icon-only buttons (sync, filter, settings icons).
- No dark/light mode toggle — hardcoded dark theme only (fine as choice, but no user control).

Priority if I had to pick 3 before shipping: finish or hide Tournaments/Decks, add crash reporting, add first-launch loading/empty state.
