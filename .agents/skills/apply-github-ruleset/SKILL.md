---
name: apply-github-ruleset
description: Apply the GitHub ruleset + CODEOWNERS defined in this repo to a target repo. The mirror of the shared skill at Personal/.agents/skills/apply-github-ruleset/.
---

# apply-github-ruleset (repo-local mirror)

This is the repo-local mirror of the shared skill at `Personal/.agents/skills/apply-github-ruleset/SKILL.md`. The two stay in sync via `scripts/sync-skills.mjs`.

## Usage

See the shared skill for the full procedure. Quick reference:

```bash
npm run plan -- --repo <owner>/<repo>
npm run apply -- --repo <owner>/<repo>
```

## Sync

To refresh the mirror from the parent workspace:

```bash
npm run sync-skills
```

This script copies `Personal/.agents/skills/apply-github-ruleset/SKILL.md` (resolved relative to the parent workspace) into this file's directory. If the parent is missing, the script exits with a useful error.

## Boundaries

- This file is generated. Do not edit it directly. Edit the parent instead and re-run `npm run sync-skills`.
