# Active / Archived Projects

`/projects` now groups projects into **Active Projects** and **Archived Projects**. Active projects use prominent cards; archived projects use a compact list. Both sections preserve the existing order within their group. Project and repository links are independent, and cards without a usable link do not navigate to a placeholder.

The admin list starts with Active Projects and offers Archived and All filters. Create/edit forms offer Active and Archived. Archive/Restore is available per row, and bulk actions support setting Active, archiving, and deleting. Failed writes are reported; failed or missing records are not treated as saved.

No database migration is required. The existing `projects.status` constraint remains valid: both legacy `live` and `wip` values render as Active; saving Active uses `live`, and Archived uses `archived`. Legacy WIP records stay readable and retain their data until edited.

Validation: `npm run type-check` and `node scripts/check-project-status.cjs`. The latter verifies legacy grouping, public rendering, independent links, create/update/archive/restore, invalid status/URL/order input, missing records, database errors, and admin authorization using mocked database responses.
