// Utility functions shared between VS Code and Obsidian versions

export function generateRandom(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

export function sanitizePathSegment(value: string, fallback = 'image'): string {
  const sanitized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/<>:"|?*#%&{}[\]\x00-\x1f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^\.+/, '')
    .replace(/[.-]+$/, '')
    .slice(0, 120);

  return sanitized || fallback;
}

/**
 * Render a path template with date/time and file variables.
 * Supports: {yyyy} {MM} {dd} {hh} {mm} {ss} {timestamp} {random} {name} {ext}
 */
export function generateFilePath(originalName: string, template: string): string {
  const now = new Date();
  const dotIndex = originalName.lastIndexOf('.');
  const ext = sanitizePathSegment(dotIndex !== -1 ? originalName.slice(dotIndex + 1) : 'png', 'png').toLowerCase();
  const name = sanitizePathSegment(dotIndex !== -1 ? originalName.slice(0, dotIndex) : originalName);

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
    // Use split/join instead of RegExp to avoid regex injection from filenames
    result = result.split(key).join(value);
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
    bmp: 'image/bmp',
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
