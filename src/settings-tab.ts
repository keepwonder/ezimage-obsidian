import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import type EzImagePlugin from './main';
import type { AppLanguage } from './types';
import { t, setLocale } from './i18n';
import { generateFilePath } from './utils';

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
    containerEl.createEl('h2', { text: t('settingsTitle') });
    containerEl.createEl('p', {
      text: t('settingsDesc'),
      cls: 'setting-item-description',
    });

    // ── Cloudflare R2 ────────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: t('sectionR2') });

    new Setting(containerEl)
      .setName(t('accountId'))
      .setDesc(t('accountIdDesc'))
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
      .setName(t('accessKeyId'))
      .setDesc(t('accessKeyIdDesc'))
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
      .setName(t('secretAccessKey'))
      .setDesc(t('secretAccessKeyDesc'))
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
      .setName(t('bucketName'))
      .setDesc(t('bucketNameDesc'))
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
      .setName(t('publicUrl'))
      .setDesc(t('publicUrlDesc'))
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
    containerEl.createEl('h3', { text: t('sectionProcessing') });

    // Path template with live preview
    const templatePreviewEl = containerEl.createEl('p', {
      cls: 'setting-item-description',
      text: t('pathTemplatePreviewLabel') + generateFilePath('example.png', this.plugin.settings.pathTemplate),
    });
    templatePreviewEl.style.marginTop = '-8px';
    templatePreviewEl.style.marginBottom = '8px';
    templatePreviewEl.style.fontFamily = 'monospace';
    templatePreviewEl.style.fontSize = '0.85em';
    templatePreviewEl.style.opacity = '0.7';

    new Setting(containerEl)
      .setName(t('pathTemplate'))
      .setDesc(t('pathTemplateDesc'))
      .addText(text =>
        text
          .setPlaceholder('{yyyy}/{MM}/{timestamp}-{random}.{ext}')
          .setValue(this.plugin.settings.pathTemplate)
          .onChange(async value => {
            const tpl = value.trim() || '{yyyy}/{MM}/{timestamp}-{random}.{ext}';
            this.plugin.settings.pathTemplate = tpl;
            // Live preview update
            templatePreviewEl.textContent = t('pathTemplatePreviewLabel') + generateFilePath('example.png', tpl);
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t('compress'))
      .setDesc(t('compressDesc'))
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.compress).onChange(async value => {
          this.plugin.settings.compress = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t('stripExif'))
      .setDesc(t('stripExifDesc'))
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.stripExif).onChange(async value => {
          this.plugin.settings.stripExif = value;
          await this.plugin.saveSettings();
        })
      );

    // Max width with validation
    const maxWidthErrEl = containerEl.createEl('p', { cls: 'setting-item-description' });
    maxWidthErrEl.style.color = 'var(--color-red)';
    maxWidthErrEl.style.marginTop = '-8px';
    maxWidthErrEl.style.marginBottom = '8px';
    maxWidthErrEl.style.display = 'none';

    new Setting(containerEl)
      .setName(t('maxWidth'))
      .setDesc(t('maxWidthDesc'))
      .addText(text => {
        text
          .setPlaceholder('1920')
          .setValue(String(this.plugin.settings.maxWidth))
          .onChange(async value => {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 0) {
              maxWidthErrEl.textContent = t('errMaxWidth');
              maxWidthErrEl.style.display = 'block';
            } else {
              maxWidthErrEl.style.display = 'none';
              this.plugin.settings.maxWidth = num;
              await this.plugin.saveSettings();
            }
          });
        text.inputEl.style.width = '80px';
        return text;
      });

    new Setting(containerEl)
      .setName(t('quality'))
      .setDesc(t('qualityDesc'))
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

    // Max file size with validation
    const maxSizeErrEl = containerEl.createEl('p', { cls: 'setting-item-description' });
    maxSizeErrEl.style.color = 'var(--color-red)';
    maxSizeErrEl.style.marginTop = '-8px';
    maxSizeErrEl.style.marginBottom = '8px';
    maxSizeErrEl.style.display = 'none';

    new Setting(containerEl)
      .setName(t('maxFileSizeMB'))
      .setDesc(t('maxFileSizeMBDesc'))
      .addText(text => {
        text
          .setPlaceholder('20')
          .setValue(String(this.plugin.settings.maxFileSizeMB))
          .onChange(async value => {
            const num = parseInt(value, 10);
            if (isNaN(num) || num < 0) {
              maxSizeErrEl.textContent = t('errMaxFileSizeMB');
              maxSizeErrEl.style.display = 'block';
            } else {
              maxSizeErrEl.style.display = 'none';
              this.plugin.settings.maxFileSizeMB = num;
              await this.plugin.saveSettings();
            }
          });
        text.inputEl.style.width = '80px';
        return text;
      });

    // ── General ───────────────────────────────────────────────────────────────
    containerEl.createEl('h3', { text: t('sectionGeneral') });

    new Setting(containerEl)
      .setName(t('localSaveDefault'))
      .setDesc(t('localSaveDefaultDesc'))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.localSaveByDefault)
          .onChange(async value => {
            this.plugin.settings.localSaveByDefault = value;
            await this.plugin.saveSettings();
            this.plugin.refreshStatusBar();
          })
      );

    new Setting(containerEl)
      .setName(t('language'))
      .setDesc(t('languageDesc'))
      .addDropdown(drop =>
        drop
          .addOption('auto', t('langAuto'))
          .addOption('en',   t('langEn'))
          .addOption('zh',   t('langZh'))
          .setValue(this.plugin.settings.language)
          .onChange(async value => {
            const oldLang = this.plugin.settings.language;
            this.plugin.settings.language = value as AppLanguage;
            await this.plugin.saveSettings();
            setLocale(this.plugin.settings.language);
            this.display();
            // Notify user to reload plugin for command palette to update
            if (oldLang !== value) {
              new Notice(t('noticeLanguageChanged'));
            }
          })
      );
  }
}
