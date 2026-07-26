# GitHub Rules as Code

Manifest-driven GitHub **rulesets** + **CODEOWNERS** for opt-in repos. Define your house style once, apply it to any repo with one command.

> Sub-project of `Personal/`. The parent workspace tracks this folder but excludes its contents via `.gitignore`. This directory is its own git repo.

## Why

Manual repo settings drift. We want a single source of truth that applies our house style with one command and that we can extend to future repos via a shared skill.

## What it does

- Reads JSON manifests under `rules/manifests/`.
- Merges each manifest with a default ruleset (`rules/defaults/personal-default.json`).
- Computes the desired state vs the current GitHub state.
- Applies only the diff (rulesets + `.github/CODEOWNERS`).
- Supports a `plan` (dry-run) and `apply` (mutate) mode.

## Requirements

- Node.js 20+ (`.nvmrc` pins it)
- `gh` CLI authenticated (`gh auth status`)
- For CI: a `GH_RULES_TOKEN` secret with `repo` scope (see AGENTS.md → CI credential setup)

## Quick start

```bash
nvm use
npm install
npm run plan -- --repo saamanthacosta/personal
npm run apply -- --repo saamanthacosta/personal
```

## Layout

```
github-rules-as-code/
├── AGENTS.md              AI rules & patterns
├── README.md              this file
├── package.json
├── .nvmrc
├── src/                   runner code
│   ├── index.mjs          CLI entry
│   ├── config/            manifest + schema loader
│   ├── github/            gh api wrapper, rulesets, codeowners, diff
│   ├── commands/          plan, apply
│   └── utils/             logger
├── rules/
│   ├── defaults/          house style (personal-default.json)
│   └── manifests/         per-repo opt-in list
├── .github/workflows/     plan.yml, apply.yml, lint.yml
├── docs/                  architecture, patterns, references
├── .agents/skills/        mirror of the shared apply-github-ruleset skill
└── scripts/               sync-skills.mjs
```

## Docs

- [docs/architecture.md](docs/architecture.md)
- [docs/patterns.md](docs/patterns.md)
- [docs/references.md](docs/references.md)

## License

Personal use.
