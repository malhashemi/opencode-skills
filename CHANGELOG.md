# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0](https://github.com/malhashemi/opencode-skills/compare/v0.1.0...v0.1.0) (2025-10-26)


### ⚠ BREAKING CHANGES

* Requires OpenCode SDK >= 0.15.18

### Features

* **config:** support ~/.config/opencode/skills as global skills directory ([93b7dcd](https://github.com/malhashemi/opencode-skills/commit/93b7dcd0e72db18d2adc2c70dc3b1ba5c1e8583c))
* **config:** support ~/.config/opencode/skills as global skills directory ([ff37006](https://github.com/malhashemi/opencode-skills/commit/ff37006f8088067905a8a7d5277cf4331a469ce2))
* implement Anthropic message insertion pattern with noReply ([#20](https://github.com/malhashemi/opencode-skills/issues/20)) ([d28fa84](https://github.com/malhashemi/opencode-skills/commit/d28fa845ab6e3386f46629bf473a938da1349803))


### Bug Fixes

* configure pre-1.0 versioning for patch releases only ([49a7016](https://github.com/malhashemi/opencode-skills/commit/49a7016f5699911dd69f6b48cd0cf20ea51df0f6))
* correct version number in package.json to 0.0.1 ([de33a38](https://github.com/malhashemi/opencode-skills/commit/de33a38816813654fd1d37025a2e820fd0c6b9b7))
* only warn if no skills directories were found ([#17](https://github.com/malhashemi/opencode-skills/issues/17)) ([e5a43c0](https://github.com/malhashemi/opencode-skills/commit/e5a43c04288df533cc63901a7c4067eea904b0b9))
* update version number in package.json to 0.0.2 and refine README examples ([0a64400](https://github.com/malhashemi/opencode-skills/commit/0a64400b65cc2b7a1e99e7556612139592c3e1ea))

## [0.1.0](https://github.com/malhashemi/opencode-skills/compare/v0.0.4...v0.1.0) (2025-10-26)


### ⚠ BREAKING CHANGES

* Requires OpenCode SDK >= 0.15.18

### Features

* implement Anthropic message insertion pattern with noReply ([#20](https://github.com/malhashemi/opencode-skills/issues/20)) ([d28fa84](https://github.com/malhashemi/opencode-skills/commit/d28fa845ab6e3386f46629bf473a938da1349803))

## [0.0.4](https://github.com/malhashemi/opencode-skills/compare/v0.0.3...v0.0.4) (2025-10-26)


### Bug Fixes

* only warn if no skills directories were found ([#17](https://github.com/malhashemi/opencode-skills/issues/17)) ([e5a43c0](https://github.com/malhashemi/opencode-skills/commit/e5a43c04288df533cc63901a7c4067eea904b0b9))

## [0.0.3](https://github.com/malhashemi/opencode-skills/compare/v0.0.2...v0.0.3) (2025-10-22)


### Bug Fixes

* configure pre-1.0 versioning for patch releases only ([49a7016](https://github.com/malhashemi/opencode-skills/commit/49a7016f5699911dd69f6b48cd0cf20ea51df0f6))

## [Unreleased]

## [0.0.2] - 2025-10-22

### Added
- Initial release with Skills Plugin functionality
- Auto-discovery of skills from `.opencode/skills/` directories
- Spec compliance with Anthropic's Skills Specification v1.0
- Dynamic tool registration for discovered skills
- Path resolution for skill supporting files

[Unreleased]: https://github.com/malhashemi/opencode-skills/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/malhashemi/opencode-skills/releases/tag/v0.0.2
