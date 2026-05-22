<div align="center">
  <img src="https://images.flashnote.top/2026/02/icon.png" width="128" alt="EzImage Logo" />
  <h1>EzImage for Obsidian</h1>
  <p><b>粘贴或拖拽图片 — 自动上传到云端并插入 Markdown 链接，本地不保存任何文件</b></p>

  <p>
    <img src="https://img.shields.io/badge/版本-1.0.0-blue.svg" alt="Version" />
    <img src="https://img.shields.io/badge/平台-macOS%20%7C%20Windows%20%7C%20Linux-brightgreen.svg" alt="Platform" />
    <img src="https://img.shields.io/badge/Obsidian-%3E%3D0.15.0-purple.svg" alt="Obsidian" />
    <img src="https://img.shields.io/badge/许可证-MIT-orange.svg" alt="License" />
  </p>

  <p>
    <a href="README.md">English</a> | <b>简体中文</b>
  </p>

  <p>
    <a href="#features">功能特性</a> •
    <a href="#install">安装</a> •
    <a href="#config">配置</a> •
    <a href="#usage">使用方式</a> •
    <a href="#roadmap">路线图</a> •
    <a href="#feedback">反馈</a>
  </p>
</div>

---

**EzImage for Obsidian** 解决了 Obsidian 图片管理的核心痛点：默认情况下，粘贴的图片会以本地文件的形式保存在 vault 中，久而久之导致文件夹混乱。EzImage 拦截每一次粘贴和拖拽事件，将图片上传到你的云存储，并在光标处插入简洁的 Markdown 链接 — 让你的 vault 彻底告别二进制文件。

## <span id="features"></span>✨ 功能特性

- **🖼️ 无感粘贴拦截** — 在笔记中粘贴图片，EzImage 在 Obsidian 本地保存之前拦截事件，上传图片并自动插入 `![image](url)`。
- **🖱️ 拖拽上传** — 直接从 Finder / 文件管理器将图片拖入编辑器，自动上传。
- **📉 自动 WebP 压缩** — 基于 `browser-image-compression`，上传前自动转为 WebP 并按需缩放，在不损失可见质量的前提下大幅压缩体积。
- **📂 灵活路径模板** — 通过变量完全控制上传路径：`{yyyy}` `{MM}` `{dd}` `{timestamp}` `{random}` `{name}` `{ext}`。
- **☁️ Cloudflare R2** — 零出口流量费，S3 兼容 API，全球 CDN。更多云存储提供商即将支持。
- **🔒 本地签名** — AWS Signature V4 完全在设备端通过 Web Crypto API 计算，你的密钥永不离开本机。

## <span id="install"></span>📦 安装

### 方式 A：社区插件市场（推荐）

1. 打开 Obsidian → **设置 → 第三方插件 → 浏览**。
2. 搜索 **EzImage**，点击**安装**，然后**启用**。

### 方式 B：手动安装

1. 从 [GitHub Releases](https://github.com/keepwonder/ezimage-obsidian/releases) 下载 `main.js` 和 `manifest.json`。
2. 将两个文件复制到 `<你的vault>/.obsidian/plugins/ezimage/` 目录下。
3. 重启 Obsidian，在**设置 → 第三方插件**中启用插件。

## <span id="config"></span>⚙️ 配置

打开**设置 → EzImage**，填入你的 Cloudflare R2 凭证：

| 字段 | 说明 |
| :--- | :--- |
| **Account ID** | 在 Cloudflare 控制台右侧边栏中找到 |
| **Access Key ID** | R2 API Token — 需要 *Object Read & Write* 权限 |
| **Secret Access Key** | 与 Access Key 配对的密钥 |
| **Bucket Name** | 上传图片的 R2 存储桶名称 |
| **Public URL** | 存储桶的公开访问地址，例如 `https://pub-xxx.r2.dev` 或自定义域名 |

### 如何获取 R2 凭证

1. 登录 [Cloudflare 控制台](https://dash.cloudflare.com) → **R2 → 管理 API 令牌**。
2. 创建一个具有 **Object Read & Write** 权限的 Token，并将范围限定到你的存储桶。
3. 复制 **Account ID**、**Access Key ID** 和 **Secret Access Key**。
4. 确保存储桶已启用**公开访问**（或通过自定义域名 + Worker 提供访问）。

### 图片处理选项

| 选项 | 默认值 | 说明 |
| :--- | :--- | :--- |
| **压缩图片** | `开启` | 上传前转换为 WebP |
| **最大宽度** | `1920` | 超过此宽度时自动缩放（px），`0` 表示不限制 |
| **压缩质量** | `85` | WebP 质量（1–100） |
| **路径模板** | `{yyyy}/{MM}/{timestamp}-{random}.{ext}` | 上传路径模板 |

**模板变量：** `{yyyy}` `{MM}` `{dd}` `{hh}` `{mm}` `{ss}` `{timestamp}` `{random}` `{name}` `{ext}`

## <span id="usage"></span>🚀 使用方式

| 操作 | 方法 |
| :--- | :--- |
| **粘贴图片** | 复制任意图片 → 在编辑器中粘贴，自动触发上传 |
| **拖拽上传** | 从文件管理器拖拽图片文件到编辑器 |
| **从文件上传** | 命令面板 → `EzImage: Upload Image from File` |
| **上传剪贴板** | 命令面板 → `EzImage: Upload Clipboard Image` |
| **右键菜单** | 在编辑器中右键 → EzImage 选项 |

> **注意：** 只有在 R2 配置完成后，EzImage 才会拦截事件。未配置时，Obsidian 的默认行为（本地保存）不受影响。

## <span id="roadmap"></span>🗺️ 路线图

- [x] Cloudflare R2 支持
- [x] 自动 WebP 压缩
- [x] 粘贴 & 拖拽拦截
- [x] 灵活路径模板
- [ ] AWS S3 / 通用 S3 兼容协议
- [ ] 阿里云 OSS & 腾讯云 COS
- [ ] GitHub / Gitee 图床模式
- [ ] 上传历史面板

## <span id="feedback"></span>🤝 贡献与反馈

发现 Bug 或有功能建议？欢迎 [提交 Issue](https://github.com/keepwonder/ezimage-obsidian/issues)。

也欢迎提交 Pull Request。本地开发方式：

```bash
git clone https://github.com/keepwonder/ezimage-obsidian.git
cd ezimage-obsidian
npm install

# 开发监听模式
npm run dev

# 生产构建
npm run build
```

将生成的 `main.js` 和 `manifest.json` 复制到 vault 的插件目录中即可本地测试。

---

## 📞 联系与支持

### 💬 微信反馈

扫描下方二维码添加作者微信，备注 **"EzImage"**：

<div align="center">
  <img src="https://images.flashnote.top/contact/wechat_qr.png" width="200" alt="微信联系" />
  <p><i>扫码获取技术支持</i></p>
</div>

### ☕ 支持作者

如果 EzImage 提升了你的效率，欢迎请作者喝杯咖啡！

<div align="center">
  <table border="0">
    <tr>
      <td align="center">
        <img src="https://images.flashnote.top/donate/wechat_pay.png" width="200" alt="微信支付" />
        <br />
        <b>微信支付</b>
      </td>
      <td align="center">
        <img src="https://images.flashnote.top/donate/alipay_pay.png" width="200" alt="支付宝" />
        <br />
        <b>支付宝</b>
      </td>
    </tr>
  </table>
</div>

---

<p align="center">由 <a href="https://kiang.website"><b>Kiang</b></a> 用 ❤️ 开发</p>
