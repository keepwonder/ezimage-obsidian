# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.1] - 2026-05-22

### Fixed
- Replace `builtin-modules` dev dependency with Node.js native `module.builtinModules`
- Remove `versions.json` from GitHub release assets (only `main.js` and `manifest.json` are needed)
- Add markdown H1 title to README for compatibility with automated plugin reviewers

## [1.0.0] - 2026-05-22

### Added
- Cloudflare R2 upload support via AWS Signature V4 (computed locally with Web Crypto API)
- Automatic paste interception — blocks Obsidian's default local-save behaviour
- Drag & drop image upload
- Upload from clipboard (Command Palette / right-click menu)
- Upload from file picker (Command Palette / right-click menu)
- Automatic WebP compression powered by `browser-image-compression`
- Configurable max width and quality for compression
- Flexible path templates with variables: `{yyyy}` `{MM}` `{dd}` `{hh}` `{mm}` `{ss}` `{timestamp}` `{random}` `{name}` `{ext}`
- Settings tab with full R2 configuration UI
