import {
  App,
  Notice,
  PluginSettingTab,
  Setting,
  type SettingDefinition,
  type SettingDefinitionItem,
} from 'obsidian';
import type EzImagePlugin from './main';
import type { AppLanguage } from './types';
import { t, setLocale } from './i18n';
import { generateFilePath, normalizeExtensionList } from './utils';

type SettingKey =
  | 'accountId'
  | 'accessKeyId'
  | 'secretAccessKey'
  | 'bucketName'
  | 'publicUrl'
  | 'pathTemplate'
  | 'compress'
  | 'compressionExcludedExtensions'
  | 'stripExif'
  | 'maxWidth'
  | 'quality'
  | 'maxFileSizeMB'
  | 'localSaveByDefault'
  | 'language';

export class EzImageSettingsTab extends PluginSettingTab {
  plugin: EzImagePlugin;

  constructor(app: App, plugin: EzImagePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  getSettingDefinitions(): SettingDefinitionItem<SettingKey>[] {
    return [
      {
        type: 'group',
        heading: t('settingsTitle'),
        items: [{ name: t('settingsDesc') }],
      },
      {
        type: 'group',
        heading: t('sectionR2'),
        items: [
          this.textDefinition('accountId', t('accountId'), t('accountIdDesc'), 'a1b2c3d4...'),
          this.textDefinition('accessKeyId', t('accessKeyId'), t('accessKeyIdDesc'), 'Enter Access Key ID'),
          {
            name: t('secretAccessKey'),
            desc: t('secretAccessKeyDesc'),
            render: setting => {
              setting.addText(text => {
                text
                  .setPlaceholder('Enter Secret Access Key')
                  .setValue(this.plugin.settings.r2.secretAccessKey)
                  .onChange(async value => {
                    this.plugin.settings.r2.secretAccessKey = value.trim();
                    await this.plugin.saveSettings();
                  });
                text.inputEl.type = 'password';
              });
            },
          },
          this.textDefinition('bucketName', t('bucketName'), t('bucketNameDesc'), 'my-images'),
          this.textDefinition('publicUrl', t('publicUrl'), t('publicUrlDesc'), 'https://images.example.com'),
        ],
      },
      {
        type: 'group',
        heading: t('sectionProcessing'),
        items: [
          {
            name: t('pathTemplate'),
            desc: t('pathTemplateDesc'),
            render: setting => {
              const previewEl = setting.descEl.createDiv({
                cls: 'ezimage-template-preview',
                text: t('pathTemplatePreviewLabel') +
                  generateFilePath('example.png', this.plugin.settings.pathTemplate),
              });
              setting.addText(text =>
                text
                  .setPlaceholder('{yyyy}/{MM}/{timestamp}-{random}.{ext}')
                  .setValue(this.plugin.settings.pathTemplate)
                  .onChange(async value => {
                    const template = value.trim() || '{yyyy}/{MM}/{timestamp}-{random}.{ext}';
                    this.plugin.settings.pathTemplate = template;
                    previewEl.textContent = t('pathTemplatePreviewLabel') +
                      generateFilePath('example.png', template);
                    await this.plugin.saveSettings();
                  })
              );
            },
          },
          {
            name: t('compress'),
            desc: t('compressDesc'),
            control: { type: 'toggle', key: 'compress' },
          },
          {
            name: t('compressionExcludedExtensions'),
            desc: t('compressionExcludedExtensionsDesc'),
            control: {
              type: 'text',
              key: 'compressionExcludedExtensions',
              placeholder: 'gif webp svg',
            },
          },
          {
            name: t('stripExif'),
            desc: t('stripExifDesc'),
            control: { type: 'toggle', key: 'stripExif' },
          },
          {
            name: t('maxWidth'),
            desc: t('maxWidthDesc'),
            control: {
              type: 'number',
              key: 'maxWidth',
              min: 0,
              step: 1,
              placeholder: '1920',
              validate: value => value >= 0 ? undefined : t('errMaxWidth'),
            },
          },
          {
            name: t('quality'),
            desc: t('qualityDesc'),
            control: {
              type: 'slider',
              key: 'quality',
              min: 1,
              max: 100,
              step: 1,
            },
          },
          {
            name: t('maxFileSizeMB'),
            desc: t('maxFileSizeMBDesc'),
            control: {
              type: 'number',
              key: 'maxFileSizeMB',
              min: 0,
              step: 1,
              placeholder: '20',
              validate: value => value >= 0 ? undefined : t('errMaxFileSizeMB'),
            },
          },
        ],
      },
      {
        type: 'group',
        heading: t('sectionGeneral'),
        items: [
          {
            name: t('localSaveDefault'),
            desc: t('localSaveDefaultDesc'),
            control: { type: 'toggle', key: 'localSaveByDefault' },
          },
          {
            name: t('language'),
            desc: t('languageDesc'),
            control: {
              type: 'dropdown',
              key: 'language',
              options: {
                auto: t('langAuto'),
                en: t('langEn'),
                zh: t('langZh'),
              },
            },
          },
        ],
      },
    ];
  }

  getControlValue(key: string): unknown {
    switch (key as SettingKey) {
      case 'accountId': return this.plugin.settings.r2.accountId;
      case 'accessKeyId': return this.plugin.settings.r2.accessKeyId;
      case 'secretAccessKey': return this.plugin.settings.r2.secretAccessKey;
      case 'bucketName': return this.plugin.settings.r2.bucketName;
      case 'publicUrl': return this.plugin.settings.r2.publicUrl;
      case 'pathTemplate': return this.plugin.settings.pathTemplate;
      case 'compress': return this.plugin.settings.compress;
      case 'compressionExcludedExtensions':
        return this.plugin.settings.compressionExcludedExtensions.join(' ');
      case 'stripExif': return this.plugin.settings.stripExif;
      case 'maxWidth': return this.plugin.settings.maxWidth;
      case 'quality': return this.plugin.settings.quality;
      case 'maxFileSizeMB': return this.plugin.settings.maxFileSizeMB;
      case 'localSaveByDefault': return this.plugin.settings.localSaveByDefault;
      case 'language': return this.plugin.settings.language;
      default: return undefined;
    }
  }

  async setControlValue(key: string, value: unknown): Promise<void> {
    switch (key as SettingKey) {
      case 'accountId':
      case 'accessKeyId':
      case 'bucketName':
        if (typeof value === 'string') this.plugin.settings.r2[key] = value.trim();
        break;
      case 'publicUrl':
        if (typeof value === 'string') {
          this.plugin.settings.r2.publicUrl = value.trim().replace(/\/$/, '');
        }
        break;
      case 'compress':
      case 'stripExif':
      case 'localSaveByDefault':
        if (typeof value === 'boolean') this.plugin.settings[key] = value;
        break;
      case 'compressionExcludedExtensions':
        if (typeof value === 'string') {
          this.plugin.settings.compressionExcludedExtensions = normalizeExtensionList(value);
        }
        break;
      case 'maxWidth':
      case 'quality':
      case 'maxFileSizeMB':
        if (typeof value === 'number') this.plugin.settings[key] = value;
        break;
      case 'language':
        if (value === 'auto' || value === 'en' || value === 'zh') {
          const changed = this.plugin.settings.language !== value;
          this.plugin.settings.language = value as AppLanguage;
          setLocale(this.plugin.settings.language);
          if (changed) new Notice(t('noticeLanguageChanged'));
        }
        break;
    }

    await this.plugin.saveSettings();
    if (key === 'language') this.update();
  }

  private textDefinition(
    key: SettingKey,
    name: string,
    desc: string,
    placeholder: string
  ): SettingDefinition<SettingKey> {
    return {
      name,
      desc,
      control: { type: 'text', key, placeholder },
    };
  }
}
