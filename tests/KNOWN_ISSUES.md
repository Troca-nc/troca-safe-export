# Known Issues - Mobile Audit

## WebKit / Safari navigation instability

- On `mobile-safari`, a few direct route transitions can still be interrupted on small viewports, especially during the first load of:
  - `/` -> `/annonces`
  - `/fret` -> `/evenements`
  - `/pro/dashboard/parametres` -> `/pro/dashboard/import`
  - `/pro/dashboard` -> `/pro/dashboard/devis`
- This is currently mitigated by the shared `navigateTo()` helper in the mobile test suite, which retries navigation and waits for the page to settle before continuing assertions.
- The issue is considered non-blocking for production because it is reproducible mainly in WebKit desktop automation and still needs validation on a real iPhone build.

## Test data dependency

- Some mobile flows are intentionally backed by seeded accounts and demo content.
- If the Playwright seed is not applied, a few checks can fall back to warnings rather than hard failures:
  - ticketing flow without a free published event
  - Pro dashboard with no active announcements
  - import flow still mapped to a demo route

## Follow-up

- Re-run `tests/e2e/mobile` on a real iPhone device once the production mobile app shell is available.
- Keep this document updated whenever the Safari route stability improves or when new seeded scenarios are added.
