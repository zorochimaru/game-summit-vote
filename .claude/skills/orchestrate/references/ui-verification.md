# UI verification — browser check

How the orchestrator proves a UI task is actually correct. Reading the diff is not proof: a template
can compile and still render nothing (e.g. a plain field mutated under zoneless change detection),
overflow on a phone, or throw in the console.

## Who runs it

The **orchestrator** runs every browser check. Sub-agents MUST NOT drive the browser.

Why: there is one dev server and one browser tab. Parallel sub-agents would navigate away from each
other's screens, and the dev server serves the union of all in-flight edits — so a sub-agent's view
may show another task's half-written code.

Sequencing:

1. Wait until **every** sub-agent in the batch has returned (no writes in flight).
2. Run the code validation (`git diff`, ACs, scope) for all tasks in the batch.
3. Then run browser checks **one task at a time**, serially.
4. Commit each task only after its browser check passes.

## Preflight — once per orchestration run, before the first browser check

Bring the environment up **yourself**, but only once you know a task in the run has a **Browser check**.

1. Load the `claude-in-chrome` skill.
2. Dev server: if `http://localhost:4200` doesn't answer, run `npm start` in the background and poll
   until it does.
3. Open `http://localhost:4200` in the browser. If it shows the login page, or the user's role
   doesn't match the tasks-file preamble, report it and stop — never log in yourself.

If preflight cannot be satisfied, report it and stop. Never mark a UI task verified from code alone.

## Per task

1. **Reach the exact state** using the **Reaching the screen** recipe in the tasks-file preamble.
   Never hardcode document ids. Wait for loaders to finish.
2. **Run the Browser check bullets** verbatim. Re-read the page after every interaction — Material
   dialogs and snack bars render into overlay containers at the end of `body`.
3. **Narrow viewport** — check the screen at ~400px wide as well as desktop width.
4. **Console** — no new errors.
5. **Live data** — read-only. Do not vote, spend stars, upload, import or delete unless the task's
   Browser check explicitly says so.

## Verdict

Report a table, one row per thing actually checked:

```
UI verification — Task N: [title]
Role: cosplay   Viewports: 1280 / 400

| Check                         | Expected            | Observed            | OK |
| ----------------------------- | ------------------- | ------------------- | -- |
| Star button visible           | yes                 | yes                 | ✅ |
| Button hidden at 0 stars      | hidden              | still visible       | ❌ |
| 400px layout                  | no horizontal scroll| no horizontal scroll| ✅ |
| Console                       | no errors           | no errors           | ✅ |
```

- All ✅ → commit the task.
- Any ❌ inside the task's scope → **do not commit**. Dispatch a fix to a sub-agent with the exact
  deltas (the orchestrator never fixes code itself), then re-verify.
- ❌ caused by a task that is not done yet → note it as expected, do not block.

## Never accept

- "Looks right" with no actual browser observation in the transcript.
- Reading the SCSS instead of looking at the rendered page.
- A pass while the dev server was down or the wrong role was logged in — report and stop instead.
- The orchestrator editing code to fix a finding, or a sub-agent driving the browser.
