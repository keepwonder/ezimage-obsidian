# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.8] - 2026-06-21

### Fixed
- Publish the stylesheet under Obsidian's supported `styles.css` asset name
- Replace the deprecated imperative settings tab with the Obsidian 1.13 declarative settings API
- Remove deprecated slider tooltip usage
- Validate persisted plugin data before assigning it to typed settings

### Changed
- Require Obsidian 1.13.0 or newer for the declarative settings API

## [1.1.7] - 2026-06-21

### Fixed
- Resolve automated Obsidian review risks by replacing inline styles with CSS classes and native heading settings
- Use public Obsidian APIs for language detection, active documents, and file trash behavior
- Load Electron dynamically so the desktop clipboard fallback remains safe on mobile
- Declare Obsidian 1.8.7 as the minimum supported version to match the APIs used by the plugin
- Ship `main.css` as a separate release asset instead of importing styles into the JavaScript bundle

## [1.1.6] - 2026-06-18

### Fixed
- Image processing now detects actual GIF, PNG/APNG, WebP, AVIF, JPEG, BMP, and SVG content instead of trusting file extensions or declared MIME types
- Animated GIF, WebP, APNG, AVIF, and SVG files automatically bypass conversion even when their file extension is misleading
- Mislabelled images are uploaded with a corrected extension and MIME type; for example, GIF data named `image.jpeg` becomes `image.gif` with `image/gif`
- Electron clipboard fallback now attempts to read original encoded image data before flattening it through a static PNG

## [1.1.5] - 2026-06-18

### Added
- Configurable list of image formats that should be uploaded unchanged, with support for space-, comma-, or semicolon-separated extensions
- English and Chinese settings copy and documentation for original-format exclusions

### Fixed
- GIF files now bypass WebP conversion by default, preserving all animation frames across paste, drag-and-drop, file picker, and batch upload flows
- Excluded formats retain their original bytes, file extension, and MIME type without resizing or Canvas metadata stripping

## [1.1.4] - 2026-05-27

### Fixed
- Batch upload now uses localized UI text consistently in English and Chinese
- Batch upload now updates each Markdown file in a single write to avoid duplicate-link and concurrent-write replacement issues
- Batch upload now verifies source wikilink positions before modifying notes, preventing stale replacements if a note changes mid-upload
- Uploaded path template file names are sanitized before generating public object keys

### Changed
- Clarified plugin metadata to state current Cloudflare R2 support

## [1.1.3] - 2026-05-26

### Fixed
- Editor context menu batch upload now scopes to current file instead of entire vault
- Removed debug logging for cleaner console output

### Changed
- Improved batch upload scope behavior: editor right-click → current file, file explorer right-click → selected file/folder, command palette → entire vault

## [1.1.2] - 2026-05-26

### Added
- **Full i18n Support**: All commands, context menus, and notices now follow the language setting
- Language change notification prompting user to reload plugin for command palette updates
- Debug logging for batch upload scope path to diagnose issues

### Changed
- Context menu items now display in selected language (Chinese/English)
- Command palette commands now display in selected language (requires plugin reload)
- Improved context menu visual grouping with separators

### Fixed
- Context menu UX improvements for better visual organization

## [1.1.1] - 2026-05-26

### Added
- **Scoped Batch Upload**: Right-click on any file or folder in file explorer to batch upload images within that scope only
- File explorer context menu integration for targeted batch uploads
- Recursive folder scanning for batch uploads
- Modal title now shows current scope (entire vault / specific file / specific folder)

### Changed
- All commands now accessible from both command palette and context menus for consistency
- Batch upload can now target: entire vault (command palette), specific file (right-click file), or specific folder (right-click folder)

## [1.1.0] - 2026-05-26

### Added
- **Batch Upload Local Images**: New command `EzImage: Batch Upload Local Images` to scan vault for existing `![[image.*]]` wikilinks and batch upload them to cloud storage
- **Scoped Batch Upload**: Right-click on any file or folder in file explorer to batch upload images within that scope only
- Interactive modal with scan results preview showing file count, total size, and per-file status
- Progress tracking with real-time log during batch upload
- Optional local file deletion after successful upload
- Concurrent upload limit (3 simultaneous uploads) to prevent overwhelming R2 rate limits
- Automatic wikilink replacement: `![[image.png]]` → `![image](url)` after upload
- File explorer context menu integration for scoped batch uploads
- All commands now accessible from both command palette and context menus

## [1.0.4] - 2026-05-22

### Added
- EXIF metadata stripping: GPS location, device info, and other metadata are removed before upload via Canvas redraw (no extra dependency)
- `Strip EXIF Metadata` toggle in Image Processing settings (default: on)
- When compression is enabled, EXIF is already stripped naturally by the WebP conversion — the new toggle only applies when compression is off
- Auto-retry on upload: up to 2 retries with 1 s / 2 s back-off for transient network errors; credential errors (4xx) are not retried
- Smarter error messages: auth failures prompt to check Settings; network errors prompt to check connection
- File size limit: configurable `Max File Size (MB)` setting (default: 20 MB); oversized files are rejected before upload with a clear notice
- Live path template preview in Settings — updates on every keystroke
- Inline validation for `Max Width` and `Max File Size` inputs

### Fixed
- Regex injection: path template variable substitution now uses `split/join` instead of `new RegExp()`, preventing filenames with special characters from breaking the template
- Concurrent upload limit: paste/drop now processes at most 3 images simultaneously to avoid overwhelming R2 rate limits
- Status bar tooltip language now updates immediately when language is changed in Settings (locale was previously applied after the status bar refresh)

## [1.0.3] - 2026-05-22

### Added
- Local Save mode: paste and drag-drop now route to vault when enabled, inserting `![[wikilink]]` instead of uploading
- Status bar indicator showing current mode (`☁ EzImage` / `🖴 Local Save`)
- Status bar tooltip follows the configured language (EN / 中文 / Auto)
- `Toggle Local Save Mode` command in Command Palette
- Settings UI available in English and 中文, with Auto (follow Obsidian) option
- `Default to Local Save mode` toggle in General settings — persists across restarts

### Changed
- Status bar is now a read-only indicator; mode switching is done via Settings toggle or Command Palette
- `localSaveDefaultDesc` copy updated to reference Command Palette instead of status bar

### Fixed
- Drag & drop bypass modifier key removed — replaced by persistent mode toggle that works reliably across all input methods

## [1.0.2] - 2026-05-22

### Fixed
- Drag & drop no longer saves a local copy — `evt.preventDefault()` is now called synchronously before any async operations, correctly blocking Obsidian's default file-save behaviour

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
