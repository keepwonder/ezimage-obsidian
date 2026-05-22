import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';
import imageCompression from 'browser-image-compression';

import { DEFAULT_SETTINGS, EzImageSettings } from './types';
import { R2Uploader } from './uploaders/r2';
import { EzImageSettingsTab } from './settings-tab';
import { generateFilePath, replaceExtension } from './utils';
import { getClipboardImage } from './handlers/clipboard';

export default class EzImagePlugin extends Plugin {
  settings: EzImageSettings;

  // Lazily created; reset when settings change
  private _uploader: R2Uploader | null = null;

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  async onload() {
    await this.loadSettings();

    // Command: Upload clipboard image
    this.addCommand({
      id: 'upload-clipboard',
      name: 'Upload Clipboard Image',
      editorCallback: async (editor: Editor) => {
        await this.handleClipboardUpload(editor);
      },
    });

    // Command: Upload from file picker
    this.addCommand({
      id: 'upload-file',
      name: 'Upload Image from File',
      editorCallback: async (editor: Editor) => {
        await this.handleFileUpload(editor);
      },
    });

    // Context menu items in the editor
    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, _view) => {
        menu.addItem(item =>
          item
            .setTitle('EzImage: Upload Clipboard Image')
            .setIcon('image')
            .onClick(() => this.handleClipboardUpload(editor))
        );
        menu.addItem(item =>
          item
            .setTitle('EzImage: Upload Image from File')
            .setIcon('folder-open')
            .onClick(() => this.handleFileUpload(editor))
        );
      })
    );

    // Intercept paste events containing images
    this.registerEvent(
      this.app.workspace.on('editor-paste', async (evt: ClipboardEvent, editor: Editor, _view: MarkdownView) => {
        // Only intercept when the plugin is configured
        if (!this.isConfigured()) return;

        const items = evt.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            evt.preventDefault(); // Block Obsidian's default local-save behaviour
            const file = item.getAsFile();
            if (file) {
              const data = await file.arrayBuffer();
              await this.uploadAndInsert(editor, data, file.name, file.type);
            }
            return;
          }
        }
      })
    );

    // Intercept drop events containing image files
    this.registerEvent(
      this.app.workspace.on('editor-drop', async (evt: DragEvent, editor: Editor, _view: MarkdownView) => {
        if (!this.isConfigured()) return;

        const files = evt.dataTransfer?.files;
        if (!files || files.length === 0) return;

        let handled = false;
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file.type.startsWith('image/')) {
            handled = true;
            const data = await file.arrayBuffer();
            await this.uploadAndInsert(editor, data, file.name, file.type);
          }
        }

        if (handled) evt.preventDefault();
      })
    );

    // Settings tab
    this.addSettingTab(new EzImageSettingsTab(this.app, this));
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

    // Hidden file input — works in both Electron and browser
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

  async uploadAndInsert(
    editor: Editor,
    data: ArrayBuffer,
    fileName: string,
    mimeType: string
  ) {
    const notice = new Notice('EzImage: Uploading…', 0);

    try {
      let uploadData = data;
      let uploadMime = mimeType;
      let uploadName = fileName;

      // Optional compression → WebP
      if (this.settings.compress) {
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
      }

      // Generate target path from template
      const targetKey = generateFilePath(uploadName, this.settings.pathTemplate);

      // Upload
      const result = await this.uploader.upload({
        data: uploadData,
        fileName: targetKey,
        mimeType: uploadMime,
      });

      // Insert Markdown at cursor
      editor.replaceSelection(`![image](${result.url})`);

      notice.hide();
      new Notice('EzImage: Upload successful ✓');
    } catch (e: unknown) {
      notice.hide();
      const msg = e instanceof Error ? e.message : String(e);
      new Notice(`EzImage: Upload failed — ${msg}`);
      console.error('EzImage upload error:', e);
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private get uploader(): R2Uploader {
    if (!this._uploader) {
      this._uploader = new R2Uploader(this.settings.r2);
    }
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
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this._uploader = null; // Invalidate uploader so next call picks up new config
  }
}
