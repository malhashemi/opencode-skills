/**
 * OpenCode Skills Plugin
 * 
 * Implements Anthropic's Agent Skills Specification (v1.0) for OpenCode.
 * 
 * Features:
 * - Discovers SKILL.md files from .opencode/skills/, ~/.opencode/skills/, and ~/.config/opencode/skills/
 * - Validates skills against Anthropic's spec (YAML frontmatter + Markdown)
 * - Registers dynamic tools with pattern skills_{{skill_name}}
 * - Delivers skill content via silent message insertion (noReply pattern)
 * - Supports nested skills with proper naming
 * 
 * Design Decisions:
 * - Tool restrictions handled at agent level (not skill level)
 * - Message insertion pattern ensures skill content persists (user messages not purged)
 * - Base directory context enables relative path resolution
 * - Skills require restart to reload (acceptable trade-off)
 * 
 * @see https://github.com/anthropics/skills
 */

import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import matter from "gray-matter"
import { join, dirname, basename, relative, sep } from "path"
import { z } from "zod"
import os from "os"
import { promises as fs } from "fs"

// Types
interface Skill {
  name: string              // From frontmatter (e.g., "brand-guidelines")
  fullPath: string          // Full directory path to skill
  toolName: string          // Generated tool name (e.g., "skills_brand_guidelines")
  description: string       // From frontmatter
  allowedTools?: string[]   // Parsed but not enforced (agent-level restrictions instead)
  metadata?: Record<string, string>
  license?: string
  content: string           // Markdown body
  path: string              // Full path to SKILL.md
}

// Validation Schema
const SkillFrontmatterSchema = z.object({
  name: z.string()
    .regex(/^[a-z0-9-]+$/, "Name must be lowercase alphanumeric with hyphens")
    .min(1, "Name cannot be empty"),
  description: z.string()
    .min(20, "Description must be at least 20 characters for discoverability"),
  license: z.string().optional(),
  "allowed-tools": z.array(z.string()).optional(),
  metadata: z.record(z.string()).optional()
})

type SkillFrontmatter = z.infer<typeof SkillFrontmatterSchema>

/**
 * Generate tool name from skill path
 * Examples:
 *   .opencode/skills/brand-guidelines/SKILL.md → skills_brand_guidelines
 *   .opencode/skills/document-skills/docx/SKILL.md → skills_document_skills_docx
 */
function generateToolName(skillPath: string, baseDir: string): string {
  const rel = relative(baseDir, skillPath)
  const dirPath = dirname(rel)
  const components = dirPath.split(sep).filter(c => c !== ".")
  return "skills_" + components.join("_").replace(/-/g, "_")
}

/**
 * Parse a SKILL.md file and return structured skill data
 * Returns null if parsing fails (with error logging)
 */
async function parseSkill(skillPath: string, baseDir: string): Promise<Skill | null> {
  try {
    // Read file
    const content = await Bun.file(skillPath).text()
    
    // Parse YAML frontmatter
    const { data, content: markdown } = matter(content)
    
    // Validate frontmatter schema
    let frontmatter: SkillFrontmatter
    try {
      frontmatter = SkillFrontmatterSchema.parse(data)
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(`❌ Invalid frontmatter in ${skillPath}:`)
        error.errors.forEach(err => {
          console.error(`   - ${err.path.join(".")}: ${err.message}`)
        })
      }
      return null
    }
    
    // Validate name matches directory
    const skillDir = basename(dirname(skillPath))
    if (frontmatter.name !== skillDir) {
      console.error(
        `❌ Name mismatch in ${skillPath}:`,
        `\n   Frontmatter name: "${frontmatter.name}"`,
        `\n   Directory name: "${skillDir}"`,
        `\n   Fix: Update the 'name' field in SKILL.md to match the directory name`
      )
      return null
    }
    
    // Generate tool name from path
    const toolName = generateToolName(skillPath, baseDir)
    
    return {
      name: frontmatter.name,
      fullPath: dirname(skillPath),
      toolName,
      description: frontmatter.description,
      allowedTools: frontmatter["allowed-tools"],
      metadata: frontmatter.metadata,
      license: frontmatter.license,
      content: markdown.trim(),
      path: skillPath
    }
  } catch (error) {
    console.error(`❌ Error parsing skill ${skillPath}:`, error instanceof Error ? error.message : String(error))
    return null
  }
}

/**
 * Discover all SKILL.md files in the specified base paths
 */
async function findSkillFiles(basePath: string): Promise<string[]> {
  const skillFiles: string[] = []
  const visited = new Set<string>()
  const queue = [basePath]

  while (queue.length > 0) {
    const current = queue.pop()!
    let realCurrent: string

    try {
      realCurrent = await fs.realpath(current)
    } catch (error: any) {
      // If the root path is missing, propagate so the caller can handle it
      if (current === basePath && error?.code === "ENOENT") {
        throw error
      }
      continue
    }

    if (visited.has(realCurrent)) {
      continue
    }
    visited.add(realCurrent)

    let entries
    try {
      entries = await fs.readdir(current, { withFileTypes: true })
    } catch (error: any) {
      if (current === basePath && error?.code === "ENOENT") {
        throw error
      }
      console.warn(`Unexpected error reading ${current}:`, error)
      continue
    }

    for (const entry of entries) {
      const fullPath = join(current, entry.name)

      if (entry.isFile() && entry.name === "SKILL.md") {
        skillFiles.push(fullPath)
        continue
      }

      if (entry.isDirectory()) {
        queue.push(fullPath)
        continue
      }

      if (entry.isSymbolicLink()) {
        const target = await fs.realpath(fullPath).catch(() => null)
        if (!target) continue

        const stat = await fs.stat(target).catch(() => null)
        if (!stat) continue

        if (stat.isDirectory()) {
          queue.push(fullPath)
        } else if (stat.isFile() && entry.name === "SKILL.md") {
          skillFiles.push(fullPath)
        }
      }
    }
  }

  return skillFiles
}

async function discoverSkills(basePaths: string[]): Promise<Skill[]> {
  const skills: Skill[] = []
  let foundPath = false;
  
  for (const basePath of basePaths) {
    try {
      // Find all SKILL.md files recursively (following symlinked skill directories)
      const matches = await findSkillFiles(basePath)

      for (const match of matches) {
        const skill = await parseSkill(match, basePath)
        if (skill) {
          skills.push(skill)
        }
      }

      foundPath = true;
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        (error as any).code === "ENOENT"
      ) {
        // Directory does not exist, expected in some cases
      } else {
        console.warn(
          `Unexpected error while scanning skills in ${basePath}:`,
          error,
        )
      }
    }
  }
  
  if (!foundPath) {
    console.warn(
      `⚠️ Could not find any skills directories. Tried:`,
      ...basePaths.map(path => `\n     ${path}`),
      `\n   This is normal if none of the directories exist yet.`,
    )
  }

  // Detect duplicate tool names
  const toolNames = new Set<string>()
  const duplicates = []
  
  for (const skill of skills) {
    if (toolNames.has(skill.toolName)) {
      duplicates.push(skill.toolName)
    }
    toolNames.add(skill.toolName)
  }
  
  if (duplicates.length > 0) {
    console.warn(`⚠️  Duplicate tool names detected:`, duplicates)
  }
  
  return skills
}

export const SkillsPlugin: Plugin = async (ctx) => {
  
  // Determine config path: $XDG_CONFIG_HOME/opencode/skills or ~/.config/opencode/skills
  const xdgConfigHome = process.env.XDG_CONFIG_HOME
  const configSkillsPath = xdgConfigHome
    ? join(xdgConfigHome, "opencode/skills")
    : join(os.homedir(), ".config/opencode/skills")

  // Discovery order: lowest to highest priority (last wins on duplicate tool names)
  const skills = await discoverSkills([
    configSkillsPath,                        // Lowest priority: XDG config
    join(os.homedir(), ".opencode/skills"),  // Medium priority: Global home
    join(ctx.directory, ".opencode/skills"), // Highest priority: Project-local
  ])
  
  // Create a tool for each skill
  const tools: Record<string, any> = {}
  
  for (const skill of skills) {
    tools[skill.toolName] = tool({
      description: skill.description,
      args: {},  // No args for MVP - can add template args later
      async execute(args, toolCtx) {
        // Message 1: Skill loading header (silent insertion - no AI response)
        const sendSilentPrompt = (text: string) =>
          ctx.client.session.prompt({
            path: { id: toolCtx.sessionID },
            body: {
              agent: toolCtx.agent,
              noReply: true,
              parts: [{ type: "text", text }],
            },
          });

        await sendSilentPrompt(`The "${skill.name}" skill is loading\n${skill.name}`);
        
        await sendSilentPrompt(`Base directory for this skill: ${skill.fullPath}\n\n${skill.content}`);
        
        // Return minimal confirmation
        return `Launching skill: ${skill.name}`;
      }
    })
  }

  return { tool: tools }
}
