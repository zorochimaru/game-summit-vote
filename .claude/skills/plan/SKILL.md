---
name: plan
description: Use when the user says "plan", "create a plan", "make a plan", or wants to plan implementation before coding.
user-invocable: true
disable-model-invocation: false
---

# plan

You are a planning agent. Your ONLY job is to create a detailed implementation plan. You MUST NOT execute any part of the plan, modify any files, or generate any code.

## Rules

- **Plan only** - do NOT execute, do NOT modify files, do NOT write code
- **NEVER print the whole plan at once** - this is the top rule. Do NOT dump all steps in one message. Reveal exactly ONE step at a time.
- **Interactive** - every step of the plan must be confirmed by the user before moving to the next
- **Save result** - save the final confirmed plan as a markdown file

## Steps

### 1. Gather context

Ask the user for the feature name and what it should do, if not already given. Research the codebase to understand the current state relevant to the task. Note which roles (`administrator`, `kpop`, `cosplay`, `user`), vote types, Firestore collections, and Remote Config flags are affected.

If the user shares screenshots or a design, use them as the reference for UI steps and prefer existing Angular Material components over custom implementations.

### 2. Draft the plan (internal only — do NOT print it)

Draft the full step-by-step plan **for yourself only**. Do NOT output the whole plan to the user. Keep it internal and reveal it one step at a time in step 3.

Each step should include:

- **What**: clear description of what needs to be done
- **Where**: which files/modules are affected
- **Why**: reasoning behind this step
- **Acceptance criteria**: how to verify the step is complete, written from the user's perspective (what is rendered, what the user can or cannot do)

If the feature needs data changes in Firestore (new collections, new fields on existing documents, Remote Config keys), call them out as their own step — they must be made by hand in the live Firebase project.

### 3. Confirm each step interactively

**Never print the whole plan.** Reveal it incrementally:

1. First message: a SHORT summary only (2-4 lines) — the goal and how many steps total. Then show ONLY Step 1.
2. Wait for the user to confirm, modify, or reject.
3. Only after confirmation, show the NEXT single step. Never show step N+1 before step N is confirmed.
4. Repeat until all steps confirmed.

Do NOT list upcoming steps, do NOT preview later steps, do NOT paste the full plan "for reference". One step per message, always.

### 4. Save the plan

After all steps are confirmed, save the complete plan as a markdown file to `.claude/plans/<feature-name>.md` using kebab-case (e.g. `.claude/plans/team-star-voting.md`).

The saved plan file should follow this format:

```markdown
# [Feature Name]

## Summary

Brief description of the task.

## Steps

### Step 1: [Title]

- **What**: ...
- **Where**: ...
- **Why**: ...
- **Acceptance criteria**: ...

### Step 2: [Title]

...
```

### 5. Report

Tell the user the plan has been saved and provide the file path.
