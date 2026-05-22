import { App, PluginSettingTab, Setting } from 'obsidian';
import type EzImagePlugin from './main';
import type { AppLanguage } from './types';
import { t, setLocale } from './i18n';

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

    new Setting(containerEl)
      .setName(t('pathTemplate'))
      .setDesc(t('pathTemplateDesc'))
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
      .setName(t('compress'))
      .setDesc(t('compressDesc'))
      .addToggle(toggle =>
        toggle.setValue(this.plugin.settings.compress).onChange(async value => {
          this.plugin.settings.compress = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName(t('maxWidth'))
      .setDesc(t('maxWidthDesc'))
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
            this.plugin.settings.language = value as AppLanguage;
            await this.plugin.saveSettings();
            // Update locale and re-render the settings page immediately
            setLocale(this.plugin.settings.language);
            this.display();
          })
      );
  }
}
