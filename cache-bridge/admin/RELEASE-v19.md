# Admin release 20261003-v19

In statistics rankings the small line below the user's name now displays the latest login/open time instead of their Figma ID. It uses lastLoginAt when available, otherwise lastOpenedAt, formatted as YYYY/MM/DD HH:mm in Asia/Shanghai. Missing records display an em dash (—). No field label or additional date column is shown.

The 12 sortable data columns, stable table/scroll nodes, committed pagination ordering, stale request checks and v18 card layout remain unchanged. The v19 entrypoint selects a new immutable release.

Validation: the ranking date unit regression fails on v18's ID value and passes on v19, checking the Beijing date, preferred lastLoginAt and missing timestamp. The full backend/admin Node suite has 30 passing tests. Released-UI browser checks also assert the displayed date and empty marker, while retaining the v18 layout, two-axis scroll and async sorting/pagination checks.
