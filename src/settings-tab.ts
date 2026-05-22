import { App, PluginSettingTab, Setting } from 'obsidian';
import type EzImagePlugin from './main';

export class EzImageSettingsTab extends PluginSettingTab {
  plugin: EzImagePlugin;

  constructor(app: App, plugin: EzImagePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    // ── Header ──────────────────────────────────────────────────────────────
    containerEl.createEl('h2', { text: 'EzImage Settings' });
    containerEl.createEl('p', {
      text: 'Upload images to Cloudflare R2 and get a Markdown link automatically.',
      cls: 'setting-item-description',
    });

    // ── Cloudflare R2 ────────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Cloudflare R2' });

    new Setting(containerEl)
      .setName('Account ID')
      .setDesc('Your Cloudflare Account ID')
      .addText(text =>
        text
          .setPlaceholder('a1b2c3d4...')
          .setValue(this.plugin.settings.r2.accountId)
          .onChange(async value => {
            this.plugin.settings.r2.accountId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Access Key ID')
      .setDesc('R2 API Access Key ID')
      .addText(text =>
        text
          .setPlaceholder('Enter Access Key ID')
          .setValue(this.plugin.settings.r2.accessKeyId)
          .onChange(async value => {
            this.plugin.settings.r2.accessKeyId = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Secret Access Key')
      .setDesc('R2 API Secret Access Key')
      .addText(text => {
        text
          .setPlaceholder('Enter Secret Access Key')
          .setValue(this.plugin.settings.r2.secretAccessKey)
          .onChange(async value => {
            this.plugin.settings.r2.secretAccessKey = value.trim();
            await this.plugin.saveSettings();
          });
        text.inputEl.type = 'password';
        return text;
      });

    new Setting(containerEl)
      .setName('Bucket Name')
      .setDesc('R2 Bucket Name')
      .addText(text =>
        text
          .setPlaceholder('my-images')
          .setValue(this.plugin.settings.r2.bucketName)
          .onChange(async value => {
            this.plugin.settings.r2.bucketName = value.trim();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Public URL')
      .setDesc('Your bucket\'s public URL, e.g. https://pub-xxx.r2.dev or a custom domain')
      .addText(text =>
        text
          .setPlaceholder('https://images.example.com')
          .setValue(this.plugin.settings.r2.publicUrl)
          .onChange(async value => {
            this.plugin.settings.r2.publicUrl = value.trim().replace(/\/$/, '');
            await this.plugin.saveSettings();
          })
      );

    // ── Image Processing ─────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: 'Image Processing' });

    new Setting(containerEl)
      .setName('Path Template')
      .setDesc(
        'Template for the uploaded file path. ' +
          'Variables: {yyyy} {MM} {dd} {hh} {mm} {ss} {timestamp} {random} {name} {ext}'
      )
      .addText(text =>
        text
          .setPlaceholder('{yyyy}/{MM}/{timestamp}-{random}.{ext}')
          .setValue(this.plugin.settings.pathTemplate)
          .onChange(async value => {
            this.plugin.settings.pathTemplate = value.trim() || '{yyyy}/{MM}/{timestamp}-{random}.{ext}';
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Compress Images')
      .setDesc('Convert images to WebP and reduce file size before uploading')
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.compress).onChange(async value => {
          this.plugin.settings.compress = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Max Width (px)')
      .setDesc('Images wider than this will be resized. 0 = no limit.')
      .addText(text =>
        text
          .setPlaceholder('1920')
          .setValue(String(this.plugin.settings.maxWidth))
          .onChange(async value => {
            const num = parseInt(value, 10);
            if (!isNaN(num) && num >= 0) {
              this.plugin.settings.maxWidth = num;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName('Quality')
      .setDesc('WebP compression quality: 1 (smallest) → 100 (best)')
      .addSlider(slider =>
        slider
          .setLimits(1, 100, 1)
          .setValue(this.plugin.settings.quality)
          .setDynamicTooltip()
          .onChange(async value => {
            this.plugin.settings.quality = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
