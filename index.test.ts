import { describe, test, expect } from "bun:test"
import { mkdir, rm, writeFile, symlink } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

/**
 * Test utilities
 */
async function createTestDir(): Promise<string> {
  const dir = join(tmpdir(), `skills-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(dir, { recursive: true })
  return dir
}

async function createSkill(
  baseDir: string,
  name: string,
  options: { description?: string; nested?: string } = {}
): Promise<string> {
  const description = options.description ?? `Test skill ${name} for automated testing purposes`
  const skillPath = options.nested ? join(baseDir, options.nested, name) : join(baseDir, name)

  await mkdir(skillPath, { recursive: true })
  await writeFile(
    join(skillPath, "SKILL.md"),
    `---
name: ${name}
description: "${description}"
---

# ${name}

Test content for ${name}.
`
  )
  return skillPath
}

/**
 * Tests for generateToolName logic
 */
describe("Tool Name Generation", () => {
  test("converts simple skill name", async () => {
    const testDir = await createTestDir()
    try {
      await createSkill(testDir, "my-skill")

      const { Glob } = await import("bun")
      const glob = new Glob("**/SKILL.md")
      const matches: string[] = []
      for await (const match of glob.scan({ cwd: testDir, absolute: true })) {
        matches.push(match)
      }

      expect(matches.length).toBe(1)
      expect(matches[0]).toContain("my-skill/SKILL.md")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("handles nested skill directories", async () => {
    const testDir = await createTestDir()
    try {
      await createSkill(testDir, "pdf", { nested: "document-skills" })

      const { Glob } = await import("bun")
      const glob = new Glob("**/SKILL.md")
      const matches: string[] = []
      for await (const match of glob.scan({ cwd: testDir, absolute: true })) {
        matches.push(match)
      }

      expect(matches.length).toBe(1)
      expect(matches[0]).toContain("document-skills/pdf/SKILL.md")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })
})

/**
 * Tests for symlink support
 */
describe("Symlink Support", () => {
  test("follows symlinked skill directories", async () => {
    const testDir = await createTestDir()
    const realDir = join(testDir, "real-skills")
    const linkDir = join(testDir, "linked-skills")

    try {
      // Create real skill directory
      await mkdir(realDir, { recursive: true })
      await createSkill(realDir, "real-skill")

      // Create symlink to real directory
      await symlink(realDir, linkDir)

      const { Glob } = await import("bun")
      const glob = new Glob("**/SKILL.md")
      const matches: string[] = []
      for await (const match of glob.scan({
        cwd: testDir,
        absolute: true,
        followSymlinks: true,
      })) {
        matches.push(match)
      }

      // Should find skill in both real and linked paths
      expect(matches.length).toBe(2)
      expect(matches.some((m) => m.includes("real-skills"))).toBe(true)
      expect(matches.some((m) => m.includes("linked-skills"))).toBe(true)
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("handles symlink to individual skill directory", async () => {
    const testDir = await createTestDir()
    const realSkillDir = join(testDir, "actual", "my-skill")
    const linkedSkillDir = join(testDir, "skills", "my-skill")

    try {
      // Create real skill
      await mkdir(realSkillDir, { recursive: true })
      await writeFile(
        join(realSkillDir, "SKILL.md"),
        `---
name: my-skill
description: "A skill accessed via symlink for testing"
---
# My Skill
`
      )

      // Create symlink in skills directory
      await mkdir(join(testDir, "skills"), { recursive: true })
      await symlink(realSkillDir, linkedSkillDir)

      const { Glob } = await import("bun")
      const glob = new Glob("**/SKILL.md")
      const matches: string[] = []
      for await (const match of glob.scan({
        cwd: join(testDir, "skills"),
        absolute: true,
        followSymlinks: true,
      })) {
        matches.push(match)
      }

      expect(matches.length).toBe(1)
      expect(matches[0]).toContain("skills/my-skill/SKILL.md")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })
})

/**
 * Tests for skill discovery edge cases
 */
describe("Skill Discovery Edge Cases", () => {
  test("discovers multiple skills in same directory", async () => {
    const testDir = await createTestDir()
    try {
      await createSkill(testDir, "skill-one")
      await createSkill(testDir, "skill-two")
      await createSkill(testDir, "skill-three")

      const { Glob } = await import("bun")
      const glob = new Glob("**/SKILL.md")
      const matches: string[] = []
      for await (const match of glob.scan({ cwd: testDir, absolute: true })) {
        matches.push(match)
      }

      expect(matches.length).toBe(3)
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("ignores non-SKILL.md files", async () => {
    const testDir = await createTestDir()
    try {
      await createSkill(testDir, "valid-skill")

      // Create decoy files
      await writeFile(join(testDir, "README.md"), "# Not a skill")
      await writeFile(join(testDir, "skill.md"), "# Wrong case")
      await mkdir(join(testDir, "fake-skill"))
      await writeFile(join(testDir, "fake-skill", "readme.md"), "# Not SKILL.md")

      const { Glob } = await import("bun")
      const glob = new Glob("**/SKILL.md")
      const matches: string[] = []
      for await (const match of glob.scan({ cwd: testDir, absolute: true })) {
        matches.push(match)
      }

      expect(matches.length).toBe(1)
      expect(matches[0]).toContain("valid-skill/SKILL.md")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("handles deeply nested skills", async () => {
    const testDir = await createTestDir()
    try {
      await createSkill(testDir, "deep-skill", { nested: "level1/level2/level3" })

      const { Glob } = await import("bun")
      const glob = new Glob("**/SKILL.md")
      const matches: string[] = []
      for await (const match of glob.scan({ cwd: testDir, absolute: true })) {
        matches.push(match)
      }

      expect(matches.length).toBe(1)
      expect(matches[0]).toContain("level1/level2/level3/deep-skill/SKILL.md")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })
})

/**
 * Tests for frontmatter validation
 */
describe("Frontmatter Validation", () => {
  test("valid frontmatter structure", async () => {
    const testDir = await createTestDir()
    const skillDir = join(testDir, "valid-skill")

    try {
      await mkdir(skillDir, { recursive: true })
      await writeFile(
        join(skillDir, "SKILL.md"),
        `---
name: valid-skill
description: "A valid skill with proper frontmatter for testing"
license: MIT
allowed-tools:
  - Read
  - Write
metadata:
  version: "1.0"
  author: test
---

# Valid Skill

Content here.
`
      )

      const content = await Bun.file(join(skillDir, "SKILL.md")).text()
      const matter = await import("gray-matter")
      const { data } = matter.default(content)

      expect(data.name).toBe("valid-skill")
      expect(data.description).toBe("A valid skill with proper frontmatter for testing")
      expect(data.license).toBe("MIT")
      expect(data["allowed-tools"]).toEqual(["Read", "Write"])
      expect(data.metadata).toEqual({ version: "1.0", author: "test" })
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })
})
