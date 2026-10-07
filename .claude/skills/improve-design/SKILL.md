---
name: improve-design
description: Reviews code for design quality issues using principles from "A Philosophy of Software Design" by John Ousterhout. Use when the user says "improve design", "review design", "check design", or wants to identify design problems in code.
---

# improve-design

Review code against the design principles and red flags from _A Philosophy of Software Design_ (Ousterhout). Identify concrete problems, explain why they matter, and suggest specific improvements.

## Rules

- **Diagnose, then prescribe** — name the red flag, explain the impact, give a concrete fix
- **Reference specific code** — file paths and line numbers for every finding
- **Prioritize ruthlessly** — lead with the most damaging issues; skip minor nits unless design is otherwise clean
- **No praise** — only surface problems; silence means the code is fine on that dimension
- **Severity levels**: 🔴 critical (obscures intent or couples modules badly), 🟡 warning (adds unnecessary complexity), 🔵 nit (minor clarity or naming issue)

## Design Principles (positive goals to check against)

1. Modules should be **deep** — simple interface, rich implementation
2. Interfaces should make the **most common usage as simple as possible**
3. A simple interface matters more than a simple implementation
4. General-purpose modules are deeper than special-purpose ones
5. **Separate** general-purpose and special-purpose code
6. Different layers should have **different abstractions**
7. **Pull complexity downward** — hide it inside modules, not force it on callers
8. **Define errors out of existence** — design APIs so misuse is impossible
9. Software should be designed for **ease of reading**, not ease of writing
10. Separate what matters from what doesn't and **emphasize what matters**
11. Comments should describe things **not obvious from the code**

## Red Flags (patterns to detect)

| Red Flag                                  | Definition                                                              |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| **Shallow Module**                        | Interface is barely simpler than the implementation                     |
| **Information Leakage**                   | A design decision is reflected in multiple modules                      |
| **Temporal Decomposition**                | Structure follows execution order, not information hiding               |
| **Overexposure**                          | Callers must know about rarely-used features to use common ones         |
| **Pass-Through Method**                   | Method just delegates to another with the same signature                |
| **Repetition**                            | A nontrivial piece of code is repeated over and over                    |
| **Special-General Mixture**               | Special-purpose and general-purpose code are interleaved                |
| **Conjoined Methods**                     | Two methods are so entangled you can't understand one without the other |
| **Comment Repeats Code**                  | Comment says exactly what the code already says                         |
| **Implementation Contaminates Interface** | Interface doc describes internals callers don't need to know            |
| **Vague Name**                            | Name is too imprecise to convey useful information                      |
| **Hard to Pick Name**                     | Difficulty naming something signals blurry responsibility               |
| **Hard to Describe**                      | Complete documentation requires a long explanation                      |
| **Nonobvious Code**                       | Behavior or meaning can't be understood without deep study              |

## Steps

### 1. Determine scope

- If the user provides a file or directory: review only that
- If the user says "review changes" or "review branch": use `git diff master...HEAD` to find changed files, then read each in full
- If ambiguous: ask

### 2. Read the full context

Read every file in scope completely — not just changed hunks. Red flags often only appear when you see the whole module.

### 3. Evaluate

For each file, check every red flag. Ask:

- Is this module's interface dramatically simpler than its implementation? (deep vs. shallow)
- Does this leak internal decisions to callers?
- Are callers forced to know things they shouldn't need to?
- Is complexity pushed up to callers instead of hidden here?
- Are names precise and self-explanatory?
- Do comments add information not already in the code?

### 4. Report

```
## Design Review: [scope]

**Files reviewed:** [n]
**Findings:** 🔴 [n] · 🟡 [n] · 🔵 [n]

---

### 1. 🔴 [Red Flag Name] — [short title]
**File:** `path/to/file.ts:42`

[What is wrong and why it hurts: which principle is violated, what the cost is.]

**Fix:** [Concrete suggestion — rename, extract, hide, redesign interface, etc.]

---
```

Order: critical → warnings → nits.

### 5. Summary

One paragraph: is the design fundamentally sound, does it need targeted fixes, or does it need rethinking?
