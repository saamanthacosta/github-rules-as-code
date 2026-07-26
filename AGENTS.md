# AGENTS.md — AI rules for github-rules-as-code

This document is the contract between human maintainers and AI agents working in this repo. Read it before proposing changes.

## Scope

This repo manages GitHub rulesets + CODEOWNERS for opt-in repos. It is a small Node.js CLI. It does not deploy infra, does not store secrets, and does not call any SaaS beyond `api.github.com`.

## Stack

- Node.js 20+ ESM (`.mjs`)
- `gh` CLI for authenticated REST calls (`gh api`)
- `zod` for manifest schema validation
- `commander` for CLI parsing
- `pino` for structured logging
- `eslint` + `prettier` for lint/format

## Conventions

- **No new dependencies** without first checking the official `gh` API or an existing repo dep. Add only when there is no clean alternative.
- **No remote state.** GitHub is the source of truth. The runner is diff-based; rerun safely.
- **No raw `curl` / `fetch`.** All HTTP goes through `gh api` so the auth context is consistent.
- **No secrets in the repo.** The runner relies on `GITHUB_TOKEN` (CI) or `gh auth status` (local). Never read or write `.env` with literal credentials.
- **No blind PUT.** Use diff-based apply. The `--prune` flag is required for deletes.
- **Idempotent CLI.** `plan` and `apply` may be run any number of times.

## File layout rules

- `src/` is the runner. Add new modules under `src/<area>/`. No top-level scripts.
- `rules/defaults/` holds the house style. Add a new file only when a meaningfully different house style is needed.
- `rules/manifests/` is the opt-in list. One file per repo. Filename is the repo name (e.g., `personal.json` → `saamanthacosta/personal` unless the manifest overrides).
- `docs/` is Obsidian-friendly. Wikilinks to other notes are welcome.
- `.agents/skills/apply-github-ruleset/` mirrors the shared skill — keep in sync via `scripts/sync-skills.mjs`.

## Patterns

### Adding a new managed repo

1. Create `rules/manifests/<repo>.json` modeled on the existing manifests.
2. Run `npm run plan -- --repo <owner>/<repo>` to verify the diff.
3. PR the new manifest.
4. After merge, CI applies automatically on push to main.

### Adding a new rule to the default

1. Update `rules/defaults/personal-default.json`.
2. Update `rules/defaults/personal-default.schema.json` to match.
3. Run `npm run plan` to preview the diff across all manifests.
4. PR the default change.

### Writing a manifest

```json
{
  "repo": "saamanthacosta/portfolio",
  "default": "personal-default",
  "codeowners": ["@saamanthacosta"],
  "overrides": {}
}
```

The `overrides` field is a partial ruleset payload that is deep-merged on top of the default.

## Security

- All API calls are HTTPS.
- Authentication is handled by `gh` — never embed tokens.
- The apply workflow declares `permissions: contents: read` globally and runs `gh` with `GH_TOKEN: ${{ secrets.GH_RULES_TOKEN }}`.
- Plan mode is the default in CI on PRs; apply runs only on main after merge.
- CODEOWNERS rule on this repo itself ensures a human reviewer is required.

## CI credential setup

The default `GITHUB_TOKEN` is scoped to the runner repo and cannot mutate rulesets on other repos. The workflows use a separate `GH_RULES_TOKEN` secret:

1. Create a PAT at https://github.com/settings/tokens with **only** the `repo` scope (classic) or **Contents: write**, **Administration: write**, **Metadata: read** (fine-grained).
2. The PAT must have access to every repo in `rules/manifests/`. For fine-grained tokens, grant access per-repo.
3. Add the PAT as a secret named `GH_RULES_TOKEN` at https://github.com/saamanthacosta/github-rules-as-code/settings/secrets/actions.
4. Rotate the PAT periodically. Add a calendar reminder or a dependabot-style watcher.

Why not the default `GITHUB_TOKEN`:

- It is scoped to the runner repo only.
- It cannot create rulesets on other repos (cross-repo writes are not allowed).
- Even on the same repo, the ruleset API requires `administration: write`, which the default token does not have without an explicit `permissions:` upgrade.

## Boundaries

- Do not modify `Personal/.gitignore` or `personal.code-workspace` from this repo. The parent workspace owns those.
- Do not edit files under `Personal/.agents/skills/apply-github-ruleset/` from this repo. Run `scripts/sync-skills.mjs` to mirror from the parent.
- Do not commit `node_modules/`, `.env`, `dist/`, or any local state.

## Testing

- `npm run lint` — eslint + prettier --check.
- `npm run plan` — exercises the runner in dry-run mode against the configured manifests.
- Manual smoke: `npm run plan -- --repo saamanthacosta/<repo>` against a real repo.

## Out of scope

- Managing GitHub Actions workflows remotely (only the workflows in this repo are managed).
- Managing repo settings unrelated to branch protection (e.g., descriptions, topics).
- Cross-org rulesets (every manifest is per-repo).
