---
tags:
  - integration/github-rules-as-code
  - architecture
---

# Architecture

## Goal

Apply GitHub rulesets + CODEOWNERS to opt-in repos, declaratively, with one command.

## Pipeline

```
   developer            PR w/ .json/.mjs change         CI
      │                          │                       │
      ▼                          ▼                       ▼
  npm run plan           .github/workflows/plan.yml  npm run apply
                                          │                       │
                              ┌───────────┴──────────┐            │
                              ▼                      ▼            ▼
                       diff (rulesets +        write_codeowners  rulesets
                       CODEOWNERS)                            (computed)
                                          │
                                          ▼
                                    GitHub REST API
                                  (api.github.com)
```

## Components

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  src/index.mjs           CLI entry (commander)             │
│      │                                                    │
│      ▼                                                    │
│  src/config/loader.mjs   merge defaults + manifests        │
│      │                                                    │
│      ▼                                                    │
│  src/github/diff.mjs     compute desired vs current        │
│      │                                                    │
│      ▼                                                    │
│  src/commands/plan.mjs   log diff                          │
│  src/commands/apply.mjs  execute diff                      │
│                                                            │
│  Net effect: rulesets + .github/CODEOWNERS in each repo    │
└────────────────────────────────────────────────────────────┘
```

## State

- **No remote state file.** GitHub is the source of truth.
- The runner reads current rulesets and CODEOWNERS via REST, then applies only the diff.
- This makes the runner safe to re-run any number of times.
- Deletes require explicit `--prune` to prevent accidental removal.

## Auth

- Local: `gh auth status` — ensures the user has authenticated `gh` with the right scopes.
- CI: a per-repo secret `GH_RULES_TOKEN` (PAT with `repo` scope). The default `GITHUB_TOKEN` is scoped to the runner repo only and cannot mutate rulesets on other repos.
- The PAT must have access to every repo listed in `rules/manifests/`.

## Boundaries

- The runner never modifies the `Personal/` parent repo (other than the entry in `personal.code-workspace` and `.gitignore` from this repo's own bootstrap).
- The runner never edits the shared skill at `Personal/.agents/skills/apply-github-ruleset/`. It mirrors via `scripts/sync-skills.mjs` only when explicitly invoked.
- The runner is per-repo. There is no cross-org support; every manifest is `owner/name`.

## Failure modes

- `gh` not authenticated → runner fails fast with `gh auth status` hint.
- Manifest schema mismatch → zod throws, runner exits non-zero.
- Network failure → `execFile` rejects, runner exits non-zero.
- Partial failure mid-apply → the diff is logged before each op; rerun `plan` to see what's left.
