---
name: pr
description: Use when the user asks to create a pull request or open a PR. Runs lint and build checks, pushes the branch, and prepares the PR.
model: haiku
user-invocable: true
disable-model-invocation: true
allowed-tools: [Bash, Read, Glob, Grep]
---

# pr

Follow these steps when creating a pull request.

The base branch is `master`. Merging into `master` deploys straight to production (Firebase Hosting,
project `gamesummit-jury`); every PR from this repo gets a Firebase preview-channel deploy from CI.

## Step 1 — Run checks

Run sequentially — do not parallelize:

1. `npm run lint 2>&1 | tail -30`
2. `npm run stylelint 2>&1 | tail -30`
3. `npm run build 2>&1 | tail -30`

The build needs `src/environments/environment.ts` (gitignored). If it is missing, report that and
stop — do not create it.

If any check fails, report the failure and the proposed fix to the user. Wait for confirmation before
applying the fix. Once confirmed, apply the fix, commit it using the `commit` skill, then re-run that
specific check to confirm it passes before continuing.

## Step 2 — Gather branch context

- Run `git log master..HEAD --oneline` to see all commits on this branch (include info from all
  commits, not only the last)
- Run `git diff master...HEAD --stat` to see changed files
- Look at the plans for this branch in `.claude/plans/`, if any

## Step 3 — Push the branch

1. Run `git rev-parse --abbrev-ref HEAD` to get the branch name. If it is `master`, stop and tell the
   user — a PR needs a feature branch
2. Run `git push -u origin HEAD`

## Step 4 — Create the PR

If `gh` is available (`gh --version` succeeds), run
`gh pr create --base master --title "<title>" --body-file <tmp file>` and output the PR URL.

Otherwise (it is not installed by default on this machine), do not fall back to `curl` or the GitHub
API. Instead print the title and body ready to paste, and the compare URL built from
`git remote get-url origin`:

```
https://github.com/<owner>/<repo>/compare/master...<branch>?expand=1
```

### PR title format

Same format as commit messages: `{type}: {description}` (e.g. `feat: add star voting for team cosplay`).

### Body template

```md
## Motivation

<!-- Why these changes were made: the problem or requirement this PR addresses. -->

## Changes

<!-- Bullet list of the key changes. -->

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

- **Motivation**: explain the "why"
- **Changes**: bullet list of the key things that changed (use commit messages and diff as source)
- Mention Firestore data or Remote Config changes that must be made by hand before/after merging, if any

### Additional rules

- Do not ask for confirmation — prepare/create the PR directly
- After creating, output the PR URL (or the compare URL) for the user
