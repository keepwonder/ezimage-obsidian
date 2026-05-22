import type { AppLanguage } from './types';

// Module-level override — set by the plugin on load and on settings change.
// 'auto' means detect from Obsidian's stored language preference.
let _langOverride: AppLanguage = 'auto';

export function setLocale(lang: AppLanguage): void {
  _langOverride = lang;
}

function getLocale(): 'zh' | 'en' {
  if (_langOverride === 'zh') return 'zh';
  if (_langOverride === 'en') return 'en';
  // auto: read Obsidian's stored language
  const lang = window.localStorage.getItem('language') ?? 'en';
  return lang.startsWith('zh') ? 'zh' : 'en';
}

interface Translations {
  // Header
  settingsTitle: string;
  settingsDesc: string;

  // R2 section
  sectionR2: string;
  accountId: string;
  accountIdDesc: string;
  accessKeyId: string;
  accessKeyIdDesc: string;
  secretAccessKey: string;
  secretAccessKeyDesc: string;
  bucketName: string;
  bucketNameDesc: string;
  publicUrl: string;
  publicUrlDesc: string;

  // Image Processing section
  sectionProcessing: string;
  pathTemplate: string;
  pathTemplateDesc: string;
  compress: string;
  compressDesc: string;
  maxWidth: string;
  maxWidthDesc: string;
  quality: string;
  qualityDesc: string;

  // General section
  sectionGeneral: string;
  localSaveDefault: string;
  localSaveDefaultDesc: string;
  language: string;
  languageDesc: string;
  langAuto: string;
  langEn: string;
  langZh: string;

  // Status bar tooltips
  statusBarUploadTitle: string;
  statusBarLocalTitle: string;
}

const en: Translations = {
  settingsTitle: 'EzImage Settings',
  settingsDesc:  'Upload images to Cloudflare R2 and get a Markdown link automatically.',

  sectionR2:           'Cloudflare R2',
  accountId:           'Account ID',
  accountIdDesc:       'Your Cloudflare Account ID',
  accessKeyId:         'Access Key ID',
  accessKeyIdDesc:     'R2 API Access Key ID',
  secretAccessKey:     'Secret Access Key',
  secretAccessKeyDesc: 'R2 API Secret Access Key',
  bucketName:          'Bucket Name',
  bucketNameDesc:      'R2 Bucket Name',
  publicUrl:           'Public URL',
  publicUrlDesc:       "Your bucket's public URL, e.g. https://pub-xxx.r2.dev or a custom domain",

  sectionProcessing: 'Image Processing',
  pathTemplate:      'Path Template',
  pathTemplateDesc:  'Template for the uploaded file path. Variables: {yyyy} {MM} {dd} {hh} {mm} {ss} {timestamp} {random} {name} {ext}',
  compress:          'Compress Images',
  compressDesc:      'Convert images to WebP and reduce file size before uploading',
  maxWidth:          'Max Width (px)',
  maxWidthDesc:      'Images wider than this will be resized. 0 = no limit.',
  quality:           'Quality',
  qualityDesc:       'WebP compression quality: 1 (smallest) → 100 (best)',

  sectionGeneral:        'General',
  localSaveDefault:      'Default to Local Save mode',
  localSaveDefaultDesc:  'When enabled, images are saved to your vault by default instead of being uploaded. You can still toggle this at any time via the status bar.',
  language:              'Language / 语言',
  languageDesc:          'Language used in this settings panel.',
  langAuto:              'Auto (follow Obsidian)',
  langEn:                'English',
  langZh:                '中文',

  statusBarUploadTitle: 'EzImage: Upload mode — change in Settings or Command Palette',
  statusBarLocalTitle:  'EzImage: Local Save mode — change in Settings or Command Palette',
};

const zh: Translations = {
  settingsTitle: 'EzImage 设置',
  settingsDesc:  '将图片上传到 Cloudflare R2，自动插入 Markdown 链接。',

  sectionR2:           'Cloudflare R2',
  accountId:           'Account ID',
  accountIdDesc:       '你的 Cloudflare 账户 ID',
  accessKeyId:         'Access Key ID',
  accessKeyIdDesc:     'R2 API 访问密钥 ID',
  secretAccessKey:     'Secret Access Key',
  secretAccessKeyDesc: 'R2 API 访问密钥',
  bucketName:          'Bucket 名称',
  bucketNameDesc:      'R2 存储桶名称',
  publicUrl:           '公开访问地址',
  publicUrlDesc:       '存储桶的公开 URL，例如 https://pub-xxx.r2.dev 或自定义域名',

  sectionProcessing: '图片处理',
  pathTemplate:      '路径模板',
  pathTemplateDesc:  '上传文件的路径模板，可用变量：{yyyy} {MM} {dd} {hh} {mm} {ss} {timestamp} {random} {name} {ext}',
  compress:          '压缩图片',
  compressDesc:      '上传前将图片转换为 WebP 格式并压缩体积',
  maxWidth:          '最大宽度（px）',
  maxWidthDesc:      '超过此宽度的图片将自动缩放，0 表示不限制',
  quality:           '压缩质量',
  qualityDesc:       'WebP 压缩质量：1（最小体积）→ 100（最佳画质）',

  sectionGeneral:       '通用',
  localSaveDefault:     '默认使用本地保存模式',
  localSaveDefaultDesc: '开启后，图片默认保存到 vault，而不是上传到云端。可随时通过命令面板切换。',
  language:             'Language / 语言',
  languageDesc:         '设置页面显示语言。',
  langAuto:             '自动（跟随 Obsidian）',
  langEn:               'English',
  langZh:               '中文',

  statusBarUploadTitle: 'EzImage：上传模式 — 在设置或命令面板中切换',
  statusBarLocalTitle:  'EzImage：本地保存模式 — 在设置或命令面板中切换',
};

const locales = { en, zh };

/** Return the translation string for the current locale. */
export function t<K extends keyof Translations>(key: K): string {
  return locales[getLocale()][key];
}
