# Contributing

This is a pnpm + Turborepo monorepo with three apps — `apps/mobile` (Expo), `apps/web` (Next.js), and `apps/server` (NestJS) — plus shared `packages/*`.

## Commit messages

Commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/). This is enforced locally by a `commit-msg` git hook (husky + commitlint); a non-conforming message is rejected.

```
type(optional-scope): subject
```

Allowed types: `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`, `revert`, `style`, `test`. The type must be lowercase and the subject non-empty.

| Example | Result |
| --- | --- |
| `feat: add user login` | ✅ minor version bump |
| `fix(server): handle null token` | ✅ patch version bump |
| `feat!: drop node 18` or a `BREAKING CHANGE:` footer | ✅ major version bump |
| `updated stuff` | ❌ rejected (no type) |

> The hooks install automatically after `pnpm install` (via the `prepare` script). If they ever stop firing, run `pnpm exec husky`.

## Branching & pull requests

`main` is protected — **you cannot push to it directly**. All changes go through a pull request:

1. Branch off `main` (e.g. `feat/…`, `fix/…`, `chore/…`).
2. Open a PR into `main`.
3. CI must pass; the required check is **`CI Success`**. Self-merge is allowed (0 approvals required).

Force-pushes and branch deletion on `main` are blocked.

## CI

CI runs on every PR (`.github/workflows/ci.yml`). A `changes` job detects which
workspaces were touched and only runs the affected jobs:

| Job | Runs when | Runs |
| --- | --- | --- |
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

1. Merge Conventional-Commit PRs into `main`.
2. release-please opens (or updates) a **release PR per affected app** — e.g.
   `chore(main): release web 0.2.0`. It bumps the version and updates the app's
   `CHANGELOG.md`.
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
