import { App, Modal, Notice, TFile, TFolder } from 'obsidian';
import EzImagePlugin from '../main';
import { fmt, t } from '../i18n';
import { getMimeType } from '../utils';

interface LocalImage {
  /** The markdown file containing the wikilink */
  mdFile: TFile;
  /** The wikilink text, e.g., "![[image.png]]" */
  wikilink: string;
  /** Start offset of this wikilink in the source markdown file */
  start: number;
  /** End offset of this wikilink in the source markdown file */
  end: number;
  /** The referenced image file (if it exists in vault) */
  imageFile: TFile | null;
  /** File size in bytes (0 if file not found) */
  size: number;
}

export class BatchUploadModal extends Modal {
  private plugin: EzImagePlugin;
  private images: LocalImage[] = [];
  private deleteAfterUpload = false;
  private scopePath: string | null;

  constructor(app: App, plugin: EzImagePlugin, scopePath: string | null = null) {
    super(app);
    this.plugin = plugin;
    this.scopePath = scopePath;
  }

  async onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('ezimage-batch-modal');

    // Title with scope info
    const scopeText = this.scopePath
      ? fmt('batchTitleScope', { scope: this.scopePath })
      : t('batchTitleVault');
    contentEl.createEl('h2', { text: scopeText });

    // Scanning notice
    const scanNotice = contentEl.createDiv({ cls: 'ezimage-scan-notice' });
    scanNotice.createSpan({ text: t('batchScanning') });

    // Scan vault or specific scope
    await this.scanVault();

    scanNotice.remove();

    if (this.images.length === 0) {
      contentEl.createDiv({ text: t('batchEmpty'), cls: 'ezimage-empty' });
      const btnContainer = contentEl.createDiv({ cls: 'ezimage-btn-container' });
      btnContainer.createEl('button', { text: t('batchClose') }).onclick = () => this.close();
      return;
    }

    // Statistics
    const stats = contentEl.createDiv({ cls: 'ezimage-stats' });
    const totalSize = this.images.reduce((sum, img) => sum + img.size, 0);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    stats.createEl('p', { text: fmt('batchStats', { count: this.images.length, size: sizeMB }) });

    // Image list (scrollable)
    const listContainer = contentEl.createDiv({ cls: 'ezimage-list-container' });
    const list = listContainer.createEl('ul', { cls: 'ezimage-list' });

    for (const img of this.images) {
      const li = list.createEl('li');
      const status = img.imageFile ? 'OK' : '!';
      const sizeText = img.imageFile ? `(${(img.size / 1024).toFixed(1)} KB)` : `(${t('batchMissingFile')})`;
      li.createSpan({ text: `${status} `, cls: img.imageFile ? 'ezimage-ok' : 'ezimage-missing' });
      li.createSpan({ text: img.wikilink });
      li.createSpan({ text: ` ${sizeText}`, cls: 'ezimage-size' });
      li.createEl('br');
      li.createSpan({ text: fmt('batchLocatedAt', { path: img.mdFile.path }), cls: 'ezimage-path' });
    }

    // Options
    const optionsDiv = contentEl.createDiv({ cls: 'ezimage-options' });
    const deleteCheckbox = optionsDiv.createEl('label');
    const checkbox = deleteCheckbox.createEl('input', { type: 'checkbox' });
    checkbox.checked = false;
    checkbox.onchange = () => { this.deleteAfterUpload = checkbox.checked; };
    deleteCheckbox.createSpan({ text: t('batchDeleteAfterUpload') });

    // Buttons
    const btnContainer = contentEl.createDiv({ cls: 'ezimage-btn-container' });
    const uploadBtn = btnContainer.createEl('button', { text: t('batchStartUpload'), cls: 'mod-cta' });
    const cancelBtn = btnContainer.createEl('button', { text: t('batchCancel') });

    uploadBtn.onclick = () => this.startUpload();
    cancelBtn.onclick = () => this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /** Scan all markdown files in vault for ![[image.*]] wikilinks */
  private async scanVault(): Promise<void> {
    const wikilinkRegex = /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|bmp|svg))\]\]/gi;

    // Get markdown files based on scope
    let mdFiles: TFile[];
    if (this.scopePath) {
      const scopeFile = this.app.vault.getAbstractFileByPath(this.scopePath);

      if (scopeFile instanceof TFile) {
        // Single file
        mdFiles = [scopeFile];
      } else if (scopeFile instanceof TFolder) {
        // Folder - get all markdown files recursively
        mdFiles = [];
        const collectFiles = (folder: TFolder) => {
          for (const child of folder.children) {
            if (child instanceof TFile && child.extension === 'md') {
              mdFiles.push(child);
            } else if (child instanceof TFolder) {
              collectFiles(child);
            }
          }
        };
        collectFiles(scopeFile);
      } else {
        // Invalid path
        return;
      }
    } else {
      // Entire vault
      mdFiles = this.app.vault.getMarkdownFiles();
    }

    for (const mdFile of mdFiles) {
      const content = await this.app.vault.read(mdFile);
      const matches = content.matchAll(wikilinkRegex);

      for (const match of matches) {
        if (match.index === undefined) continue;

        const wikilink = match[0]; // e.g., "![[image.png]]"
        const imagePath = match[1]; // e.g., "image.png" or "folder/image.png"

        // Resolve the image file (Obsidian's link resolution logic)
        const imageFile = this.app.metadataCache.getFirstLinkpathDest(imagePath, mdFile.path);

        this.images.push({
          mdFile,
          wikilink,
          start: match.index,
          end: match.index + wikilink.length,
          imageFile,
          size: imageFile?.stat.size ?? 0,
        });
      }
    }
  }

  /** Start batch upload with progress tracking */
  private async startUpload(): Promise<void> {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { text: t('batchProgressTitle') });
    const validImages = this.images.filter(img => img.imageFile !== null);
    const uploadTotal = validImages.length;

    const progressDiv = contentEl.createDiv({ cls: 'ezimage-progress' });
    const progressBar = progressDiv.createEl('progress', { attr: { max: uploadTotal, value: 0 } });
    const progressText = progressDiv.createDiv({ cls: 'ezimage-progress-text', text: this.formatProgress(0, uploadTotal, 0, 0) });

    const logDiv = contentEl.createDiv({ cls: 'ezimage-log' });

    let completed = 0;
    let succeeded = 0;
    let failed = 0;

    const updateProgress = () => {
      progressBar.value = completed;
      progressText.textContent = this.formatProgress(completed, uploadTotal, succeeded, failed);
    };

    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      const line = logDiv.createDiv({ cls: `ezimage-log-${type}` });
      line.textContent = msg;
      logDiv.scrollTop = logDiv.scrollHeight;
    };

    if (validImages.length === 0) {
      log(t('batchNoValidImages'), 'error');
      return;
    }

    const uploadCache = new Map<string, Promise<string>>();
    const getUploadedUrl = (imageFile: TFile): Promise<string> => {
      const cached = uploadCache.get(imageFile.path);
      if (cached) return cached;

      const upload = (async () => {
        log(fmt('batchUploading', { name: imageFile.name }));
        const data = await this.app.vault.readBinary(imageFile);
        return this.plugin.uploadImage(data, imageFile.name, getMimeType(imageFile.extension));
      })();

      uploadCache.set(imageFile.path, upload);
      return upload;
    };

    const groups = this.groupByMarkdownFile(validImages);
    const successfulImagePaths = new Set<string>();
    const failedImagePaths = new Set<string>();

    // Process each markdown file as one write to avoid concurrent modification races.
    const tasks = groups.map(group => async () => {
      const replacements: { start: number; end: number; expected: string; text: string }[] = [];
      const touchedImagePaths = new Set<string>();
      try {
        for (const img of group.images) {
          const imageFile = img.imageFile!;
          touchedImagePaths.add(imageFile.path);
          const url = await getUploadedUrl(imageFile);
          replacements.push({
            start: img.start,
            end: img.end,
            expected: img.wikilink,
            text: `![image](${url})`,
          });
        }

        const mdContent = await this.app.vault.read(group.mdFile);
        await this.app.vault.modify(group.mdFile, this.applyReplacements(mdContent, replacements));

        for (const img of group.images) {
          const imageFile = img.imageFile!;
          successfulImagePaths.add(imageFile.path);
          log(fmt('batchSuccess', { name: imageFile.name }), 'success');
        }
        succeeded += group.images.length;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        for (const img of group.images) {
          const name = img.imageFile?.name ?? img.wikilink;
          if (img.imageFile) failedImagePaths.add(img.imageFile.path);
          log(fmt('batchFailure', { name, message: msg }), 'error');
        }
        for (const imagePath of touchedImagePaths) failedImagePaths.add(imagePath);
        failed += group.images.length;
      } finally {
        completed += group.images.length;
        updateProgress();
      }
    });

    await this.runWithConcurrency(tasks, 3);

    if (this.deleteAfterUpload) {
      await this.deleteUploadedFiles(successfulImagePaths, failedImagePaths, log);
    }

    log(fmt('batchDone', { succeeded, failed }), succeeded > 0 ? 'success' : 'error');

    // Done button
    const btnContainer = contentEl.createDiv({ cls: 'ezimage-btn-container' });
    btnContainer.createEl('button', { text: t('batchClose'), cls: 'mod-cta' }).onclick = () => {
      this.close();
      new Notice(fmt('batchNoticeDone', { succeeded, failed }));
    };
  }

  private formatProgress(completed: number, total: number, succeeded: number, failed: number): string {
    return fmt('batchProgressText', { completed, total, succeeded, failed });
  }

  private groupByMarkdownFile(images: LocalImage[]): { mdFile: TFile; images: LocalImage[] }[] {
    const groups = new Map<string, { mdFile: TFile; images: LocalImage[] }>();
    for (const image of images) {
      let group = groups.get(image.mdFile.path);
      if (!group) {
        group = { mdFile: image.mdFile, images: [] };
        groups.set(image.mdFile.path, group);
      }
      group.images.push(image);
    }
    return Array.from(groups.values());
  }

  private applyReplacements(
    content: string,
    replacements: { start: number; end: number; expected: string; text: string }[]
  ): string {
    for (const replacement of replacements) {
      if (content.slice(replacement.start, replacement.end) !== replacement.expected) {
        throw new Error(t('batchMarkdownChanged'));
      }
    }

    return [...replacements]
      .sort((a, b) => b.start - a.start)
      .reduce((next, replacement) =>
        next.slice(0, replacement.start) + replacement.text + next.slice(replacement.end),
      content);
  }

  private async deleteUploadedFiles(
    successfulImagePaths: Set<string>,
    failedImagePaths: Set<string>,
    log: (msg: string, type?: 'info' | 'success' | 'error') => void
  ): Promise<void> {
    for (const imagePath of successfulImagePaths) {
      if (failedImagePaths.has(imagePath)) continue;
      const file = this.app.vault.getAbstractFileByPath(imagePath);
      if (file instanceof TFile) {
        try {
          await this.app.vault.delete(file);
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : String(e);
          log(fmt('batchFailure', { name: file.name, message: msg }), 'error');
        }
      }
    }
  }

  /** Run tasks with concurrency limit (same pattern as main.ts) */
  private async runWithConcurrency<T>(tasks: (() => Promise<T>)[], limit = 3): Promise<void> {
    const queue = [...tasks];
    const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
      while (queue.length > 0) {
        const task = queue.shift();
        if (task) await task();
      }
    });
    await Promise.all(workers);
  }

}
