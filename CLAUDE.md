# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Angular 22 SPA for jury voting at Game Summit (cosplay solo, cosplay team, and K-pop contests). Backend is Firebase only (Auth, Firestore, Storage, Remote Config) — there is no custom server. Deployed to Firebase Hosting (project `gamesummit-jury`) by GitHub Actions on push to `master`.

## Commands

- `npm start` — builds the SVG icon sprite (`make-sprite`) and then runs `ng serve -o` (http://localhost:4200)
- `npm run build` — production build to `dist/` (`@angular/build` application builder)
- `npm run make-sprite` — regenerate the SVG sprite from `src/assets/icons/svg/**/*.svg` (config in `svg-sprite.json`). Run it after adding or changing icons; CI runs it before deploy.
- `npm run lint` / `npm run lint-fix` — ESLint via `ng lint`
- `npm run stylelint` / `npm run stylelint:fix` — SCSS linting
- `npm run format` — Prettier
- CI (GitHub Actions) runs on Node 24.

There are no unit tests: there are no `*.spec.ts` files and no `test` target in `angular.json`.

## Required local setup

`src/environments/environment.ts` is gitignored. It must export `environment: EnvConfig` (see `src/app/core/interfaces/environment.interface.ts`) with the Firebase web config. In CI, `server.js` writes this file from the `ENVIRONMENT_FILE` secret.

## Commit hook

`.husky/pre-commit` runs `lint-staged` (eslint --fix on `*.ts`, stylelint --fix on `*.scss`), **bumps the patch version in `package.json`, and runs `git add .`**. Every commit therefore stages _all_ working-tree changes. Make sure unrelated changes are stashed or committed separately before you commit.

## Architecture

- **Standalone components, zoneless.** `app.config.ts` uses `provideZonelessChangeDetection()`, so state that drives templates must be signals (or go through `async`/`toSignal`). Mutating plain fields will not re-render.
- **Firebase access goes through `FirebaseProvider`** (`core/firebase-provider/firebase.provider.ts`). It is a root service that initializes the modular Firebase SDK (`firebase/*`, not AngularFire, which was removed) and exposes `auth`, `firestore` (persistent multi-tab cache), `storage` and `remoteConfig`. The InjectionTokens in `firebase-token.ts` are currently unused.
- **`FirestoreService`** (`core/services/firestore.service.ts`) is the generic data layer: Observable-returning `get`, `getList`, `getListWithPagination`, `getListByIds`, `getLiveListChanges`, `create`, `update`, `delete`, `batchSave` (chunked `writeBatch`), and `incrementField`/`decrementField`. Collection names come from the `FirestoreCollections` enum. Use this service instead of calling the Firestore SDK from components.
- **Vote types → collections.** `VoteTypes` (`cosplay`, `cosplayTeam`, `kpop`) map to a participants collection, a criteria collection, and a results collection through `PrivateService.mapTypeTo*Collection`. Star votes use separate `*StarResults` collections. Domain interfaces in `private/core/interfaces` come in pairs: `X` and `XFirestore` (the stored shape).
- **Auth and roles.** `AuthService` wraps Firebase Auth (`isAuthenticated$`) and holds the app-level user profile (from the `authUsers` collection) in the `authUser` signal, including `role` (`Roles`: `administrator`, `kpop`, `cosplay`, `user`) and the per-vote-type `stars` the user has left.
- **Routing** (`app.routes.ts` → `private/private.routes.ts`). Everything is lazy-loaded and protected with `canMatch` functional guards:

  - `loginGuard` / `authGuard` — check Firebase auth state
  - `juryOnlyGuard` — any role except `user` (`vote-panel`, `results`)
  - `adminGuard` — `administrator` only (`admin-panel`)
  - `star-vote-panel` — available to every authenticated user

  Failed guards redirect to `/login` with a `redirectLink` query param. Route paths come from the `RouterLinks` enum.

- **Feature flags.** `remoteConfigGuard` and the `IfFeatureFlag` directive read Firebase Remote Config keys from `RemoteConfigParams`.
- **Barrel imports.** Each folder exposes an `index.ts`. Import from `../core`, `./shared`, etc. rather than from deep paths.
- **Admin data import.** The admin panel imports participants from Excel through `xlsx` (see `excel-file-fields.interface.ts`) and uploads images through `UploadService` (Firebase Storage, `StorageFolders` enum).

## Conventions

- Prettier: single quotes, no trailing commas, `arrowParens: avoid`, CRLF line endings, imports sorted and grouped by `@trivago/prettier-plugin-sort-imports` (packages first, then relative imports).
- Private class members use ECMAScript `#private` fields; dependencies are injected with `inject()`, not constructor parameters.
- A Claude PostToolUse hook (`.claude/hooks/format-hook.sh`) runs eslint --fix and prettier on every file Claude edits.
- Project-specific Claude skills and commands live in `.claude/skills` and `.claude/commands/opsx` (an OpenSpec propose/apply/archive workflow).
