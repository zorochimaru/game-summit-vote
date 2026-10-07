---
name: execute-tasks
description: Executes tasks from a task breakdown file one by one. Use when the user says "execute tasks", "execute plan", or you need to execute saved tasks in an md file.
user-invocable: true
disable-model-invocation: false
---

# execute-tasks

Execute tasks from a task breakdown file one by one in order, stopping after each for user review.

## Rules

- **One task at a time** — implement only the current task, stop, and wait for user confirmation before proceeding
- **Respect order** — execute tasks in sequence; check `Depends on` and never skip ahead
- **Skip completed tasks** — skip any task where `Done: true`
- **Stay in scope** — do not exceed the task description; no extra refactoring, no bonus features
- **Manual tasks go to the user** — for a task with `Manual: true`, tell the user what to change in the Firebase console and wait for them to confirm; there is nothing to commit
- **Verify UI in a real browser** — a task with a **Browser check** field is not done until it renders correctly; start the dev server and open the app yourself when you reach such a task, never before
- **Commit after confirmation** — after the user approves, use the `commit` skill to commit, then mark the task done
- **Mark done immediately** — after committing, update `- **Done**: false` → `- **Done**: true` in the task file

## Steps

### 1. Load the task file

Accept the file path as an argument. If not provided, list `*-tasks.md` files in `.claude/plans/` and ask the user to pick one. Read the file.

### 2. Find the next task

Find the first task where `Done: false`. If all tasks are `Done: true`, run `npm run lint` and `npm run build`, report the result, and stop.

### 3. Announce the task

Before doing anything, clearly show:

```
## Task N: [title]

**What**: ...
**Skills**: ...
**Files**: ...
```

Ask the user to confirm they want to proceed (or say "go" to skip the prompt if they already said "execute tasks").

### 4. Load required skills

If the task has a `Skills` field, invoke each listed skill via the Skill tool **before** writing any code. This is mandatory — skills provide conventions and patterns that must be followed during implementation.

### 5. Implement the task

Implement exactly what the task describes. Follow all project conventions and any rules loaded from skills. Read files before editing. Do not touch files not listed in the task unless absolutely necessary (and explain why if so). Run `npm run lint` and fix errors in the files you touched.

### 6. Verify the UI in the browser — only if the task has a Browser check

Tasks with no **Browser check** field skip to step 7.

Otherwise follow the preflight and per-task procedure in the `orchestrate` skill's
[ui-verification.md](../orchestrate/references/ui-verification.md): dev server via `npm start`,
`claude-in-chrome` skill, correct role logged in (never log in yourself), read-only against the live
Firebase data, desktop and ~400px viewports, no new console errors.

Report what you actually observed. If a step could not be run, say so rather than inferring the
result from the code, and do not commit a failing check.

### 7. Stop for user review

After implementation, summarize the changes:

```
Done. Here's what changed:
- file/path.ts — description of change
- ...

Ready to commit. Type "yes" to commit and continue, or give feedback to revise.
```

Wait for the user to respond. If they give feedback, apply it and show the summary again. Do not commit until they explicitly confirm.

### 8. Commit

Use the `commit` skill to commit the changes.

### 9. Mark task as done

In the task file, change the current task's `- **Done**: false` to `- **Done**: true`.

### 10. Continue

Ask: "Continue with Task N+1: [title]?" and wait for user input. If they confirm, go back to step 2.
