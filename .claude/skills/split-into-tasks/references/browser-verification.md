# Browser verification for UI tasks

Any task that changes rendered output (template, SCSS) gets a **Browser check** field. There are no
automated tests in this project, so the browser check is the only proof that the UI works — it
catches rendering, layout, zoneless change-detection and console errors that reading the diff can't.

## Tooling

Use the `claude-in-chrome` skill (load it before the first browser call). It drives the user's own
Chrome, which already holds their logged-in Firebase session.

## Constraints specific to this app

- **Live data.** There is no Firebase emulator — the dev server talks to the production Firebase
  project. Browser checks are **read-only** by default: never submit a vote, spend a star, upload,
  import Excel, or delete anything unless the task explicitly allows it and the user agreed.
- **Roles.** What a screen shows depends on the logged-in user's role (`administrator`, `kpop`,
  `cosplay`, `user`). Name the role each check needs. If the logged-in user has a different role,
  report it — never log in or switch accounts yourself.
- **Mobile first.** Jury members vote on phones. UI checks should include a narrow (~400px) viewport.

## Write a self-navigation recipe, not a deep link

Never hardcode Firestore document ids in a plan. Describe the route as numbered steps where every
step is identified by _visible text_:

- Start from a stable route from the `RouterLinks` enum (`/dashboard`, `/vote-panel`,
  `/stars-vote-panel`, `/admin-panel`, `/results` — check the enum for exact values).
- Say how to _choose_ a record rather than which record (e.g. "the first participant card that has
  an image").
- Name the tabs/toggles the agent should click (e.g. the vote-type switch).
- Branch explicitly where the UI can go two ways, quoting the empty-state text that distinguishes them.
- End with text unique to the target screen, so the agent knows it arrived.

## Writing the check

Write concrete, observable steps, not "verify in the browser": what is visible, what changes after a
click, what the console shows. End with an instruction to report what was actually observed, and to
say when a step could not be run (dev server down, wrong role, no matching data) rather than
inferring the result from the code.

## Preamble block

When at least one task has a **Browser check**, insert this section into the saved file between `> Source:` and `## Tasks`.

    ## Browser verification (UI tasks)

    Tasks marked **Browser check** must be verified in a real browser. Load the `claude-in-chrome`
    skill and use the user's Chrome, which holds the logged-in session.

    Prerequisites — start these **yourself**, when you reach the first task that needs them:

    1. Dev server on `http://localhost:4200` (`npm start`, backgrounded). Poll the URL until it
       answers — a cold first build takes a minute or two.
    2. The browser shows the app logged in with the role listed below. If it shows the login page or
       a different role, report it — never log in yourself.

    Required role: [administrator | kpop | cosplay | user]

    **The app uses the live Firebase project.** Checks are read-only: never vote, spend stars, upload,
    import or delete unless a task's Browser check explicitly says so.

    ### Reaching the screen

    [numbered steps: stable start route → how to *choose* a record by visible content → toggles/tabs
     to click → explicit branch with the empty-state text → closing check on text unique to the
     target screen]

    Report what was actually observed. If a step could not be run, say so rather than inferring the
    result from the code.
