# Duplicate PLATOU titles

PLATOU title duplicates are allowed. The editor does not block saving, importing, reordering, or loading a project when two or more PLATOU titles have the same displayed text.

Duplicate detection uses a normalized title value:

- leading and trailing whitespace is ignored;
- letter case is ignored;
- empty titles are ignored.

For example, these titles are treated as identical:

- `ECONOMIE`
- `economie`
- `ECONOMIE `

When duplicates are found, every matching PLATOU title occurrence is highlighted using the duplicate-title visual tokens. The default theme renders these rows with a visible yellow treatment.

PLATOU title dividers are ignored by duplicate detection. They are not compared with title rows and are never highlighted as duplicate titles.

CSV data is not changed by duplicate highlighting. The behavior is derived in the UI from the current PLATOU title list, so exported and persisted CSV files keep their original values.
