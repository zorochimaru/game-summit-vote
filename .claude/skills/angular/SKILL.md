---
name: angular
description: Use when writing or editing Angular code (components, services, signals, signal forms, resources, templates) anywhere in src/app. Covers project conventions and the signal/zoneless patterns that are frequent correction points.
---

# Angular conventions

Angular 22 with Angular Material — signals-first, standalone, **zoneless**
(`provideZonelessChangeDetection`), OnPush by default. The upgrade from 19 is tracked in
`.claude/plans/angular-22-upgrade.md`; until it's done, check `package.json` before using an API
introduced after v19. Some older files predate these rules — follow them for new and edited code, but
do not rewrite untouched code just to conform.

## General

- Import individual components/directives/pipes, not modules
- Importing `CommonModule` is forbidden — use built-in control flow (`@if`, `@for`, `@switch`)
- Never add `standalone: true` — it's the default
- Never set `changeDetection` — `OnPush` is the default since v22. Never use `ChangeDetectionStrategy.Eager`
- Sort component imports, object and type properties, and constants alphabetically
- Use real private fields `#iAmPrivate`, not `private`
- Use `inject()`; never use constructor parameter properties; declare all properties outside the constructor
- Never inline template or styles — always 3 files per component (template, style, code)
- Keep the `.component.ts` / `.service.ts` file suffixes this repo already uses (don't follow the suffix-less v20+ style guide)
- All boolean and number inputs must be transformed (`booleanAttribute`, `numberAttribute`, or a custom transform)
- Don't use self-closing tags for components
- Always write the access modifier explicitly (including `public`), and pick the least permissive one: `#`(private) by default, `protected` only when the template needs it, `public` only for inputs/outputs or implemented interface members
- Import from barrels (`../core`, `../shared`, `./shared`) rather than deep paths; add new exports to the folder's `index.ts`

## Signals & zoneless

- Anything the template reads must be a signal (or come through `toSignal`). Mutating a plain field
  will not re-render — there is no zone.js.
- Use signal APIs: `input()`, `output()`, `model()`, `viewChild()`, `contentChildren()` — never the
  decorator versions.
- Prefer `computed()` for derived values. Avoid `linkedSignal` and side-effect-driven derivation unless
  you genuinely need writable derived state.
- Use `effect()` for side effects only.
- Don't add redundant `ngOnInit` logic when an `effect()`, `computed()` or resource already handles initialization.
- Subscriptions that outlive a single emission must use `takeUntilDestroyed()`.

## Async data & resources

- `resource()` / `rxResource()` are stable — prefer `rxResource({ params, stream })` over manual
  subscribe-and-set when loading data from `FirestoreService` (which returns Observables) based on
  signals. Read `.value()`, `.isLoading()`, `.error()` in the template.
- Go through `FirestoreService` and `FirebaseProvider` — never call the Firebase SDK directly from a
  component. Collection names come from the `FirestoreCollections` enum; vote-type → collection
  mapping lives in `PrivateService`.
- Store-shaped types are the `*Firestore` interfaces; app-shaped types are their plain counterparts.

## Signal forms (`@angular/forms/signals`, stable since v22)

- Use Signal Forms for new forms; existing reactive forms (with `core/interfaces/typed-forms.type.ts`)
  may stay until they're touched for other reasons.
- Custom form controls implement `FormValueControl<T>` with `value = model<T>()`; bind them with `[formField]`, **not** `ngModel`.
- `FormField` already syncs `required`, `disabled`, etc. from field state to the control — do **not** handle these manually.
- Reset a field's value/dirty/touched with `field().reset()`. `markAsPristine` does **not** exist on `FieldState`.
- `markAsTouched()` also marks descendants (pass `{ skipDescendants: true }` to limit it).

## Templates

- Optional chaining (`a?.b`) yields `undefined`, not `null`, when `a` is nullish — don't compare its
  result with `=== null`.
- Use native class/style bindings (`[class.x]`, `[style.x]`), not `NgClass`/`NgStyle`.
- Enter/leave animations use `animate.enter` / `animate.leave` with CSS classes — don't use
  `@angular/animations` (deprecated).

## DI

- Root singletons: `@Service()` (shorthand for `@Injectable({ providedIn: 'root' })`). Route- or
  component-scoped services: plain `@Injectable()` plus a `providers` entry (see `ng-generate`).
