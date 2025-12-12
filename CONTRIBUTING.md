# Contributing to OpenCode Skills Plugin

Thank you for your interest in contributing to the OpenCode Skills Plugin! This document provides guidelines for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
  - [Reporting Bugs](#reporting-bugs)
  - [Suggesting Enhancements](#suggesting-enhancements)
  - [Submitting Pull Requests](#submitting-pull-requests)
- [Development Setup](#development-setup)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Code Style](#code-style)
- [Questions?](#questions)

## Code of Conduct

By participating in this project, you agree to:

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person
- Help create a welcoming environment for all contributors

## How to Contribute

### Reporting Bugs

Before creating a bug report:

1. Check the [existing issues](https://github.com/malhashemi/opencode-skills/issues) to see if it's already reported
2. If you can't find an existing issue, create a new one

When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the bug
- **Expected behavior** vs **actual behavior**
- **Environment details** (OS, Node version, OpenCode version)
- **Code samples** or screenshots if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Before creating an enhancement request:

1. Check [existing issues](https://github.com/malhashemi/opencode-skills/issues) for similar suggestions
2. Consider if the enhancement fits the project's goals

When suggesting an enhancement, include:

- **Clear description** of the enhancement
- **Use cases** - why is this useful?
- **Possible implementation** approach (optional)
- **Examples** from other projects (if applicable)

### Submitting Pull Requests

#### 1. Fork the Repository

Click the "Fork" button on GitHub to create your own copy of the repository.

#### 2. Clone Your Fork

# Clone using SSH

git clone git@github.com:YOUR-USERNAME/opencode-skills.git

# OR Clone using HTTPS

git clone https://github.com/YOUR-USERNAME/opencode-skills.git
cd opencode-skills

#### 3. Add Upstream Remote

```bash
git remote add upstream https://github.com/malhashemi/opencode-skills.git
```

#### 4. Create a Feature Branch

```bash
git checkout main
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `chore/description` - Maintenance tasks

#### 5. Make Your Changes

- Write clear, concise code
- Follow existing code style
- Add tests if applicable
- Update documentation as needed

#### 6. Commit Your Changes

We use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages:

```bash
git commit -m "feat: add new skill discovery feature"
git commit -m "fix: correct path resolution bug"
git commit -m "docs: update installation instructions"
```

**Commit types:**

- `feat:` - New feature (triggers minor version bump)
- `fix:` - Bug fix (triggers patch version bump)
- `docs:` - Documentation changes only
- `chore:` - Maintenance tasks (no version bump)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `perf:` - Performance improvements

**Breaking changes:**

```bash
git commit -m "feat!: change skill loading API

BREAKING CHANGE: Skills now require a version field in frontmatter"
```

#### 7. Keep Your Branch Updated

```bash
git fetch upstream
git rebase upstream/main
```

#### 8. Push to Your Fork

```bash
git push origin feature/your-feature-name
```

#### 9. Create Pull Request

1. Go to your fork on GitHub
2. Click "Compare & pull request"
3. Ensure base branch is `main`
4. Fill out the PR description:
   - What does this PR do?
   - Why is this change needed?
   - How has it been tested?
   - Related issues (if applicable)
5. Submit the PR

#### 10. PR Review Process

- Maintainers will review your PR
- Address any feedback or requested changes
- Once approved, your PR will be merged
- Your contribution will be included in the next release!

## Maintainer Workflow

> **Note:** This section is for project maintainers only. Regular contributors should follow the standard PR process above.

### Branch Strategy

This project uses a dual-branch workflow:

- **`main`** - Stable release branch
  - Accepts external contributor PRs
  - Triggers Release Please for automated releases
  - Published to npm
- **`dev`** - Integration branch
  - Used by maintainers for development and testing
  - Tested changes promoted to `main` for release

### Maintainer Development Process

**1. Create feature branch from `dev`:**

```bash
git checkout dev
git pull origin dev
git checkout -b feature/your-feature-name
```

**2. Develop and commit using conventional commits:**

```bash
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
```

**3. Create PR to `dev` for integration:**

```bash
gh pr create --base dev --head feature/your-feature-name
```

**4. After merge, test on `dev`:**

```bash
npm run build
npm run typecheck
# Test in local OpenCode project
```

**5. When ready to release, promote `dev` to `main`:**

See [RELEASE.md](RELEASE.md) for detailed release process.

### Quick Release Steps

```bash
# Create promotion PR
gh pr create \
  --base main \
  --head dev \
  --title "chore: release v0.x.x - description"

# After merge, Release Please creates release PR automatically
# Merge Release Please PR → auto-publishes to npm
```

For complete release documentation, see [RELEASE.md](RELEASE.md).

## Development Setup

### Prerequisites

- Node.js >= 20.0.0
- npm or pnpm
- TypeScript knowledge

### Installation

```bash
# Clone your fork
git clone git@github.com:YOUR-USERNAME/opencode-skills.git
cd opencode-skills

# Install dependencies
npm install

# Build the project
npm run build

# Run type checking
npm run typecheck
```

### Testing Your Changes

1. **Build the project:**

   ```bash
   npm run build
   ```

2. **Test in a local OpenCode project:**
   - Link the package locally
   - Add to OpenCode config
   - Test skill discovery and execution

3. **Verify types:**
   ```bash
   npm run typecheck
   ```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types

- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation only changes
- **style**: Code style changes (formatting, missing semicolons, etc.)
- **refactor**: Code change that neither fixes a bug nor adds a feature
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **chore**: Changes to build process or auxiliary tools

### Examples

```bash
# Simple feature
feat: add support for nested skill directories

# Bug fix with scope
fix(parser): handle empty frontmatter correctly

# Breaking change
feat!: require Node.js 20+

BREAKING CHANGE: Drops support for Node.js 18 and below
```

### Why Conventional Commits?

- **Automated versioning** - Commit messages determine version bumps
- **Automated changelog** - Release notes are generated automatically
- **Clear history** - Easy to understand what changed and why

## Code Style

### TypeScript

- Use TypeScript for all code
- Avoid `any` types - use proper type definitions
- Export types for public APIs
- Add JSDoc comments for public functions/interfaces

### Formatting

- The project uses existing TypeScript compiler settings
- Follow the patterns in existing code
- Use meaningful variable and function names
- Keep functions focused and single-purpose

### File Organization

```
opencode-skills/
├── index.ts           # Main plugin export
├── dist/              # Compiled output (gitignored)
├── .opencode/         # Example skills
└── README.md
```

## Questions?

If you have questions:

1. **Check existing documentation:**
   - [README.md](README.md)
   - [Anthropic Skills Specification](https://github.com/anthropics/skills)

2. **Search existing issues:**
   - [Open Issues](https://github.com/malhashemi/opencode-skills/issues)
   - [Closed Issues](https://github.com/malhashemi/opencode-skills/issues?q=is%3Aissue+is%3Aclosed)

3. **Start a discussion:**
   - [GitHub Discussions](https://github.com/malhashemi/opencode-skills/discussions)

4. **Ask in a PR:**
   - If you're already working on something, ask questions in your PR

## Recognition

Contributors are recognized in:

- Release notes (automatically via Release Drafter)
- GitHub Contributors page
- Special thanks in major releases

## License

By contributing to opencode-skills, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to OpenCode Skills Plugin!** 🎉

Every contribution, no matter how small, helps make this project better for the community.
