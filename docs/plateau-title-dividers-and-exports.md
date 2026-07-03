# PLATOU title dividers and title exports

## Divider marker

The exact divider marker is:

```text
[ DIVIDER ]
```

The marker is valid only in `INVITATI` / `PLATOU > Titles`. It is not imported or exported as a title entity and it is not valid in BETA sections.

## Full CSV storage

In the full project CSV, a divider row is stored in the `Titlu` column with an empty `Nr` column:

```csv
Nr;Titlu
;[ DIVIDER ]
```

All other columns on that row remain empty. The parser stores it as a separate ordered list item so its position among titles is preserved.

## Broadcast exports

Dividers are editor-only ordering helpers. They are omitted from broadcast export files so downstream graphics systems receive only real titles and hot titles.

`PA_titles.csv` now contains only:

```csv
Nr;Titlu
```

It keeps existing section markers and exports only title rows.

`PA_titles_with_hot.csv` contains:

```csv
Nr;Titlu;Ultima Ora
```

It keeps the previous title-plus-hot export behavior. Titles and hot titles are aligned by index only for convenience; they are not treated as semantically linked.

## Numbering

Only real title rows receive numbers. Dividers are ignored during numbering, so title numbers are always consecutive within each section: `1`, `2`, `3`, and so on.
