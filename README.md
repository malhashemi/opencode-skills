# OpenCode Skills Plugin

[![npm version](https://img.shields.io/npm/v/opencode-skills.svg)](https://www.npmjs.com/package/opencode-skills)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Bring Anthropic's Agent Skills Specification (v1.0) to OpenCode. This plugin automatically discovers and registers skills as dynamic tools, enabling the Agent to leverage specialized knowledge, workflows, and bundled resources.

## Features

- ✅ **Auto-discovery** - Scans `.opencode/skills/` and `~/.opencode/skills/` recursively
- ✅ **Spec compliance** - Validates against Anthropic's Skills Specification v1.0
- ✅ **Dynamic tools** - Each skill becomes a `skills_{{name}}` tool
- ✅ **Path resolution** - Clear instructions for relative file paths
- ✅ **Nested skills** - Supports hierarchical skill organization
- ✅ **Task planning** - Integrates with OpenCode's todo system
- ✅ **Graceful errors** - Invalid skills skipped with helpful messages

## Installation

**No npm install needed!** OpenCode automatically installs plugins when you add them to your config.

Add to your `opencode.json` or `~/.config/opencode/opencode.json`:

```json
{
  "plugin": ["opencode-skills"]
}
```

OpenCode will auto-install the plugin on next startup.

## Quick Start

### 1. Create a Skill

Create a skill directory with a `SKILL.md` file:

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

The plugin will discover and register your skill:

```
🎯 Skills Plugin: Starting discovery...
✅ Found 1 skill(s): ['my-skill']
✅ Registered 1 skill tool(s)
```

### 3. Use the Skill

Simply invoke the skill tool:

```
skills_my_skill
```

The Agent will:

1. Create a todo list of tasks from the skill
2. Execute the skill instructions
3. Track progress through the todo list

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

## Path Resolution

When a skill references files with relative paths:

```markdown
Read the API documentation in `references/api.md`.
Run the deployment script at `scripts/deploy.sh`.
```

The plugin provides clear path resolution instructions:

```
**SKILL DIRECTORY:** /path/to/.opencode/skills/my-skill/

If the skill mentions `references/api.md`, the full path is:
/path/to/.opencode/skills/my-skill/references/api.md
```

The Agent automatically understands and resolves these paths correctly.

## Global Skills

Skills in `~/.opencode/skills/` or `~/.config/opencode/skills/` are available across **all** projects:

```bash
mkdir -p ~/.opencode/skills/personal-notes
# or
mkdir -p ~/.config/opencode/skills/personal-notes
# Create SKILL.md...
```

This skill will be available in every OpenCode project.

## Execution Workflow

When the Agent invokes a skill tool, it receives structured instructions:

1. **STEP 1: PLAN THE WORK**
   - Use `todowrite` to create task list
   - Identify all steps from skill content
   - Set appropriate priorities

2. **STEP 2: EXECUTE THE SKILL**
   - Follow skill instructions
   - Mark todos as `in_progress` and `completed`
   - Track progress through completion

This ensures systematic execution and nothing gets missed.

## Examples

Check out these [example](https://github.com/anthropics/skills) skills from Anthropic repository:

## Troubleshooting

**Skills not discovered?**

- Check console for `🎯 Skills Plugin: Starting discovery...`
- Verify `SKILL.md` files exist in `.opencode/skills/`
- Check frontmatter validation errors in console

**Tool not appearing?**

- Ensure `name` field matches directory name exactly
- Check for duplicate tool names (logged as warnings)
- Restart OpenCode after adding/modifying skills

**Paths not resolving?**

- Check the SKILL DIRECTORY shown in skill output
- Verify supporting files exist at specified paths
- Ensure paths in SKILL.md are relative (not absolute)

**Invalid skill errors?**

- Name must be lowercase with hyphens only (`[a-z0-9-]+`)
- Description must be at least 20 characters
- Name in frontmatter must match directory name

## Design Decisions

### Agent-Level Tool Restrictions

Tool restrictions are handled at the OpenCode agent level (via `opencode.json` or agent frontmatter), not at the skill level. This provides:

- Clearer permission model
- Simpler architecture
- Better alignment with OpenCode's existing system

Skills parse `allowed-tools` from frontmatter for spec compliance, but enforcement happens at the agent level.

### No Hot Reload

Skills are treated as project configuration, not runtime state. Adding or modifying skills requires restarting OpenCode. This is acceptable because:

- Skills change infrequently
- No API exists for runtime tool registration
- Simpler implementation

## API Reference

### Plugin Export

```typescript
export const SkillsPlugin: Plugin;
```

The plugin automatically:

1. Scans for `**/SKILL.md` files in discovery paths (`.opencode/skills/`, `~/.opencode/skills/`, `~/.config/opencode/skills/`)
2. Validates YAML frontmatter against spec
3. Registers a tool for each valid skill
4. Returns skill content with execution instructions

### Skill Interface

```typescript
interface Skill {
  name: string; // From frontmatter
  fullPath: string; // Absolute path to skill directory
  toolName: string; // Generated tool name
  description: string; // From frontmatter
  allowedTools?: string[]; // Parsed but not enforced
  metadata?: Record<string, string>;
  license?: string;
  content: string; // Markdown body
  path: string; // Absolute path to SKILL.md
}
```

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## References

- [Anthropic Skills Specification](https://github.com/anthropics/skills)
- [OpenCode Documentation](https://opencode.ai)
- [Plugin Development Guide](https://opencode.ai/docs/plugins)

## Acknowledgments

- Anthropic for the Skills Specification
- OpenCode team for the plugin system
- Community contributors

---

**Not affiliated with OpenAI or Anthropic.** This is an independent open-source project.
