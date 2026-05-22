/**
 * R2 uploader using Obsidian's native requestUrl + Web Crypto API (AWS Signature V4).
 *
 * Why not AWS SDK?
 *   Obsidian bundles plugins as browser-format CJS, but runs inside Electron.
 *   The SDK oscillates between Web Stream / Node.js stream APIs and throws
 *   ".getReader is not a function" at runtime. requestUrl runs in the main
 *   process and bypasses CORS + stream-type confusion entirely.
 */

import { requestUrl } from 'obsidian';
import type { IUploader, UploadPayload, UploadResult, R2Config } from '../types';

// ── Web Crypto helpers ──────────────────────────────────────────────────────

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sha256(data: ArrayBuffer | Uint8Array): Promise<string> {
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

async function hmac(key: ArrayBuffer, msg: string): Promise<ArrayBuffer> {
  const k = await crypto.subtle.importKey(
    'raw', key,
    { name: 'HMAC', hash: 'SHA-256' },
    false, ['sign']
  );
  return crypto.subtle.sign('HMAC', k, enc(msg));
}

const enc = (s: string) => new TextEncoder().encode(s);

async function signingKey(
  secret: string, date: string, region: string, service: string
): Promise<ArrayBuffer> {
  const kDate    = await hmac(enc(`AWS4${secret}`), date);
  const kRegion  = await hmac(kDate,    region);
  const kService = await hmac(kRegion,  service);
  return             hmac(kService, 'aws4_request');
}

// ── S3 / R2 uploader ────────────────────────────────────────────────────────

export class R2Uploader implements IUploader {
  constructor(private config: R2Config) {}

  async upload(payload: UploadPayload): Promise<UploadResult> {
    const { data, fileName, mimeType } = payload;

    const region  = 'auto';
    const service = 's3';

    // Timestamps
    const now  = new Date();
    const ymd  = now.toISOString().slice(0, 10).replace(/-/g, '');          // 20240101
    const ymdt = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); // 20240101T000000Z

    // Endpoint — R2 uses path-style: /<bucket>/<key>
    const host = `${this.config.accountId}.r2.cloudflarestorage.com`;

    // Canonical URI must match the actual request path: /{bucket}/{key}
    // R2 uses path-style URLs, so bucket is part of the path, not the host.
    const canonicalUri =
      '/' + [this.config.bucketName, ...fileName.split('/')]
        .map(s => encodeURIComponent(s))
        .join('/');

    // Payload hash
    const payloadHash = await sha256(data);

    // Headers used in AWS signature (must include 'host', lowercase + sorted)
    const signHdr: Record<string, string> = {
      'content-type':         mimeType,
      'host':                 host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date':           ymdt,
    };
    const hdrKeys        = Object.keys(signHdr).sort();
    const canonicalHeaders = hdrKeys.map(k => `${k}:${signHdr[k]}`).join('\n') + '\n';
    const signedHeaders    = hdrKeys.join(';');

    // Canonical request.
    // canonicalHeaders already ends with '\n', and join('\n') adds another '\n'
    // before signedHeaders — this produces the blank line that AWS spec requires
    // between CanonicalHeaders and SignedHeaders. Do NOT collapse these newlines.
    const canonicalReq = [
      'PUT',
      canonicalUri,
      '',               // empty query string
      canonicalHeaders, // ends with '\n' → blank line after join
      signedHeaders,
      payloadHash,
    ].join('\n');

    // String to sign
    const scope     = `${ymd}/${region}/${service}/aws4_request`;
    const strToSign = [
      'AWS4-HMAC-SHA256',
      ymdt,
      scope,
      await sha256(enc(canonicalReq)),
    ].join('\n');

    // Signature
    const sk  = await signingKey(this.config.secretAccessKey, ymd, region, service);
    const sig = toHex(await hmac(sk, strToSign));

    // Authorization header
    const authorization =
      `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${sig}`;

    // Headers actually sent — omit 'host' (forbidden header; set automatically by Electron/browser)
    const sendHdr: Record<string, string> = {
      'content-type':         mimeType,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date':           ymdt,
      'Authorization':        authorization,
    };

    // Fire request via Obsidian requestUrl (main-process, no CORS, no stream-type issues)
    const url = `https://${host}/${this.config.bucketName}/${fileName}`;
    await requestUrl({
      url,
      method:  'PUT',
      headers: sendHdr,
      body:    data,
      throw:   true,
    });

    const base = this.config.publicUrl.replace(/\/$/, '');
    return { url: `${base}/${fileName}`, key: fileName };
  }
}
