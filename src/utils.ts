// Utility functions shared between VS Code and Obsidian versions

export function generateRandom(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

/**
 * Render a path template with date/time and file variables.
 * Supports: {yyyy} {MM} {dd} {hh} {mm} {ss} {timestamp} {random} {name} {ext}
 */
export function generateFilePath(originalName: string, template: string): string {
  const now = new Date();
  const dotIndex = originalName.lastIndexOf('.');
  const ext = dotIndex !== -1 ? originalName.slice(dotIndex + 1) : 'png';
  const name = dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName;

  const variables: Record<string, string> = {
    '{timestamp}': Date.now().toString(),
    '{yyyy}': now.getFullYear().toString(),
    '{MM}': String(now.getMonth() + 1).padStart(2, '0'),
    '{dd}': String(now.getDate()).padStart(2, '0'),
    '{hh}': String(now.getHours()).padStart(2, '0'),
    '{mm}': String(now.getMinutes()).padStart(2, '0'),
    '{ss}': String(now.getSeconds()).padStart(2, '0'),
    '{random}': generateRandom(),
    '{name}': name,
    '{ext}': ext,
  };

  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    // Escape curly braces for regex
    const escaped = key.replace(/\{/g, '\\{').replace(/\}/g, '\\}');
    result = result.replace(new RegExp(escaped, 'g'), value);
  }
  return result;
}

export function getMimeType(ext: string): string {
  const map: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return map[ext.toLowerCase()] ?? 'image/png';
}

/** Replace or append an extension on a filename */
export function replaceExtension(fileName: string, newExt: string): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot !== -1 ? fileName.slice(0, dot) : fileName;
  return `${base}.${newExt}`;
}
