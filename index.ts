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

import { promises as fsPromises } from "node:fs";
import { lstat } from "node:fs/promises";
import { join, dirname, basename, sep } from "path"
import os from "os"

import type { Plugin, PluginInput, ToolContext, ToolDefinition } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import envPaths from "env-paths";
import matter from "gray-matter"
import { mergeDeepLeft } from "ramda";


const SKILL_PATH_PATTERN = /skills\/.*\/SKILL.md$/;

// Types
type Skill = {
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
type PluginConfig = {
    debug: boolean
    basePaths: string | string[]
}
type SkillRegistry = Map<string, Skill>;
type ToolArgs = Parameters<typeof tool>[0]["args"];


// Validation Schema
const SkillFrontmatterSchema = tool.schema.object({
    name: tool.schema.string()
        .regex(/^[a-z0-9-]+$/, "Name must be lowercase alphanumeric with hyphens")
        .min(1, "Name cannot be empty"),
    description: tool.schema.string()
        .min(20, "Description must be at least 20 characters for discoverability"),
    license: tool.schema.string().optional(),
    "allowed-tools": tool.schema.array(tool.schema.string()).optional(),
    metadata: tool.schema.record(tool.schema.string(), tool.schema.string()).optional(),
})

/**
 * Generate tool name from skill path
 * Examples:
 *   skills/brand-guidelines/SKILL.md → skills_brand_guidelines
 *   skills/document-skills/docx/SKILL.md → skills_document_skills_docx
 *   skills/image-processing/SKILL.md → skills_image_processing
*/
function toolName(skillPath: string): string {
    return skillPath
        .replace(/\/SKILL\.md$/, "") // Remove trailing /SKILL.md
        .split(sep)
        .join("_")
        .replace(/-/g, "_") // Replace hyphens with underscores
}

async function findSkillPaths(basePaths: string | string[]) {

    const basePathsArray = Array.isArray(basePaths) ? basePaths : [basePaths]
    try {
        const paths: string[] = []

        for (const basePath of basePathsArray) {
            const stat = await lstat(basePath).catch(() => null);
            if (!stat?.isDirectory()) {
                continue;
            }
            paths.push(basePath);
        }

        const patterns = paths.map(basePath => join(basePath, "**/SKILL.md"))
        const matches = await fsPromises.glob(patterns)
        return matches;
    } catch {
        return [];
    }
}

/**
 * Parse a SKILL.md file and return structured skill data
 * Returns null if parsing fails (with error logging)
 */
async function parseSkill(skillPath: string): Promise<Skill | null> {

    try {

        const relativePath = skillPath.match(SKILL_PATH_PATTERN)?.[0]
        if (!relativePath) {
            console.error(`❌ Skill path does not match expected pattern: ${skillPath}`);
            return null
        }


        // Read file
        const content = await Bun.file(skillPath).text()

        // Parse YAML frontmatter
        const parsed = matter(content)

        // Validate frontmatter schema
        const frontmatter = SkillFrontmatterSchema.safeParse(parsed.data)
        if (!frontmatter.success) {
            console.error(`❌ Invalid frontmatter in ${skillPath}:`)
            frontmatter.error.flatten()
                .formErrors
                .forEach(err => {
                    console.error(`   - ${err}`)
                })
            return null
        }

        // Validate name matches directory
        const skillDir = basename(dirname(skillPath))
        if (frontmatter.data.name !== skillDir) {
            console.error(
                `❌ Name mismatch in ${skillPath}:`,
                `\n   Frontmatter name: "${frontmatter.data.name}"`,
                `\n   Directory name: "${skillDir}"`,
                `\n   Fix: Update the 'name' field in SKILL.md to match the directory name`
            )
            return null
        }

        // Generate tool name from path

        return {
            allowedTools: frontmatter.data["allowed-tools"],
            content: parsed.content.trim(),
            description: frontmatter.data.description,
            fullPath: dirname(skillPath),
            toolName: toolName(relativePath),
            license: frontmatter.data.license,
            metadata: frontmatter.data.metadata,
            name: frontmatter.data.name,
            path: skillPath,
        }

    } catch (error) {
        console.error(`❌ Error parsing skill ${skillPath}:`, error instanceof Error ? error.message : String(error))
        return null
    }
}

function createInstructionInjector(ctx: PluginInput) {
    // Message 1: Skill loading header (silent insertion - no AI response)
    const sendPrompt = (text: string, props: { sessionId: string }) => {
        ctx.client.session.prompt({
            path: { id: props.sessionId },
            body: {
                noReply: true,
                parts: [{ type: "text", text }],
            },
        });
    }
    return sendPrompt;
}

/**
 * Creates a function to inject skill loading messages into the session
 */
function createSkillTool<T extends ToolArgs>(skill: Skill, options: { ctx: PluginInput, args?: T }): ToolDefinition {
    const sendPrompt = createInstructionInjector(options.ctx);

    return tool({
        description: skill.description,
        args: options.args || {},  // No args for MVP - can add template args later
        execute: async (_, toolCtx) => {
            await sendPrompt(`The "${skill.name}" skill is loading\n${skill.name}`, { sessionId: toolCtx.sessionID });
            await sendPrompt(`Base directory for this skill: ${skill.fullPath}\n\n${skill.content}`, { sessionId: toolCtx.sessionID });
            // Return minimal confirmation
            return `Launching skill: ${skill.name}`;
        }
    })
}

/**
 *  Tool to read a resource file from a skill's directory
 */
function createToolResourceReader(ctx: PluginInput, registry: SkillRegistry): ToolDefinition {
    const sendPrompt = createInstructionInjector(ctx);

    return tool({
        description: "Read [[<relative_path>]] from a skill's resources and inject content silently. If loading skills, use the skills_<skillname> instead.",
        args: {
            skill_name: tool.schema.string(),
            relative_path: tool.schema.string()
        },
        execute: async (args, toolCtx: ToolContext) => {
            const skill = registry.get(args.skill_name);
            if (!skill) {
                throw new Error(`Skill not found: ${args.skill_name}`);
            }

            const resourcePath = join(skill.fullPath, args.relative_path);
            try {
                const content = await Bun.file(resourcePath).text();

                // Inject content silently
                await sendPrompt(`Resource loaded from skill "${skill.name}": ${args.relative_path}\n\n${content}`, { sessionId: toolCtx.sessionID });

                return `Resource "${args.relative_path}" from skill "${skill.name}" has been loaded successfully.`;
            } catch (error) {
                throw new Error(`Failed to read resource at ${resourcePath}: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
    })
}


/**
 * SkillRegistry manages skill discovery and parsing
 */
async function createSkillRegistry(ctx: PluginInput, config: PluginConfig) {

    /**
     * Skill Registry Map
     * 
     * Key: toolName (e.g., "skills_brand_guidelines")
     * Value: Skill object
     * 
     * - Handles duplicate tool names by logging and skipping
     * - Skills loaded from multiple base paths (last one wins)
     * - Stored as Map for metadata access by tool resource reader
     */
    const registry: SkillRegistry = new Map()

    // Find all SKILL.md files recursively
    const matches = await findSkillPaths(config.basePaths);
    const dupes: string[] = [];
    const tools: Record<string, ToolDefinition> = {
        "skills_read_resource": createToolResourceReader(ctx, registry)
    }

    for await (const match of matches) {
        const skill = await parseSkill(match);

        if (!skill) {
            continue;
        }


        if (registry.has(skill.toolName)) {
            dupes.push(skill.toolName);
            continue;
        }

        tools[skill.toolName] = createSkillTool(skill, { ctx });
        registry.set(skill.toolName, skill);
    }

    if (dupes.length) {
        console.warn(`⚠️  Duplicate skill tool names detected (skipped): ${dupes.join(", ")}`);
    }

    return tools
}

const OpenCodePaths = envPaths("opencode", { suffix: "" });

async function getPluginConfig(ctx: PluginInput): Promise<PluginConfig> {
    /**
     * Future: Load from OpenCode config
     * const config = await ctx.client.config.get();
     * const resolved = config.data.plugins?.find(skill => skill.name === "opencode-skills");
     * 
     * Raised this as https://github.com/sst/opencode/issues/4393
     */
    const base = {
        debug: false,
        basePaths: [
            join(os.homedir(), ".opencode/skills"),    // Lowest priority: Non standard user config
            join(OpenCodePaths.config, "skills"),      // Lowest priority: Standard User Config (windows)
            join(ctx.directory, ".opencode/skills"),   // Highest priority: Project-local
        ]
    };

    return mergeDeepLeft({}, base);
}

export const SkillsPlugin: Plugin = async (ctx) => {
    const config = await getPluginConfig(ctx);
    // Discovery order: lowest to highest priority (last wins on duplicate tool names)
    const tool = await createSkillRegistry(ctx, config)

    return { tool }
}
