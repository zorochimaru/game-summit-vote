---
name: commit
description: Use this skill when the user asks to commit the code, commit changes, or you need to commit your changes.
user-invocable: true
disable-model-invocation: false
allowed-tools: [Bash, Read, Glob, Grep]
---

# commit

Follow these rules when writing commit messages.

## Commit message convention

### Subject format

Format: `{type}: {description}` (max **72** characters). An optional scope is allowed when it adds
clarity: `{type}({scope}): {description}` (e.g. `fix(admin-panel): ...`).

- **type**: `feat`, `fix`, `hotfix`, `chore`, or `refactor`
- **description**: concise, lowercase-start summary of the change

Examples:

- `feat: add star voting for team cosplay`
- `fix: update routing to redirect to login instead of google login`
- `refactor: migrate to Firebase modular SDK`
- `chore(admin-panel): remove unused excel export button`

### Body format

Body format (separated from subject by a blank line):

- Include a short list of only the important changes, up to 3-5 list items
- Each item on its own line, prefixed with `-`
- Omit trivial or obvious changes (imports, formatting, etc.)
- Do not list every individual file that was changed
- End with `Co-Authored-By: Claude ${modelName} <noreply@anthropic.com>`, where `${modelName}` is the
  model currently answering (e.g. `Opus 5.5`), not the model that wrote the code earlier in the session
  and not the one in the example below. Keep using the current one unless the user says otherwise.

Full commit example:

```
feat: add star voting for team cosplay

- add cosplayStarTeamResults collection mapping
- decrement user stars locally after a successful vote
- hide star button when the user has no stars left

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

## Rules

- Keep the subject line under **72** characters
- Do not end the subject line with a period
- Use imperative mood (e.g. "add", "fix", "update", not "added", "fixed", "updated")
- Do not ask user to confirm, just commit

### Staging

- Stage explicitly, by path: `git add <path> [<path> ...]`. Never `git add -A` / `git add .` yourself
- Run `git status --short` first. **The pre-commit hook runs `git add .`** (see below), so anything
  modified in the working tree ends up in the commit regardless of what you staged. If unrelated
  changes are present, stop and tell the user before committing — do not stash or discard them
  yourself
- If the tree holds two unrelated changes of your own, make two commits — commit the first, then
  make the second change's files the only modified ones before committing again

### Pre-commit hook (`.husky/pre-commit`)

The hook runs, in order:

1. `lint-staged` — `eslint --fix` on staged `*.ts`, `stylelint --fix` on staged `*.scss`. The
   committed content can differ from what you wrote. That is expected — do not amend to "undo" it
2. `npm --no-git-tag-version version patch` — bumps the patch version in `package.json` /
   `package-lock.json` on **every** commit. Expected; do not revert it
3. `git add .` — stages the whole working tree

- If the hook fails, fix the reported errors and commit again. Never pass `--no-verify`
- Avoid `git commit --amend`: the hook bumps the version again on every amend
