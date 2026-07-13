# Contributing

This is a pnpm + Turborepo monorepo with three apps — `apps/mobile` (Expo), `apps/web` (Next.js), and `apps/server` (NestJS) — plus shared `packages/*`.

## Commit messages & PR titles

Feature PRs are **squash-merged**, and the squash uses the **PR title** as the
commit message — so the **PR title is what release-please reads** to compute
versions. It **must** be a [Conventional Commit](https://www.conventionalcommits.org/),
and CI enforces this (the `pr-title` check).

```
type(optional-scope): subject
```

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`.

| PR title | Result |
| --- | --- |
| `feat: add user login` | ✅ minor bump |
| `fix(server): handle null token` | ✅ patch bump for `server` |
| `feat(web)!: redesign dashboard` | ✅ **major** bump for `web` (see below) |
| `updated stuff` | ❌ CI fails (not a Conventional Commit) |

Your local commits are also linted by a `commit-msg` hook (husky + commitlint),
but since PRs are squashed, only the **PR title** ultimately matters for releases.

> The hooks install automatically after `pnpm install` (via the `prepare` script). If they ever stop firing, run `pnpm exec husky`.

### Major (breaking) releases

To bump an app to its **next major version**, add the `!` marker to a scoped PR
title on the **feature PR** that changes that app:

```
feat(web)!: drop legacy auth
```

Because the PR only touches `apps/web`, release-please bumps **only `web`** to its
next major; other apps bump normally based on their own changes. (A
`BREAKING CHANGE:` footer in the PR description works too.) The scope must be the
app whose files the PR changes — the marker is only "scoped" because release-please
attributes the commit by file path.

## Branching & the promotion flow

There are two protected branches: **`main-uat`** (staging/UAT) and **`main`**
(production, where releases are cut). Changes flow one way:

```
feature branch ──squash──▶ main-uat ──merge commit──▶ main ──▶ releases
```

1. Branch off `main-uat` (e.g. `feat/…`, `fix/…`).
2. Open a PR **into `main-uat`** → **squash-merge** (the PR title becomes the commit).
3. When UAT is ready, open a PR **`main-uat` → `main`** → **merge-commit** (preserves
   the individual commits so release-please sees each one).

Both branches are protected: no direct pushes, no force-push/deletion, and the
**`CI Success`** check must pass (self-merge allowed, 0 approvals). PRs into `main`
may **only** come from `main-uat` (enforced by the `guard` CI job); release-please's
own release PRs are exempt.

> `main` accepts **merge commits only**; `main-uat` accepts **squash only**.

## CI

CI runs on every PR (`.github/workflows/ci.yml`). A `changes` job detects which
workspaces were touched and only runs the affected jobs:

| Job | Runs when | Runs |
| --- | --- | --- |
| `guard` | any PR | fails PRs into `main` not from `main-uat` |
| `pr-title` | PRs into `main-uat` | fails if the PR title isn't a Conventional Commit |
| `mobile` | `apps/mobile/**` changed | lint |
| `web` | `apps/web/**` changed | lint + build + test |
| `server` | `apps/server/**` changed | lint + build + test |
| `packages` | `packages/**` changed | lint + check-types |
| `CI Success` | always | gate — the single required status check |

Shared files (`pnpm-lock.yaml`, root `package.json`, `pnpm-workspace.yaml`,
`turbo.json`, the CI workflow itself) trigger **all** jobs.

Run the same checks locally before pushing:

```bash
pnpm lint
pnpm check-types
pnpm build
pnpm test
```

## Testing

Each app uses Jest:

- `apps/server` — `jest` (NestJS default).
- `apps/web` — `jest` via `next/jest` (config in `jest.config.mjs`, jsdom + Testing Library).
- `apps/mobile` — `jest-expo` preset + React Native Testing Library.

Run all tests with `pnpm test`, or a single app with `pnpm --filter ./apps/<app> test`.

## Releases

Releases are automated with [release-please](https://github.com/googleapis/release-please),
configured for **per-app versioning** (`release-please-config.json` +
`.release-please-manifest.json`). Each app has its own version, changelog, and tag
(`server-vX.Y.Z`, `web-vX.Y.Z`, `mobile-vX.Y.Z`).

How it works:

1. Promote `main-uat` → `main` (merge commit). release-please reads the promoted
   Conventional-Commit history.
2. release-please opens (or updates) a **release PR per affected app** — e.g.
   `chore(main): release web 0.2.0`. It bumps the version (major/minor/patch from
   the commits) and updates the app's `CHANGELOG.md`.
3. **Merging that release PR** creates the git tag and the GitHub Release.

### Required: `RELEASE_PLEASE_TOKEN` secret

Release PRs must be authored by a **real user token**, not the default
`GITHUB_TOKEN`. GitHub does not run required status checks on PRs opened by
`github-actions[bot]`, so without this the release PR's `CI Success` check never
runs and the PR can't be merged.

Set up a repository secret named **`RELEASE_PLEASE_TOKEN`**:

1. **Settings → Developer settings → Fine-grained personal access tokens → Generate**.
   Scope it to this repo with **Contents: Read/write** and **Pull requests: Read/write**.
2. **Settings → Secrets and variables → Actions → New repository secret**, named
   `RELEASE_PLEASE_TOKEN`, with the token value.

The workflow uses `token: ${{ secrets.RELEASE_PLEASE_TOKEN || secrets.GITHUB_TOKEN }}`,
so it falls back to the default token until the secret is set.

> **If a release PR is stuck** with no CI (a `action_required` run from the bot),
> and the token isn't configured yet: close and reopen the PR — reopening it as a
> real user re-triggers CI and unblocks the `CI Success` check.
