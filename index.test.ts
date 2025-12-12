import { describe, test, expect } from "bun:test"
import { mkdir, rm, writeFile, symlink } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"

// Import functions under test
import { generateToolName, parseSkill, discoverSkills, type Skill } from "./index"

/**
 * Test utilities
 */
async function createTestDir(): Promise<string> {
  const dir = join(tmpdir(), `skills-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
  await mkdir(dir, { recursive: true })
  return dir
}

async function createSkillFile(
  baseDir: string,
  name: string,
  options: { description?: string; nested?: string; content?: string } = {}
): Promise<string> {
  const description = options.description ?? `Test skill ${name} for automated testing purposes`
  const skillPath = options.nested ? join(baseDir, options.nested, name) : join(baseDir, name)

  await mkdir(skillPath, { recursive: true })
  const skillFilePath = join(skillPath, "SKILL.md")
  await writeFile(
    skillFilePath,
    options.content ??
      `---
name: ${name}
description: "${description}"
---

# ${name}

Test content for ${name}.
`
  )
  return skillFilePath
}

/**
 * Tests for generateToolName function
 */
describe("generateToolName", () => {
  test("converts simple skill name to tool name", () => {
    const skillPath = "/base/my-skill/SKILL.md"
    const baseDir = "/base"
    const result = generateToolName(skillPath, baseDir)
    expect(result).toBe("skills_my_skill")
  })

  test("handles nested skill directories", () => {
    const skillPath = "/base/document-skills/pdf/SKILL.md"
    const baseDir = "/base"
    const result = generateToolName(skillPath, baseDir)
    expect(result).toBe("skills_document_skills_pdf")
  })

  test("handles deeply nested paths", () => {
    const skillPath = "/base/level1/level2/level3/deep-skill/SKILL.md"
    const baseDir = "/base"
    const result = generateToolName(skillPath, baseDir)
    expect(result).toBe("skills_level1_level2_level3_deep_skill")
  })

  test("replaces hyphens with underscores", () => {
    const skillPath = "/base/my-awesome-skill/SKILL.md"
    const baseDir = "/base"
    const result = generateToolName(skillPath, baseDir)
    expect(result).toBe("skills_my_awesome_skill")
  })
})

/**
 * Tests for parseSkill function
 */
describe("parseSkill", () => {
  test("parses valid skill file", async () => {
    const testDir = await createTestDir()
    try {
      const skillFile = await createSkillFile(testDir, "valid-skill")
      const skill = await parseSkill(skillFile, testDir)

      expect(skill).not.toBeNull()
      expect(skill!.name).toBe("valid-skill")
      expect(skill!.toolName).toBe("skills_valid_skill")
      expect(skill!.description).toBe("Test skill valid-skill for automated testing purposes")
      expect(skill!.content).toContain("# valid-skill")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("parses skill with all frontmatter fields", async () => {
    const testDir = await createTestDir()
    const skillDir = join(testDir, "full-skill")
    try {
      await mkdir(skillDir, { recursive: true })
      const skillFile = join(skillDir, "SKILL.md")
      await writeFile(
        skillFile,
        `---
name: full-skill
description: "A complete skill with all frontmatter fields"
license: MIT
allowed-tools:
  - Read
  - Write
  - Bash
metadata:
  version: "1.0"
  author: test
---

# Full Skill

Complete content here.
`
      )

      const skill = await parseSkill(skillFile, testDir)

      expect(skill).not.toBeNull()
      expect(skill!.name).toBe("full-skill")
      expect(skill!.license).toBe("MIT")
      expect(skill!.allowedTools).toEqual(["Read", "Write", "Bash"])
      expect(skill!.metadata).toEqual({ version: "1.0", author: "test" })
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("returns null for invalid frontmatter (short description)", async () => {
    const testDir = await createTestDir()
    const skillDir = join(testDir, "bad-skill")
    try {
      await mkdir(skillDir, { recursive: true })
      const skillFile = join(skillDir, "SKILL.md")
      await writeFile(
        skillFile,
        `---
name: bad-skill
description: "Too short"
---

# Bad Skill
`
      )

      const skill = await parseSkill(skillFile, testDir)
      expect(skill).toBeNull()
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("returns null when name doesn't match directory", async () => {
    const testDir = await createTestDir()
    const skillDir = join(testDir, "actual-dir")
    try {
      await mkdir(skillDir, { recursive: true })
      const skillFile = join(skillDir, "SKILL.md")
      await writeFile(
        skillFile,
        `---
name: different-name
description: "A skill where name doesn't match directory name"
---

# Mismatched Skill
`
      )

      const skill = await parseSkill(skillFile, testDir)
      expect(skill).toBeNull()
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("returns null for invalid name format (uppercase)", async () => {
    const testDir = await createTestDir()
    const skillDir = join(testDir, "BadName")
    try {
      await mkdir(skillDir, { recursive: true })
      const skillFile = join(skillDir, "SKILL.md")
      await writeFile(
        skillFile,
        `---
name: BadName
description: "A skill with invalid name containing uppercase"
---

# Bad Name
`
      )

      const skill = await parseSkill(skillFile, testDir)
      expect(skill).toBeNull()
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })
})

/**
 * Tests for discoverSkills function
 */
describe("discoverSkills", () => {
  test("discovers single skill", async () => {
    const testDir = await createTestDir()
    try {
      await createSkillFile(testDir, "my-skill")
      const skills = await discoverSkills([testDir])

      expect(skills.length).toBe(1)
      expect(skills[0].name).toBe("my-skill")
      expect(skills[0].toolName).toBe("skills_my_skill")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("discovers multiple skills", async () => {
    const testDir = await createTestDir()
    try {
      await createSkillFile(testDir, "skill-one")
      await createSkillFile(testDir, "skill-two")
      await createSkillFile(testDir, "skill-three")

      const skills = await discoverSkills([testDir])

      expect(skills.length).toBe(3)
      const names = skills.map((s) => s.name).sort()
      expect(names).toEqual(["skill-one", "skill-two", "skill-three"].sort())
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("discovers nested skills", async () => {
    const testDir = await createTestDir()
    try {
      await createSkillFile(testDir, "pdf", { nested: "document-skills" })

      const skills = await discoverSkills([testDir])

      expect(skills.length).toBe(1)
      expect(skills[0].name).toBe("pdf")
      expect(skills[0].toolName).toBe("skills_document_skills_pdf")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("handles non-existent directory gracefully", async () => {
    const skills = await discoverSkills(["/nonexistent/path/that/does/not/exist"])
    expect(skills.length).toBe(0)
  })

  test("discovers skills from multiple base paths", async () => {
    const testDir1 = await createTestDir()
    const testDir2 = await createTestDir()
    try {
      await createSkillFile(testDir1, "skill-from-dir-one")
      await createSkillFile(testDir2, "skill-from-dir-two")

      const skills = await discoverSkills([testDir1, testDir2])

      expect(skills.length).toBe(2)
      const names = skills.map((s) => s.name).sort()
      expect(names).toEqual(["skill-from-dir-one", "skill-from-dir-two"])
    } finally {
      await rm(testDir1, { recursive: true, force: true })
      await rm(testDir2, { recursive: true, force: true })
    }
  })

  test("follows symlinked skill directories", async () => {
    const testDir = await createTestDir()
    const realDir = join(testDir, "real-skills")
    const linkDir = join(testDir, "linked-skills")

    try {
      await mkdir(realDir, { recursive: true })
      await createSkillFile(realDir, "real-skill")

      // Create symlink to real directory
      await symlink(realDir, linkDir)

      // Discover from the parent dir - should find skill in both paths
      const skills = await discoverSkills([testDir])

      // Should find 2 skills (one from real path, one from symlink)
      expect(skills.length).toBe(2)
      expect(skills.some((s) => s.path.includes("real-skills"))).toBe(true)
      expect(skills.some((s) => s.path.includes("linked-skills"))).toBe(true)
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("handles symlink to individual skill directory", async () => {
    const testDir = await createTestDir()
    const realSkillDir = join(testDir, "actual", "my-skill")
    const skillsDir = join(testDir, "skills")
    const linkedSkillDir = join(skillsDir, "my-skill")

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
      await mkdir(skillsDir, { recursive: true })
      await symlink(realSkillDir, linkedSkillDir)

      // Discover from the skills directory
      const skills = await discoverSkills([skillsDir])

      expect(skills.length).toBe(1)
      expect(skills[0].name).toBe("my-skill")
      expect(skills[0].path).toContain("skills/my-skill/SKILL.md")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })

  test("ignores invalid skills (doesn't break discovery)", async () => {
    const testDir = await createTestDir()
    try {
      // Create valid skill
      await createSkillFile(testDir, "valid-skill")

      // Create invalid skill (bad frontmatter)
      const badDir = join(testDir, "bad-skill")
      await mkdir(badDir, { recursive: true })
      await writeFile(
        join(badDir, "SKILL.md"),
        `---
name: bad-skill
description: "Short"
---
# Bad
`
      )

      const skills = await discoverSkills([testDir])

      // Should only find the valid skill
      expect(skills.length).toBe(1)
      expect(skills[0].name).toBe("valid-skill")
    } finally {
      await rm(testDir, { recursive: true, force: true })
    }
  })
})
