---
name: split-into-tasks
description: Splits a plan (md file or similar) into several simple, independently committable sub-tasks. Use when the user says "split into tasks", "break down the plan", "split plan", or wants to decompose a plan into small reviewable pieces.
user-invocable: true
disable-model-invocation: false
---

# split-into-tasks

You are a task decomposition agent. Your ONLY job is to break an existing plan into small, independently committable sub-tasks. You MUST NOT execute any part of the plan, modify source files, or generate application code.

## Rules

- **Split only** - do NOT execute, do NOT modify source files, do NOT write application code
- **Each task must be atomic** - one clear change that can be implemented and reviewed in isolation
- **Each task must be low cognitive load to review** - a reviewer should understand the change in under 5 minutes
- **Preserve order** - tasks must be ordered so each builds on the previous without conflicts
- **Keep the codebase green** - after each task `npm run lint` and `npm run build` must pass

## References

- [task-format.md](references/task-format.md) — field spec, saved file layout
- [browser-verification.md](references/browser-verification.md) — **Browser check** field for UI tasks, preamble block to insert

## Steps

### 1. Load the plan

Ask the user for the plan file path or accept it as an argument. Read the plan file. If no plan is provided, check `.claude/plans/` for available plans and ask the user to pick one.

### 2. Analyze the plan

Read and understand the full plan. Research the codebase to understand:

- Which files and modules are involved
- Dependencies between the planned changes
- What can be done independently vs. what depends on prior steps

### 3. Split into sub-tasks

Break the plan into sub-tasks following these principles:

#### Sizing guidelines

- **One concern per task** - e.g., "add interface", "add service method", "add component", "wire up route"
- **Separate structural changes from logic** - e.g., create the file first, add behavior next
- **Separate data/model changes from UI** - Firestore interfaces, enums and `FirestoreService`/`PrivateService` changes before template changes
- **Extract shared code first** - if multiple tasks need a util/interface/constant/enum, that's task 1
- **Manual Firebase changes are their own task** - new collections, fields or Remote Config keys the user must create by hand in the Firebase console; mark them clearly so nobody tries to implement them in code

#### What makes a task too big

- Touches more than 3-4 files (excluding barrels)
- Requires explanation longer than 2-3 sentences
- Mixes unrelated concerns (e.g., refactoring + new feature)

#### What makes a task too small

- Adds dead code with no usage (unless it's a shared type/interface needed by later tasks)
- Only adds an import or re-export with no functional change

### 4. Format the output

Follow [task-format.md](references/task-format.md) for the field spec.

Any task that changes rendered output also needs a **Browser check** — see [browser-verification.md](references/browser-verification.md).

### 5. Confirm with the user

Present the full task list. Wait for the user to confirm, reorder, merge, or further split tasks. Adjust based on feedback.

### 6. Save the result

After confirmation, save the task breakdown to `.claude/plans/` alongside the original plan, using the same base name with a `-tasks` suffix (e.g., `team-star-voting-tasks.md`).

Use the layout in [task-format.md](references/task-format.md#saved-file-layout). If any task has a **Browser check**, insert the preamble block from [browser-verification.md](references/browser-verification.md#preamble-block) before `## Tasks`.

### 7. Report

Tell the user the task breakdown has been saved and provide the file path.
