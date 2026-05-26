# EzImage

<div align="center">
  <img src="https://images.flashnote.top/2026/02/icon.png" width="128" alt="EzImage Logo" />
  <h1>EzImage for Obsidian</h1>
  <p><b>Paste or drag an image — upload to the cloud or save to vault, your choice.</b></p>

  <p>
    <img src="https://img.shields.io/github/manifest-json/v/keepwonder/ezimage-obsidian?color=blue&label=Version" alt="Version" />
    <img src="https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux-brightgreen.svg" alt="Platform" />
    <img src="https://img.shields.io/badge/Obsidian-%3E%3D0.15.0-purple.svg" alt="Obsidian" />
    <img src="https://img.shields.io/badge/License-MIT-orange.svg" alt="License" />
  </p>

  <p>
    <b>English</b> | <a href="README_CN.md">简体中文</a>
  </p>

  <p>
    <a href="#features">Features</a> •
    <a href="#install">Installation</a> •
    <a href="#config">Configuration</a> •
    <a href="#usage">Usage</a> •
    <a href="#roadmap">Roadmap</a> •
    <a href="#feedback">Feedback</a>
  </p>
</div>

---

**EzImage for Obsidian** solves the fundamental pain point of image management in Obsidian: pasted images pollute your vault with local binary files, or worse, reference paths that break across machines. EzImage intercepts every paste and drop event and either uploads the image to your cloud storage (inserting a clean Markdown URL) or saves it to the vault via a wikilink — whichever mode you prefer, switchable at any time from the status bar.

## <span id="features"></span>✨ Features

- **🖼️ Seamless Paste Interception** — Paste an image anywhere in your notes; EzImage intercepts the event before Obsidian, then either uploads it or saves it locally depending on the current mode.
- **🖱️ Drag & Drop Support** — Drag image files directly from Finder / Explorer into the editor. EzImage copies the file into your vault or uploads it — not just references the original path.
- **☁️ Upload Mode** — Images are uploaded to Cloudflare R2 and a `![image](url)` link is inserted. Zero local files, zero broken paths.
- **💾 Local Save Mode** — Images are saved to your vault's configured attachment folder and inserted as `![[wikilink]]`. Fully managed by Obsidian's native structure.
- **⚡ Mode Toggle** — Switch between Upload and Local Save mode via the Settings toggle or Command Palette (`EzImage: Toggle Local Save Mode`). The status bar always shows the current mode at a glance.
- **📉 Automatic WebP Compression** — Powered by `browser-image-compression`. Images are converted to WebP and resized before upload, reducing file size without visible quality loss. EXIF metadata is stripped automatically during conversion.
- **🔏 EXIF Metadata Stripping** — When compression is disabled, EzImage redraws the image via Canvas before upload, removing GPS location, device info, and other metadata. No extra dependency required.
- **🛡️ Upload Reliability** — Failed uploads are automatically retried up to 2 times with back-off. Credential errors surface a clear "check Settings" message; network errors prompt to check your connection.
- **📂 Flexible Path Templates** — Full control over the upload path using variables: `{yyyy}` `{MM}` `{dd}` `{timestamp}` `{random}` `{name}` `{ext}`.
- **🌐 Language Support** — Settings UI available in English and 中文, or auto-detected from Obsidian.
- **🔒 Local Signing** — AWS Signature V4 is computed entirely on-device using the Web Crypto API. Your credentials never leave your machine.

## <span id="install"></span>📦 Installation

### Method A: Community Plugins (Recommended)

1. Open Obsidian → **Settings → Community Plugins → Browse**.
2. Search for **EzImage** and click **Install**, then **Enable**.

### Method B: Manual (BRAT / direct)

1. Download `main.js` and `manifest.json` from [GitHub Releases](https://github.com/keepwonder/ezimage-obsidian/releases).
2. Copy both files to `<your-vault>/.obsidian/plugins/ezimage/`.
3. Reload Obsidian and enable the plugin under **Settings → Community Plugins**.

## <span id="config"></span>⚙️ Configuration

Open **Settings → EzImage** and fill in your credentials and preferences.

### Cloudflare R2

| Field | Description |
| :--- | :--- |
| **Account ID** | Found on the right sidebar of your Cloudflare dashboard |
| **Access Key ID** | R2 API token — requires *Object Read & Write* permission |
| **Secret Access Key** | Paired secret for the access key |
| **Bucket Name** | The R2 bucket to upload images into |
| **Public URL** | Your bucket's public URL, e.g. `https://pub-xxx.r2.dev` or a custom domain |

#### How to get R2 credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 → Manage API tokens**.
2. Create a token with **Object Read & Write** permission scoped to your bucket.
3. Copy **Account ID**, **Access Key ID**, and **Secret Access Key**.
4. Make sure your bucket has **Public Access** enabled (or use a custom domain with a Worker).

### Image Processing

| Option | Default | Description |
| :--- | :--- | :--- |
| **Compress Images** | `on` | Convert to WebP before upload — also strips EXIF automatically |
| **Strip EXIF Metadata** | `on` | Remove GPS, device info, and other metadata. Only applies when compression is off (compression already strips EXIF via WebP conversion) |
| **Max Width** | `1920` | Resize if wider than this (px). `0` = no limit |
| **Quality** | `85` | WebP quality (1–100) |
| **Max File Size (MB)** | `20` | Files larger than this are rejected before upload. `0` = no limit |
| **Path Template** | `{yyyy}/{MM}/{timestamp}-{random}.{ext}` | Upload path pattern — live preview shown in Settings |

**Template variables:** `{yyyy}` `{MM}` `{dd}` `{hh}` `{mm}` `{ss}` `{timestamp}` `{random}` `{name}` `{ext}`

### General

| Option | Default | Description |
| :--- | :--- | :--- |
| **Default to Local Save mode** | `off` | When enabled, images are saved to your vault by default instead of being uploaded. Can be toggled at any time via the status bar. |
| **Language** | `Auto` | Language used in the settings panel. Options: Auto (follow Obsidian), English, 中文. |

## <span id="usage"></span>🚀 Usage

| Action | How |
| :--- | :--- |
| **Paste image** | Copy any image → paste in editor — processed automatically based on current mode |
| **Drag & drop** | Drag image file(s) from your file manager into the editor |
| **Upload from file** | Command Palette → `EzImage: Upload Image from File` |
| **Upload clipboard** | Command Palette → `EzImage: Upload Clipboard Image` |
| **Batch upload local images** | Command Palette → `EzImage: Batch Upload Local Images` (entire vault)<br>Right-click on file/folder → `EzImage: Batch Upload Local Images` (scoped) |
| **Toggle mode** | Settings toggle, or Command Palette → `EzImage: Toggle Local Save Mode` |
| **Context menu** | Right-click in editor → EzImage options |

### Status Bar

The status bar item is a **read-only indicator** of the current mode:

| Display | Mode |
| :--- | :--- |
| `☁ EzImage` (dimmed) | Upload mode — images go to R2 |
| `🖴 Local Save` (bright) | Local Save mode — images go to vault |

To switch modes, use the **Settings toggle** or **Command Palette → `EzImage: Toggle Local Save Mode`** (bindable to a hotkey). The tooltip follows your configured language.

> **Note:** EzImage only intercepts paste/drop events when R2 is configured. If credentials are missing, Obsidian's default behaviour (local save) is preserved regardless of mode.

## <span id="roadmap"></span>🗺️ Roadmap

- [x] Cloudflare R2 support
- [x] Automatic WebP compression with EXIF stripping
- [x] Paste & drag-drop interception
- [x] Flexible path templates with live preview
- [x] Local Save mode with status bar indicator
- [x] Language support (EN / 中文)
- [x] File size limit & input validation
- [x] Auto-retry on network errors
- [x] EXIF metadata stripping (when compression is off)
- [x] Batch upload existing local images in vault
- [ ] AWS S3 / generic S3-compatible providers
- [ ] Aliyun OSS & Tencent COS
- [ ] GitHub / Gitee image hosting mode
- [ ] Upload history panel

## <span id="feedback"></span>🤝 Contribution & Feedback

Found a bug or have a feature request? Please [open an issue](https://github.com/keepwonder/ezimage-obsidian/issues).

Pull requests are welcome. See the development setup below.

### Development

```bash
git clone https://github.com/keepwonder/ezimage-obsidian.git
cd ezimage-obsidian
npm install

# Watch mode (outputs main.js)
npm run dev

# Production build
npm run build
```

Copy `main.js` and `manifest.json` into your vault's plugin folder to test locally.

---

## 📞 Contact & Support

### 💬 Feedback

Scan the QR code below to add the author on WeChat, please mention **"EzImage"**:

<div align="center">
  <img src="https://images.flashnote.top/contact/wechat_qr.png" width="200" alt="WeChat Contact" />
  <p><i>Scan to get technical support</i></p>
</div>

### ☕ Support the Author

If EzImage has improved your workflow, feel free to buy me a coffee!

<div align="center">
  <table border="0">
    <tr>
      <td align="center">
        <img src="https://images.flashnote.top/donate/wechat_pay.png" width="200" alt="WeChat Pay" />
        <br />
        <b>WeChat Pay</b>
      </td>
      <td align="center">
        <img src="https://images.flashnote.top/donate/alipay_pay.png" width="200" alt="Alipay Pay" />
        <br />
        <b>Alipay Pay</b>
      </td>
    </tr>
  </table>
</div>

---

<p align="center">Developed with ❤️ by <a href="https://kiang.website"><b>Kiang</b></a></p>
