# Metallic Gray Theme

## Teme disponibile

Aplicatia foloseste doua teme UI:

- `legacy`: tema implicita si fallback sigur. Pastreaza aspectul existent.
- `metallic`: tema Metallic Gray, cu suprafete gri metalice, contrast clar si panouri diferentiate.

Tema activa se aplica pe root prin atributul:

```html
<html data-theme="legacy">
<html data-theme="metallic">
```

## Design tokens

Tokenii sunt centralizati in `src/styles/index.css` si sunt definiti pentru ambele teme:

- `--app-bg`
- `--panel-bg`
- `--panel-bg-elevated`
- `--border-color`
- `--text-primary`
- `--text-secondary`
- `--accent`
- `--accent-hover`
- `--danger`
- `--warning`
- `--success`
- `--input-bg`
- `--button-bg`
- `--tab-active-bg`
- `--shadow`
- `--radius`
- `--divider-color`
- `--divider-hover`
- `--drag-handle`
- `--duplicate-title-bg`
- `--duplicate-title-border`
- `--modal-overlay`

Tema `legacy` reproduce valorile vizuale existente. Tema `metallic` suprascrie tokenii si clasele `app-*` doar cand root are `data-theme="metallic"`.

## Setare

Setarea este expusa in Settings ca `Aspect interfata`:

- `Clasic` salveaza `uiTheme: 'legacy'`
- `Metallic Gray` salveaza `uiTheme: 'metallic'`

Valoarea este persistata in `AppConfig` sub cheia `uiTheme`. Schimbarea se aplica imediat, fara restart, prin actualizarea atributului `data-theme`.

## Revenire la Legacy

Orice valoare invalida revine la `legacy`. Selectarea optiunii `Clasic` seteaza `data-theme="legacy"` si restaureaza aspectul vechi, deoarece regulile Metallic sunt scoped pe `:root[data-theme='metallic']`.

## Componente acoperite

Tema Metallic acopera:

- header
- section tabs
- entity tabs
- EntityList
- EntityEditor
- QuickTitlesBar
- preview container
- Settings
- modaluri
- notificari
- butoane
- inputs
- drag handles
- divider rows
- duplicate title highlighting
- import backup modal

## Reguli pentru divider, DnD si duplicate

Dividerul ramane o linie discreta si nu afiseaza textul `[ DIVIDER ]`. In Edit Mode, drag handle-ul ramane vizibil pentru randurile care pot fi mutate. Duplicatele raman evidentiate cu tokenii galbeni `--duplicate-title-bg` si `--duplicate-title-border`, inclusiv in tema Metallic.

Butonul de import din backup este separat de butonul principal `Adauga`, iar butonul de adaugare separator ramane secundar si clar identificabil.
