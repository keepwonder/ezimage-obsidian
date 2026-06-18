import { Editor, MarkdownView, Notice, Plugin, setIcon } from 'obsidian';
import imageCompression from 'browser-image-compression';

import { DEFAULT_SETTINGS, EzImageSettings } from './types';
import { R2Uploader } from './uploaders/r2';
import { EzImageSettingsTab } from './settings-tab';
import {
  generateFilePath,
  isImageProcessingExcluded,
  normalizeExtensionList,
  replaceExtension,
} from './utils';
import { getClipboardImage } from './handlers/clipboard';
import { setLocale, t } from './i18n';
import { BatchUploadModal } from './modals/batch-upload-modal';

// Import styles
import './styles.css';

export default class EzImagePlugin extends Plugin {
  settings: EzImageSettings;

  // Lazily created; reset when settings change
  private _uploader: R2Uploader | null = null;

  private _statusBarItem: HTMLElement | null = null;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async onload() {
    await this.loadSettings();

    // Apply stored locale preference before anything renders
    setLocale(this.settings.language);

    // ── Commands ──────────────────────────────────────────────────────────────

    this.addCommand({
      id: 'upload-clipboard',
      name: t('cmdUploadClipboard'),
      editorCallback: async (editor: Editor) => {
        await this.handleClipboardUpload(editor);
      },
    });

    this.addCommand({
      id: 'upload-file',
      name: t('cmdUploadFile'),
      editorCallback: async (editor: Editor) => {
        await this.handleFileUpload(editor);
      },
    });

    this.addCommand({
      id: 'toggle-local-mode',
      name: t('cmdToggleLocalMode'),
      callback: () => {
        this.setLocalMode(!this.settings.localSaveByDefault);
        new Notice(this.settings.localSaveByDefault ? t('noticeLocalModeOn') : t('noticeLocalModeOff'));
      },
    });

    this.addCommand({
      id: 'batch-upload',
      name: t('cmdBatchUpload'),
      callback: () => {
        new BatchUploadModal(this.app, this).open();
      },
    });

    // ── Context menu ──────────────────────────────────────────────────────────
    // Editor context menu (right-click in editor)
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        menu.addSeparator();
        menu.addItem(item =>
          item
            .setTitle(`${t('menuEzImage')}: ${t('menuUploadClipboard')}`)
            .setIcon('clipboard')
            .onClick(() => this.handleClipboardUpload(editor))
        );
        menu.addItem(item =>
          item
            .setTitle(`${t('menuEzImage')}: ${t('menuUploadFile')}`)
            .setIcon('folder-open')
            .onClick(() => this.handleFileUpload(editor))
        );
        menu.addItem(item =>
          item
            .setTitle(`${t('menuEzImage')}: ${t('menuBatchUpload')}`)
            .setIcon('upload-cloud')
            .onClick(() => {
              // Get current file from view
              const file = view.file;
              new BatchUploadModal(this.app, this, file?.path ?? null).open();
            })
        );
        menu.addItem(item =>
          item
            .setTitle(`${t('menuEzImage')}: ${t('menuToggleLocalMode')}`)
            .setIcon('switch')
            .onClick(() => {
              this.setLocalMode(!this.settings.localSaveByDefault);
              new Notice(this.settings.localSaveByDefault ? t('noticeLocalModeOn') : t('noticeLocalModeOff'));
            })
        );
        menu.addSeparator();
      })
    );

    // File explorer context menu (right-click on files/folders)
    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        menu.addItem(item =>
          item
            .setTitle(`${t('menuEzImage')}: ${t('menuBatchUpload')}`)
            .setIcon('upload-cloud')
            .onClick(() => new BatchUploadModal(this.app, this, file.path).open())
        );
      })
    );

    // ── Status bar ────────────────────────────────────────────────────────────
    // Read-only indicator. Use the Settings toggle or the command palette to switch modes.

    this._statusBarItem = this.addStatusBarItem();
    this._statusBarItem.title = 'EzImage: current image mode (change in Settings or via Command Palette)';
    this.refreshStatusBar();

    // ── Paste interception (DOM capture) ──────────────────────────────────────
    // In local-save mode: return early → Obsidian's handler saves to the vault.
    // In upload mode: block default, upload to R2.

    this.registerDomEvent(document, 'paste', (evt: ClipboardEvent) => {
      if (!this.isConfigured()) return;
      if (this.settings.localSaveByDefault) return; // let Obsidian save to vault

      const target = evt.target as Element;
      if (!target.closest('.cm-editor')) return;

      const items = evt.clipboardData?.items;
      if (!items) return;

      const imageItems: DataTransferItem[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === 'file' && item.type.startsWith('image/')) imageItems.push(item);
      }
      if (imageItems.length === 0) return;

      evt.preventDefault();
      evt.stopPropagation();

      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) return;

      (async () => {
        await this.runWithConcurrency(
          imageItems
            .map(imageItem => async () => {
              const file = imageItem.getAsFile();
              if (file) {
                const data = await file.arrayBuffer();
                await this.uploadAndInsert(view.editor, data, file.name, file.type);
              }
            })
        );
      })();
    }, true);

    // ── Drop interception (DOM capture) ───────────────────────────────────────
    // Always intercept image drops. Route to vault-save or R2-upload based on mode.
    // (Obsidian's native drop handler would reference the original file path, not copy it.)

    this.registerDomEvent(document, 'drop', (evt: DragEvent) => {
      if (!this.isConfigured()) return;

      const target = evt.target as Element;
      if (!target.closest('.cm-editor')) return;

      const files = evt.dataTransfer?.files;
      if (!files || files.length === 0) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) imageFiles.push(file);
      }
      if (imageFiles.length === 0) return;

      evt.preventDefault();
      evt.stopPropagation();

      const view = this.app.workspace.getActiveViewOfType(MarkdownView);
      if (!view) return;

      (async () => {
        await this.runWithConcurrency(
          imageFiles.map(file => async () => {
            if (this.settings.localSaveByDefault) {
              await this.saveToVault(view, file);
            } else {
              const data = await file.arrayBuffer();
              await this.uploadAndInsert(view.editor, data, file.name, file.type);
            }
          })
        );
      })();
    }, true);

    // Settings tab
    this.addSettingTab(new EzImageSettingsTab(this.app, this));
  }

  // ── Public helpers (called by settings tab) ────────────────────────────────

  /** Set local-save mode, persist to settings, and refresh the status bar. */
  setLocalMode(value: boolean): void {
    this.settings.localSaveByDefault = value;
    void this.saveSettings();
    this.refreshStatusBar();
  }

  // ── Upload Handlers ────────────────────────────────────────────────────────

  async handleClipboardUpload(editor: Editor) {
    const err = this.validateSettings();
    if (err) {
      new Notice(`EzImage: ${err} — open Settings to configure.`);
      return;
    }
    const image = await getClipboardImage();
    if (!image) {
      new Notice('EzImage: No image found in clipboard.');
      return;
    }
    await this.uploadAndInsert(editor, image.data, image.fileName, image.mimeType);
  }

  async handleFileUpload(editor: Editor) {
    const err = this.validateSettings();
    if (err) {
      new Notice(`EzImage: ${err} — open Settings to configure.`);
      return;
    }

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.style.display = 'none';
    document.body.appendChild(input);

    input.onchange = async () => {
      document.body.removeChild(input);
      if (!input.files) return;
      for (const file of Array.from(input.files)) {
        const data = await file.arrayBuffer();
        await this.uploadAndInsert(editor, data, file.name, file.type);
      }
    };
    input.click();
  }

  // ── Core Upload Logic ──────────────────────────────────────────────────────

  /**
   * Public upload method for batch upload modal.
   * Returns the uploaded image URL.
   */
  async uploadImage(
    data: ArrayBuffer,
    fileName: string,
    mimeType: string
  ): Promise<string> {
    // File size guard (before compression)
    const limitMB = this.settings.maxFileSizeMB;
    if (limitMB > 0 && data.byteLength > limitMB * 1024 * 1024) {
      const sizeMB = (data.byteLength / 1024 / 1024).toFixed(1);
      throw new Error(`File too large (${sizeMB} MB). Limit is ${limitMB} MB.`);
    }

    let uploadData = data;
    let uploadMime = mimeType;
    let uploadName = fileName;
    const processingExcluded = isImageProcessingExcluded(
      fileName,
      mimeType,
      this.settings.compressionExcludedExtensions
    );

    if (this.settings.compress && !processingExcluded) {
      // browser-image-compression converts to WebP, which naturally drops EXIF
      try {
        const file = new File([data], fileName, { type: mimeType });
        const compressed = await imageCompression(file, {
          maxWidthOrHeight: this.settings.maxWidth || undefined,
          initialQuality: this.settings.quality / 100,
          useWebWorker: true,
          fileType: 'image/webp',
        });
        uploadData = await compressed.arrayBuffer();
        uploadMime = 'image/webp';
        uploadName = replaceExtension(fileName, 'webp');
      } catch (e) {
        console.warn('EzImage: compression failed, uploading original', e);
      }
    } else if (!processingExcluded && this.settings.stripExif) {
      // Compression is off but user wants EXIF stripped — redraw via Canvas
      try {
        const stripped = await this.stripExifFromImage(data, mimeType);
        uploadData = stripped;
      } catch (e) {
        console.warn('EzImage: EXIF strip failed, uploading original', e);
      }
    }

    const targetKey = generateFilePath(uploadName, this.settings.pathTemplate);
    const result = await this.uploadWithRetry({ data: uploadData, fileName: targetKey, mimeType: uploadMime });
    return result.url;
  }

  async uploadAndInsert(
    editor: Editor,
    data: ArrayBuffer,
    fileName: string,
    mimeType: string
  ) {
    const notice = new Notice('EzImage: Uploading…', 0);

    try {
      const url = await this.uploadImage(data, fileName, mimeType);
      editor.replaceSelection(`![image](${url})`);
      notice.hide();
      new Notice('EzImage: Upload successful ✓');
    } catch (e: unknown) {
      notice.hide();
      new Notice(this.formatUploadError(e));
      console.error('EzImage upload error:', e);
    }
  }

  /**
   * Strip EXIF metadata by redrawing the image onto a Canvas and exporting it.
   * Works for JPEG, PNG, WebP. The output retains pixel data but drops all metadata.
   */
  private stripExifFromImage(data: ArrayBuffer, mimeType: string): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const blob = new Blob([data], { type: mimeType });
      const url  = URL.createObjectURL(blob);
      const img  = new Image();

      img.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const canvas = document.createElement('canvas');
          canvas.width  = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(data); return; } // fallback: return original
          ctx.drawImage(img, 0, 0);
          canvas.toBlob(
            outputBlob => {
              if (!outputBlob) { resolve(data); return; }
              outputBlob.arrayBuffer().then(resolve).catch(() => resolve(data));
            },
            mimeType,
            1.0  // quality = lossless for PNG; ignored for formats that don't support it
          );
        } catch (e) {
          reject(e);
        }
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for EXIF stripping'));
      };

      img.src = url;
    });
  }

  /**
   * Upload with up to 2 automatic retries for transient network errors.
   * Credential / auth errors (4xx) are not retried — they require user action.
   */
  private async uploadWithRetry(
    payload: Parameters<R2Uploader['upload']>[0],
    maxRetries = 2
  ): ReturnType<R2Uploader['upload']> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploader.upload(payload);
      } catch (e: unknown) {
        lastError = e;
        // Don't retry on credential / permission errors (HTTP 4xx)
        if (this.isAuthError(e)) throw e;
        if (attempt < maxRetries) {
          // Brief back-off: 1s, then 2s
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  /** Returns true if the error looks like a credential / permission failure. */
  private isAuthError(e: unknown): boolean {
    const msg = e instanceof Error ? e.message : String(e);
    return /40[13]|InvalidAccessKeyId|SignatureDoesNotMatch|AccessDenied/i.test(msg);
  }

  /** Produce a user-friendly error message, distinguishing auth vs network failures. */
  private formatUploadError(e: unknown): string {
    const msg = e instanceof Error ? e.message : String(e);
    if (this.isAuthError(e)) {
      return 'EzImage: Auth failed — check your R2 credentials in Settings.';
    }
    if (/timeout|network|fetch|ECONNRESET|ENOTFOUND/i.test(msg)) {
      return 'EzImage: Network error — upload failed after retries. Check your connection.';
    }
    return `EzImage: Upload failed — ${msg}`;
  }

  // ── Local Save Logic ───────────────────────────────────────────────────────

  /** Copy a dropped file into the vault's configured attachment folder and insert a wikilink. */
  private async saveToVault(view: MarkdownView, file: File): Promise<void> {
    try {
      const data     = await file.arrayBuffer();
      const ext      = file.name.split('.').pop() || 'png';
      const baseName = file.name.replace(/\.[^.]+$/, '') || `image-${Date.now()}`;

      // Resolve attachment folder from Obsidian's vault config
      const attachCfg = (this.app.vault as any).getConfig?.('attachmentFolderPath') as string ?? '';
      let folderPath: string;
      if (attachCfg === '.' || attachCfg === './') {
        folderPath = view.file?.parent?.path ?? '';
      } else {
        folderPath = attachCfg.replace(/^\//, '');
      }

      // Ensure parent folder exists
      if (folderPath && !this.app.vault.getAbstractFileByPath(folderPath)) {
        await this.app.vault.createFolder(folderPath);
      }

      // Build unique file path
      const makePath = (n: number) => {
        const name = n === 0 ? `${baseName}.${ext}` : `${baseName} ${n}.${ext}`;
        return folderPath ? `${folderPath}/${name}` : name;
      };
      let idx = 0;
      while (this.app.vault.getAbstractFileByPath(makePath(idx))) idx++;
      const destPath = makePath(idx);

      const tfile = await this.app.vault.createBinary(destPath, new Uint8Array(data));
      view.editor.replaceSelection(`![[${tfile.name}]]`);
      new Notice(`EzImage: Saved to vault — ${tfile.name}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`EzImage: Local save failed — ${msg}`);
      console.error('EzImage local save error:', e);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Run an array of async tasks with a maximum concurrency limit.
   * Prevents overwhelming the network or R2 rate limits when many images are pasted at once.
   */
  private async runWithConcurrency<T>(
    tasks: (() => Promise<T>)[],
    limit = 3
  ): Promise<void> {
    const queue = [...tasks];
    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (task) await task();
      }
    });
    await Promise.all(workers);
  }

  /** Refresh the status bar to reflect the current mode. */
  refreshStatusBar(): void {
    const el = this._statusBarItem;
    if (!el) return;
    el.empty();
    if (this.settings.localSaveByDefault) {
      setIcon(el, 'hard-drive');
      el.createSpan({ text: ' Local Save' });
      el.style.opacity = '1';
      el.title = t('statusBarLocalTitle');
    } else {
      setIcon(el, 'cloud-upload');
      el.createSpan({ text: ' EzImage' });
      el.style.opacity = '0.5';
      el.title = t('statusBarUploadTitle');
    }
  }

  private get uploader(): R2Uploader {
    if (!this._uploader) this._uploader = new R2Uploader(this.settings.r2);
    return this._uploader;
  }

  isConfigured(): boolean {
    return this.validateSettings() === null;
  }

  private validateSettings(): string | null {
    const r2 = this.settings.r2;
    if (!r2.accountId)       return 'Missing R2 Account ID';
    if (!r2.accessKeyId)     return 'Missing R2 Access Key ID';
    if (!r2.secretAccessKey) return 'Missing R2 Secret Access Key';
    if (!r2.bucketName)      return 'Missing R2 Bucket Name';
    if (!r2.publicUrl)       return 'Missing R2 Public URL';
    return null;
  }

  // ── Settings Persistence ───────────────────────────────────────────────────

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    this.settings.compressionExcludedExtensions = normalizeExtensionList(
      this.settings.compressionExcludedExtensions ?? DEFAULT_SETTINGS.compressionExcludedExtensions
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
    // Apply locale FIRST so refreshStatusBar picks up the new language
    setLocale(this.settings.language);
    this.refreshStatusBar();
    // Only reset the uploader when R2 credentials/config actually change
    this._uploader = null;
  }
}
