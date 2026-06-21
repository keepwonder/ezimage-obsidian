export interface ClipboardImage {
  data: ArrayBuffer;
  fileName: string;
  mimeType: string;
}

/**
 * Extract an image from the system clipboard.
 * Strategy:
 *   1. Web Clipboard API  (works in Electron + modern browsers with permission)
 *   2. Electron clipboard (Desktop fallback, zero-permission)
 */
export async function getClipboardImage(): Promise<ClipboardImage | null> {
  // --- Strategy 1: Web Clipboard API ---
  try {
    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof ClipboardItem !== 'undefined'
    ) {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const data = await blob.arrayBuffer();
            const ext = type.split('/')[1] ?? 'png';
            return {
              data,
              fileName: `clipboard-${Date.now()}.${ext}`,
              mimeType: type,
            };
          }
        }
      }
    }
  } catch {
    // Permission denied or no image — fall through to Electron
  }

  // --- Strategy 2: Electron clipboard (Desktop only) ---
  try {
    // Dynamic import keeps the desktop-only module out of the mobile load path.
    const electron = await import('electron');
    const clipboard = electron.clipboard ?? electron.remote?.clipboard;
    if (clipboard) {
      // Prefer original encoded clipboard data so animated GIF/WebP/APNG/AVIF
      // is not flattened by nativeImage.toPNG(). Clipboard format names vary
      // between operating systems, so match both MIME names and platform UTIs.
      const formats: string[] = clipboard.availableFormats?.() ?? [];
      const encodedFormats = [
        { pattern: /gif/i, extension: 'gif', mimeType: 'image/gif' },
        { pattern: /webp/i, extension: 'webp', mimeType: 'image/webp' },
        { pattern: /avif/i, extension: 'avif', mimeType: 'image/avif' },
        { pattern: /png/i, extension: 'png', mimeType: 'image/png' },
      ];
      for (const candidate of encodedFormats) {
        const format = formats.find(value => candidate.pattern.test(value));
        if (!format || typeof clipboard.readBuffer !== 'function') continue;
        const buffer: Buffer = clipboard.readBuffer(format);
        if (buffer.length === 0) continue;
        return {
          data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
          fileName: `clipboard-${Date.now()}.${candidate.extension}`,
          mimeType: candidate.mimeType,
        };
      }

      const image = clipboard.readImage();
      if (!image.isEmpty()) {
        const buffer: Buffer = image.toPNG();
        return {
          // Convert Node Buffer → ArrayBuffer
          data: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
          fileName: `clipboard-${Date.now()}.png`,
          mimeType: 'image/png',
        };
      }
    }
  } catch {
    // Not in Electron, or Electron API unavailable
  }

  return null;
}
