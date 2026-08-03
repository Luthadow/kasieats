# Contributing to KasiEats

## Branching

| Branch pattern | Purpose |
|---|---|
| `main` | Production-ready code; protected, PR required |
| `feat/<ticket>-<slug>` | New features |
| `fix/<ticket>-<slug>` | Bug fixes |
| `chore/<slug>` | Non-functional changes (deps, tooling, docs) |
| `cursor/<slug>` | AI-assisted changes |

Branch from `main`, keep branches short-lived, delete after merge.

## Development workflow

```bash
git checkout -b feat/123-my-feature
bash scripts/dev-up.sh   # first time only
yarn workspace @kasieats/api dev
# ... make changes ...
git add -p
git commit -m "feat(api): add endpoint for ..."
git push origin feat/123-my-feature
# open a pull request → main
```

## Pull Requests

- Title must follow [Conventional Commits](https://www.conventionalcommits.org): `type(scope): description`
- Link the Linear/GitHub issue in the PR description
- Ensure CI is green before requesting review
- Squash-merge into `main`

## Commit message types

`feat` · `fix` · `chore` · `docs` · `refactor` · `test` · `ci` · `perf`

## Code style

```bash
yarn lint     # TypeScript strict checks across all workspaces
yarn format   # Prettier on all files
```

Both run automatically in CI. Fix before pushing.

## Tests

```bash
yarn workspace @kasieats/api test          # unit tests
yarn smoke                                  # API smoke tests (requires running API)
```

New features should include unit tests. Bug fixes should add a regression test.

## Database changes

```bash
yarn workspace @kasieats/db db:migrate     # create migration after schema edit
yarn workspace @kasieats/db db:generate    # regenerate Prisma client
```

Never edit migration files manually after they have been committed.
