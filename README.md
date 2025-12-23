# OpenCode Skills Plugin

> ## 🎓 This Plugin Has Graduated to Native OpenCode Support!
>
> **Great news!** The skills functionality first brought to OpenCode by this plugin is now **built into OpenCode** as of v1.0.190.
>
> This plugin served as the proof-of-concept that led to native skills support in OpenCode:
>
> - [PR #5930](https://github.com/sst/opencode/pull/5930) - Native `skill` tool with pattern-based permissions
> - [PR #6000](https://github.com/sst/opencode/pull/6000) - Per-agent skill filtering (v1.0.191)
>
> **[Jump to Migration Guide](#migration)** | **[See What's Next](#whats-next)**

---

[![DEPRECATED](https://img.shields.io/badge/STATUS-DEPRECATED-red.svg)](#migration)
[![Graduated to Native](https://img.shields.io/badge/Native%20Support-OpenCode%20v1.0.190+-success.svg)](https://github.com/sst/opencode/pull/5930)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Migration

### 1. Remove the Plugin

```diff
// opencode.json
{
-  "plugin": ["opencode-skills"]
}
```

### 2. Move Your Skills Directory

```bash
# Native uses skill/ (singular) at project root instead of .opencode/skills/
mv .opencode/skills skill

# For global skills
mv ~/.opencode/skills ~/.config/opencode/skill
```

### 3. Update Your Config (Optional)

Native skills use pattern-based permissions instead of tool-level config:

```diff
// opencode.json
{
-  "tools": {
-    "skills*": false,
-    "skills_my_skill": true
-  }
+  "permission": {
+    "skill": {
+      "my-skill": "allow",
+      "*": "deny"
+    }
+  }
}
```

### Key Differences

| Aspect      | This Plugin            | Native (v1.0.190+)          |
| ----------- | ---------------------- | --------------------------- |
| Tool name   | `skills_my_skill`      | `skill` (single tool)       |
| Directory   | `.opencode/skills/`    | `skill/`                    |
| Loading     | Eager (all at startup) | **Lazy** (on-demand)        |
| Permissions | `tools` config         | `permission.skill` patterns |

Your existing `SKILL.md` files work unchanged - just move them to the new location!

---

## Thank You! 💜

To everyone who starred, used, and provided feedback on this plugin - **your support made native implementation possible**.

This plugin was the first stepping stone, proving that the OpenCode community wanted skills support. Your adoption and feedback directly influenced the native implementation.

Special thanks to the OpenCode maintainers ([@thdxr](https://github.com/thdxr)) for the collaboration on PRs [#5930](https://github.com/sst/opencode/pull/5930) and [#6000](https://github.com/sst/opencode/pull/6000).

---

## What's Next?

I'm working on something new. **Stay tuned.** ✨

In the meantime, check out my other OpenCode plugin:

### 🔄 [opencode-sessions](https://github.com/malhashemi/opencode-sessions)

**Multi-agent collaboration and workflow orchestration for OpenCode**

| Mode        | What It Does                                                     |
| ----------- | ---------------------------------------------------------------- |
| **Fork**    | Explore multiple approaches in parallel (compare architectures!) |
| **Message** | Turn-based agent collaboration in the same conversation          |
| **New**     | Clean handoffs between phases (Research → Plan → Build)          |
| **Compact** | Manual compression to maintain long conversations                |

```bash
# Add to opencode.json: { "plugin": ["opencode-sessions"] }
```

---

## Historical Documentation

<details>
<summary>📚 Original README (for reference)</summary>

### Original Features

- ✅ **Auto-discovery** - Scans project, home, and config directories for skills
- ✅ **Spec compliance** - Validates against Anthropic's Skills Specification v1.0
- ✅ **Dynamic tools** - Each skill becomes a `skills_{{name}}` tool
- ✅ **Path resolution** - Base directory context for relative file paths
- ✅ **Nested skills** - Supports hierarchical skill organization
- ✅ **Graceful errors** - Invalid skills skipped with helpful messages

### Requirements

- **OpenCode SDK ≥ 1.0.126** - Required for agent context preservation and `noReply` message insertion pattern

### Installation

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

The plugin scans these locations (lowest to highest priority):

1. **`~/.config/opencode/skills/`** - XDG config location (or `$XDG_CONFIG_HOME/opencode/skills/`)
2. **`~/.opencode/skills/`** - Global skills (all projects)
3. **`$OPENCODE_CONFIG_DIR/skills/`** (if set) - Custom OpenCode config directory (higher priority than global, lower than project-local)
4. **`.opencode/skills/`** - Project-local skills (**overrides all other locations**)

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

## Controlling Skill Access

By default, all discovered skills are available to all agents. Use OpenCode's tool configuration to control which agents can access which skills.

> **💡 Tip**: Use `skills*: false` at project level to prevent context pollution, then enable only what each agent needs.

### Project Level (Global Defaults)

Disable all skills by default, then enable specific ones in your `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "tools": {
    "skills*": false,
    "skills_my_skill": true
  }
}
```

### Per-Agent Access

Override defaults for specific built-in agents (like `build`, `plan`, etc.):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "tools": {
    "skills*": false
  },
  "agent": {
    "build": {
      "tools": {
        "skills_document_skills_docx": true,
        "skills_document_skills_xlsx": true
      }
    }
  }
}
```

Now only the `build` agent has access to document skills.

### Subagent Access

For custom subagents, control tools via YAML frontmatter in the agent definition:

```yaml
mode: subagent
description: Content creator agent
tools:
  skills_brand_guidelines: true
  skills_writing_style: true
```

This subagent gets specific skills even if they're disabled globally.

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
export const SkillsPlugin: Plugin
```

**Discovery**: Scans `.opencode/skills/`, `~/.opencode/skills/`, and `~/.config/opencode/skills/`  
**Validation**: Enforces Anthropic Skills Specification v1.0  
**Tool naming**: `skills_{name}` with underscores for nested paths

See [types](./dist/index.d.ts) for full interface definitions.

## Advanced

<details>
<summary>Design Decisions</summary>

### Why Agent-Level Permissions?

The `allowed-tools` field in skill frontmatter is parsed for Anthropic spec compliance, but **enforcement happens at the OpenCode agent level** (see [Controlling Skill Access](#controlling-skill-access)). This provides:

- Clearer permission model aligned with OpenCode's existing system
- Centralized control in `opencode.json` rather than scattered across skills
- Flexibility to override permissions per-project or per-agent

### No Hot Reload

Skills are discovered at startup and cached. Adding or modifying skills requires restarting OpenCode. This is acceptable because skills change infrequently and simplifies the implementation.

</details>

## Contributing

Contributions welcome! Fork, create a feature branch, and submit a PR.

### License

MIT - see [LICENSE](LICENSE)

### References

- [Anthropic Skills Specification](https://github.com/anthropics/skills)
- [OpenCode Documentation](https://opencode.ai)

</details>

---

## Links

- **Native Skills Docs**: [opencode.ai/docs/skills](https://opencode.ai/docs/skills)
- **PR #5930**: [Native skill tool](https://github.com/sst/opencode/pull/5930)
- **PR #6000**: [Per-agent filtering](https://github.com/sst/opencode/pull/6000)
- **opencode-sessions**: [github.com/malhashemi/opencode-sessions](https://github.com/malhashemi/opencode-sessions)

---

_This repository is archived for historical reference. Not affiliated with OpenCode or Anthropic._
