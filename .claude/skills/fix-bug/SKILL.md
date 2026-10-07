---
name: fix-bug
description: Use this skill when the user asks to fix a bug, or you need to fix a bug. Enforces reproduce → root cause → minimal fix → verify.
---

# fix-bug

Fix bugs by first proving you understand them. This project has no automated tests, so "proof" is a
precise reproduction and an observed fix — never a guess from reading code.

## The cycle

1. **Understand & reproduce** — Read the relevant code and pin down the exact incorrect behavior:
   which role (`administrator` / `kpop` / `cosplay` / `user`), which route, which vote type, which data
   produces it. Write the reproduction down as steps + expected vs. actual. If you cannot articulate
   what is wrong and what "correct" looks like, stop and clarify before changing code.

2. **Find the root cause** — Trace from the symptom to the cause. Common places in this app:
   zoneless rendering (a plain field mutated instead of a signal), `FirestoreService` queries,
   vote-type → collection mapping in `PrivateService`, role guards, and `AuthService.authUser` state.

3. **Fix** — Make the **smallest** change that addresses the root cause. Do not refactor unrelated code
   in the same step.

4. **Verify** —
   - `npm run lint` and `npm run build` pass.
   - If the bug is visible in the UI, re-run the reproduction in the browser (see the `claude-in-chrome`
     skill) with the dev server from `npm start`. The app talks to the **live** Firebase project — do
     not create, vote on, or delete data to reproduce without the user's go-ahead. If you can't verify
     in the browser, say so and give the user the reproduction steps to check.

## Rules

- **One bug at a time.** If you discover more bugs, note them; finish the current one first.
- **Root cause, not symptom.** Don't patch over the visible error if the real cause is elsewhere.
- **Report honestly.** Say what you actually observed. If something still fails or couldn't be
  checked, say so — don't claim success.
