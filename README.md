# EzImage

<div align="center">
  <img src="https://images.flashnote.top/2026/02/icon.png" width="128" alt="EzImage Logo" />
  <h1>EzImage for Obsidian</h1>
  <p><b>Paste or drag an image — it uploads to the cloud and inserts a Markdown link. Nothing saved locally.</b></p>

  <p>
    <img src="https://img.shields.io/badge/Version-1.0.0-blue.svg" alt="Version" />
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

**EzImage for Obsidian** solves the fundamental pain point of image management in Obsidian: by default, pasted images are saved as local files that clutter your vault. EzImage intercepts every paste and drop event, uploads the image to your cloud storage, and inserts a clean Markdown link — keeping your vault free of binary files.

## <span id="features"></span>✨ Features

- **🖼️ Seamless Paste Interception** — Paste an image anywhere in your notes; EzImage intercepts the event before Obsidian can save it locally, uploads it, and inserts `![image](url)` at the cursor.
- **🖱️ Drag & Drop Support** — Drag image files directly from Finder / Explorer into the editor for automatic upload.
- **📉 Automatic WebP Compression** — Powered by `browser-image-compression`. Images are converted to WebP and resized before upload, reducing file size without visible quality loss.
- **📂 Flexible Path Templates** — Full control over the upload path using variables: `{yyyy}` `{MM}` `{dd}` `{timestamp}` `{random}` `{name}` `{ext}`.
- **☁️ Cloudflare R2** — Zero egress fees, S3-compatible API, global CDN. More providers coming.
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

Open **Settings → EzImage** and fill in your Cloudflare R2 credentials:

| Field | Description |
| :--- | :--- |
| **Account ID** | Found on the right sidebar of your Cloudflare dashboard |
| **Access Key ID** | R2 API token — requires *Object Read & Write* permission |
| **Secret Access Key** | Paired secret for the access key |
| **Bucket Name** | The R2 bucket to upload images into |
| **Public URL** | Your bucket's public URL, e.g. `https://pub-xxx.r2.dev` or a custom domain |

### How to get R2 credentials

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2 → Manage API tokens**.
2. Create a token with **Object Read & Write** permission scoped to your bucket.
3. Copy **Account ID**, **Access Key ID**, and **Secret Access Key**.
4. Make sure your bucket has **Public Access** enabled (or use a custom domain with a Worker).

### Image Processing Options

| Option | Default | Description |
| :--- | :--- | :--- |
| **Compress Images** | `true` | Convert to WebP before upload |
| **Max Width** | `1920` | Resize if wider than this (px). `0` = no limit |
| **Quality** | `85` | WebP quality (1–100) |
| **Path Template** | `{yyyy}/{MM}/{timestamp}-{random}.{ext}` | Upload path pattern |

**Template variables:** `{yyyy}` `{MM}` `{dd}` `{hh}` `{mm}` `{ss}` `{timestamp}` `{random}` `{name}` `{ext}`

## <span id="usage"></span>🚀 Usage

| Action | How |
| :--- | :--- |
| **Paste image** | Copy any image → paste in editor — upload happens automatically |
| **Drag & drop** | Drag image file(s) from your file manager into the editor |
| **Upload from file** | Command Palette → `EzImage: Upload Image from File` |
| **Upload clipboard** | Command Palette → `EzImage: Upload Clipboard Image` |
| **Context menu** | Right-click in editor → EzImage options |

> **Note:** EzImage only intercepts events when R2 is configured. If credentials are missing, Obsidian's default behaviour (local save) is preserved.

## <span id="roadmap"></span>🗺️ Roadmap

- [x] Cloudflare R2 support
- [x] Automatic WebP compression
- [x] Paste & drag-drop interception
- [x] Flexible path templates
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
