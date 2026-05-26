import { App, Modal, Notice, TFile, TFolder } from 'obsidian';
import EzImagePlugin from '../main';

interface LocalImage {
  /** The markdown file containing the wikilink */
  mdFile: TFile;
  /** The wikilink text, e.g., "![[image.png]]" */
  wikilink: string;
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
      ? `批量上传本地图片 (${this.scopePath})`
      : '批量上传本地图片 (整个 Vault)';
    contentEl.createEl('h2', { text: scopeText });

    // Scanning notice
    const scanNotice = contentEl.createDiv({ cls: 'ezimage-scan-notice' });
    scanNotice.createSpan({ text: '🔍 正在扫描...' });

    // Scan vault or specific scope
    await this.scanVault();

    scanNotice.remove();

    if (this.images.length === 0) {
      contentEl.createDiv({ text: '✓ 未发现本地图片引用', cls: 'ezimage-empty' });
      const btnContainer = contentEl.createDiv({ cls: 'ezimage-btn-container' });
      btnContainer.createEl('button', { text: '关闭' }).onclick = () => this.close();
      return;
    }

    // Statistics
    const stats = contentEl.createDiv({ cls: 'ezimage-stats' });
    const totalSize = this.images.reduce((sum, img) => sum + img.size, 0);
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    stats.createEl('p', { text: `📊 发现 ${this.images.length} 张本地图片,总大小 ${sizeMB} MB` });

    // Image list (scrollable)
    const listContainer = contentEl.createDiv({ cls: 'ezimage-list-container' });
    const list = listContainer.createEl('ul', { cls: 'ezimage-list' });

    for (const img of this.images) {
      const li = list.createEl('li');
      const status = img.imageFile ? '✓' : '✗';
      const sizeText = img.imageFile ? `(${(img.size / 1024).toFixed(1)} KB)` : '(文件不存在)';
      li.createSpan({ text: `${status} `, cls: img.imageFile ? 'ezimage-ok' : 'ezimage-missing' });
      li.createSpan({ text: img.wikilink });
      li.createSpan({ text: ` ${sizeText}`, cls: 'ezimage-size' });
      li.createEl('br');
      li.createSpan({ text: `   位于: ${img.mdFile.path}`, cls: 'ezimage-path' });
    }

    // Options
    const optionsDiv = contentEl.createDiv({ cls: 'ezimage-options' });
    const deleteCheckbox = optionsDiv.createEl('label');
    const checkbox = deleteCheckbox.createEl('input', { type: 'checkbox' });
    checkbox.checked = false;
    checkbox.onchange = () => { this.deleteAfterUpload = checkbox.checked; };
    deleteCheckbox.createSpan({ text: ' 上传成功后删除本地文件' });

    // Buttons
    const btnContainer = contentEl.createDiv({ cls: 'ezimage-btn-container' });
    const uploadBtn = btnContainer.createEl('button', { text: '开始上传', cls: 'mod-cta' });
    const cancelBtn = btnContainer.createEl('button', { text: '取消' });

    uploadBtn.onclick = () => this.startUpload();
    cancelBtn.onclick = () => this.close();
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }

  /** Scan all markdown files in vault for ![[image.*]] wikilinks */
  private async scanVault(): Promise<void> {
    console.log('BatchUploadModal: scanVault called with scopePath:', this.scopePath);

    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'];
    const wikilinkRegex = /!\[\[([^\]]+\.(png|jpg|jpeg|gif|webp|bmp|svg))\]\]/gi;

    // Get markdown files based on scope
    let mdFiles: TFile[];
    if (this.scopePath) {
      const scopeFile = this.app.vault.getAbstractFileByPath(this.scopePath);
      console.log('BatchUploadModal: scopeFile type:', scopeFile?.constructor.name);

      if (scopeFile instanceof TFile) {
        // Single file
        console.log('BatchUploadModal: Single file mode:', scopeFile.path);
        mdFiles = [scopeFile];
      } else if (scopeFile instanceof TFolder) {
        // Folder - get all markdown files recursively
        console.log('BatchUploadModal: Folder mode:', scopeFile.path);
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
        console.log('BatchUploadModal: Found', mdFiles.length, 'markdown files in folder');
      } else {
        // Invalid path
        console.warn('BatchUploadModal: Invalid scope path:', this.scopePath);
        return;
      }
    } else {
      // Entire vault
      console.log('BatchUploadModal: Entire vault mode');
      mdFiles = this.app.vault.getMarkdownFiles();
    }

    console.log('BatchUploadModal: Scanning', mdFiles.length, 'markdown files');

    for (const mdFile of mdFiles) {
      const content = await this.app.vault.read(mdFile);
      const matches = content.matchAll(wikilinkRegex);

      for (const match of matches) {
        const wikilink = match[0]; // e.g., "![[image.png]]"
        const imagePath = match[1]; // e.g., "image.png" or "folder/image.png"

        // Resolve the image file (Obsidian's link resolution logic)
        const imageFile = this.app.metadataCache.getFirstLinkpathDest(imagePath, mdFile.path);

        this.images.push({
          mdFile,
          wikilink,
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

    contentEl.createEl('h2', { text: '上传进度' });

    const progressDiv = contentEl.createDiv({ cls: 'ezimage-progress' });
    const progressBar = progressDiv.createEl('progress', { attr: { max: this.images.length, value: 0 } });
    const progressText = progressDiv.createDiv({ cls: 'ezimage-progress-text', text: '0 / ' + this.images.length });

    const logDiv = contentEl.createDiv({ cls: 'ezimage-log' });

    let completed = 0;
    let succeeded = 0;
    let failed = 0;

    const updateProgress = () => {
      progressBar.value = completed;
      progressText.textContent = `${completed} / ${this.images.length} (成功: ${succeeded}, 失败: ${failed})`;
    };

    const log = (msg: string, type: 'info' | 'success' | 'error' = 'info') => {
      const line = logDiv.createDiv({ cls: `ezimage-log-${type}` });
      line.textContent = msg;
      logDiv.scrollTop = logDiv.scrollHeight;
    };

    // Filter out images with missing files
    const validImages = this.images.filter(img => img.imageFile !== null);
    if (validImages.length === 0) {
      log('所有图片文件均不存在,无法上传', 'error');
      return;
    }

    // Batch upload with concurrency limit
    const tasks = validImages.map(img => async () => {
      try {
        const imageFile = img.imageFile!;
        log(`⏳ 上传中: ${imageFile.name}`);

        // Read file data
        const data = await this.app.vault.readBinary(imageFile);

        // Upload (reuse plugin's upload logic)
        const url = await this.plugin.uploadImage(data, imageFile.name, this.getMimeType(imageFile.extension));

        // Replace wikilink with markdown URL in the source file
        const mdContent = await this.app.vault.read(img.mdFile);
        const newContent = mdContent.replace(img.wikilink, `![image](${url})`);
        await this.app.vault.modify(img.mdFile, newContent);

        // Optionally delete local file
        if (this.deleteAfterUpload) {
          await this.app.vault.delete(imageFile);
        }

        log(`✓ 成功: ${imageFile.name}`, 'success');
        succeeded++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        log(`✗ 失败: ${img.imageFile?.name} — ${msg}`, 'error');
        failed++;
      } finally {
        completed++;
        updateProgress();
      }
    });

    await this.runWithConcurrency(tasks, 3);

    log(`\n🎉 完成! 成功: ${succeeded}, 失败: ${failed}`, succeeded > 0 ? 'success' : 'error');

    // Done button
    const btnContainer = contentEl.createDiv({ cls: 'ezimage-btn-container' });
    btnContainer.createEl('button', { text: '关闭', cls: 'mod-cta' }).onclick = () => {
      this.close();
      new Notice(`EzImage: 批量上传完成 (${succeeded} 成功, ${failed} 失败)`);
    };
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

  /** Get MIME type from file extension */
  private getMimeType(ext: string): string {
    const map: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
      svg: 'image/svg+xml',
    };
    return map[ext.toLowerCase()] || 'image/png';
  }
}
