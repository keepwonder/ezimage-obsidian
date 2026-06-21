import { getLanguage } from 'obsidian';
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
  // auto: follow Obsidian's public language API
  const lang = getLanguage();
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
  compressionExcludedExtensions: string;
  compressionExcludedExtensionsDesc: string;
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

  // Validation messages
  maxFileSizeMB: string;
  maxFileSizeMBDesc: string;
  errMaxWidth: string;
  errMaxFileSizeMB: string;
  pathTemplatePreviewLabel: string;

  // EXIF
  stripExif: string;
  stripExifDesc: string;

  // Commands
  cmdUploadClipboard: string;
  cmdUploadFile: string;
  cmdBatchUpload: string;
  cmdToggleLocalMode: string;

  // Context menu
  menuEzImage: string;
  menuUploadClipboard: string;
  menuUploadFile: string;
  menuBatchUpload: string;
  menuToggleLocalMode: string;

  // Notices
  noticeLocalModeOn: string;
  noticeLocalModeOff: string;
  noticeLanguageChanged: string;

  // Batch upload modal
  batchTitleScope: string;
  batchTitleVault: string;
  batchScanning: string;
  batchEmpty: string;
  batchClose: string;
  batchStats: string;
  batchMissingFile: string;
  batchLocatedAt: string;
  batchDeleteAfterUpload: string;
  batchStartUpload: string;
  batchCancel: string;
  batchProgressTitle: string;
  batchProgressText: string;
  batchNoValidImages: string;
  batchMarkdownChanged: string;
  batchUploading: string;
  batchSuccess: string;
  batchFailure: string;
  batchDone: string;
  batchNoticeDone: string;
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
  compressionExcludedExtensions:     'Formats to Keep Original',
  compressionExcludedExtensionsDesc: 'Upload these formats without conversion, resizing, or metadata stripping. Separate extensions with spaces or commas. Animated images are always detected from file contents and preserved.',
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

  maxFileSizeMB:        'Max File Size (MB)',
  maxFileSizeMBDesc:    'Files larger than this will be rejected before upload. 0 = no limit.',
  errMaxWidth:          '⚠ Must be a number ≥ 0',
  errMaxFileSizeMB:     '⚠ Must be a number ≥ 0',
  pathTemplatePreviewLabel: 'Preview: ',

  stripExif:     'Strip EXIF Metadata',
  stripExifDesc: 'Remove GPS, device info, and other metadata before uploading. Only applies when compression is disabled — compression already strips EXIF by converting to WebP.',

  cmdUploadClipboard: 'Upload Clipboard Image',
  cmdUploadFile: 'Upload Image from File',
  cmdBatchUpload: 'Batch Upload Local Images',
  cmdToggleLocalMode: 'Toggle Local Save Mode',

  menuEzImage: 'EzImage',
  menuUploadClipboard: 'Upload Clipboard Image',
  menuUploadFile: 'Upload Image from File',
  menuBatchUpload: 'Batch Upload Local Images',
  menuToggleLocalMode: 'Toggle Local Save Mode',

  noticeLocalModeOn: 'EzImage: Local Save mode ON',
  noticeLocalModeOff: 'EzImage: Upload mode ON',
  noticeLanguageChanged: 'EzImage: Language changed. Please reload the plugin for commands to update.',

  batchTitleScope: 'Batch Upload Local Images ({scope})',
  batchTitleVault: 'Batch Upload Local Images (entire vault)',
  batchScanning: 'Scanning...',
  batchEmpty: 'No local image references found',
  batchClose: 'Close',
  batchStats: 'Found {count} local images, total size {size} MB',
  batchMissingFile: 'file missing',
  batchLocatedAt: 'Located in: {path}',
  batchDeleteAfterUpload: ' Delete local files after successful upload',
  batchStartUpload: 'Start Upload',
  batchCancel: 'Cancel',
  batchProgressTitle: 'Upload Progress',
  batchProgressText: '{completed} / {total} (Success: {succeeded}, Failed: {failed})',
  batchNoValidImages: 'All image files are missing; nothing can be uploaded',
  batchMarkdownChanged: 'Markdown file changed while batch upload was running',
  batchUploading: 'Uploading: {name}',
  batchSuccess: 'Success: {name}',
  batchFailure: 'Failed: {name} - {message}',
  batchDone: 'Done. Success: {succeeded}, Failed: {failed}',
  batchNoticeDone: 'EzImage: Batch upload complete ({succeeded} succeeded, {failed} failed)',
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
  compressionExcludedExtensions:     '保持原格式',
  compressionExcludedExtensionsDesc: '这些格式将原样上传，不转码、缩放或清除元数据。多个扩展名用空格或逗号分隔。动图会根据文件内容自动识别并保留。',
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

  maxFileSizeMB:        '最大文件大小（MB）',
  maxFileSizeMBDesc:    '超过此大小的文件将在上传前被拒绝。0 表示不限制。',
  errMaxWidth:          '⚠ 请输入 ≥ 0 的数字',
  errMaxFileSizeMB:     '⚠ 请输入 ≥ 0 的数字',
  pathTemplatePreviewLabel: '预览：',

  stripExif:     '清除 EXIF 元数据',
  stripExifDesc: '上传前移除 GPS 位置、设备信息等元数据，保护隐私。仅在关闭压缩时生效——开启压缩时转换为 WebP 已自动清除 EXIF。',

  cmdUploadClipboard: '上传剪贴板图片',
  cmdUploadFile: '从文件上传图片',
  cmdBatchUpload: '批量上传本地图片',
  cmdToggleLocalMode: '切换本地保存模式',

  menuEzImage: 'EzImage',
  menuUploadClipboard: '上传剪贴板图片',
  menuUploadFile: '从文件上传图片',
  menuBatchUpload: '批量上传本地图片',
  menuToggleLocalMode: '切换本地保存模式',

  noticeLocalModeOn: 'EzImage：本地保存模式已开启',
  noticeLocalModeOff: 'EzImage：上传模式已开启',
  noticeLanguageChanged: 'EzImage：语言已更改，请重新加载插件以更新命令面板。',

  batchTitleScope: '批量上传本地图片 ({scope})',
  batchTitleVault: '批量上传本地图片 (整个 Vault)',
  batchScanning: '正在扫描...',
  batchEmpty: '未发现本地图片引用',
  batchClose: '关闭',
  batchStats: '发现 {count} 张本地图片，总大小 {size} MB',
  batchMissingFile: '文件不存在',
  batchLocatedAt: '位于：{path}',
  batchDeleteAfterUpload: ' 上传成功后删除本地文件',
  batchStartUpload: '开始上传',
  batchCancel: '取消',
  batchProgressTitle: '上传进度',
  batchProgressText: '{completed} / {total} (成功: {succeeded}, 失败: {failed})',
  batchNoValidImages: '所有图片文件均不存在，无法上传',
  batchMarkdownChanged: '批量上传过程中 Markdown 文件发生了变化',
  batchUploading: '上传中：{name}',
  batchSuccess: '成功：{name}',
  batchFailure: '失败：{name} - {message}',
  batchDone: '完成。成功：{succeeded}，失败：{failed}',
  batchNoticeDone: 'EzImage：批量上传完成 ({succeeded} 成功，{failed} 失败)',
};

const locales = { en, zh };

/** Return the translation string for the current locale. */
export function t<K extends keyof Translations>(key: K): string {
  return locales[getLocale()][key];
}

export function fmt<K extends keyof Translations>(
  key: K,
  values: Record<string, string | number>
): string {
  let text = t(key);
  for (const [name, value] of Object.entries(values)) {
    text = text.split(`{${name}}`).join(String(value));
  }
  return text;
}
