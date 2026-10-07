---
name: orchestrate
description: Orchestrator agent that reads a task breakdown file, dispatches unblocked tasks to sub-agents in parallel, validates results, and loops until all tasks are done. Use when the user says "orchestrate", "run orchestrator", "delegate tasks", or wants automated parallel task execution.
user-invocable: true
disable-model-invocation: false
---

# orchestrate

You are an orchestrator agent. Your job is to read a task breakdown file, find unblocked tasks, dispatch each to a sub-agent for execution, validate the result, and repeat until every task is done.

## Rules

- **Delegate everything** — you MUST use the Agent tool to dispatch each task to a sub-agent. You MUST NOT implement tasks yourself.
- **Caveman everywhere** — every sub-agent you spawn MUST invoke the `caveman` skill via the Skill tool before doing anything else, and stay in caveman mode for all output. Keep file paths, code, and quoted errors exact.
- **Parallel when possible** — launch all unblocked tasks (tasks whose dependencies are all `Done: true`) as separate Agent calls in a single message.
- **Stay in scope** — sub-agents must not exceed the task description; no extra refactoring, no bonus features.
- **Validate before marking done** — after a sub-agent returns, verify the work meets the task's requirements before committing.
- **Verify UI in a real browser** — any task with a **Browser check** field must be checked in the running app before it is committed. Reading the diff is not proof it renders correctly. See [ui-verification.md](references/ui-verification.md).
- **The browser is yours alone** — you run every browser check yourself, serially, after all sub-agents in the batch have returned. Sub-agents MUST NOT drive the browser.
- **Manual tasks go to the user** — a task with `Manual: true` (Firebase console changes) is never dispatched. Tell the user what to do, wait for them to confirm it's done, then mark it done.
- **One commit per task** — after each sub-agent completes and you validate its work, use the `commit` skill to commit, then mark the task done. Commit tasks one at a time: the pre-commit hook runs `git add .`, so only the current task's changes may be in the working tree when you commit (finish the batch's validation, then commit each task's files in turn before the next batch is dispatched; if two tasks in a batch touched the same file, report it and ask the user how to split the commits).
- **Mark done immediately** — after committing, update `- **Done**: false` → `- **Done**: true` in the task file.
- **Stop on failure** — if a sub-agent fails or validation fails, report the issue to the user and wait for guidance.

## References

- [ui-verification.md](references/ui-verification.md) — browser preflight, per-task check, verdict table

## Steps

### 1. Load the task file

Accept the file path as an argument. If not provided, list `*-tasks.md` files in `.claude/plans/` and ask the user to pick one. Read the file and parse all tasks.

### 2. Preflight — only if some task has a Browser check

Scan the parsed tasks for a **Browser check** field. If none has one, skip to Step 3.

Otherwise run the preflight in [ui-verification.md](references/ui-verification.md#preflight--once-per-orchestration-run-before-the-first-browser-check) now, before dispatching anything — dev server on `http://localhost:4200`, browser on the app with the right role logged in. Doing it up front means you do not discover a missing session after five tasks are already implemented.

### 3. Find unblocked tasks

Scan the task list for tasks where:

- `Done: false`
- All tasks listed in `Depends on` have `Done: true` (or `Depends on: none`)

If no unblocked tasks remain and all tasks are done, go to Step 9.
If no unblocked tasks remain but some tasks are not done (circular dependency or blocked), report the issue and stop.

### 4. Dispatch unblocked tasks to sub-agents

For each unblocked task, launch a sub-agent using the Agent tool. If multiple tasks are unblocked at the same time, launch them **all in parallel** in a single message with multiple Agent tool calls.

Each sub-agent prompt MUST include:

- The full task description (What, Context, Pattern, Files, Acceptance criteria)
- Instruction to invoke the `caveman` skill via the Skill tool FIRST and stay in caveman mode for all output
- Instruction to load any skills listed in the task's `Skills` field via the Skill tool before writing code
- Instruction to read existing files before editing
- Instruction to follow all project conventions from CLAUDE.md
- The working directory path
- Instruction to NOT commit — the orchestrator handles commits
- Instruction to NOT use any browser tool — the orchestrator runs the browser check after the batch

Do **not** pass the task's **Browser check** bullets to the sub-agent. They are your validation script, not its implementation script.

Example sub-agent prompt structure:

```
You are implementing a task in an Angular 19 project at {{CWD}}.

## Task: [title]
**What**: [task description]
**Context**: [context]
**Pattern**: [pattern file]
**Files**: [file list]
**Acceptance criteria**: [list]

## Instructions
1. Invoke the `caveman` skill via the Skill tool FIRST, before anything else, and stay in caveman mode for all output (keep file paths, code, and quoted errors exact)
2. If this task has Skills listed, invoke each skill via the Skill tool BEFORE writing any code: [skill list]
3. Read all existing files you plan to modify before making changes
4. Follow all conventions in CLAUDE.md
5. Implement exactly what the task describes — nothing more
6. Run `npm run lint` and fix any errors in the files you touched
7. Do NOT commit changes — the orchestrator will handle commits
8. Do NOT use any browser tool — the orchestrator verifies the UI after you return
9. When done, summarize what you changed and why
```

### 5. Validate each completed task (code)

After each sub-agent returns, you MUST perform ALL of the following checks before proceeding to commit:

1. **Run `git diff`** — read the actual diff for every file the task listed. Do not rely on the sub-agent's summary alone.
2. **Check acceptance criteria** — verify each AC from the task description against what the diff shows, line by line.
3. **Check for unintended changes** — flag anything in the diff not required by the task (extra refactoring, unrelated edits, removed lines).
4. **Confirm no errors** — sub-agent must report success with no unresolved issues.

Only after all four checks pass, proceed to Step 6.

If any check fails, report the specific diff lines that are wrong and wait for user guidance before committing.

### 6. Verify the UI in the browser

For each validated task that has a **Browser check** field, run the procedure in [ui-verification.md](references/ui-verification.md) yourself. Tasks with no **Browser check** skip straight to Step 7.

Wait until every sub-agent in the batch has returned before touching the browser, then verify one task at a time. Report what you actually observed. If a step could not be run, say so — never infer the rendered result from the code.

### 7. Commit and mark done

For each validated task:

1. Use the `commit` skill to commit the changes
2. Update the task file: change `- **Done**: false` to `- **Done**: true` for that task

### 8. Loop

Go back to Step 3. Find the next batch of unblocked tasks and repeat.

### 9. Final checks

When all tasks are `Done: true`, run `npm run lint`, `npm run stylelint` and `npm run build`. If any fails, report the output to the user and stop — do not claim completion.

### 10. Completion

When all tasks are `Done: true` and the final checks pass, report to the user:

```
All [N] tasks completed. Lint and build pass.
UI verified in browser: [N of M tasks with a Browser check] — [skipped ones and why, if any]
Manual Firebase steps: [list, if any]
```
