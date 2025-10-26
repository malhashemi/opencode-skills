# OpenCode Skills Plugin

[![npm version](https://img.shields.io/npm/v/opencode-skills.svg)](https://www.npmjs.com/package/opencode-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bring Anthropic's Agent Skills Specification (v1.0) to OpenCode. This plugin automatically discovers and registers skills as dynamic tools, enabling the Agent to leverage specialized knowledge, workflows, and bundled resources.

## Features

- ✅ **Auto-discovery** - Scans project, home, and config directories for skills
- ✅ **Spec compliance** - Validates against Anthropic's Skills Specification v1.0
- ✅ **Dynamic tools** - Each skill becomes a `skills_{{name}}` tool
- ✅ **Path resolution** - Base directory context for relative file paths
- ✅ **Nested skills** - Supports hierarchical skill organization
- ✅ **Graceful errors** - Invalid skills skipped with helpful messages

## Requirements

- **OpenCode SDK ≥ 0.15.18** - Required for `noReply` message insertion pattern ([PR#3378](https://github.com/sst/opencode/issues/3378))

## Installation

Add to your `opencode.json` or `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-skills"]
}
```

OpenCode auto-installs plugins on startup.

### Version Pinning

Pin to a specific version:

```json
{
  "plugin": ["opencode-skills@x.y.z"]
}
```

### Plugin Updates

Check installed version:
```bash
cat ~/.cache/opencode/node_modules/opencode-skills/package.json | grep version
```

Force update to latest:
```bash
rm -rf ~/.cache/opencode
```

Then restart OpenCode.

## Skill Discovery

The plugin scans three locations (lowest to highest priority):

1. **`~/.config/opencode/skills/`** - XDG config location (or `$XDG_CONFIG_HOME/opencode/skills/`)
2. **`~/.opencode/skills/`** - Global skills (all projects)
3. **`.opencode/skills/`** - Project-local skills (**overrides global**)

All locations are merged. If duplicate skill names exist, the project-local version takes precedence and a warning is logged.

## Quick Start

### 1. Create a Skill

```bash
mkdir -p .opencode/skills/my-skill
```

**`.opencode/skills/my-skill/SKILL.md`:**

```markdown
---
name: my-skill
description: A custom skill that helps with specific tasks in my project
license: MIT
---

# My Custom Skill

This skill helps you accomplish specific tasks.

## Instructions

1. First, do this
2. Then, do that
3. Finally, verify the results

You can reference supporting files like `scripts/helper.py` or `references/docs.md`.
```

### 2. Restart OpenCode

The plugin will discover and register your skill.

### 3. Use the Skill

```
skills_my_skill
```

The Agent receives the skill content and follows its instructions.

## Skill Structure

### Required: SKILL.md

Every skill must have a `SKILL.md` file with YAML frontmatter:

```markdown
---
name: skill-name # Must match directory name
description: What this skill does and when to use it (min 20 chars)
license: MIT # Optional
allowed-tools: # Optional (parsed but not enforced)
  - read
  - write
metadata: # Optional key-value pairs
  version: "1.0"
---

# Skill Content

Your skill instructions in Markdown format.
```

### Optional: Supporting Files

```
my-skill/
├── SKILL.md              # Required
├── scripts/              # Executable code
│   └── helper.py
├── references/           # Documentation to load as needed
│   └── api-docs.md
└── assets/               # Files used in output
    └── template.html
```

## Skill Naming

| Directory           | Frontmatter Name   | Tool Name                 |
| ------------------- | ------------------ | ------------------------- |
| `brand-guidelines/` | `brand-guidelines` | `skills_brand_guidelines` |
| `tools/analyzer/`   | `analyzer`         | `skills_tools_analyzer`   |

**Rules:**

- Directory name: lowercase with hyphens (`my-skill`)
- Frontmatter `name`: must match directory name exactly
- Tool name: auto-generated with underscores (`skills_my_skill`)

## How It Works

The plugin uses Anthropic's **message insertion pattern** to deliver skill content:

1. **Skill loading message** - Announces skill activation
2. **Skill content message** - Delivers instructions with base directory context
3. **Tool confirmation** - Returns `"Launching skill: {name}"`

Both messages use `noReply: true`, so they appear as user messages (not tool responses). This ensures skill content persists throughout long conversations, even when OpenCode purges tool responses to manage context.

### Path Resolution

Skills can reference files with relative paths:

```markdown
Read `references/api.md` and run `scripts/deploy.sh`
```

The Agent receives base directory context:

```
Base directory for this skill: /path/to/.opencode/skills/my-skill/
```

And automatically resolves paths like: `/path/to/.opencode/skills/my-skill/references/api.md`

## Troubleshooting

**Skills not discovered?**

- Verify `SKILL.md` files exist in discovery paths
- Check console for discovery messages
- Confirm frontmatter is valid YAML

**Tool not appearing?**

- Ensure `name` field matches directory name exactly
- Check for duplicate tool names (logged as warnings)
- Restart OpenCode after adding/modifying skills

**Paths not resolving?**

- Check the base directory shown in skill output
- Verify supporting files exist at specified paths
- Ensure paths in SKILL.md are relative (not absolute)

**Invalid skill errors?**

- Name must be lowercase with hyphens only (`[a-z0-9-]+`)
- Description must be at least 20 characters
- Name in frontmatter must match directory name

**Plugin not updating?**

- Check version: `cat ~/.cache/opencode/node_modules/opencode-skills/package.json | grep version`
- Force update: `rm -rf ~/.cache/opencode` then restart
- Pin version: Add `@version` to plugin name in `opencode.json`

## API Reference

The plugin exports a single function that registers skills as dynamic tools:

```typescript
export const SkillsPlugin: Plugin;
```

**Discovery**: Scans `.opencode/skills/`, `~/.opencode/skills/`, and `~/.config/opencode/skills/`  
**Validation**: Enforces Anthropic Skills Specification v1.0  
**Tool naming**: `skills_{name}` with underscores for nested paths

See [types](./dist/index.d.ts) for full interface definitions.

## Advanced

<details>
<summary>Design Decisions</summary>

### Agent-Level Tool Restrictions

Tool restrictions are handled at the OpenCode agent level (via `opencode.json` or agent frontmatter), not at the skill level. This provides a clearer permission model and better alignment with OpenCode's existing system.

Skills parse `allowed-tools` from frontmatter for spec compliance, but enforcement happens at the agent level.

### No Hot Reload

Skills are treated as project configuration, not runtime state. Adding or modifying skills requires restarting OpenCode. This is acceptable because skills change infrequently and there's no API for runtime tool registration.

</details>

## Contributing

Contributions welcome! Fork, create a feature branch, and submit a PR.

## License

MIT - see [LICENSE](LICENSE)

## References

- [Anthropic Skills Specification](https://github.com/anthropics/skills)
- [OpenCode Documentation](https://opencode.ai)

---

**Not affiliated with OpenAI or Anthropic.** This is an independent open-source project.
