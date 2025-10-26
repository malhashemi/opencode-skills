# Release Process

## For Maintainers

This document describes the release process for project maintainers. External contributors should refer to [CONTRIBUTING.md](CONTRIBUTING.md).

## Overview

This project uses a **dual-branch workflow** with automated releases:

- **`dev`** - Integration branch for maintainer development and testing
- **`main`** - Stable branch for releases (also accepts external contributor PRs)
- **Release Please** - Automates versioning, changelog, and npm publishing

## Release Workflow

### 1. Develop on `dev` Branch

All maintainer features are developed and integrated on `dev`:

```bash
git checkout dev
git checkout -b feature/your-feature-name
# ... make changes ...
gh pr create --base dev --head feature/your-feature-name
```

After PR is merged:
- Test integrated changes
- Verify builds: `npm run build`
- Verify types: `npm run typecheck`

### 2. Promote to `main` When Ready to Release

When `dev` has changes ready for release:

```bash
gh pr create \
  --base main \
  --head dev \
  --title "chore: release v0.x.x - brief description" \
  --body "Promotes integrated changes from dev to main:

- feat: feature description (#PR)
- fix: bug fix description (#PR)
- docs: documentation updates

[Include BREAKING CHANGE note if applicable]

After merge, Release Please will handle versioning and publishing."
```

**Review checklist before creating PR:**
- [ ] All features tested on `dev`
- [ ] Build passes: `npm run build`
- [ ] Types pass: `npm run typecheck`
- [ ] CHANGELOG entries look correct
- [ ] Breaking changes are clearly documented

### 3. Merge dev → main PR

Review and merge the promotion PR. This triggers Release Please.

### 4. Release Please Creates Release PR

Release Please automatically:
- Analyzes commits since last release
- Determines version bump based on conventional commits
- Updates `package.json` version
- Updates `CHANGELOG.md`
- Updates `.release-please-manifest.json`
- Creates a release PR titled `chore(main): release x.x.x`

**Do not edit the Release Please PR** - it's auto-generated.

### 5. Merge Release Please PR

When you merge the Release Please PR, it automatically:
- Creates git tag (e.g., `v0.1.0`)
- Creates GitHub release with changelog
- Publishes to npm with provenance
- Triggers the publish workflow

**After publish:**
- Verify on npm: https://www.npmjs.com/package/opencode-skills
- Test installation: `npm install opencode-skills@latest`

### 6. Sync `dev` with `main`

After release, sync `dev` to include version bumps:

```bash
git checkout dev
git pull origin dev
git merge main
git push origin dev
```

## Version Strategy

This project follows [Semantic Versioning](https://semver.org/) with [Conventional Commits](https://www.conventionalcommits.org/).

### Pre-1.0 Versioning

While version is `0.x.x`, breaking changes bump **minor** version (configured in `release-please-config.json`):

| Commit Type | Example | Version Bump | Description |
|-------------|---------|--------------|-------------|
| `feat:` | `feat: add skill templates` | 0.0.4 → 0.1.0 | New feature (minor) |
| `fix:` | `fix: resolve path issue` | 0.0.4 → 0.0.5 | Bug fix (patch) |
| `feat!:` | `feat!: change API` | 0.0.4 → 0.1.0 | Breaking change (minor) |
| `BREAKING CHANGE:` | In commit body | 0.0.4 → 0.1.0 | Breaking change (minor) |
| `docs:`, `chore:` | Documentation/maintenance | No bump | No release |

### Post-1.0 Versioning

After reaching `1.0.0`, breaking changes will bump **major** version:

| Commit Type | Version Bump |
|-------------|--------------|
| `feat!:` | 1.0.0 → 2.0.0 |
| `feat:` | 1.0.0 → 1.1.0 |
| `fix:` | 1.0.0 → 1.0.1 |

## External Contributor PRs

External contributors create PRs directly to `main`. When merged:

1. If it's a `feat:` or `fix:`, Release Please will include it in the next release
2. Maintainer can immediately merge Release Please PR for quick release
3. Or wait to batch with other changes

**No action needed** - Release Please handles it automatically.

## Troubleshooting

### Release Please PR Not Created

**Cause:** No `feat:` or `fix:` commits since last release.

**Solution:** Ensure commits use conventional commit format.

### Wrong Version Bump

**Cause:** Commit type doesn't match change.

**Solution:** 
- Close Release Please PR
- Fix commit message on `main` branch
- Release Please will recreate PR with correct version

### Publish Failed

**Cause:** npm authentication issue.

**Solution:**
1. Check `NPM_TOKEN` secret in GitHub settings
2. Verify token has publish permissions
3. Re-run failed workflow

### Manual Version Bump Needed

**Not recommended**, but if needed:

```bash
# On main branch
npm version patch  # or minor, major
git push --follow-tags
```

Release Please will detect the manual bump and adjust.

## Emergency Hotfix to `main`

If you need to hotfix `main` directly (skipping `dev`):

```bash
git checkout main
git checkout -b hotfix/critical-fix
# ... make fix ...
gh pr create --base main --head hotfix/critical-fix
```

After merge:
1. Release Please creates release PR
2. Merge to publish
3. **Don't forget to backport to `dev`:**
   ```bash
   git checkout dev
   git cherry-pick <hotfix-commit-sha>
   git push origin dev
   ```

## Release Checklist

Before promoting dev → main:

- [ ] All PRs on `dev` are tested
- [ ] Build passes: `npm run build`
- [ ] Types pass: `npm run typecheck`
- [ ] Breaking changes documented
- [ ] README updated if needed
- [ ] Examples tested (if applicable)

After merging Release Please PR:

- [ ] Verify npm package: https://www.npmjs.com/package/opencode-skills
- [ ] Test installation: `npm install opencode-skills@latest`
- [ ] Verify GitHub release created
- [ ] Sync `dev` with `main`

## Questions?

If you're unsure about the release process:
- Review recent releases: https://github.com/malhashemi/opencode-skills/releases
- Check Release Please docs: https://github.com/googleapis/release-please
- Open a discussion: https://github.com/malhashemi/opencode-skills/discussions
