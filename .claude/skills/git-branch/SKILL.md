---
name: git-branch
description: Use this skill when the user asks to create a branch or you need to create a new branch.
model: haiku
user-invocable: true
disable-model-invocation: false
allowed-tools: [Bash]
---

# git-branch

Follow these rules when creating branches.

## Branch naming convention

Format: `{type}/{short-description}`

- **type**: `feat`, `fix`, `hotfix`, `chore`, `refactor` etc.
- **short-description**: lowercase kebab-case summary, a few words

Examples:

- `feat/team-star-voting`
- `fix/login-redirect`
- `refactor/firebase-modular-sdk`

## Additional rules

- Always create new branches from `master` unless the user asks otherwise
- If the working tree has uncommitted changes, tell the user before switching — do not stash or
  discard them yourself

## Steps to create a branch

1. Check current branch — if not on `master`, switch to it: `git checkout master`
2. Fetch and update `master` from remote: `git pull`
3. Create and switch to the new branch: `git checkout -b {branch-name}`
