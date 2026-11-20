# TF-03g travel-list integration audit

This audit adds one CI-only browser path that joins the existing React UI,
Next.js handlers, Better Auth session verification, and disposable PostgreSQL.
The Better Auth `testUtils` plugin runs only in
`scripts/run-travel-list-browser-integration.ts`; it is not imported by an app
route or the normal auth instance. The runner refuses to start unless `CI=true`
and `DATABASE_URL` targets local `tripfinder_test`. It writes standard signed
session cookies to a temporary Playwright storage state, runs the browser test,
then deletes synthetic travel lists, both users, and temporary files. No login endpoint or
production auth bypass is added.

## Verification matrix

| Area                                                                                          | Existing evidence                                                                         | Level                                                          | TF-03g result                                                         |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------- |
| List create, rename, delete                                                                   | `src/components/travel-lists/TravelListsHome.test.tsx`                                    | Component with mocked fetch                                    | Existing coverage retained                                            |
| Item save/remove, count, stale cursor/version UX                                              | `src/components/travel-lists/AddToTravelListButton.test.tsx`, `TravelListDetail.test.tsx` | Component with mocked fetch                                    | Existing coverage retained                                            |
| Auth disabled, missing/forged/expired session, Origin, user isolation                         | `scripts/verify-auth-postgres.ts`                                                         | API/auth with real PostgreSQL                                  | Existing coverage retained                                            |
| List ownership, CRUD, pagination, versions, rollback                                          | `scripts/verify-travel-lists-postgres.ts`                                                 | Route handlers with real PostgreSQL                            | Existing coverage retained                                            |
| Item ownership, duplicate, concurrency, rollback, cursor, TourAPI errors                      | `scripts/verify-travel-list-items-postgres.ts`                                            | Route handlers with real PostgreSQL and TourAPI fixtures       | Existing coverage retained                                            |
| Create/rename, save a TourAPI fixture place, read actual item count, remove item, delete list | `e2e/travel-lists-real-db.spec.ts`                                                        | Browser → Next.js → Better Auth → disposable PostgreSQL        | Added to PostgreSQL Integration CI job                                |
| Cross-user detail request                                                                     | `e2e/travel-lists-real-db.spec.ts`                                                        | Browser API request with a second standard Better Auth session | Added; expects 404 and no list name in UI                             |
| Account list vs. localStorage bookmark                                                        | `e2e/travel-lists-real-db.spec.ts`, `e2e/bookmark.spec.ts`                                | Browser / existing localStorage flow                           | Added account-flow independence check; existing bookmark E2E retained |
| 390px layout and delete confirmation focus restoration                                        | `e2e/travel-lists-real-db.spec.ts`, existing component tests                              | Browser / component                                            | Added browser checks                                                  |
| 401/503, 403, 404, 409/412, CURSOR_STALE, duplicate requests, image fallback                  | Existing tests above and `src/components/travel-lists/TravelListThumbnail.test.tsx`       | API real DB and UI mock                                        | Not duplicated in browser test                                        |
| Real Google OAuth, cloud database, production deployment                                      | No credentials or production service configured                                           | OAuth / production                                             | Not tested by design                                                  |

GitHub Actions `PostgreSQL Integration` applies migrations to a disposable
PostgreSQL service, runs existing database tests, installs Chromium, then runs
the new browser-to-database scenario. The `Quality Check` job remains
unchanged. No production database migration or paid service is used.

## Remaining limits

- Google OAuth provider handoff and callback are unverified because no real
  OAuth credentials are configured.
- The browser scenario uses Better Auth's supported test helper to create
  ordinary persisted sessions; it does not verify a user signing in through a
  real provider.
- The item snapshot is served by the existing TourAPI test fixture. Live
  TourAPI availability is not part of this test.
- No Vercel production environment or remote database was changed or tested.
