---
tags:
  - integration/github-rules-as-code
  - patterns
---

# Patterns

## Manifest opt-in

A repo is governed iff its filename appears in `rules/manifests/`. The manifest is the contract: dropping a file opts in, deleting it (with `--prune`) opts out.

## Defaults + overrides

`rules/defaults/personal-default.json` is the house style. Manifests reference one default and may include a partial `overrides` payload that is deep-merged on top. This keeps the shared rules DRY and lets per-repo repos express only the differences.

## Idempotency

The runner is pure diff. Rerun `npm run plan` and the diff should be empty (give or take drift). This is the test for "did the previous apply stick".

## CODEOWNERS first

GitHub's required-reviewer rule only fires when a `CODEOWNERS` file exists. The runner writes `.github/CODEOWNERS` in the same pass so the ruleset is enforceable end-to-end.

## --prune

Deletion is a destructive operation. The runner does not auto-delete remote rulesets when a manifest is removed. To delete, pass `--prune` explicitly. This is opt-in by default.

## Plan in CI

`plan.yml` runs on every PR. The diff is logged but nothing is mutated. This catches manifest typos and schema mismatches before merge.

## Apply in CI

`apply.yml` runs on push to main. Workflow-level permissions are `contents: read`; the apply job upgrades to `contents: write` only on the apply step. This is the principle of least privilege.

## Versioning

`engines.node` in `package.json` pins the minimum Node version. `.nvmrc` pins the exact version. `package.json` pins each dep version. No `^` or `~` ranges.

## Schema-first

Each default has a `.schema.json` next to it. The zod schema in `src/config/schema.mjs` is the runtime contract. CI runs `npm run lint` which catches malformed JSON.

## Async CLI

`src/index.mjs` uses `commander` with `await program.parseAsync(...)`. Subcommands are async because each manifest triggers multiple REST calls. No top-level `await` outside the entrypoint.

## Logger

`pino` writes JSON to stdout. In CI, this is easy to scrape. In local dev, `tail -f` reads it cleanly. No log files are written to disk.
