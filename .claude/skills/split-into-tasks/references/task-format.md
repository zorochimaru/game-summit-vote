# Task format

Each task must be **fully self-contained** — an autonomous sub-agent must be able to execute it without reading the plan, prior tasks, or asking questions. Include all context inline.

## Fields

| Field                   | Content                                                                                                                                                                                                  |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **What**                | What to do, 1-3 sentences max                                                                                                                                                                            |
| **Context**             | Background an autonomous agent needs to understand WHY this change is being made and HOW it fits into the broader feature. Domain terms, architectural decisions, non-obvious constraints. 2-4 sentences |
| **Pattern**             | Path to an existing file this task should mirror in style/structure. Omit if no relevant pattern exists                                                                                                  |
| **Skills**              | Comma-separated skills required (e.g. `angular`, `ng-generate`, `css`). Omit if none apply                                                                                                               |
| **Files**               | Files to create/modify — full paths from project root                                                                                                                                                    |
| **Acceptance criteria** | Bulleted list of verifiable conditions that must be true when the task is done                                                                                                                           |
| **Browser check**       | Concrete steps in the running app — see [browser-verification.md](browser-verification.md). Omit for tasks with no rendered output (types, services, enums)                                              |
| **Manual**              | `true` only for changes the user makes by hand in the Firebase console (collections, fields, Remote Config). Omit otherwise                                                                              |
| **Depends on**          | Task N-1, or `none`                                                                                                                                                                                      |
| **Done**                | `true` / `false`                                                                                                                                                                                         |

## Saved file layout

    # [Plan Name] - Task Breakdown

    > Source: [original plan file path]

    ## Browser verification (UI tasks)

    [only when at least one task has a Browser check — copy the block from
     references/browser-verification.md]

    ## Tasks

    ### Task 1: [title]

    - **What**: ...
    - **Context**: ...
    - **Pattern**: src/app/private/core/interfaces/kpop/kpop.interface.ts
    - **Skills**: angular
    - **Files**: ...
    - **Acceptance criteria**:
      - Condition 1
      - Condition 2
    - **Depends on**: none
    - **Done**: false

    ### Task 2: [title]

    - **What**: ...
    - **Context**: ...
    - **Pattern**: src/app/private/star-vote-panel/star-vote-panel.component.ts
    - **Skills**: angular, css
    - **Files**: ...
    - **Acceptance criteria**:
      - Condition 1
      - Condition 2
    - **Browser check** (see [Browser verification](#browser-verification-ui-tasks)):
      - Reach the screen via the recipe above, as a `cosplay` jury user
      - The new element is visible with the expected label
      - Resize to ~400px wide — layout still fits without horizontal scroll
      - Console — no new errors
    - **Depends on**: Task 1
    - **Done**: false
