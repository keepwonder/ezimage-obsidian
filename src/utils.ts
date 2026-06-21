// Utility functions shared between VS Code and Obsidian versions

export function generateRandom(length = 8): string {
  return Math.random().toString(36).substring(2, 2 + length);
}

export function sanitizePathSegment(value: string, fallback = 'image'): string {
  const sanitized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/<>:"|?*#%&{}[\]]/g, '-')
    .split('')
    .map(char => char.charCodeAt(0) <= 0x1f ? '-' : char)
    .join('')
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
    avif: 'image/avif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  };
  return map[ext.toLowerCase()] ?? 'image/png';
}

export interface ImageInspection {
  format: 'gif' | 'png' | 'webp' | 'avif' | 'jpeg' | 'bmp' | 'svg' | null;
  extension: string | null;
  mimeType: string | null;
  animated: boolean;
}

function ascii(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.subarray(offset, offset + length));
}

function countGifFrames(bytes: Uint8Array): number {
  if (bytes.length < 13) return 0;
  let offset = 13;
  const globalTable = (bytes[10] & 0x80) !== 0;
  if (globalTable) offset += 3 * (1 << ((bytes[10] & 0x07) + 1));

  let frames = 0;
  const skipSubBlocks = () => {
    while (offset < bytes.length) {
      const size = bytes[offset++];
      if (size === 0) return true;
      if (offset + size > bytes.length) return false;
      offset += size;
    }
    return false;
  };

  while (offset < bytes.length) {
    const marker = bytes[offset++];
    if (marker === 0x3b) break; // trailer
    if (marker === 0x21) { // extension
      if (offset >= bytes.length) break;
      offset++; // extension label
      if (!skipSubBlocks()) break;
      continue;
    }
    if (marker !== 0x2c || offset + 9 > bytes.length) break; // image descriptor

    frames++;
    const packed = bytes[offset + 8];
    offset += 9;
    if ((packed & 0x80) !== 0) offset += 3 * (1 << ((packed & 0x07) + 1));
    if (offset >= bytes.length) break;
    offset++; // LZW minimum code size
    if (!skipSubBlocks()) break;
    if (frames > 1) return frames;
  }

  return frames;
}

/** Inspect actual image bytes instead of trusting a file extension or declared MIME type. */
export function inspectImageData(data: ArrayBuffer): ImageInspection {
  const bytes = new Uint8Array(data);
  const unknown: ImageInspection = { format: null, extension: null, mimeType: null, animated: false };

  if (bytes.length >= 6) {
    const signature = ascii(bytes, 0, 6);
    if (signature === 'GIF87a' || signature === 'GIF89a') {
      return {
        format: 'gif',
        extension: 'gif',
        mimeType: 'image/gif',
        animated: countGifFrames(bytes) > 1,
      };
    }
  }

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (bytes.length >= 8 && pngSignature.every((value, i) => bytes[i] === value)) {
    const view = new DataView(data);
    let offset = 8;
    let animated = false;
    while (offset + 12 <= bytes.length) {
      const length = view.getUint32(offset, false);
      const type = ascii(bytes, offset + 4, 4);
      if (type === 'acTL') animated = true;
      if (type === 'IEND' || length > bytes.length - offset - 12) break;
      offset += 12 + length;
    }
    return { format: 'png', extension: 'png', mimeType: 'image/png', animated };
  }

  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    const view = new DataView(data);
    let offset = 12;
    let animated = false;
    while (offset + 8 <= bytes.length) {
      const type = ascii(bytes, offset, 4);
      const length = view.getUint32(offset + 4, true);
      if (type === 'ANIM' || type === 'ANMF') animated = true;
      if (length > bytes.length - offset - 8) break;
      offset += 8 + length + (length & 1);
    }
    return { format: 'webp', extension: 'webp', mimeType: 'image/webp', animated };
  }

  if (bytes.length >= 16 && ascii(bytes, 4, 4) === 'ftyp') {
    const view = new DataView(data);
    const boxSize = Math.min(view.getUint32(0, false) || bytes.length, bytes.length);
    const brands: string[] = [];
    for (let offset = 8; offset + 4 <= boxSize; offset += 4) brands.push(ascii(bytes, offset, 4));
    if (brands.includes('avif') || brands.includes('avis')) {
      return {
        format: 'avif',
        extension: 'avif',
        mimeType: 'image/avif',
        animated: brands.includes('avis'),
      };
    }
  }

  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { format: 'jpeg', extension: 'jpg', mimeType: 'image/jpeg', animated: false };
  }

  if (bytes.length >= 2 && ascii(bytes, 0, 2) === 'BM') {
    return { format: 'bmp', extension: 'bmp', mimeType: 'image/bmp', animated: false };
  }

  // SVG may include XML declarations and leading whitespace. Limit decoding to
  // avoid turning an arbitrarily large binary file into a string.
  const prefix = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.length, 1024 * 1024)));
  if (/^(?:\uFEFF|\s)*(?:<\?xml[\s\S]*?\?>\s*)?<svg\b/i.test(prefix)) {
    const animated = /<animate(?:Motion|Transform)?\b|@keyframes\b|\banimation\s*:/i.test(prefix);
    return { format: 'svg', extension: 'svg', mimeType: 'image/svg+xml', animated };
  }

  return unknown;
}

/** Correct misleading image metadata using the detected binary format. */
export function reconcileImageMetadata(
  data: ArrayBuffer,
  fileName: string,
  mimeType: string
): ImageInspection & { fileName: string; resolvedMimeType: string } {
  const inspection = inspectImageData(data);
  if (!inspection.format || !inspection.extension || !inspection.mimeType) {
    return { ...inspection, fileName, resolvedMimeType: mimeType };
  }

  const dot = fileName.lastIndexOf('.');
  const extension = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  const matchingExtensions = inspection.format === 'jpeg' ? ['jpg', 'jpeg'] : [inspection.extension];
  const resolvedName = matchingExtensions.includes(extension)
    ? fileName
    : replaceExtension(fileName, inspection.extension);

  return { ...inspection, fileName: resolvedName, resolvedMimeType: inspection.mimeType };
}

/**
 * Parse a user-entered list of file extensions.
 * Accepts whitespace, commas, and semicolons; stores lowercase extensions
 * without a leading dot.
 */
export function normalizeExtensionList(value: string | string[]): string[] {
  const input = Array.isArray(value) ? value.join(' ') : value;
  return Array.from(new Set(
    input
      .split(/[\s,;]+/)
      .map(ext => ext.trim().toLowerCase().replace(/^\.+/, ''))
      .filter(Boolean)
  ));
}

/** Return whether an image should bypass all lossy image processing. */
export function isImageProcessingExcluded(
  fileName: string,
  mimeType: string,
  excludedExtensions: string[]
): boolean {
  const excluded = new Set(normalizeExtensionList(excludedExtensions));
  if (excluded.size === 0) return false;

  const dot = fileName.lastIndexOf('.');
  const fileExtension = dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : '';
  const mimeExtension = mimeType
    .toLowerCase()
    .replace(/^image\//, '')
    .replace(/\+xml$/, '');

  // Treat the common JPEG extensions as aliases.
  if (
    (fileExtension === 'jpg' || fileExtension === 'jpeg' || mimeExtension === 'jpeg') &&
    (excluded.has('jpg') || excluded.has('jpeg'))
  ) {
    return true;
  }

  return excluded.has(fileExtension) || excluded.has(mimeExtension);
}

/** Replace or append an extension on a filename */
export function replaceExtension(fileName: string, newExt: string): string {
  const dot = fileName.lastIndexOf('.');
  const base = dot !== -1 ? fileName.slice(0, dot) : fileName;
  return `${base}.${newExt}`;
}
