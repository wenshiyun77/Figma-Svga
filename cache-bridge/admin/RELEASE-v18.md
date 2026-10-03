# Admin release 20261003-v18

User cards show WebP, GIF, Lottie, WebM and PAG in one breakdown row. The breakdown is a separate grid row, so expanding it does not move the avatar or the three PRO controls. At narrow widths the avatar and controls share the first row and the user details follow below.

Statistics removes the first-use and last-opened date columns. Sorting retains the existing rows until every requested page has returned. The scroll container, table, column schema and header nodes stay mounted; only tbody content and sorting state are updated. Fixed columns and a 12px arrow slot prevent layout shifts. Both scroll axes and page scroll are restored. When multiple pages have already loaded, sorting fetches the same number of rows in the new global ordering before replacing the rows.

Appends cannot overlap a pending sort or another append. Each new sort supersedes earlier requests using the shared sequence and page epoch. The committed query/sort/direction stays associated with the displayed data: a failed new sort preserves old data, and subsequent append requests use its original ordering. A stale response cannot clear the latest request's busy state.

Validation:

- `node --test cache-bridge/admin/src/*.test.mjs`: 29 passing tests.
- `node cache-bridge/admin/src/admin-layout-v18.browser.mjs`: actual released UI at widths 1440, 1000, 760 and 390; all five formats, fixed control centers, two-axis scroll, delayed sorting, stale response rejection, failed sorting, duplicate append prevention, all 12 sortable keys, and globally sorted 112-row pagination.
- The browser regression failed against v17 because the fifth export format occupied another row, then passed against v18.

Browser test authentication and API fixtures are injected by its local HTTP server and request interception. Production code contains no test hooks.
