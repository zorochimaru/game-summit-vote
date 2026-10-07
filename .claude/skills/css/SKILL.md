---
name: css
description: Use every time you write or edit styles in `.scss` / `.css` files — covers file layout, Angular Material theming, CSS custom properties, breakpoints, class naming, and `:host`.
user-invocable: false
---

# CSS / SCSS conventions

## 1. File location

- Component-scoped styles: `*.component.scss` next to the component.
- App-global styles: `src/styles.scss`, which `@use`s partials from `src/styles/`
  (`_custom-variables`, `_fonts`, `_container`, `_animations`, `_theme-colors`, `_typography`).
- `src/styles` is on the include path, so components can `@use 'animations';` directly.

## 2. SCSS module API

- Always `@use` — never `@import`.
- Angular Material: `@use '@angular/material' as mat;`. The theme is a dark M3 theme set up in
  `styles.scss` from the palettes in `_theme-colors.scss`. Prefer Material system tokens
  (`var(--mat-sys-*)`) or component overrides (`mat.<component>-overrides(...)`) over overriding
  Material's internal classes.

## 3. Colors and tokens (no hardcoded colors)

App-level tokens are CSS custom properties declared on `:root` in `src/styles/_custom-variables.scss`
(`--accent-color`, `--fg-light`, `--fg-muted`, `--bg-surface`, `--border-default`,
`--btn-danger-bg`, `--header-height`, …). Use `var(--token)`; if a new color is needed, add a token
there instead of hardcoding it in a component.

## 4. Breakpoints

The app is used on phones by jury members — check mobile layouts. The existing breakpoint is
`@media screen and (max-width: 600px)`; reuse it rather than inventing new widths.

## 5. Class naming

- Kebab-case, no BEM.
- Use simple class names, but avoid collisions with Angular Material (`mat-*`, `mdc-*`) classes.
- Avoid unnecessary nesting — flat selectors preferred; nest only for state (`&:hover`, `&.active`) or genuinely scoped children.

## 6. `:host`

- Use `:host` for the component root only — layout (`display`, `flex-direction`, `min-height`), positioning, host-state styling, and declaring component-scoped CSS custom properties (`--my-var: ...`).
- Don't wrap unrelated child rules inside `:host` — keep child selectors at the top level.

## 7. Linting

`npm run stylelint` (or `stylelint:fix`) — `stylelint-config-recommended-scss` + Prettier.
