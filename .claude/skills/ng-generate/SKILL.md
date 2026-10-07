---
name: ng-generate
description: This skill should be used when the user asks to or you need to add a new Angular component, directive, service, pipe, or guard.
model: haiku
user-invocable: false
allowed-tools: [Read, Edit, Write, Bash]
---

# ng-generate

## Steps

- Execute `npx ng g <schematic> <path/name>` where schematic is one of: `component`, `directive`,
  `service`, `pipe`, `guard` (guards are functional `CanMatchFn` — use `--functional` and pick
  `CanMatch`). `skipTests` is already set for every schematic in `angular.json`; delete any
  `*.spec.ts` that still appears.

- Keep this repo's file suffixes (`header.component.ts`, `auth.service.ts`). If the generated files
  come out suffix-less (`header.ts`) or the class is missing its `Component`/`Service` suffix, rename
  them to match the existing convention.

- Remove any `changeDetection` the schematic adds — OnPush is the default.

- Add an `index.ts` file to the new component folder exporting the component, only if it's not a
  routed component (not lazy-loaded by the router). Also export it from the parent barrel
  (e.g. `private/shared/index.ts`, `core/guards/index.ts`).

- For a service, use plain `@Injectable()` (remove `providedIn: 'root'` / `@Service()`). The user must
  tell where to provide this service; if they say root, use `@Service()`.
