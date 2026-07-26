# Rules manifest

A repo is governed iff its filename appears in this directory.

## Adding a new manifest

1. Drop a new `<repo>.json` next to the existing ones.
2. Use `saamanthacosta/<repo>` as the `repo` value.
3. Set `default` to the ruleset name (today: `personal-default`).
4. Set `codeowners` to the list of GitHub handles that own all paths.
5. Optionally set `overrides` to a partial ruleset payload — it will be deep-merged on top of the default.

## Removing a manifest

Removing the file alone does NOT delete the remote ruleset. The runner is diff-based and treats deletions as a separate op. To remove a repo from governance, either:

- Delete the file and run `npm run apply -- --prune --repo <owner>/<repo>`, OR
- Mark the file's `overrides.enforcement` as `disabled` to neutralize the ruleset without deleting it.

## Lazy opt-out

A repo is intentionally not listed: `lazyFinances/` (not the user's repo). Add it here only if ownership changes.
